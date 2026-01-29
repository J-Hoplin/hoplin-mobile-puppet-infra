import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdScreenShare, MdTerminal, MdArticle, MdArrowBack, MdCircle } from 'react-icons/md';
import {
  RemoteScreen,
  MetricsPanel,
  LogViewer,
  AdbShell,
} from '@remote-puppet/web-sdk/react';
import { useRemoteDevice } from '@remote-puppet/web-sdk/react';
import { useAuthStore } from '../store/authStore';

type TabType = 'screen' | 'shell' | 'logs' | 'files';

export const ControlPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { token, serverUrl } = useAuthStore();

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
    sendShellCommand,
    clearLogs,
    addShellOutput,
    requestAppList,
    startLogs,
    stopLogs,
    setLogPackage,
  } = useRemoteDevice({
    serverUrl,
    token: token!,
    autoConnect: false,
  });

  const [isLogsStarted, setIsLogsStarted] = useState(false);

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
        // Start logs with default (agent app)
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
        ? 'Streaming'
        : `WebRTC: ${webrtcState}`
      : connectionState;

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/devices')}
            style={{ padding: '8px 12px' }}
          >
            <MdArrowBack size={18} />
            <span>Back</span>
          </button>
          <div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '2px',
              }}
            >
              Remote Control
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdCircle
                size={8}
                style={{
                  color: isStreaming ? 'var(--success)' : 'var(--warning)',
                  filter: isStreaming ? 'drop-shadow(0 0 4px var(--success))' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  color: isStreaming ? 'var(--success)' : 'var(--text-secondary)',
                }}
              >
                {statusText}
              </span>
            </div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={handleDisconnect}>
          Disconnect
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '20px',
          padding: '4px',
          background: 'var(--bg-tertiary)',
          borderRadius: '10px',
          width: 'fit-content',
        }}
      >
        <TabButton
          active={activeTab === 'screen'}
          onClick={() => setActiveTab('screen')}
          icon={<MdScreenShare size={16} />}
        >
          Screen
        </TabButton>
        <TabButton
          active={activeTab === 'shell'}
          onClick={() => setActiveTab('shell')}
          icon={<MdTerminal size={16} />}
        >
          Shell
        </TabButton>
        <TabButton
          active={activeTab === 'logs'}
          onClick={() => setActiveTab('logs')}
          icon={<MdArticle size={16} />}
        >
          Logs
        </TabButton>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', gap: '20px', overflow: 'hidden' }}>
        {activeTab === 'screen' && (
          <>
            <div
              className="card"
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <RemoteScreen
                stream={stream}
                onTouchDown={sendTouchDown}
                onTouchUp={sendTouchUp}
                onTouchMove={sendTouchMove}
                onBack={sendBack}
                onHome={sendHome}
                onRecent={sendRecent}
                showControls={true}
                style={{ maxHeight: '100%', borderRadius: '8px' }}
              />
            </div>
            <div
              className="card"
              style={{
                width: '320px',
                flexShrink: 0,
                overflow: 'auto',
                background: 'var(--bg-secondary)',
              }}
            >
              <div className="card-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: metrics ? 'var(--success)' : 'var(--text-muted)',
                  boxShadow: metrics ? '0 0 8px var(--success)' : 'none',
                }} />
                <span>System Metrics</span>
              </div>
              <div className="card-body" style={{ padding: '16px' }}>
                <MetricsPanel
                  metrics={metrics}
                  showProcesses={true}
                  maxProcesses={5}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'shell' && (
          <div
            className="card"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
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
                background: 'var(--bg-primary)',
                borderRadius: '12px',
              }}
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <div
            className="card"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              className="card-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>Application Logs</span>
                <select
                  value={selectedLogPackage}
                  onChange={(e) => handleAppChange(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    minWidth: '200px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}>
                  {logs.length} entries
                </span>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                  onClick={clearLogs}
                >
                  Clear
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '12px' }}>
              <LogViewer
                logs={logs}
                style={{
                  height: '100%',
                  background: 'var(--bg-primary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
                maxHeight="100%"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: active ? 'var(--accent)' : 'transparent',
      color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
      fontWeight: 600,
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: active ? '0 2px 10px rgba(0, 212, 170, 0.3)' : 'none',
    }}
  >
    {icon}
    {children}
  </button>
);
