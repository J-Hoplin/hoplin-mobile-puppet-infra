import { create } from 'zustand';
import type {
  ConnectionState,
  Device,
  MetricsData,
  LogEntry,
  FileInfo,
  WebRTCStats,
  AppInfo,
} from '../types';

export interface RemotePuppetStore {
  connectionState: ConnectionState;
  webrtcState: RTCPeerConnectionState | null;
  devices: Device[];
  currentDeviceId: string | null;
  stream: MediaStream | null;
  metrics: MetricsData | null;
  logs: LogEntry[];
  appList: AppInfo[];
  selectedLogPackage: string;
  files: FileInfo[];
  currentPath: string;
  stats: WebRTCStats | null;
  error: string | null;
  shellOutput: string;

  setConnectionState: (state: ConnectionState) => void;
  setWebRTCState: (state: RTCPeerConnectionState | null) => void;
  setDevices: (devices: Device[]) => void;
  setCurrentDeviceId: (deviceId: string | null) => void;
  setStream: (stream: MediaStream | null) => void;
  setMetrics: (metrics: MetricsData | null) => void;
  addLog: (entry: LogEntry) => void;
  addLogs: (entries: LogEntry[]) => void;
  clearLogs: () => void;
  setAppList: (apps: AppInfo[]) => void;
  setSelectedLogPackage: (packageName: string) => void;
  setFiles: (files: FileInfo[]) => void;
  setCurrentPath: (path: string) => void;
  setStats: (stats: WebRTCStats | null) => void;
  setError: (error: string | null) => void;
  addShellOutput: (output: string) => void;
  clearShellOutput: () => void;
  reset: () => void;
}

const MAX_LOGS = 1000;

export const useRemotePuppetStore = create<RemotePuppetStore>((set) => ({
  connectionState: 'disconnected',
  webrtcState: null,
  devices: [],
  currentDeviceId: null,
  stream: null,
  metrics: null,
  logs: [],
  appList: [],
  selectedLogPackage: '',
  files: [],
  currentPath: '/',
  stats: null,
  error: null,
  shellOutput: '',

  setConnectionState: (state) => set({ connectionState: state }),
  setWebRTCState: (state) => set({ webrtcState: state }),
  setDevices: (devices) => set({ devices }),
  setCurrentDeviceId: (deviceId) => set({ currentDeviceId: deviceId }),
  setStream: (stream) => set({ stream }),
  setMetrics: (metrics) => set({ metrics }),
  addLog: (entry) =>
    set((state) => ({
      logs: [...state.logs.slice(-MAX_LOGS + 1), entry],
    })),
  addLogs: (entries) =>
    set((state) => ({
      logs: [...state.logs, ...entries].slice(-MAX_LOGS),
    })),
  clearLogs: () => set({ logs: [] }),
  setAppList: (apps) => set({ appList: apps }),
  setSelectedLogPackage: (packageName) => set({ selectedLogPackage: packageName }),
  setFiles: (files) => set({ files }),
  setCurrentPath: (path) => set({ currentPath: path }),
  setStats: (stats) => set({ stats }),
  setError: (error) => set({ error }),
  addShellOutput: (output) =>
    set((state) => ({
      shellOutput: state.shellOutput + output,
    })),
  clearShellOutput: () => set({ shellOutput: '' }),
  reset: () =>
    set({
      connectionState: 'disconnected',
      webrtcState: null,
      currentDeviceId: null,
      stream: null,
      metrics: null,
      logs: [],
      appList: [],
      selectedLogPackage: '',
      files: [],
      currentPath: '/',
      stats: null,
      error: null,
      shellOutput: '',
    }),
}));
