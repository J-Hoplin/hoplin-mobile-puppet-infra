import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Plus, Pencil, Trash2 } from 'lucide-react';
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

export const FolderManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { folders, fetchFolders, createFolder, updateFolder, deleteFolder } = useFolderStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchFolders();
    const interval = setInterval(fetchFolders, 5000);
    return () => clearInterval(interval);
  }, [fetchFolders]);

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateModal(false);
    }
  };

  const handleUpdateFolder = async () => {
    if (editingFolder && editingFolder.name.trim()) {
      await updateFolder(editingFolder.id, editingFolder.name.trim());
      setEditingFolder(null);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm(t('folders.deleteConfirm'))) {
      await deleteFolder(folderId);
    }
  };

  return (
    <div style={{ padding: `${spacing[8]} ${spacing[10]}` }}>
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
            {t('folders.title')}
          </h1>
          <p
            style={{
              fontFamily: fontFamily.primary,
              fontSize: fontSize.md,
              color: colors.mutedForeground,
            }}
          >
            {t('folders.description')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
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
          {t('folders.addFolder')}
        </button>
      </div>

      {/* Folder Grid */}
      {folders.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing[5],
          }}
        >
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => navigate(`/folders/${folder.id}`)}
              style={{
                width: sizing.folderCard,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.xl,
                padding: spacing[6],
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[4],
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              {/* Folder Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <div
                  style={{
                    width: sizing.logoMarkSmall,
                    height: sizing.logoMarkSmall,
                    borderRadius: borderRadius.lg,
                    background: colors.primaryAlpha,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Folder size={18} color={colors.primary} />
                </div>
                <h3
                  style={{
                    fontFamily: fontFamily.display,
                    fontSize: fontSize['2xl'],
                    fontWeight: fontWeight.semibold,
                    color: colors.foreground,
                    flex: 1,
                  }}
                >
                  {folder.name}
                </h3>
              </div>

              {/* Folder Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                <div
                  style={{
                    fontFamily: fontFamily.primary,
                    fontSize: fontSize.lg,
                    color: colors.mutedForeground,
                  }}
                >
                  {folder.deviceCount || 0} {t('folders.deviceCount')}
                </div>
                <div style={{ display: 'flex', gap: spacing[4] }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[1],
                      fontSize: fontSize.md,
                      color: colors.success,
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: borderRadius.full,
                        background: colors.success,
                      }}
                    />
                    {folder.onlineCount || 0} {t('devices.online')}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[1],
                      fontSize: fontSize.md,
                      color: colors.error,
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: borderRadius.full,
                        background: colors.error,
                      }}
                    />
                    {folder.offlineCount || 0} {t('devices.offline')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: spacing[2],
                  marginTop: 'auto',
                  paddingTop: spacing[4],
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingFolder({ id: folder.id, name: folder.name }); }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[2],
                    padding: spacing[2],
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    color: colors.mutedForeground,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Pencil size={16} />
                  {t('common.edit')}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[2],
                    padding: spacing[2],
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    color: colors.error,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 size={16} />
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: spacing[10],
            color: colors.mutedForeground,
          }}
        >
          <Folder size={48} style={{ opacity: 0.5, marginBottom: spacing[4] }} />
          <p style={{ fontFamily: fontFamily.display, fontSize: fontSize.xl }}>
            {t('folders.noFolders')}
          </p>
          <p style={{ fontSize: fontSize.md, marginTop: spacing[2] }}>
            {t('folders.noFoldersHint')}
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          title={t('folders.addFolder')}
          onClose={() => {
            setShowCreateModal(false);
            setNewFolderName('');
          }}
          onSubmit={handleCreateFolder}
        >
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t('folders.folderName')}
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
        </Modal>
      )}

      {/* Edit Modal */}
      {editingFolder && (
        <Modal
          title={t('folders.editFolder')}
          onClose={() => setEditingFolder(null)}
          onSubmit={handleUpdateFolder}
        >
          <input
            type="text"
            value={editingFolder.name}
            onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
            placeholder={t('folders.folderName')}
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
        </Modal>
      )}
    </div>
  );
};

// Modal Component
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
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
          {title}
        </h3>
        <div style={{ marginBottom: spacing[5] }}>{children}</div>
        <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
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
            onClick={onSubmit}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              background: colors.primary,
              border: 'none',
              borderRadius: borderRadius.md,
              color: colors.foreground,
              fontFamily: fontFamily.display,
              fontSize: fontSize.lg,
              fontWeight: fontWeight.semibold,
              cursor: 'pointer',
            }}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
