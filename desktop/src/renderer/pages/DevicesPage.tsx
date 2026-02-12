import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Plus,
  Folder,
  X,
  Copy,
  Check,
  Pencil,
  Trash2,
  MoreVertical,
  Monitor,
  GripVertical,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFolderStore } from '../store/folderStore';
import { useTranslation } from '../store/settingsStore';
import {
  spacing,
  borderRadius,
  sizing,
  fontFamily,
  fontSize,
  fontWeight,
  useTheme,
} from '../design-system';

// Modal component that renders to body using Portal
const Modal: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      {children}
    </div>,
    document.body
  );
};

// Table column widths for consistent alignment (fixed pixel widths)
const columnWidths = {
  name: 240,
  model: 140,
  os: 100,
  status: 100,
  folder: 120,
  actions: 150,
};

// Minimum table width to prevent squishing
const MIN_TABLE_WIDTH = Object.values(columnWidths).reduce((a, b) => a + b, 0);

interface Device {
  id: string;
  name: string;
  model?: string;
  osVersion?: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  authCode?: string;
  folderId?: string;
  folderName?: string;
  folder?: { id: string; name: string };
  capabilities?: Record<string, unknown>;
  lastSeenAt?: string;
}

type SortField = 'name' | 'model';
type SortDirection = 'asc' | 'desc';

