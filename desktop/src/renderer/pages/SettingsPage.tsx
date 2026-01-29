import React, { useState, useEffect } from 'react';
import { MdCheck, MdRefresh, MdKeyboard, MdInfo, MdStorage } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';

export const SettingsPage: React.FC = () => {
  const { serverUrl, setServerUrl } = useAuthStore();
  const [version, setVersion] = useState('');
  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(setVersion);
  }, []);

  const handleSaveServerUrl = () => {
    setServerUrl(localServerUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCheckUpdates = async () => {
    await window.electronAPI?.checkForUpdates();
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '4px',
            color: 'var(--text-primary)',
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Configure your Remote Puppet experience
        </p>
      </div>

      {/* Server Configuration */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <MdStorage size={18} style={{ color: 'var(--accent)' }} />
          <span>Server Configuration</span>
        </div>
        <div className="card-body">
          <div>
            <label className="label">Server URL</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="url"
                className="input mono"
                style={{ flex: 1, fontSize: '13px' }}
                value={localServerUrl}
                onChange={(e) => setLocalServerUrl(e.target.value)}
                placeholder="http://localhost:3000"
              />
              <button
                className="btn btn-primary"
                onClick={handleSaveServerUrl}
                style={{ minWidth: '100px' }}
              >
                {saved ? (
                  <>
                    <MdCheck size={16} /> Saved
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
            {saved && (
              <p
                style={{
                  marginTop: '10px',
                  color: 'var(--success)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <MdCheck size={14} />
                Settings saved successfully
              </p>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <MdInfo size={18} style={{ color: 'var(--accent)' }} />
          <span>About</span>
        </div>
        <div className="card-body">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '16px',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  marginBottom: '4px',
                }}
              >
                Remote Puppet Desktop
              </div>
              <div
                className="mono"
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                Version {version || 'Development'}
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleCheckUpdates}
              style={{ gap: '6px' }}
            >
              <MdRefresh size={16} />
              Check for Updates
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <MdKeyboard size={18} style={{ color: 'var(--accent)' }} />
          <span>Keyboard Shortcuts</span>
        </div>
        <div className="card-body" style={{ padding: '12px 20px' }}>
          <table style={{ width: '100%', fontSize: '13px' }}>
            <tbody>
              <ShortcutRow keys={['⌘', 'D']} description="Toggle DevTools" />
              <ShortcutRow keys={['⌘', 'R']} description="Reload app" />
              <ShortcutRow keys={['Esc']} description="Disconnect from device" />
              <ShortcutRow keys={['⌘', 'Q']} description="Quit application" />
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '32px',
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        <p style={{ marginBottom: '8px' }}>
          Remote Puppet - WebRTC-based Android Remote Control
        </p>
        <p>
          Built with Electron, React, and TypeScript
        </p>
      </div>
    </div>
  );
};

const ShortcutRow: React.FC<{ keys: string[]; description: string }> = ({
  keys,
  description,
}) => (
  <tr
    style={{
      borderBottom: '1px solid var(--border-color)',
    }}
  >
    <td style={{ padding: '14px 0', width: '140px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        {keys.map((key, i) => (
          <React.Fragment key={i}>
            <kbd
              style={{
                padding: '4px 10px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
                boxShadow: '0 2px 0 var(--border-color)',
              }}
            >
              {key}
            </kbd>
            {i < keys.length - 1 && (
              <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </td>
    <td style={{ padding: '14px 0', color: 'var(--text-secondary)' }}>
      {description}
    </td>
  </tr>
);
