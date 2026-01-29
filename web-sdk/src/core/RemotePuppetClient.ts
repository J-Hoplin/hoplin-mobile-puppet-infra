import { SignalingClient } from './SignalingClient';
import { WebRTCManager } from './WebRTCManager';
import type {
  RemotePuppetConfig,
  ConnectionState,
  Device,
  ControlEvent,
  MetricsData,
  LogEntry,
  FileInfo,
  WebRTCStats,
} from '../types';

export interface RemotePuppetEvents {
  onConnectionStateChange: (state: ConnectionState) => void;
  onWebRTCStateChange: (state: RTCPeerConnectionState) => void;
  onStream: (stream: MediaStream) => void;
  onMetrics: (data: MetricsData) => void;
  onLog: (entry: LogEntry) => void;
  onFileList: (files: FileInfo[]) => void;
  onShellOutput: (data: string, isStderr: boolean) => void;
  onError: (error: string) => void;
}

export class RemotePuppetClient {
  private signaling: SignalingClient;
  private webrtc: WebRTCManager;
  private events: Partial<RemotePuppetEvents> = {};
  private currentDeviceId: string | null = null;

  constructor(config: RemotePuppetConfig) {
    this.signaling = new SignalingClient({
      serverUrl: config.serverUrl,
      token: config.token,
      reconnectAttempts: config.reconnectAttempts,
      reconnectDelay: config.reconnectDelay,
    });

    this.webrtc = new WebRTCManager({
      iceServers: config.iceServers,
    });

    this.setupSignalingEvents();
    this.setupWebRTCEvents();
  }

  on<K extends keyof RemotePuppetEvents>(event: K, handler: RemotePuppetEvents[K]): void {
    this.events[event] = handler;
  }

  off<K extends keyof RemotePuppetEvents>(event: K): void {
    delete this.events[event];
  }

  async connect(): Promise<void> {
    this.signaling.connect();

    const turn = await this.signaling.getTurnCredentials();
    if (turn) {
      this.webrtc.setIceServers([
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: turn.urls,
          username: turn.username,
          credential: turn.credential,
        },
      ]);
    }
  }

  disconnect(): void {
    if (this.currentDeviceId) {
      this.leaveSession();
    }
    this.webrtc.close();
    this.signaling.disconnect();
  }

  async getDevices(): Promise<Device[]> {
    return this.signaling.getDevices();
  }

  async joinSession(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.signaling.joinSession(deviceId);
    if (!result.success) {
      return result;
    }

    this.currentDeviceId = deviceId;

    const offer = await this.webrtc.createOffer();
    this.signaling.sendOffer(deviceId, offer);

    return { success: true };
  }

  async leaveSession(): Promise<void> {
    if (this.currentDeviceId) {
      await this.signaling.leaveSession(this.currentDeviceId);
      this.webrtc.close();
      this.currentDeviceId = null;
    }
  }

  sendControl(event: ControlEvent): boolean {
    console.log('[RemotePuppet] sendControl:', event);
    const result = this.webrtc.sendControl(event);
    console.log('[RemotePuppet] sendControl result:', result);
    return result;
  }

  sendTouchDown(x: number, y: number, pointerId = 0): boolean {
    console.log('[RemotePuppet] sendTouchDown:', x, y, pointerId);
    return this.sendControl({
      type: 'touch',
      action: 'down',
      x,
      y,
      pointerId,
    });
  }

  sendTouchUp(x: number, y: number, pointerId = 0): boolean {
    return this.sendControl({
      type: 'touch',
      action: 'up',
      x,
      y,
      pointerId,
    });
  }

  sendTouchMove(x: number, y: number, pointerId = 0): boolean {
    return this.sendControl({
      type: 'touch',
      action: 'move',
      x,
      y,
      pointerId,
    });
  }

  sendBack(): boolean {
    console.log('[RemotePuppet] sendBack called');
    return this.sendControl({ type: 'back' });
  }

  sendHome(): boolean {
    console.log('[RemotePuppet] sendHome called');
    return this.sendControl({ type: 'home' });
  }

  sendRecent(): boolean {
    console.log('[RemotePuppet] sendRecent called');
    return this.sendControl({ type: 'recent' });
  }

  sendShellCommand(command: string, sessionId = 'default'): boolean {
    return this.webrtc.sendData(
      'shell',
      JSON.stringify({ sessionId, command })
    );
  }

  requestFileList(path: string): boolean {
    return this.webrtc.sendData(
      'file',
      JSON.stringify({ operation: 'list', path })
    );
  }

  getStream(): MediaStream | null {
    return this.webrtc.getRemoteStream();
  }

  async getStats(): Promise<WebRTCStats | null> {
    return this.webrtc.getStats();
  }

  get connectionState(): ConnectionState {
    return this.signaling.connectionState;
  }

  private setupSignalingEvents(): void {
    this.signaling.on('onConnectionStateChange', (state) => {
      this.events.onConnectionStateChange?.(state);
    });

    this.signaling.on('onAnswer', async (deviceId, sdp) => {
      if (deviceId === this.currentDeviceId) {
        await this.webrtc.handleAnswer(sdp);
      }
    });

    this.signaling.on('onIceCandidate', async (_targetId, candidate) => {
      await this.webrtc.handleIceCandidate(candidate);
    });

    this.signaling.on('onError', (error) => {
      this.events.onError?.(error);
    });
  }

  private setupWebRTCEvents(): void {
    this.webrtc.on('onTrack', (stream) => {
      this.events.onStream?.(stream);
    });

    this.webrtc.on('onIceCandidate', (candidate) => {
      if (this.currentDeviceId) {
        this.signaling.sendIceCandidate(this.currentDeviceId, candidate.toJSON());
      }
    });

    this.webrtc.on('onConnectionStateChange', (state) => {
      this.events.onWebRTCStateChange?.(state);
    });

    this.webrtc.on('onDataChannelMessage', (label, data) => {
      this.handleDataChannelMessage(label, data);
    });
  }

  private handleDataChannelMessage(channel: string, data: ArrayBuffer | string): void {
    try {
      const str = typeof data === 'string' ? data : new TextDecoder().decode(data);
      console.log(`[RemotePuppet] DataChannel message received: channel=${channel}, data=${str.substring(0, 200)}`);
      const parsed = JSON.parse(str);

      switch (channel) {
        case 'metrics':
          console.log('[RemotePuppet] Metrics received:', parsed);
          this.events.onMetrics?.(parsed as MetricsData);
          break;
        case 'logs':
          this.events.onLog?.(parsed as LogEntry);
          break;
        case 'file':
          if (parsed.files) {
            this.events.onFileList?.(parsed.files as FileInfo[]);
          }
          break;
        case 'shell':
          this.events.onShellOutput?.(parsed.data || '', parsed.isStderr || false);
          break;
      }
    } catch (e) {
      console.error(`Failed to parse DataChannel message from ${channel}:`, e);
    }
  }
}
