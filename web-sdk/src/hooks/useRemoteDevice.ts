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
    client.on('onFileList', store.setFiles);
    client.on('onError', store.setError);

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
    store.setCurrentPath(path);
    return clientRef.current?.requestFileList(path) ?? false;
  }, []);

  const getStats = useCallback(async () => {
    const stats = await clientRef.current?.getStats();
    if (stats) {
      store.setStats(stats);
    }
    return stats;
  }, []);

  return {
    connectionState: store.connectionState,
    webrtcState: store.webrtcState,
    devices: store.devices,
    currentDeviceId: store.currentDeviceId,
    stream: store.stream,
    metrics: store.metrics,
    logs: store.logs,
    files: store.files,
    currentPath: store.currentPath,
    stats: store.stats,
    error: store.error,

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
    getStats,
    clearLogs: store.clearLogs,
    clearError: () => store.setError(null),
  };
}
