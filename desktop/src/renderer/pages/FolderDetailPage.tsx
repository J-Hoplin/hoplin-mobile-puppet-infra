import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Smartphone,
  ArrowLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFolderStore } from '../store/folderStore';
import { useTranslation } from '../store/settingsStore';
import {
  spacing,
  borderRadius,
  fontFamily,
  fontSize,
  fontWeight,
  useTheme,
} from '../design-system';

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

interface Device {
  id: string;
  name: string;
  model?: string;
  osVersion?: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  folderId?: string;
  capabilities?: Record<string, unknown>;
  lastSeenAt?: string;
}

const columnWidths = {
  name: 240,
  model: 160,
  os: 140,
  status: 100,
  actions: 150,
};

const MIN_TABLE_WIDTH = Object.values(columnWidths).reduce((a, b) => a + b, 0);

type SortField = 'name' | 'model';
type SortDirection = 'asc' | 'desc';

export const FolderDetailPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { token, serverUrl } = useAuthStore();
  const { folders, fetchFolders } = useFolderStore();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Rename modal
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameDevice, setRenameDevice] = useState<Device | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDeviceTarget, setDeleteDeviceTarget] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);

  const folder = folders.find((f) => f.id === folderId);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data: Device[] = await response.json();
        setDevices(data.filter((d) => d.folderId === folderId));
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  }, [serverUrl, token, folderId]);

  useEffect(() => {
    fetchDevices();
    fetchFolders();
    const interval = setInterval(() => {
      fetchDevices();
      fetchFolders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices, fetchFolders]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleConnectDevice = (device: Device) => {
    navigate(`/control/${device.id}`);
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
          prev.map((d) => (d.id === renameDevice.id ? { ...d, name: renameValue.trim() } : d))
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
    setDeleteDeviceTarget(device);
    setShowDeleteModal(true);
    setOpenDropdownId(null);
  };

  const handleDelete = async () => {
    if (!deleteDeviceTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`${serverUrl}/devices/${deleteDeviceTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setDevices((prev) => prev.filter((d) => d.id !== deleteDeviceTarget.id));
        setShowDeleteModal(false);
        setDeleteDeviceTarget(null);
        fetchFolders();
      }
    } catch (err) {
      console.error('Failed to delete device:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredDevices = devices
    .filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const name = d.name?.toLowerCase() || '';
      const model = d.model?.toLowerCase() || '';
      return name.includes(q) || model.includes(q);
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const aVal = (a[sortField] || '').toLowerCase();
      const bVal = (b[sortField] || '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });

  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const offlineCount = devices.filter((d) => d.status !== 'ONLINE').length;

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
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
          marginBottom: spacing[3],
        }}
      >
        <ArrowLeft
          size={16}
          color={colors.mutedForeground}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/folders')}
        />
        <span
          onClick={() => navigate('/folders')}
          style={{
            fontFamily: fontFamily.primary,
            fontSize: fontSize.md,
            color: colors.mutedForeground,
            cursor: 'pointer',
          }}
        >
          {t('folders.title')}
        </span>
        <ChevronRight size={14} color={colors.mutedForeground} />
        <span
          style={{
            fontFamily: fontFamily.primary,
            fontSize: fontSize.md,
            fontWeight: fontWeight.medium,
            color: colors.foreground,
          }}
        >
          {folder?.name || '...'}
        </span>
      </div>

      {/* Page Header - Title + Button aligned */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[8],
        }}
      >
        <h1
          style={{
            fontFamily: fontFamily.display,
            fontSize: fontSize['4xl'],
            fontWeight: fontWeight.semibold,
            color: colors.foreground,
          }}
        >
          {folder?.name || '...'}
        </h1>
        <button
          onClick={() => navigate('/devices')}
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
          <Plus size={16} />
          {t('devices.addDevice')}
        </button>
      </div>

      {/* Info Cards */}
      <div style={{ display: 'flex', gap: spacing[6], marginBottom: spacing[8] }}>
        {/* Total */}
        <div
          style={{
            padding: `${spacing[5]} ${spacing[8]}`,
            background: colors.surface,
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.border}`,
            minWidth: '140px',
          }}
        >
          <div
            style={{
              fontFamily: fontFamily.primary,
              fontSize: fontSize.sm,
              color: colors.mutedForeground,
              marginBottom: spacing[2],
            }}
          >
            {t('folders.totalDevices')}
          </div>
          <div
            style={{
              fontFamily: fontFamily.display,
              fontSize: fontSize['4xl'],
              fontWeight: fontWeight.semibold,
              color: colors.foreground,
            }}
          >
            {devices.length}{t('folders.unit')}
          </div>
        </div>
        {/* Online */}
        <div
          style={{
            padding: `${spacing[5]} ${spacing[8]}`,
            background: colors.surface,
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.border}`,
            minWidth: '140px',
          }}
        >
          <div
            style={{
              fontFamily: fontFamily.primary,
              fontSize: fontSize.sm,
              color: colors.mutedForeground,
              marginBottom: spacing[2],
            }}
          >
            {t('folders.online')}
          </div>
          <div
            style={{
              fontFamily: fontFamily.display,
              fontSize: fontSize['4xl'],
              fontWeight: fontWeight.semibold,
              color: colors.success,
            }}
          >
            {onlineCount}{t('folders.unit')}
          </div>
        </div>
        {/* Offline */}
        <div
          style={{
            padding: `${spacing[5]} ${spacing[8]}`,
            background: colors.surface,
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.border}`,
            minWidth: '140px',
          }}
        >
          <div
            style={{
              fontFamily: fontFamily.primary,
              fontSize: fontSize.sm,
              color: colors.mutedForeground,
              marginBottom: spacing[2],
            }}
          >
            {t('folders.offline')}
          </div>
          <div
            style={{
              fontFamily: fontFamily.display,
              fontSize: fontSize['4xl'],
              fontWeight: fontWeight.semibold,
              color: colors.error,
            }}
          >
            {offlineCount}{t('folders.unit')}
          </div>
        </div>
      </div>

      {/* Device Table */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Table Header with title + search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${spacing[4]} ${spacing[5]}`,
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surface,
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
            {t('folders.deviceList')}
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
            <p style={{ fontFamily: fontFamily.display, fontSize: fontSize.xl }}>
              {t('devices.noDevices')}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', minWidth: `${MIN_TABLE_WIDTH}px`, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: columnWidths.name }} />
                <col style={{ width: columnWidths.model }} />
                <col style={{ width: columnWidths.os }} />
                <col style={{ width: columnWidths.status }} />
                <col style={{ width: columnWidths.actions }} />
              </colgroup>
              <thead>
                <tr style={{ background: colors.surfaceElevated }}>
                  <th
                    onClick={() => handleSort('name')}
                    style={{
                      textAlign: 'left',
                      padding: `${spacing[3]} ${spacing[4]}`,
                      paddingLeft: spacing[5],
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
                    {t('devices.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr
                    key={device.id}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    {/* Device Name */}
                    <td style={{ padding: `${spacing[3]} ${spacing[4]}`, paddingLeft: spacing[5] }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
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
            <h3
              style={{
                fontFamily: fontFamily.display,
                fontSize: fontSize['2xl'],
                fontWeight: fontWeight.semibold,
                color: colors.foreground,
                marginBottom: spacing[5],
              }}
            >
              {t('devices.renameDevice')}
            </h3>
            <div style={{ marginBottom: spacing[5] }}>
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
      {showDeleteModal && deleteDeviceTarget && (
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
            <h3
              style={{
                fontFamily: fontFamily.display,
                fontSize: fontSize['2xl'],
                fontWeight: fontWeight.semibold,
                color: colors.foreground,
                marginBottom: spacing[5],
              }}
            >
              {t('devices.deleteDevice')}
            </h3>
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
                "{deleteDeviceTarget.name}"
              </p>
              <p style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing[3] }}>
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
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setOpenDropdownId(null)}
        />
      )}
    </div>
  );
};
