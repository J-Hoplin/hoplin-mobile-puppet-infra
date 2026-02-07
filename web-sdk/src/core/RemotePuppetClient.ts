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
  AppInfo,
  FileTransfer,
} from '../types';

export interface RemotePuppetEvents {
  onConnectionStateChange: (state: ConnectionState) => void;
  onWebRTCStateChange: (state: RTCPeerConnectionState) => void;
  onStream: (stream: MediaStream) => void;
  onMetrics: (data: MetricsData) => void;
  onLog: (entry: LogEntry) => void;
  onLogs: (entries: LogEntry[]) => void;
  onAppList: (apps: AppInfo[]) => void;
  onFileList: (files: FileInfo[], path: string) => void;
  onFileTransferStart: (transfer: FileTransfer) => void;
  onFileTransferProgress: (transferId: string, transferredBytes: number, speed: number) => void;
  onFileTransferComplete: (transferId: string) => void;
  onFileTransferError: (transferId: string, error: string) => void;
  onShellOutput: (data: string, isStderr: boolean) => void;
  onShellClear: () => void;
  onError: (error: string) => void;
}

export class RemotePuppetClient {
  private signaling: SignalingClient;
  private webrtc: WebRTCManager;
  private events: Partial<RemotePuppetEvents> = {};
  private currentDeviceId: string | null = null;
  private downloadBuffers: Map<string, { chunks: Map<number, ArrayBuffer>; totalChunks: number; totalBytes: number; startTime: number; fileName: string }> = new Map();
  private uploadProgress: Map<string, { startTime: number; totalBytes: number }> = new Map();

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
    // Wait for signaling connection to be fully established
    await this.signaling.connect();

