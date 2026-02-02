import { useEffect, useRef, useCallback } from 'react';
import { RemotePuppetClient } from '../core/RemotePuppetClient';
import { useRemotePuppetStore } from '../core/store';
import type { RemotePuppetConfig, ControlEvent } from '../types';

export interface UseRemoteDeviceOptions extends RemotePuppetConfig {
  autoConnect?: boolean;
}

export function useRemoteDevice(options: UseRemoteDeviceOptions) {
  const clientRef = useRef<RemotePuppetClient | null>(null);
  const store = useRemotePuppetStore();

  useEffect(() => {
    const client = new RemotePuppetClient({
      serverUrl: options.serverUrl,
      token: options.token,
      iceServers: options.iceServers,
      reconnectAttempts: options.reconnectAttempts,
      reconnectDelay: options.reconnectDelay,
    });

    client.on('onConnectionStateChange', store.setConnectionState);
    client.on('onWebRTCStateChange', store.setWebRTCState);
    client.on('onStream', store.setStream);
    client.on('onMetrics', store.setMetrics);
    client.on('onLog', store.addLog);
    client.on('onLogs', store.addLogs);
    client.on('onAppList', store.setAppList);
    client.on('onFileList', (files, path) => {
      store.setFiles(files);
      store.setCurrentPath(path);
    });
    client.on('onFileTransferStart', store.addFileTransfer);
    client.on('onFileTransferProgress', (id, transferredBytes, speed) => {
      store.updateFileTransfer(id, { transferredBytes, speed, status: 'transferring' });
    });
    client.on('onFileTransferComplete', (id) => {
      store.updateFileTransfer(id, { status: 'completed' });
    });
    client.on('onFileTransferError', (id, error) => {
      store.updateFileTransfer(id, { status: 'error', error });
    });
    client.on('onError', store.setError);
    client.on('onShellOutput', (data: string) => {
      store.addShellOutput(data + '\n');
    });
    client.on('onShellClear', () => {
      store.clearShellOutput();
    });

    clientRef.current = client;

    if (options.autoConnect !== false) {
      client.connect();
    }

    return () => {
      client.disconnect();
      store.reset();
    };
  }, [options.serverUrl, options.token]);

  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    store.reset();
  }, []);

  const joinSession = useCallback(async (deviceId: string) => {
    const result = await clientRef.current?.joinSession(deviceId);
    if (result?.success) {
      store.setCurrentDeviceId(deviceId);
    }
    return result;
  }, []);

  const leaveSession = useCallback(async () => {
    await clientRef.current?.leaveSession();
    store.setCurrentDeviceId(null);
    store.setStream(null);
    store.setMetrics(null);
  }, []);

  const refreshDevices = useCallback(async () => {
    const devices = await clientRef.current?.getDevices();
    if (devices) {
      store.setDevices(devices);
    }
    return devices || [];
  }, []);

  const sendControl = useCallback((event: ControlEvent) => {
    return clientRef.current?.sendControl(event) ?? false;
  }, []);

  const sendTouchDown = useCallback((x: number, y: number, pointerId = 0) => {
    return clientRef.current?.sendTouchDown(x, y, pointerId) ?? false;
  }, []);

  const sendTouchUp = useCallback((x: number, y: number, pointerId = 0) => {
    return clientRef.current?.sendTouchUp(x, y, pointerId) ?? false;
  }, []);

  const sendTouchMove = useCallback((x: number, y: number, pointerId = 0) => {
    return clientRef.current?.sendTouchMove(x, y, pointerId) ?? false;
  }, []);

  const sendBack = useCallback(() => {
    return clientRef.current?.sendBack() ?? false;
  }, []);

  const sendHome = useCallback(() => {
    return clientRef.current?.sendHome() ?? false;
  }, []);

  const sendRecent = useCallback(() => {
    return clientRef.current?.sendRecent() ?? false;
  }, []);

  const sendShellCommand = useCallback((command: string, sessionId = 'default') => {
    return clientRef.current?.sendShellCommand(command, sessionId) ?? false;
  }, []);

  const requestFileList = useCallback((path: string) => {
    store.setIsLoadingFiles(true);
    return clientRef.current?.requestFileList(path) ?? false;
  }, []);

  const downloadFile = useCallback((path: string, fileName: string) => {
    return clientRef.current?.downloadFile(path, fileName) ?? null;
  }, []);

  const uploadFile = useCallback((path: string, fileName: string, fileData: ArrayBuffer) => {
    return clientRef.current?.uploadFile(path, fileName, fileData) ?? null;
  }, []);

  const deleteFile = useCallback((path: string) => {
    return clientRef.current?.deleteFile(path) ?? false;
  }, []);

  const createDirectory = useCallback((path: string) => {
    return clientRef.current?.createDirectory(path) ?? false;
  }, []);

  const cancelTransfer = useCallback((transferId: string) => {
    clientRef.current?.cancelTransfer(transferId);
    store.removeFileTransfer(transferId);
  }, []);

  const getStats = useCallback(async () => {
    const stats = await clientRef.current?.getStats();
    if (stats) {
      store.setStats(stats);
    }
    return stats;
  }, []);

  // Log methods
  const requestAppList = useCallback(() => {
    return clientRef.current?.requestAppList() ?? false;
  }, []);

  const startLogs = useCallback((packageName?: string) => {
    return clientRef.current?.startLogs(packageName) ?? false;
  }, []);

  const stopLogs = useCallback(() => {
    return clientRef.current?.stopLogs() ?? false;
  }, []);

  const setLogPackage = useCallback((packageName: string) => {
    store.setSelectedLogPackage(packageName);
    return clientRef.current?.setLogPackage(packageName) ?? false;
  }, []);

  return {
    connectionState: store.connectionState,
    webrtcState: store.webrtcState,
    devices: store.devices,
    currentDeviceId: store.currentDeviceId,
    stream: store.stream,
    metrics: store.metrics,
    logs: store.logs,
    appList: store.appList,
    selectedLogPackage: store.selectedLogPackage,
    files: store.files,
    currentPath: store.currentPath,
    isLoadingFiles: store.isLoadingFiles,
    fileTransfers: store.fileTransfers,
    stats: store.stats,
    error: store.error,
    shellOutput: store.shellOutput,

    connect,
    disconnect,
    joinSession,
    leaveSession,
    refreshDevices,
    sendControl,
    sendTouchDown,
    sendTouchUp,
    sendTouchMove,
    sendBack,
    sendHome,
    sendRecent,
    sendShellCommand,
    requestFileList,
    downloadFile,
    uploadFile,
    deleteFile,
    createDirectory,
    cancelTransfer,
    removeFileTransfer: store.removeFileTransfer,
    clearFileTransfers: store.clearFileTransfers,
    getStats,
    clearLogs: store.clearLogs,
    clearShellOutput: store.clearShellOutput,
    addShellOutput: store.addShellOutput,
    clearError: () => store.setError(null),

    // Log methods
    requestAppList,
    startLogs,
    stopLogs,
    setLogPackage,
  };
}
