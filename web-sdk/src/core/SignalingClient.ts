import { io, Socket } from 'socket.io-client';
import type { ConnectionState, Device, SessionUser } from '../types';

export interface SignalingClientConfig {
  serverUrl: string;
  token: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface SignalingEvents {
  onConnectionStateChange: (state: ConnectionState) => void;
  onOffer: (deviceId: string, sdp: RTCSessionDescriptionInit) => void;
  onAnswer: (deviceId: string, sdp: RTCSessionDescriptionInit) => void;
  onIceCandidate: (targetId: string, candidate: RTCIceCandidateInit) => void;
  onSessionJoin: (user: SessionUser) => void;
  onSessionLeave: (userId: string) => void;
  onDeviceStatus: (deviceId: string, status: Device['status']) => void;
  onError: (error: string) => void;
}

export class SignalingClient {
  private socket: Socket | null = null;
  private config: SignalingClientConfig;
  private events: Partial<SignalingEvents> = {};
  private _connectionState: ConnectionState = 'disconnected';

  constructor(config: SignalingClientConfig) {
    this.config = config;
  }

  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  on<K extends keyof SignalingEvents>(event: K, handler: SignalingEvents[K]): void {
    this.events[event] = handler;
  }

  off<K extends keyof SignalingEvents>(event: K): void {
    delete this.events[event];
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.setConnectionState('connecting');

      this.socket = io(`${this.config.serverUrl}/signaling`, {
        auth: { token: this.config.token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.config.reconnectAttempts ?? 10,
        reconnectionDelay: this.config.reconnectDelay ?? 1000,
        reconnectionDelayMax: 30000,
      });

      // Wait for connection to be established before resolving
      const onConnect = () => {
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
        resolve();
      };

      const onError = (error: Error) => {
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
        reject(error);
      };

      this.socket.on('connect', onConnect);
      this.socket.on('connect_error', onError);

      this.setupSocketListeners();
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.setConnectionState('disconnected');
  }

  async joinSession(deviceId: string): Promise<{ success: boolean; users?: SessionUser[]; error?: string }> {
    return new Promise((resolve) => {
      this.socket?.emit('session:join', { deviceId }, (response: any) => {
        if (response.error) {
          resolve({ success: false, error: response.error });
        } else {
          resolve({ success: true, users: response.users });
        }
      });
    });
  }

  async leaveSession(deviceId: string): Promise<void> {
    return new Promise((resolve) => {
      this.socket?.emit('session:leave', { deviceId }, () => {
        resolve();
      });
    });
  }

  sendOffer(deviceId: string, sdp: RTCSessionDescriptionInit): void {
    this.socket?.emit('webrtc:offer', {
      targetDeviceId: deviceId,
      sdp,
    });
  }

  sendAnswer(deviceId: string, sdp: RTCSessionDescriptionInit): void {
    this.socket?.emit('webrtc:answer', {
      targetDeviceId: deviceId,
      sdp,
    });
  }

  sendIceCandidate(targetId: string, candidate: RTCIceCandidateInit): void {
    this.socket?.emit('webrtc:ice-candidate', {
      targetId,
      candidate,
    });
  }

  async getDevices(): Promise<Device[]> {
    return new Promise((resolve) => {
      this.socket?.emit('device:list', null, (response: any) => {
        resolve(response.devices || []);
      });
    });
  }

  async getTurnCredentials(): Promise<{ urls: string; username: string; credential: string } | null> {
    return new Promise((resolve) => {
      this.socket?.emit('turn:credentials', null, (response: any) => {
        if (response?.urls) {
          resolve(response);
        } else {
          resolve(null);
        }
      });
    });
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.setConnectionState('connected');
    });

    this.socket.on('disconnect', () => {
      this.setConnectionState('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      this.setConnectionState('error');
      this.events.onError?.(error.message);
    });

    this.socket.io.on('reconnect_attempt', () => {
      this.setConnectionState('reconnecting');
    });

    this.socket.on('auth:response', (data: { success: boolean; message?: string }) => {
      if (!data.success) {
        this.events.onError?.(data.message || 'Authentication failed');
      }
    });

    this.socket.on('webrtc:offer', (data: { userId?: string; deviceId?: string; sdp: RTCSessionDescriptionInit }) => {
      // Handle offers from both users (userId) and devices (deviceId)
      const sourceId = data.deviceId || data.userId || '';
      this.events.onOffer?.(sourceId, data.sdp);
    });

    this.socket.on('webrtc:answer', (data: { deviceId: string; sdp: RTCSessionDescriptionInit }) => {
      this.events.onAnswer?.(data.deviceId, data.sdp);
    });

    this.socket.on('webrtc:ice-candidate', (data: { userId?: string; deviceId?: string; candidate: RTCIceCandidateInit }) => {
      const targetId = data.userId || data.deviceId || '';
      this.events.onIceCandidate?.(targetId, data.candidate);
    });

    this.socket.on('session:join', (data: { userId: string; email?: string }) => {
      this.events.onSessionJoin?.({
        id: data.userId,
        email: data.email,
        joinedAt: new Date(),
      });
    });

    this.socket.on('session:leave', (data: { userId: string }) => {
      this.events.onSessionLeave?.(data.userId);
    });

    this.socket.on('device:status', (data: { deviceId: string; status: Device['status'] }) => {
      this.events.onDeviceStatus?.(data.deviceId, data.status);
    });

    this.socket.on('error', (data: { message: string }) => {
      this.events.onError?.(data.message);
    });
  }

  private setConnectionState(state: ConnectionState): void {
    this._connectionState = state;
    this.events.onConnectionStateChange?.(state);
  }
}