export const DevicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { token, serverUrl } = useAuthStore();
  const { folders, selectedFolderId, setSelectedFolderId, fetchFolders, moveDeviceToFolder } = useFolderStore();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);
  const [newDeviceCode, setNewDeviceCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Rename modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameDevice, setRenameDevice] = useState<Device | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Action dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Drag and drop state
  const [draggedDeviceId, setDraggedDeviceId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

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
    fetchFolders();
    const interval = setInterval(() => {
      fetchDevices();
      fetchFolders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices, fetchFolders]);

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

  const openRenameModal = (device: Device) => {
    setRenameDevice(device);
    setRenameValue(device.name);
    setShowRenameModal(true);
    setOpenDropdownId(null);
  };

  const handleRename = async () => {
    if (!renameDevice || !renameValue.trim()) return;

    setRenaming(true);
    try {
      const response = await fetch(`${serverUrl}/devices/${renameDevice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: renameValue.trim() }),
      });

      if (response.ok) {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === renameDevice.id ? { ...d, name: renameValue.trim() } : d
          )
        );
        setShowRenameModal(false);
        setRenameDevice(null);
      }
    } catch (err) {
      console.error('Failed to rename device:', err);
    } finally {
      setRenaming(false);
    }
  };

  const openDeleteModal = (device: Device) => {
    setDeleteDevice(device);
    setShowDeleteModal(true);
    setOpenDropdownId(null);
  };

  const handleDelete = async () => {
    if (!deleteDevice) return;

    setDeleting(true);
    try {
      const response = await fetch(`${serverUrl}/devices/${deleteDevice.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setDevices((prev) => prev.filter((d) => d.id !== deleteDevice.id));
        setShowDeleteModal(false);
        setDeleteDevice(null);
      }
    } catch (err) {
      console.error('Failed to delete device:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, deviceId: string) => {
    setDraggedDeviceId(deviceId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', deviceId);
  };

  const handleDragEnd = () => {
    setDraggedDeviceId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const deviceId = e.dataTransfer.getData('text/plain');

    if (deviceId && draggedDeviceId) {
      const device = devices.find(d => d.id === deviceId);
      // Don't move if already in the same folder
      if (device && device.folderId !== folderId) {
        const success = await moveDeviceToFolder(deviceId, folderId);
        if (success) {
          // Update local state
          setDevices(prev => prev.map(d =>
            d.id === deviceId
              ? { ...d, folderId: folderId || undefined, folderName: folderId ? folders.find(f => f.id === folderId)?.name : undefined }
              : d
          ));
          fetchFolders(); // Refresh folder counts
        }
      }
    }

    setDraggedDeviceId(null);
    setDragOverFolderId(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter devices by selected folder and search query
  const filteredDevices = devices
    .filter((d) => {
      if (selectedFolderId && d.folderId !== selectedFolderId) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = d.name?.toLowerCase() || '';
        const model = d.model?.toLowerCase() || '';
        return name.includes(q) || model.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const aVal = (a[sortField] || '').toLowerCase();
      const bVal = (b[sortField] || '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });

  // Count devices
  const totalDevices = devices.length;

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: colors.mutedForeground,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: `2px solid ${colors.border}`,
              borderTopColor: colors.primary,
              borderRadius: borderRadius.full,
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: `${spacing[8]} ${spacing[10]}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[8],
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: fontFamily.display,
              fontSize: fontSize['4xl'],
              fontWeight: fontWeight.semibold,
              color: colors.foreground,
              marginBottom: spacing[2],
            }}
          >
            {t('devices.title')}
          </h1>
          <p
            style={{
              fontFamily: fontFamily.primary,
              fontSize: fontSize.md,
              color: colors.mutedForeground,
            }}
          >
            {t('devices.description')}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: `${spacing[2]} ${spacing[4]}`,
            background: colors.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: borderRadius.md,
            fontFamily: fontFamily.display,
            fontSize: fontSize.lg,
            fontWeight: fontWeight.semibold,
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          {t('devices.addDevice')}
        </button>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: spacing[5], flex: 1, minHeight: 0 }}>
        {/* Folder Panel */}
        <div
          style={{
            width: sizing.folderPanel,
            flexShrink: 0,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.lg,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Folder Panel Header */}
          <div
            style={{
              padding: `${spacing[4]} ${spacing[5]}`,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <h3
              style={{
                fontFamily: fontFamily.display,
                fontSize: fontSize.xl,
                fontWeight: fontWeight.semibold,
                color: colors.foreground,
                marginBottom: spacing[1],
              }}
            >
              {t('folders.title')}
            </h3>
            <p
              style={{
                fontFamily: fontFamily.primary,
                fontSize: fontSize.xs,
                color: colors.mutedForeground,
              }}
            >
              {t('devices.dragHint')}
            </p>
          </div>

          {/* Folder List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* All Devices - Drop target for removing from folder */}
            <button
              onClick={() => setSelectedFolderId(null)}
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing[3]} ${spacing[5]}`,
                background: dragOverFolderId === null && draggedDeviceId
                  ? colors.primaryAlpha
                  : selectedFolderId === null
                    ? colors.surfaceElevated
                    : 'transparent',
                border: dragOverFolderId === null && draggedDeviceId
                  ? `2px dashed ${colors.primary}`
                  : '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <Monitor size={18} color={selectedFolderId === null ? colors.primary : colors.mutedForeground} />
                <span
                  style={{
                    fontFamily: fontFamily.primary,
                    fontSize: fontSize.lg,
                    color: selectedFolderId === null ? colors.foreground : colors.mutedForeground,
                  }}
                >
                  {t('devices.allDevices')}
                </span>
              </div>
              <span
                style={{
                  padding: `${spacing[1]} ${spacing[2]}`,
                  background: selectedFolderId === null ? colors.primary : colors.surfaceElevated,
                  borderRadius: borderRadius.full,
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.medium,
                  color: colors.foreground,
                }}
              >
                {totalDevices}
              </span>
            </button>

            {/* Folder Items - Drop targets */}
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${spacing[3]} ${spacing[5]}`,
                  background: dragOverFolderId === folder.id
                    ? colors.primaryAlpha
                    : selectedFolderId === folder.id
                      ? colors.surfaceElevated
                      : 'transparent',
                  border: dragOverFolderId === folder.id
                    ? `2px dashed ${colors.primary}`
                    : '2px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                  <Folder size={18} color={dragOverFolderId === folder.id || selectedFolderId === folder.id ? colors.primary : colors.mutedForeground} />
                  <span
                    style={{
                      fontFamily: fontFamily.primary,
                      fontSize: fontSize.lg,
                      color: dragOverFolderId === folder.id || selectedFolderId === folder.id ? colors.foreground : colors.mutedForeground,
                    }}
                  >
                    {folder.name}
                  </span>
                </div>
                <span
                  style={{
                    padding: `${spacing[1]} ${spacing[2]}`,
                    background: selectedFolderId === folder.id ? colors.primary : colors.surfaceElevated,
                    borderRadius: borderRadius.full,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.medium,
                    color: colors.foreground,
                  }}
                >
                  {folder.deviceCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Device Table */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.lg,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Device Header with search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${spacing[4]} ${spacing[5]}`,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <span
              style={{
                fontFamily: fontFamily.display,
                fontSize: fontSize.lg,
                fontWeight: fontWeight.semibold,
                color: colors.foreground,
              }}
            >
              {selectedFolderId
                ? `${folders.find((f) => f.id === selectedFolderId)?.name || ''} (${filteredDevices.length})`
                : `${t('devices.allDevices')} (${totalDevices})`}
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                padding: `${spacing[2]} ${spacing[4]}`,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                background: 'transparent',
              }}
            >
              <Search size={14} color={colors.mutedForeground} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('devices.searchPlaceholder') || 'Search devices...'}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: colors.foreground,
                  fontFamily: fontFamily.primary,
                  fontSize: fontSize.sm,
                  width: '160px',
                }}
              />
            </div>
          </div>
          {filteredDevices.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing[10],
                color: colors.mutedForeground,
              }}
            >
              <Smartphone size={48} style={{ opacity: 0.5, marginBottom: spacing[4] }} />
              <p style={{ fontFamily: fontFamily.display, fontSize: fontSize.xl, marginBottom: spacing[2] }}>
                {t('devices.noDevices')}
              </p>
              <p style={{ fontSize: fontSize.md }}>
                {t('devices.noDevicesHint')}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  marginTop: spacing[5],
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  padding: `${spacing[2]} ${spacing[4]}`,
                  background: colors.primary,
                  color: colors.foreground,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontFamily: fontFamily.display,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  cursor: 'pointer',
                }}
              >
                <Plus size={18} />
                {t('devices.addDevice')}
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', minWidth: `${MIN_TABLE_WIDTH}px`, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: columnWidths.name }} />
                  <col style={{ width: columnWidths.model }} />
                  <col style={{ width: columnWidths.os }} />
                  <col style={{ width: columnWidths.status }} />
                  <col style={{ width: columnWidths.folder }} />
                  <col style={{ width: columnWidths.actions }} />
                </colgroup>
                <thead>
                  <tr style={{ background: colors.surfaceElevated }}>
                    <th
                      onClick={() => handleSort('name')}
                      style={{
                        textAlign: 'left',
                        padding: `${spacing[3]} ${spacing[4]}`,
                        paddingLeft: '62px',
                        fontFamily: fontFamily.primary,
                        fontSize: fontSize.sm,
                        fontWeight: fontWeight.medium,
                        color: sortField === 'name' ? colors.foreground : colors.mutedForeground,
                        borderBottom: `1px solid ${colors.border}`,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {t('devices.deviceName')}
                        <ArrowUpDown size={12} />
                      </span>
                    </th>
                    <th
                      onClick={() => handleSort('model')}
                      style={{
                        textAlign: 'left',
                        padding: `${spacing[3]} ${spacing[4]}`,
                        fontFamily: fontFamily.primary,
                        fontSize: fontSize.sm,
                        fontWeight: fontWeight.medium,
                        color: sortField === 'model' ? colors.foreground : colors.mutedForeground,
                        borderBottom: `1px solid ${colors.border}`,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {t('devices.model')}
                        <ArrowUpDown size={12} />
                      </span>
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: `${spacing[3]} ${spacing[4]}`,
                        fontFamily: fontFamily.primary,
                        fontSize: fontSize.sm,
                        fontWeight: fontWeight.medium,
                        color: colors.mutedForeground,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {t('devices.os')}
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: `${spacing[3]} ${spacing[4]}`,
                        fontFamily: fontFamily.primary,
                        fontSize: fontSize.sm,
                        fontWeight: fontWeight.medium,
                        color: colors.mutedForeground,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {t('devices.status')}
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: `${spacing[3]} ${spacing[4]}`,
                        fontFamily: fontFamily.primary,
                        fontSize: fontSize.sm,
                        fontWeight: fontWeight.medium,
                        color: colors.mutedForeground,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {t('devices.folder')}
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: `${spacing[3]} ${spacing[4]}`,
                        fontFamily: fontFamily.primary,
                        fontSize: fontSize.sm,
                        fontWeight: fontWeight.medium,
                        color: colors.mutedForeground,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {t('devices.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((device) => (
                    <tr
                      key={device.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, device.id)}
                      onDragEnd={handleDragEnd}
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                        cursor: 'grab',
                        opacity: draggedDeviceId === device.id ? 0.5 : 1,
                        background: draggedDeviceId === device.id ? colors.surfaceElevated : 'transparent',
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      {/* Device Name */}
                      <td style={{ padding: `${spacing[3]} ${spacing[4]}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                          <GripVertical
                            size={14}
                            color={colors.mutedForeground}
                            style={{ cursor: 'grab', opacity: 0.5, flexShrink: 0 }}
                          />
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              flexShrink: 0,
                              borderRadius: borderRadius.md,
                              background: device.status === 'ONLINE' ? colors.primaryAlpha : colors.surfaceElevated,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Smartphone
                              size={16}
                              color={device.status === 'ONLINE' ? colors.primary : colors.mutedForeground}
                            />
                          </div>
                          <span
                            style={{
                              fontFamily: fontFamily.display,
                              fontSize: fontSize.md,
                              fontWeight: fontWeight.medium,
                              color: colors.foreground,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {device.name}
                          </span>
                        </div>
                      </td>

                      {/* Model */}
                      <td
                        style={{
                          padding: `${spacing[3]} ${spacing[4]}`,
                          fontFamily: fontFamily.primary,
                          fontSize: fontSize.md,
                          color: colors.foreground,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {device.model || '-'}
                      </td>

                      {/* OS */}
                      <td
                        style={{
                          padding: `${spacing[3]} ${spacing[4]}`,
                          fontFamily: fontFamily.primary,
                          fontSize: fontSize.md,
                          color: colors.foreground,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {device.osVersion || '-'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: `${spacing[3]} ${spacing[4]}` }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: spacing[1],
                            padding: `${spacing[1]} ${spacing[2]}`,
                            borderRadius: borderRadius.sm,
                            background: device.status === 'ONLINE' ? colors.successAlpha : colors.errorAlpha,
                            color: device.status === 'ONLINE' ? colors.success : colors.error,
                            fontSize: fontSize.sm,
                            fontWeight: fontWeight.medium,
                          }}
                        >
                          <div
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: borderRadius.full,
                              background: device.status === 'ONLINE' ? colors.success : colors.error,
                            }}
                          />
                          {device.status === 'ONLINE' ? t('devices.online') : t('devices.offline')}
                        </span>
                      </td>

                      {/* Folder */}
                      <td
                        style={{
                          padding: `${spacing[3]} ${spacing[4]}`,
                          fontFamily: fontFamily.primary,
                          fontSize: fontSize.md,
                          color: colors.mutedForeground,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {device.folder?.name || device.folderName || '-'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: `${spacing[3]} ${spacing[4]}` }}>
                        <div style={{ display: 'flex', gap: spacing[2] }}>
                          <button
                            onClick={() => handleConnectDevice(device)}
                            disabled={device.status !== 'ONLINE'}
                            style={{
                              padding: `${spacing[2]} ${spacing[3]}`,
                              background: device.status === 'ONLINE' ? colors.primary : colors.surfaceElevated,
                              color: colors.foreground,
                              border: 'none',
                              borderRadius: borderRadius.md,
                              fontFamily: fontFamily.display,
                              fontSize: fontSize.md,
                              fontWeight: fontWeight.medium,
                              cursor: device.status === 'ONLINE' ? 'pointer' : 'not-allowed',
                              opacity: device.status === 'ONLINE' ? 1 : 0.5,
                            }}
                          >
                            {t('devices.connect')}
                          </button>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === device.id ? null : device.id)}
                              style={{
                                padding: spacing[2],
                                background: 'transparent',
                                border: `1px solid ${colors.border}`,
                                borderRadius: borderRadius.md,
                                color: colors.mutedForeground,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Dropdown Menu */}
                            {openDropdownId === device.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: 0,
                                  marginTop: spacing[1],
                                  background: colors.surface,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: borderRadius.md,
                                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                                  zIndex: 50,
                                  minWidth: '140px',
                                  overflow: 'hidden',
                                }}
                              >
                                <button
                                  onClick={() => openRenameModal(device)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[2],
                                    padding: `${spacing[2]} ${spacing[3]}`,
                                    background: 'transparent',
                                    border: 'none',
                                    color: colors.foreground,
                                    fontSize: fontSize.md,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                >
                                  <Pencil size={14} />
                                  {t('common.edit')}
                                </button>
                                <button
                                  onClick={() => openDeleteModal(device)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[2],
                                    padding: `${spacing[2]} ${spacing[3]}`,
                                    background: 'transparent',
                                    border: 'none',
                                    color: colors.error,
                                    fontSize: fontSize.md,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                >
                                  <Trash2 size={14} />
                                  {t('common.delete')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <Modal onClose={closeAddModal}>
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.xl,
              padding: spacing[6],
              width: '440px',
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[5],
              }}
            >
              <h3
                style={{
                  fontFamily: fontFamily.display,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.semibold,
                  color: colors.foreground,
                }}
              >
                {newDeviceCode ? t('devices.addComplete') : t('devices.addDevice')}
              </h3>
              <button
                onClick={closeAddModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.mutedForeground,
                  cursor: 'pointer',
                  padding: spacing[1],
                }}
              >
                <X size={20} />
              </button>
            </div>

            {newDeviceCode ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: borderRadius.full,
                    background: colors.primaryAlpha,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: `0 auto ${spacing[5]}`,
                  }}
                >
                  <Check size={28} color={colors.primary} />
                </div>
                <p style={{ marginBottom: spacing[5], color: colors.mutedForeground, fontSize: fontSize.lg }}>
                  {t('devices.enterCode')}:
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[3],
                    padding: spacing[5],
                    background: colors.background,
                    borderRadius: borderRadius.lg,
                    border: `1px solid ${colors.border}`,
                    marginBottom: spacing[4],
                  }}
                >
                  <span
                    style={{
                      fontFamily: fontFamily.mono,
                      fontSize: fontSize['5xl'],
                      fontWeight: fontWeight.semibold,
                      letterSpacing: '8px',
                      color: colors.primary,
                    }}
                  >
                    {newDeviceCode}
                  </span>
                  <button
                    onClick={copyCode}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: colors.mutedForeground,
                      cursor: 'pointer',
                      padding: spacing[2],
                    }}
                  >
                    {copied ? <Check size={20} color={colors.success} /> : <Copy size={20} />}
                  </button>
                </div>
                <p
                  style={{
                    fontSize: fontSize.sm,
                    color: colors.mutedForeground,
                    marginBottom: spacing[6],
                  }}
                >
                  {t('devices.codeConnected')}
                </p>
                <button
                  onClick={closeAddModal}
                  style={{
                    width: '100%',
                    padding: `${spacing[3]} 0`,
                    background: colors.primary,
                    color: colors.foreground,
                    border: 'none',
                    borderRadius: borderRadius.md,
                    fontFamily: fontFamily.display,
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.semibold,
                    cursor: 'pointer',
                  }}
                >
                  {t('devices.done')}
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: spacing[5] }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: fontFamily.primary,
                      fontSize: fontSize.lg,
                      fontWeight: fontWeight.medium,
                      color: colors.foreground,
                      marginBottom: spacing[2],
                    }}
                  >
                    {t('devices.deviceName')}
                  </label>
                  <input
                    type="text"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="기기 추가"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: `${spacing[3]} ${spacing[4]}`,
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: borderRadius.lg,
                      color: colors.foreground,
                      fontFamily: fontFamily.primary,
                      fontSize: fontSize.lg,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: spacing[3] }}>
                  <button
                    onClick={closeAddModal}
                    style={{
                      flex: 1,
                      padding: `${spacing[3]} 0`,
                      background: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: borderRadius.md,
                      color: colors.foreground,
                      fontFamily: fontFamily.display,
                      fontSize: fontSize.lg,
                      cursor: 'pointer',
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleAddDevice}
                    disabled={addingDevice || !newDeviceName.trim()}
                    style={{
                      flex: 1,
                      padding: `${spacing[3]} 0`,
                      background: colors.primary,
                      color: colors.foreground,
                      border: 'none',
                      borderRadius: borderRadius.md,
                      fontFamily: fontFamily.display,
                      fontSize: fontSize.lg,
                      fontWeight: fontWeight.semibold,
                      cursor: addingDevice || !newDeviceName.trim() ? 'not-allowed' : 'pointer',
                      opacity: addingDevice || !newDeviceName.trim() ? 0.6 : 1,
                    }}
                  >
                    {addingDevice ? t('devices.adding') : t('devices.addDevice')}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Rename Device Modal */}
      {showRenameModal && renameDevice && (
        <Modal onClose={() => setShowRenameModal(false)}>
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.xl,
              padding: spacing[6],
              width: '400px',
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[5],
              }}
            >
              <h3
                style={{
                  fontFamily: fontFamily.display,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.semibold,
                  color: colors.foreground,
                }}
              >
                {t('devices.renameDevice')}
              </h3>
              <button
                onClick={() => setShowRenameModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.mutedForeground,
                  cursor: 'pointer',
                  padding: spacing[1],
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: spacing[5] }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: fontFamily.primary,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.medium,
                  color: colors.foreground,
                  marginBottom: spacing[2],
                }}
              >
                {t('devices.deviceName')}
              </label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
                style={{
                  width: '100%',
                  padding: `${spacing[3]} ${spacing[4]}`,
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.lg,
                  color: colors.foreground,
                  fontFamily: fontFamily.primary,
                  fontSize: fontSize.lg,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: spacing[3] }}>
              <button
                onClick={() => setShowRenameModal(false)}
                style={{
                  flex: 1,
                  padding: `${spacing[3]} 0`,
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  color: colors.foreground,
                  fontFamily: fontFamily.display,
                  fontSize: fontSize.lg,
                  cursor: 'pointer',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRename}
                disabled={renaming || !renameValue.trim()}
                style={{
                  flex: 1,
                  padding: `${spacing[3]} 0`,
                  background: colors.primary,
                  color: colors.foreground,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontFamily: fontFamily.display,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  cursor: renaming || !renameValue.trim() ? 'not-allowed' : 'pointer',
                  opacity: renaming || !renameValue.trim() ? 0.6 : 1,
                }}
              >
                {renaming ? t('devices.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Device Modal */}
      {showDeleteModal && deleteDevice && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.xl,
              padding: spacing[6],
              width: '400px',
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[5],
              }}
            >
              <h3
                style={{
                  fontFamily: fontFamily.display,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.semibold,
                  color: colors.foreground,
                }}
              >
                {t('devices.deleteDevice')}
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.mutedForeground,
                  cursor: 'pointer',
                  padding: spacing[1],
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: `${spacing[5]} 0` }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: borderRadius.full,
                  background: colors.errorAlpha,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: `0 auto ${spacing[4]}`,
                }}
              >
                <Trash2 size={28} color={colors.error} />
              </div>
              <p style={{ color: colors.mutedForeground, marginBottom: spacing[2] }}>
                {t('devices.deleteConfirm')}
              </p>
              <p style={{ fontWeight: fontWeight.semibold, color: colors.foreground }}>
                "{deleteDevice.name}"
              </p>
              <p
                style={{
                  fontSize: fontSize.sm,
                  color: colors.mutedForeground,
                  marginTop: spacing[3],
                }}
              >
                {t('devices.cannotUndo')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: spacing[3] }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: `${spacing[3]} 0`,
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  color: colors.foreground,
                  fontFamily: fontFamily.display,
                  fontSize: fontSize.lg,
                  cursor: 'pointer',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: `${spacing[3]} 0`,
                  background: colors.error,
                  color: colors.foreground,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontFamily: fontFamily.display,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? t('devices.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Click outside to close dropdown */}
      {openDropdownId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
          }}
          onClick={() => setOpenDropdownId(null)}
        />
      )}
    </div>
  );
};
