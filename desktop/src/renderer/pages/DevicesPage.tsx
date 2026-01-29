import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPhoneAndroid, MdAdd, MdClose, MdContentCopy, MdCheck } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';

interface Device {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  authCode?: string;
  lastSeenAt?: string;
}

export const DevicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, serverUrl } = useAuthStore();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);
  const [newDeviceCode, setNewDeviceCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  }, [serverUrl, token]);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleAddDevice = async () => {
    if (!newDeviceName.trim()) return;

    setAddingDevice(true);
    try {
      const response = await fetch(`${serverUrl}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newDeviceName }),
      });

      if (response.ok) {
        const device = await response.json();
        setNewDeviceCode(device.authCode);
        setDevices((prev) => [device, ...prev]);
      }
    } catch (err) {
      console.error('Failed to add device:', err);
    } finally {
      setAddingDevice(false);
    }
  };

  const handleConnectDevice = (device: Device) => {
    navigate(`/control/${device.id}`);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewDeviceName('');
    setNewDeviceCode(null);
    setCopied(false);
  };

  const copyCode = () => {
    if (newDeviceCode) {
      navigator.clipboard.writeText(newDeviceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid var(--border-color)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading devices...
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '4px',
              color: 'var(--text-primary)',
            }}
          >
            Devices
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Manage and connect to your Android devices
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <MdAdd size={18} /> Add Device
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <MdPhoneAndroid className="empty-state-icon" size={64} />
            <h3 className="empty-state-title">No devices yet</h3>
            <p className="empty-state-description">
              Add your first Android device to start remote controlling it.
            </p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <MdAdd size={18} /> Add Your First Device
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {devices.map((device, index) => (
            <DeviceCard
              key={device.id}
              device={device}
              onConnect={() => handleConnectDevice(device)}
              style={{ animationDelay: `${index * 0.05}s` }}
            />
          ))}
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div
          className="backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeAddModal}
        >
          <div
            className="card fade-in"
            style={{
              width: '440px',
              maxWidth: '90%',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="card-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{newDeviceCode ? 'Device Added' : 'Add New Device'}</span>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px' }}
                onClick={closeAddModal}
              >
                <MdClose size={18} />
              </button>
            </div>
            <div className="card-body">
              {newDeviceCode ? (
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'var(--accent-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <MdCheck size={28} style={{ color: 'var(--accent)' }} />
                  </div>
                  <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                    Enter this code in the Android Agent app:
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '20px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      marginBottom: '16px',
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: '32px',
                        fontWeight: 600,
                        letterSpacing: '8px',
                        color: 'var(--accent)',
                      }}
                    >
                      {newDeviceCode}
                    </span>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '8px' }}
                      onClick={copyCode}
                    >
                      {copied ? (
                        <MdCheck size={20} style={{ color: 'var(--success)' }} />
                      ) : (
                        <MdContentCopy size={20} />
                      )}
                    </button>
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginBottom: '24px',
                    }}
                  >
                    The device will appear in your list once connected.
                  </p>
                  <button className="btn btn-primary" onClick={closeAddModal}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label className="label">Device Name</label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%' }}
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      placeholder="e.g., Galaxy S24, Pixel 8 Pro"
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={closeAddModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={handleAddDevice}
                      disabled={addingDevice || !newDeviceName.trim()}
                    >
                      {addingDevice ? 'Adding...' : 'Add Device'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DeviceCard: React.FC<{
  device: Device;
  onConnect: () => void;
  style?: React.CSSProperties;
}> = ({ device, onConnect, style }) => {
  const statusConfig = {
    ONLINE: {
      color: 'var(--success)',
      label: 'Online',
      className: 'status-online',
    },
    OFFLINE: {
      color: 'var(--text-muted)',
      label: 'Offline',
      className: 'status-offline',
    },
    BUSY: {
      color: 'var(--warning)',
      label: 'Busy',
      className: 'status-busy',
    },
  };

  const status = statusConfig[device.status];

  return (
    <div
      className="card fade-in"
      style={{
        cursor: device.status === 'ONLINE' ? 'pointer' : 'default',
        transition: 'all 0.2s',
        ...style,
      }}
      onClick={device.status === 'ONLINE' ? onConnect : undefined}
      onMouseEnter={(e) => {
        if (device.status === 'ONLINE') {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 170, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="card-body">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: device.status === 'ONLINE' ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MdPhoneAndroid
              size={24}
              style={{
                color: device.status === 'ONLINE' ? 'var(--accent)' : 'var(--text-muted)',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--text-primary)',
              }}
            >
              {device.name}
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span className={`status-dot ${status.className}`} />
              <span style={{ fontSize: '12px', color: status.color }}>
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <button
          className={device.status === 'ONLINE' ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ width: '100%', marginTop: '16px' }}
          onClick={(e) => {
            e.stopPropagation();
            if (device.status === 'ONLINE') onConnect();
          }}
          disabled={device.status !== 'ONLINE'}
        >
          {device.status === 'ONLINE' ? 'Connect' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};
