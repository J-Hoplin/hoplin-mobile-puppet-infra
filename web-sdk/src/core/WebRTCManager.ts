import type { WebRTCStats } from '../types';

export interface WebRTCManagerConfig {
  iceServers?: RTCIceServer[];
}

export interface WebRTCEvents {
  onTrack: (stream: MediaStream) => void;
  onLocalDescription: (sdp: RTCSessionDescriptionInit) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onDataChannelOpen: (label: string) => void;
  onDataChannelMessage: (label: string, data: ArrayBuffer | string) => void;
  onDataChannelClose: (label: string) => void;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private config: WebRTCManagerConfig;
  private events: Partial<WebRTCEvents> = {};
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private remoteStream: MediaStream | null = null;

  constructor(config: WebRTCManagerConfig = {}) {
    this.config = config;
  }

  on<K extends keyof WebRTCEvents>(event: K, handler: WebRTCEvents[K]): void {
    this.events[event] = handler;
  }

  off<K extends keyof WebRTCEvents>(event: K): void {
    delete this.events[event];
  }

  setIceServers(servers: RTCIceServer[]): void {
    this.config.iceServers = servers;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    this.createPeerConnection();

    this.createDataChannel('control', { ordered: true, maxRetransmits: 0 });
    this.createDataChannel('metrics', { ordered: true, maxRetransmits: 0 });
    this.createDataChannel('file', { ordered: true });
    this.createDataChannel('logs', { ordered: true, maxRetransmits: 3 });
    this.createDataChannel('shell', { ordered: true });

    const offer = await this.peerConnection!.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: false,
    });

    await this.peerConnection!.setLocalDescription(offer);

    return offer;
  }

  async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      return;
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  sendData(channel: string, data: ArrayBuffer | string): boolean {
    const dc = this.dataChannels.get(channel);
    console.log(`[WebRTC] sendData: channel=${channel}, dcExists=${!!dc}, readyState=${dc?.readyState}`);

    if (!dc || dc.readyState !== 'open') {
      console.warn(`[WebRTC] Cannot send data: channel ${channel} is not open (state: ${dc?.readyState})`);
      return false;
    }

    try {
      if (typeof data === 'string') {
        console.log(`[WebRTC] Sending string data on ${channel}:`, data.substring(0, 100));
        dc.send(data);
      } else {
        dc.send(data);
      }
      return true;
    } catch (e) {
      console.error(`Failed to send data on channel ${channel}:`, e);
      return false;
    }
  }

  sendControl(event: object): boolean {
    return this.sendData('control', JSON.stringify(event));
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  async getStats(): Promise<WebRTCStats | null> {
    if (!this.peerConnection) {
      return null;
    }

    const stats = await this.peerConnection.getStats();
    let bytesReceived = 0;
    let bytesSent = 0;
    let packetsLost = 0;
    let roundTripTime = 0;
    let jitter = 0;
    let frameRate: number | undefined;
    let resolution: { width: number; height: number } | undefined;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        bytesReceived = report.bytesReceived || 0;
        packetsLost = report.packetsLost || 0;
        jitter = report.jitter || 0;
        frameRate = report.framesPerSecond;
        if (report.frameWidth && report.frameHeight) {
          resolution = { width: report.frameWidth, height: report.frameHeight };
        }
      }
      if (report.type === 'outbound-rtp') {
        bytesSent += report.bytesSent || 0;
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        roundTripTime = report.currentRoundTripTime || 0;
      }
    });

    return {
      connectionState: this.peerConnection.connectionState,
      iceConnectionState: this.peerConnection.iceConnectionState,
      bytesReceived,
      bytesSent,
      packetsLost,
      roundTripTime,
      jitter,
      frameRate,
      resolution,
    };
  }

  close(): void {
    this.dataChannels.forEach((dc) => dc.close());
    this.dataChannels.clear();

    this.peerConnection?.close();
    this.peerConnection = null;
    this.remoteStream = null;
  }

  private createPeerConnection(): void {
    if (this.peerConnection) {
      return;
    }

    const rtcConfig: RTCConfiguration = {
      iceServers: this.config.iceServers || DEFAULT_ICE_SERVERS,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };

    this.peerConnection = new RTCPeerConnection(rtcConfig);

    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] ontrack event received:', event.track.kind, 'streams:', event.streams.length);
      this.remoteStream = event.streams[0];
      console.log('[WebRTC] Remote stream set:', this.remoteStream?.id, 'tracks:', this.remoteStream?.getTracks().length);
      this.events.onTrack?.(event.streams[0]);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.events.onIceCandidate?.(event.candidate);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.events.onConnectionStateChange?.(this.peerConnection!.connectionState);
    };

    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };
  }

  private createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    const channel = this.peerConnection.createDataChannel(label, options);
    this.setupDataChannel(channel);
    return channel;
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannels.set(channel.label, channel);
    console.log(`[WebRTC] Data channel setup: ${channel.label}, initial state: ${channel.readyState}`);

    channel.onopen = () => {
      console.log(`[WebRTC] Data channel OPEN: ${channel.label}`);
      this.events.onDataChannelOpen?.(channel.label);
    };

    channel.onmessage = (event) => {
      this.events.onDataChannelMessage?.(channel.label, event.data);
    };

    channel.onclose = () => {
      this.events.onDataChannelClose?.(channel.label);
      this.dataChannels.delete(channel.label);
    };

    channel.onerror = (error) => {
      console.error(`DataChannel ${channel.label} error:`, error);
    };
  }
}
