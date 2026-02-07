import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  Terminal,
  ScrollText,
  FolderTree,
  RefreshCw,
  Power,
  Lock,
  Camera,
  Circle,
  Square,
} from 'lucide-react';
import {
  RemoteScreen,
  MetricsPanel,
  LogViewer,
  AdbShell,
  FileExplorer,
  SDKThemeProvider,
} from '@remote-puppet/web-sdk/react';
import { useRemoteDevice } from '@remote-puppet/web-sdk/react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../store/settingsStore';
import {
  spacing,
  borderRadius,
  sizing,
  fontFamily,
  fontSize,
  fontWeight,
  useTheme,
  ThemeColors,
} from '../design-system';

type TabType = 'screen' | 'shell' | 'logs' | 'files';

export const ControlPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { token, serverUrl } = useAuthStore();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>('screen');

  const {
    connectionState,
    webrtcState,
    stream,
    metrics,
    logs,
    shellOutput,
    appList,
    selectedLogPackage,
    files,
    currentPath,
    isLoadingFiles,
    fileTransfers,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    sendTouchDown,
    sendTouchUp,
    sendTouchMove,
    sendBack,
    sendHome,
    sendRecent,
    sendPowerDialog,
    sendLockScreen,
    sendScreenshot,
    reconnect,
    sendShellCommand,
    clearLogs,
    addShellOutput,
    requestAppList,
    startLogs,
    stopLogs,
    setLogPackage,
    requestFileList,
    downloadFile,
    uploadFile,
    deleteFile,
    createDirectory,
    cancelTransfer,
    removeFileTransfer,
  } = useRemoteDevice({
    serverUrl,
    token: token!,
    autoConnect: false,
  });

  const [isLogsStarted, setIsLogsStarted] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = useCallback(async () => {
    setIsReconnecting(true);
    try {
      const result = await reconnect();
      if (result && !result.success) {
        console.error('[ControlPage] Reconnect failed:', result.error);
      }
    } finally {
      setIsReconnecting(false);
    }
  }, [reconnect]);

  useEffect(() => {
    if (deviceId && token) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [deviceId, token]);

  useEffect(() => {
    if (connectionState === 'connected' && deviceId) {
      joinSession(deviceId);
    }
  }, [connectionState, deviceId]);

  // Request app list when Logs tab is activated and WebRTC is connected
  useEffect(() => {
    if (activeTab === 'logs' && webrtcState === 'connected') {
      requestAppList();
      if (!isLogsStarted) {
        startLogs();
        setIsLogsStarted(true);
      }
    }
  }, [activeTab, webrtcState, isLogsStarted, requestAppList, startLogs]);

  // Stop logs when leaving Logs tab
  useEffect(() => {
    if (activeTab !== 'logs' && isLogsStarted) {
      stopLogs();
      setIsLogsStarted(false);
    }
  }, [activeTab, isLogsStarted, stopLogs]);

  // Request file list when Files tab is activated and WebRTC is connected
  useEffect(() => {
    if (activeTab === 'files' && webrtcState === 'connected') {
      const defaultPath = metrics?.deviceInfo?.externalStoragePath || '/';
      const path = (!currentPath || currentPath === '/') ? defaultPath : currentPath;
      requestFileList(path);
    }
  }, [activeTab, webrtcState, metrics?.deviceInfo?.externalStoragePath]);

  // Auto-refresh file list when upload completes
  const prevTransfersRef = React.useRef(fileTransfers);
  useEffect(() => {
    const prevTransfers = prevTransfersRef.current;
    const newlyCompleted = fileTransfers.filter(
      (t) =>
        t.status === 'completed' &&
        t.direction === 'upload' &&
        prevTransfers.find((p) => p.id === t.id)?.status === 'transferring'
    );
    if (newlyCompleted.length > 0 && activeTab === 'files') {
      setTimeout(() => requestFileList(currentPath), 300);
    }
    prevTransfersRef.current = fileTransfers;
  }, [fileTransfers, activeTab, currentPath, requestFileList]);

  const handleAppChange = useCallback((packageName: string) => {
    setLogPackage(packageName);
    clearLogs();
  }, [setLogPackage, clearLogs]);

  const handleDisconnect = useCallback(() => {
    leaveSession();
    navigate('/devices');
  }, [leaveSession, navigate]);

  const handleShellCommand = useCallback(
    (command: string) => {
      addShellOutput(`$ ${command}\n`);
      sendShellCommand(command);
    },
    [sendShellCommand, addShellOutput]
  );

  const isStreaming = connectionState === 'connected' && webrtcState === 'connected';
  const statusText =
    connectionState === 'connected'
      ? webrtcState === 'connected'
        ? t('control.streaming')
        : `WebRTC: ${webrtcState}`
      : connectionState;

  const deviceName = metrics?.deviceInfo?.model || deviceId || 'Device';

  return (
    <SDKThemeProvider mode={isDark ? 'dark' : 'light'}>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: `${spacing[6]} ${spacing[8]}` }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[6],
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
          <button
            onClick={() => navigate('/devices')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing[2],
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.sm,
              color: colors.mutedForeground,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              style={{
                fontFamily: fontFamily.display,
                fontSize: fontSize['2xl'],
                fontWeight: fontWeight.semibold,
                color: colors.foreground,
                marginBottom: spacing[1],
              }}
            >
              {deviceName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: borderRadius.full,
                  background: isStreaming ? colors.success : colors.warning,
                  boxShadow: isStreaming ? `0 0 8px ${colors.success}` : 'none',
                }}
              />
              <span
                style={{
                  fontFamily: fontFamily.primary,
                  fontSize: fontSize.md,
                  color: isStreaming ? colors.success : colors.mutedForeground,
                }}
              >
                {statusText}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: spacing[3] }}>
          <button
            onClick={handleReconnect}
            disabled={isReconnecting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[2]} ${spacing[4]}`,
              background: colors.primary,
              color: colors.foreground,
              border: 'none',
              borderRadius: borderRadius.sm,
              fontFamily: fontFamily.display,
              fontSize: fontSize.lg,
              fontWeight: fontWeight.medium,
              cursor: isReconnecting ? 'not-allowed' : 'pointer',
              opacity: isReconnecting ? 0.6 : 1,
            }}
          >
            <RefreshCw
              size={16}
              style={{ animation: isReconnecting ? 'spin 1s linear infinite' : 'none' }}
            />
            {t('control.reconnect')}
          </button>
          <button
            onClick={handleDisconnect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[2]} ${spacing[4]}`,
              background: 'transparent',
              border: `1px solid ${colors.error}`,
              borderRadius: borderRadius.sm,
              color: colors.error,
              fontFamily: fontFamily.display,
              fontSize: fontSize.lg,
              fontWeight: fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            {t('control.disconnect')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: spacing[5],
        }}
      >
        <TabButton
          active={activeTab === 'screen'}
          onClick={() => setActiveTab('screen')}
          icon={<Monitor size={16} />}
          colors={colors}
        >
          {t('control.tabs.screen')}
        </TabButton>
        <TabButton
          active={activeTab === 'files'}
          onClick={() => setActiveTab('files')}
          icon={<FolderTree size={16} />}
          colors={colors}
        >
          {t('control.tabs.files')}
        </TabButton>
        <TabButton
          active={activeTab === 'logs'}
          onClick={() => setActiveTab('logs')}
          icon={<ScrollText size={16} />}
          colors={colors}
        >
          {t('control.tabs.logs')}
        </TabButton>
        <TabButton
          active={activeTab === 'shell'}
          onClick={() => setActiveTab('shell')}
          icon={<Terminal size={16} />}
          colors={colors}
        >
          {t('control.tabs.shell')}
        </TabButton>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', gap: spacing[5], overflow: 'hidden' }}>
        {activeTab === 'screen' && (
          <>
            {/* Phone Preview */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              <RemoteScreen
                stream={stream}
                onTouchDown={sendTouchDown}
                onTouchUp={sendTouchUp}
                onTouchMove={sendTouchMove}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                }}
              />
            </div>

            {/* Metrics Panel */}
            <div
              style={{
                width: sizing.metricsPanel,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[4],
                overflow: 'auto',
              }}
            >
              {/* Device Controls */}
              <div
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.xl,
                  padding: spacing[4],
                }}
              >
                <h3
                  style={{
                    fontFamily: fontFamily.display,
                    fontSize: fontSize.xl,
                    fontWeight: fontWeight.semibold,
                    color: colors.foreground,
                    marginBottom: spacing[4],
                  }}
                >
                  {t('control.deviceControls')}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: spacing[2],
                  }}
                >
                  <ControlButton
                    icon={<ArrowLeft size={20} />}
                    label={t('control.back')}
                    onClick={sendBack}
                    colors={colors}
                  />
                  <ControlButton
                    icon={<Circle size={20} />}
                    label={t('control.home')}
                    onClick={sendHome}
                    colors={colors}
                  />
                  <ControlButton
                    icon={<Square size={20} />}
                    label={t('control.recent')}
                    onClick={sendRecent}
                    colors={colors}
                  />
                  <ControlButton
                    icon={<Power size={20} />}
                    label={t('control.power')}
                    onClick={sendPowerDialog}
                    color={colors.error}
                    colors={colors}
                  />
                  <ControlButton
                    icon={<Lock size={20} />}
                    label={t('control.lockScreen')}
                    onClick={sendLockScreen}
                    colors={colors}
                  />
                  <ControlButton
                    icon={<Camera size={20} />}
                    label={t('control.screenshot')}
                    onClick={sendScreenshot}
                    colors={colors}
                  />
                </div>
              </div>

              {/* System Metrics */}
              <div
                style={{
                  flex: 1,
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.xl,
                  padding: spacing[4],
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    marginBottom: spacing[4],
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: borderRadius.full,
                      background: metrics ? colors.success : colors.mutedForeground,
                      boxShadow: metrics ? `0 0 8px ${colors.success}` : 'none',
                    }}
                  />
                  <h3
                    style={{
                      fontFamily: fontFamily.display,
                      fontSize: fontSize.xl,
                      fontWeight: fontWeight.semibold,
                      color: colors.foreground,
                    }}
                  >
                    {t('control.systemMetrics')}
                  </h3>
                </div>
                <MetricsPanel metrics={metrics} showProcesses={true} maxProcesses={5} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'shell' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.xl,
            }}
          >
            <AdbShell
              output={shellOutput}
              onCommand={handleShellCommand}
              maxHeight="none"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: colors.background,
                borderRadius: borderRadius.lg,
              }}
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.xl,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: `${spacing[4]} ${spacing[5]}`,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <span
                  style={{
                    fontFamily: fontFamily.display,
                    fontSize: fontSize.xl,
                    fontWeight: fontWeight.semibold,
                    color: colors.foreground,
                  }}
                >
                  {t('control.applicationLogs')}
                </span>
                <select
                  value={selectedLogPackage}
                  onChange={(e) => handleAppChange(e.target.value)}
                  style={{
                    padding: `${spacing[2]} ${spacing[3]}`,
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.border}`,
                    background: colors.background,
                    color: colors.foreground,
                    fontFamily: fontFamily.primary,
                    fontSize: fontSize.md,
                    cursor: 'pointer',
                    minWidth: '200px',
                    outline: 'none',
                  }}
                >
                  {appList.length === 0 ? (
                    <option value="">Loading apps...</option>
                  ) : (
                    appList.map((app) => (
                      <option key={app.packageName} value={app.packageName}>
                        {app.appName} {app.isDefault ? '(Agent)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <span
                  style={{
                    fontSize: fontSize.sm,
                    color: colors.mutedForeground,
                  }}
                >
                  {logs.length} entries
                </span>
                <button
                  onClick={clearLogs}
                  style={{
                    padding: `${spacing[1]} ${spacing[3]}`,
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    color: colors.mutedForeground,
                    fontSize: fontSize.sm,
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: spacing[4] }}>
              <LogViewer
                logs={logs}
                style={{
                  height: '100%',
                  background: colors.background,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.border}`,
                }}
                maxHeight="100%"
              />
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.xl,
            }}
          >
            <FileExplorer
              files={files}
              currentPath={currentPath}
              transfers={fileTransfers}
              isLoading={isLoadingFiles}
              onNavigate={requestFileList}
              onDownload={(file) => downloadFile(file.path, file.name)}
              onUpload={(path, fileName, data) => uploadFile(path, fileName, data)}
              onDelete={(file) => {
                if (confirm(`Delete "${file.name}"?`)) {
                  deleteFile(file.path);
                  setTimeout(() => requestFileList(currentPath), 500);
                }
              }}
              onCreateDirectory={createDirectory}
              onCancelTransfer={cancelTransfer}
              onRemoveTransfer={removeFileTransfer}
              style={{
                height: '100%',
                background: colors.surface,
                borderRadius: borderRadius.lg,
              }}
            />
          </div>
        )}
      </div>

      {/* Spin animation for reconnect button */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
    </SDKThemeProvider>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  colors: ThemeColors;
}> = ({ active, onClick, icon, children, colors }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: spacing[2],
      padding: `${spacing[3]} ${spacing[5]}`,
      background: 'transparent',
      border: 'none',
      borderBottom: `2px solid ${active ? colors.primary : 'transparent'}`,
      color: active ? colors.primary : colors.mutedForeground,
      fontFamily: fontFamily.display,
      fontSize: fontSize.lg,
      fontWeight: active ? fontWeight.medium : fontWeight.normal,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}
  >
    <span style={{ display: 'flex', color: active ? colors.primary : colors.mutedForeground }}>
      {icon}
    </span>
    {children}
  </button>
);

const ControlButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
  colors: ThemeColors;
}> = ({ icon, label, onClick, color, colors }) => (
  <button
    onClick={onClick}
    title={label}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[1],
      padding: spacing[3],
      minHeight: '60px',
      background: colors.surfaceElevated,
      border: `1px solid ${colors.border}`,
      borderRadius: borderRadius.lg,
      color: color || colors.mutedForeground,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}
  >
    {icon}
    <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>{label}</span>
  </button>
);
