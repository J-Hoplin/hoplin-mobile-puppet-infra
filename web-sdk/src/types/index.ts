export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'BUSY';

export interface Device {
  id: string;
  name: string;
  status: DeviceStatus;
  capabilities?: DeviceCapabilities;
  lastSeenAt?: string;
  createdAt: string;
}

export interface DeviceCapabilities {
  hasShizuku: boolean;
  hasRoot: boolean;
  androidVersion: string;
  apiLevel: number;
  deviceModel: string;
  manufacturer: string;
  screenWidth?: number;
  screenHeight?: number;
}

export interface SessionUser {
  id: string;
  email?: string;
  joinedAt: Date;
}

export interface TouchEvent {
  type: 'touch';
  action: 'down' | 'up' | 'move';
  x: number;
  y: number;
  pointerId?: number;
  pressure?: number;
}

export interface KeyEvent {
  type: 'key';
  action: 'down' | 'up';
  keyCode: number;
}

export type ControlEvent = TouchEvent | KeyEvent | { type: 'back' | 'home' | 'recent' };

export interface MetricsData {
  totalCpuPercent: number;
  totalMemoryBytes: number;
  availableMemoryBytes: number;
  usedMemoryBytes: number;
  topProcesses: ProcessInfo[];
  batteryLevel: number;
  isCharging: boolean;
  temperatureCelsius: number;
  timestamp: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryBytes: number;
  user: string;
}

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: number;
  permissions: string;
}

export interface LogEntry {
  level: 'verbose' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  tag: string;
  message: string;
  timestamp: number;
  pid: number;
  packageName?: string;
}

export interface AppInfo {
  packageName: string;
  appName: string;
  isDefault?: boolean;
}

export interface LogFilter {
  levels?: LogEntry['level'][];
  tags?: string[];
  packages?: string[];
  searchText?: string;
}

export interface RemotePuppetConfig {
  serverUrl: string;
  token: string;
  iceServers?: RTCIceServer[];
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface WebRTCStats {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  roundTripTime: number;
  jitter: number;
  frameRate?: number;
  resolution?: { width: number; height: number };
}