    // Now get TURN credentials after connection is ready
    const turn = await this.signaling.getTurnCredentials();
    console.log('[RemotePuppet] TURN credentials received:', turn);
    if (turn) {
      this.webrtc.setIceServers([
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: turn.urls,
          username: turn.username,
          credential: turn.credential,
        },
      ]);
      console.log('[RemotePuppet] ICE servers configured with TURN');
    } else {
      console.warn('[RemotePuppet] No TURN credentials received, using STUN only');
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
    console.log('[RemotePuppet] joinSession called for device:', deviceId);
    const result = await this.signaling.joinSession(deviceId);
    console.log('[RemotePuppet] joinSession result:', result);
    if (!result.success) {
      return result;
    }

    this.currentDeviceId = deviceId;
    console.log('[RemotePuppet] Waiting for offer from Android device...');

    // Android will send offer when it receives session:join event
    // We just wait for it and handle it in setupSignalingEvents

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

  sendPowerDialog(): boolean {
    console.log('[RemotePuppet] sendPowerDialog called');
    return this.sendControl({ type: 'power_dialog' });
  }

  sendLockScreen(): boolean {
    console.log('[RemotePuppet] sendLockScreen called');
    return this.sendControl({ type: 'lock_screen' });
  }

  sendScreenshot(): boolean {
    console.log('[RemotePuppet] sendScreenshot called');
    return this.sendControl({ type: 'screenshot' });
  }

  async reconnect(): Promise<{ success: boolean; error?: string }> {
    console.log('[RemotePuppet] reconnect called');
    const deviceId = this.currentDeviceId;
    if (!deviceId) {
      return { success: false, error: 'No active session to reconnect' };
    }

    // Close WebRTC without losing deviceId
    this.webrtc.close();

    // Try to leave old session (may fail if already cleaned up, that's OK)
    try {
      await this.signaling.leaveSession(deviceId);
    } catch (e) {
      console.warn('[RemotePuppet] leaveSession during reconnect failed (expected):', e);
    }
    this.currentDeviceId = null;

    // Rejoin session
    const result = await this.joinSession(deviceId);

    if (!result.success) {
      // Preserve deviceId so the user can retry reconnect
      this.currentDeviceId = deviceId;
      console.error('[RemotePuppet] reconnect failed:', result.error);
    }

    return result;
  }

  getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
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

  downloadFile(path: string, fileName: string): string {
    const transferId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.webrtc.sendData(
      'file',
      JSON.stringify({ operation: 'download', path, fileName, transferId })
    );
    return transferId;
  }

  uploadFile(path: string, fileName: string, fileData: ArrayBuffer): string {
    const transferId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const chunkSize = 64 * 1024; // 64KB chunks
    const totalChunks = Math.ceil(fileData.byteLength / chunkSize);

    this.uploadProgress.set(transferId, {
      startTime: Date.now(),
      totalBytes: fileData.byteLength,
    });

    // Emit transfer start event
    this.events.onFileTransferStart?.({
      id: transferId,
      fileName,
      filePath: path,
      direction: 'upload',
      status: 'transferring',
      totalBytes: fileData.byteLength,
      transferredBytes: 0,
      speed: 0,
      startTime: Date.now(),
    });

    // Send chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileData.byteLength);
      const chunk = fileData.slice(start, end);
      const base64Data = this.arrayBufferToBase64(chunk);

      this.webrtc.sendData(
        'file',
        JSON.stringify({
          operation: 'upload',
          path,
          transferId,
          chunkIndex: i,
          totalChunks,
          data: base64Data,
        })
      );
    }

    return transferId;
  }

  deleteFile(path: string): boolean {
    return this.webrtc.sendData(
      'file',
      JSON.stringify({ operation: 'delete', path })
    );
  }

  createDirectory(path: string): boolean {
    return this.webrtc.sendData(
      'file',
      JSON.stringify({ operation: 'mkdir', path })
    );
  }

  cancelTransfer(transferId: string): void {
    // Remove from tracking maps
    this.downloadBuffers.delete(transferId);
    this.uploadProgress.delete(transferId);
    // Emit cancelled status
    this.events.onFileTransferError?.(transferId, 'Cancelled by user');
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Log methods
  requestAppList(): boolean {
    return this.webrtc.sendData(
      'logs',
      JSON.stringify({ action: 'getApps' })
    );
  }

  startLogs(packageName?: string): boolean {
    return this.webrtc.sendData(
      'logs',
      JSON.stringify({ action: 'start', packageName: packageName || '' })
    );
  }

  stopLogs(): boolean {
    return this.webrtc.sendData(
      'logs',
      JSON.stringify({ action: 'stop' })
    );
  }

  setLogPackage(packageName: string): boolean {
    return this.webrtc.sendData(
      'logs',
      JSON.stringify({ action: 'setPackage', packageName })
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
      console.log('[RemotePuppet] Signaling connection state changed:', state);
      this.events.onConnectionStateChange?.(state);
    });

    // Handle offer from Android (Android creates offer, Desktop creates answer)
    this.signaling.on('onOffer', async (deviceId, sdp) => {
      console.log('[RemotePuppet] *** OFFER RECEIVED *** from device:', deviceId);
      console.log('[RemotePuppet] Offer SDP type:', sdp.type);
      if (deviceId === this.currentDeviceId) {
        console.log('[RemotePuppet] Creating answer for offer...');
        const answer = await this.webrtc.handleOffer(sdp);
        console.log('[RemotePuppet] Answer created, sending to device...');
        this.signaling.sendAnswer(deviceId, answer);
        console.log('[RemotePuppet] Answer sent to device:', deviceId);
      } else {
        console.warn('[RemotePuppet] Offer from unknown device:', deviceId, 'current:', this.currentDeviceId);
      }
    });

    this.signaling.on('onIceCandidate', async (_targetId, candidate) => {
      console.log('[RemotePuppet] ICE candidate received from:', _targetId);
      await this.webrtc.handleIceCandidate(candidate);
    });

    this.signaling.on('onError', (error) => {
      console.error('[RemotePuppet] Signaling error:', error);
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
          if (parsed.type === 'appList' && parsed.apps) {
            console.log('[RemotePuppet] App list received:', parsed.apps);
            this.events.onAppList?.(parsed.apps as AppInfo[]);
          } else if (parsed.type === 'logs' && parsed.logs) {
            console.log('[RemotePuppet] Logs received:', parsed.logs.length, 'entries');
            this.events.onLogs?.(parsed.logs as LogEntry[]);
          } else {
            // Legacy single log entry
            this.events.onLog?.(parsed as LogEntry);
          }
          break;
        case 'file':
          this.handleFileMessage(parsed);
          break;
        case 'shell':
          if (parsed.type === 'clear') {
            this.events.onShellClear?.();
          } else {
            this.events.onShellOutput?.(parsed.data || '', parsed.isStderr || false);
          }
          break;
      }
    } catch (e) {
      console.error(`Failed to parse DataChannel message from ${channel}:`, e);
    }
  }

  private handleFileMessage(parsed: Record<string, unknown>): void {
    const operation = parsed.operation as string;

    switch (operation) {
      case 'list':
        if (parsed.files) {
          this.events.onFileList?.(parsed.files as FileInfo[], parsed.path as string);
        }
        break;

      case 'downloadStart': {
        const transferId = parsed.transferId as string;
        const totalBytes = parsed.totalBytes as number;
        const totalChunks = parsed.totalChunks as number;
        const fileName = parsed.fileName as string;

        this.downloadBuffers.set(transferId, {
          chunks: new Map(),
          totalChunks,
          totalBytes,
          startTime: Date.now(),
          fileName,
        });

        this.events.onFileTransferStart?.({
          id: transferId,
          fileName,
          filePath: parsed.path as string,
          direction: 'download',
          status: 'transferring',
          totalBytes,
          transferredBytes: 0,
          speed: 0,
          startTime: Date.now(),
        });
        break;
      }

      case 'downloadChunk': {
        const transferId = parsed.transferId as string;
        const chunkIndex = parsed.chunkIndex as number;
        const chunkData = this.base64ToArrayBuffer(parsed.data as string);
        const buffer = this.downloadBuffers.get(transferId);

        if (buffer) {
          buffer.chunks.set(chunkIndex, chunkData);

          // Calculate progress
          let transferredBytes = 0;
          buffer.chunks.forEach((chunk) => {
            transferredBytes += chunk.byteLength;
          });

          const elapsedSeconds = (Date.now() - buffer.startTime) / 1000;
          const speed = elapsedSeconds > 0 ? transferredBytes / elapsedSeconds : 0;

          this.events.onFileTransferProgress?.(transferId, transferredBytes, speed);
        }
        break;
      }

      case 'downloadComplete': {
        const transferId = parsed.transferId as string;
        const buffer = this.downloadBuffers.get(transferId);

        if (buffer) {
          // Combine chunks and trigger download
          const totalSize = Array.from(buffer.chunks.values()).reduce((sum, chunk) => sum + chunk.byteLength, 0);
          const combined = new Uint8Array(totalSize);
          let offset = 0;

          for (let i = 0; i < buffer.totalChunks; i++) {
            const chunk = buffer.chunks.get(i);
            if (chunk) {
              combined.set(new Uint8Array(chunk), offset);
              offset += chunk.byteLength;
            }
          }

          // Trigger browser download
          const blob = new Blob([combined]);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = buffer.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          this.downloadBuffers.delete(transferId);
          this.events.onFileTransferComplete?.(transferId);
        }
        break;
      }

      case 'uploadProgress': {
        const transferId = parsed.transferId as string;
        const chunkIndex = parsed.chunkIndex as number;
        const totalChunks = parsed.totalChunks as number;
        const progress = this.uploadProgress.get(transferId);

        if (progress) {
          const transferredBytes = Math.floor((chunkIndex + 1) / totalChunks * progress.totalBytes);
          const elapsedSeconds = (Date.now() - progress.startTime) / 1000;
          const speed = elapsedSeconds > 0 ? transferredBytes / elapsedSeconds : 0;

          this.events.onFileTransferProgress?.(transferId, transferredBytes, speed);
        }
        break;
      }

      case 'uploadComplete': {
        const transferId = parsed.transferId as string;
        this.uploadProgress.delete(transferId);
        this.events.onFileTransferComplete?.(transferId);
        break;
      }

      case 'error': {
        const transferId = parsed.transferId as string;
        const error = parsed.error as string;
        this.downloadBuffers.delete(transferId);
        this.uploadProgress.delete(transferId);
        this.events.onFileTransferError?.(transferId, error);
        break;
      }

      case 'delete':
      case 'mkdir':
        // Refresh file list after delete or mkdir
        if (parsed.success) {
          // The client should request a new file list
        }
        break;
    }
  }
}
