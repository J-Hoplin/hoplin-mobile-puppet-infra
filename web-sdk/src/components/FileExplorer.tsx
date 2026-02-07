import React, { useCallback, useRef } from 'react';
import type { FileInfo, FileTransfer } from '../types';
import { useSDKTheme } from '../theme';

export interface FileExplorerProps {
  files: FileInfo[];
  currentPath: string;
  transfers?: FileTransfer[];
  isLoading?: boolean;
  onNavigate: (path: string) => void;
  onFileSelect?: (file: FileInfo) => void;
  onDownload?: (file: FileInfo) => void;
  onUpload?: (path: string, fileName: string, data: ArrayBuffer) => void;
  onDelete?: (file: FileInfo) => void;
  onCreateDirectory?: (path: string) => void;
  onRemoveTransfer?: (id: string) => void;
  onCancelTransfer?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return `${parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Icons
const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const FolderPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

// Transfer Item Component
const TransferItem: React.FC<{
  transfer: FileTransfer;
  onRemove?: () => void;
  onCancel?: () => void;
}> = ({ transfer, onRemove, onCancel }) => {
  const theme = useSDKTheme();
  const progress = transfer.totalBytes > 0
    ? (transfer.transferredBytes / transfer.totalBytes) * 100
    : 0;

  const statusColor = {
    pending: theme.foregroundSecondary,
    transferring: theme.success,
    completed: theme.success,
    error: theme.error,
    cancelled: theme.foregroundSecondary,
  }[transfer.status];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      background: theme.hover,
      borderRadius: '8px',
      marginBottom: '6px',
    }}>
      <div style={{
        color: transfer.direction === 'download' ? theme.info : theme.accent,
      }}>
        {transfer.direction === 'download' ? <DownloadIcon /> : <UploadIcon />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px',
          color: theme.foreground,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: '4px',
        }}>
          {transfer.fileName}
        </div>

        {transfer.status === 'transferring' && (
          <>
            <div style={{
              height: '4px',
              borderRadius: '2px',
              background: theme.border,
              overflow: 'hidden',
              marginBottom: '4px',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${statusColor}, ${statusColor}80)`,
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: theme.foregroundSecondary,
            }}>
              <span>{formatBytes(transfer.transferredBytes)} / {formatBytes(transfer.totalBytes)}</span>
              <span>{formatSpeed(transfer.speed)}</span>
            </div>
          </>
        )}

        {transfer.status === 'completed' && (
          <div style={{ fontSize: '10px', color: theme.success }}>
            Completed • {formatBytes(transfer.totalBytes)}
          </div>
        )}

        {transfer.status === 'error' && (
          <div style={{ fontSize: '10px', color: theme.error }}>
            {transfer.error || 'Transfer failed'}
          </div>
        )}
      </div>

      {(transfer.status === 'transferring' || transfer.status === 'pending') && onCancel && (
        <button
          onClick={onCancel}
          title="Cancel transfer"
          style={{
            padding: '6px',
            background: `${theme.error}26`,
            border: `1px solid ${theme.error}4d`,
            borderRadius: '4px',
            color: theme.error,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      )}

      {(transfer.status === 'completed' || transfer.status === 'error') && onRemove && (
        <button
          onClick={onRemove}
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            color: theme.foregroundSecondary,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

// File Row Component
const FileRow: React.FC<{
  file: FileInfo;
  onClick: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}> = ({ file, onClick, onDownload, onDelete }) => {
  const theme = useSDKTheme();
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        cursor: 'pointer',
        borderBottom: `1px solid ${theme.borderLight}`,
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: file.isDirectory
          ? `linear-gradient(135deg, ${theme.warning} 0%, ${theme.warning}cc 100%)`
          : `linear-gradient(135deg, ${theme.info} 0%, ${theme.primary} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        marginRight: '12px',
        flexShrink: 0,
      }}>
        {file.isDirectory ? <FolderIcon /> : <FileIcon />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 500,
          color: theme.foreground,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {file.name}
        </div>
        <div style={{
          fontSize: '11px',
          color: theme.foregroundSecondary,
          display: 'flex',
          gap: '8px',
        }}>
          <span>{file.isDirectory ? '--' : formatBytes(file.size)}</span>
          <span>•</span>
          <span>{formatDate(file.modifiedAt)}</span>
        </div>
      </div>

      {!file.isDirectory && (
        <div style={{
          display: 'flex',
          gap: '6px',
          opacity: 0.7,
        }}
        onClick={(e) => e.stopPropagation()}
        >
          {onDownload && (
            <button
              onClick={onDownload}
              style={{
                padding: '6px 10px',
                background: `${theme.success}26`,
                border: `1px solid ${theme.success}4d`,
                borderRadius: '6px',
                color: theme.success,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
            >
              <DownloadIcon />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                padding: '6px 10px',
                background: `${theme.error}26`,
                border: `1px solid ${theme.error}4d`,
                borderRadius: '6px',
                color: theme.error,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  currentPath,
  transfers = [],
  isLoading = false,
  onNavigate,
  onFileSelect,
  onDownload,
  onUpload,
  onDelete,
  onCreateDirectory,
  onRemoveTransfer,
  onCancelTransfer,
  className,
  style,
}) => {
  const theme = useSDKTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const pathParts = currentPath.split('/').filter(Boolean);
  const activeTransfers = transfers.filter(t => t.status === 'transferring' || t.status === 'pending');
  const completedTransfers = transfers.filter(t => t.status === 'completed' || t.status === 'error');

  // Focus input when dialog opens
  React.useEffect(() => {
    if (showNewFolderDialog && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [showNewFolderDialog]);

  const handleBreadcrumbClick = useCallback(
    (index: number) => {
      const newPath = '/' + pathParts.slice(0, index + 1).join('/');
      onNavigate(newPath);
    },
    [pathParts, onNavigate]
  );

  const handleFileClick = useCallback(
    (file: FileInfo) => {
      if (file.isDirectory) {
        onNavigate(file.path);
      } else {
        onFileSelect?.(file);
      }
    },
    [onNavigate, onFileSelect]
  );

  const handleParentClick = useCallback(() => {
    if (pathParts.length > 0) {
      const parentPath = '/' + pathParts.slice(0, -1).join('/');
      onNavigate(parentPath || '/');
    }
  }, [pathParts, onNavigate]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as ArrayBuffer;
        const uploadPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        onUpload(uploadPath, file.name, data);
      };
      reader.readAsArrayBuffer(file);
    }
    e.target.value = '';
  };

  const handleCreateDirectory = () => {
    setNewFolderName('');
    setShowNewFolderDialog(true);
  };

  const handleCreateDirectorySubmit = () => {
    if (newFolderName.trim() && onCreateDirectory) {
      const dirPath = currentPath === '/' ? `/${newFolderName.trim()}` : `${currentPath}/${newFolderName.trim()}`;
      onCreateDirectory(dirPath);
      setShowNewFolderDialog(false);
      setNewFolderName('');
      // Refresh after a short delay
      setTimeout(() => onNavigate(currentPath), 500);
    }
  };

  const handleNewFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateDirectorySubmit();
    } else if (e.key === 'Escape') {
      setShowNewFolderDialog(false);
      setNewFolderName('');
    }
  };

  const sortedFiles = [...files].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.background,
        borderRadius: '12px',
        border: `1px solid ${theme.border}`,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.overlay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowNewFolderDialog(false)}
        >
          <div
            style={{
              backgroundColor: theme.surfaceElevated,
              borderRadius: '12px',
              padding: '20px',
              minWidth: '320px',
              border: `1px solid ${theme.border}`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: theme.foreground,
              marginBottom: '16px',
            }}>
              Create New Folder
            </div>
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleNewFolderKeyDown}
              placeholder="Folder name"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1px solid ${theme.inputBorder}`,
                background: theme.background,
                color: theme.foreground,
                fontSize: '13px',
                outline: 'none',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.inputBorder}`,
                  background: 'transparent',
                  color: theme.foregroundSecondary,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDirectorySubmit}
                disabled={!newFolderName.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: newFolderName.trim() ? theme.success : `${theme.success}4d`,
                  color: newFolderName.trim() ? '#000' : 'rgba(0, 0, 0, 0.5)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: newFolderName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.overlay,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: `3px solid ${theme.success}33`,
              borderTopColor: theme.success,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>
            {`@keyframes spin { to { transform: rotate(360deg); } }`}
          </style>
          <span style={{ color: theme.foregroundSecondary, fontSize: '13px' }}>Loading files...</span>
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: theme.surface,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <button
          onClick={() => onNavigate(currentPath)}
          style={{
            padding: '6px 10px',
            background: 'transparent',
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: '6px',
            color: theme.foregroundSecondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Refresh"
        >
          <RefreshIcon />
        </button>

        {onUpload && (
          <button
            onClick={handleUploadClick}
            style={{
              padding: '6px 12px',
              background: `${theme.success}26`,
              border: `1px solid ${theme.success}4d`,
              borderRadius: '6px',
              color: theme.success,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
            }}
          >
            <UploadIcon />
            Upload
          </button>
        )}

        {onCreateDirectory && (
          <button
            onClick={handleCreateDirectory}
            style={{
              padding: '6px 12px',
              background: `${theme.accent}26`,
              border: `1px solid ${theme.accent}4d`,
              borderRadius: '6px',
              color: theme.accent,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
            }}
          >
            <FolderPlusIcon />
            New Folder
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          backgroundColor: theme.surfaceDeep,
          borderBottom: `1px solid ${theme.border}`,
          fontSize: '12px',
          gap: '4px',
          flexWrap: 'wrap',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <button
          onClick={() => onNavigate('/sdcard')}
          style={{
            padding: '4px 8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: theme.success,
            borderRadius: '4px',
          }}
        >
          /sdcard
        </button>
        {pathParts.slice(1).map((part, index) => (
          <React.Fragment key={index}>
            <span style={{ color: theme.foregroundMuted }}>/</span>
            <button
              onClick={() => handleBreadcrumbClick(index + 1)}
              style={{
                padding: '4px 8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: index === pathParts.length - 2 ? theme.foreground : theme.success,
                fontWeight: index === pathParts.length - 2 ? 600 : 400,
                borderRadius: '4px',
              }}
            >
              {part}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Active Transfers */}
      {activeTransfers.length > 0 && (
        <div style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${theme.border}`,
          background: `${theme.success}0d`,
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: theme.success,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Active Transfers ({activeTransfers.length})
          </div>
          {activeTransfers.map((transfer) => (
            <TransferItem
              key={transfer.id}
              transfer={transfer}
              onCancel={onCancelTransfer ? () => onCancelTransfer(transfer.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* File List */}
      <div style={{ flex: 1, overflowY: 'auto', background: theme.surfaceDeep }}>
        {currentPath !== '/sdcard' && (
          <div
            onClick={handleParentClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 14px',
              cursor: 'pointer',
              borderBottom: `1px solid ${theme.borderLight}`,
              background: theme.hover,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: theme.border,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.foregroundSecondary,
              marginRight: '12px',
            }}>
              ↑
            </div>
            <span style={{ fontWeight: 500, color: theme.foregroundSecondary }}>..</span>
          </div>
        )}

        {sortedFiles.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: theme.foregroundMuted,
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>
              📂
            </div>
            <div style={{ fontSize: '13px' }}>
              {currentPath === '/sdcard' ? 'Loading...' : 'Empty directory'}
            </div>
          </div>
        ) : (
          sortedFiles.map((file) => (
            <FileRow
              key={file.path}
              file={file}
              onClick={() => handleFileClick(file)}
              onDownload={onDownload ? () => onDownload(file) : undefined}
              onDelete={onDelete ? () => onDelete(file) : undefined}
            />
          ))
        )}
      </div>

      {/* Completed Transfers */}
      {completedTransfers.length > 0 && (
        <div style={{
          padding: '10px 14px',
          borderTop: `1px solid ${theme.border}`,
          background: theme.surface,
          maxHeight: '150px',
          overflowY: 'auto',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: theme.foregroundSecondary,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Recent Transfers
          </div>
          {completedTransfers.slice(-5).map((transfer) => (
            <TransferItem
              key={transfer.id}
              transfer={transfer}
              onRemove={onRemoveTransfer ? () => onRemoveTransfer(transfer.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: `1px solid ${theme.border}`,
          backgroundColor: theme.surface,
          fontSize: '11px',
          color: theme.foregroundMuted,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{files.length} items</span>
        <span>{currentPath}</span>
      </div>
    </div>
  );
};
