import React, { useCallback, useRef } from 'react';
import type { FileInfo, FileTransfer } from '../types';

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
  const progress = transfer.totalBytes > 0
    ? (transfer.transferredBytes / transfer.totalBytes) * 100
    : 0;

  const statusColor = {
    pending: '#9090a0',
    transferring: '#00d4aa',
    completed: '#00d68f',
    error: '#ff6b6b',
    cancelled: '#9090a0',
  }[transfer.status];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '8px',
      marginBottom: '6px',
    }}>
      <div style={{
        color: transfer.direction === 'download' ? '#5ba8ff' : '#a855f7',
      }}>
        {transfer.direction === 'download' ? <DownloadIcon /> : <UploadIcon />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px',
          color: '#ffffff',
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
              background: 'rgba(255, 255, 255, 0.1)',
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
              color: '#9090a0',
            }}>
              <span>{formatBytes(transfer.transferredBytes)} / {formatBytes(transfer.totalBytes)}</span>
              <span>{formatSpeed(transfer.speed)}</span>
            </div>
          </>
        )}

        {transfer.status === 'completed' && (
          <div style={{ fontSize: '10px', color: '#00d68f' }}>
            Completed • {formatBytes(transfer.totalBytes)}
          </div>
        )}

        {transfer.status === 'error' && (
          <div style={{ fontSize: '10px', color: '#ff6b6b' }}>
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
            background: 'rgba(255, 107, 107, 0.15)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '4px',
            color: '#ff6b6b',
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
            color: '#9090a0',
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
}> = ({ file, onClick, onDownload, onDelete }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 14px',
      cursor: 'pointer',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      transition: 'background 0.15s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
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
        ? 'linear-gradient(135deg, #ffaa00 0%, #ff8800 100%)'
        : 'linear-gradient(135deg, #5ba8ff 0%, #3b82f6 100%)',
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
        color: '#ffffff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {file.name}
      </div>
      <div style={{
        fontSize: '11px',
        color: '#9090a0',
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
              background: 'rgba(0, 212, 170, 0.15)',
              border: '1px solid rgba(0, 212, 170, 0.3)',
              borderRadius: '6px',
              color: '#00d4aa',
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
              background: 'rgba(255, 107, 107, 0.15)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '6px',
              color: '#ff6b6b',
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
        backgroundColor: '#12121a',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
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
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowNewFolderDialog(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a24',
              borderRadius: '12px',
              padding: '20px',
              minWidth: '320px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
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
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: '#12121a',
                color: '#ffffff',
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
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: '#9090a0',
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
                  background: newFolderName.trim() ? '#00d4aa' : 'rgba(0, 212, 170, 0.3)',
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
            backgroundColor: 'rgba(12, 12, 18, 0.8)',
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
              border: '3px solid rgba(0, 212, 170, 0.2)',
              borderTopColor: '#00d4aa',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>
            {`@keyframes spin { to { transform: rotate(360deg); } }`}
          </style>
          <span style={{ color: '#9090a0', fontSize: '13px' }}>Loading files...</span>
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: '#16161f',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={() => onNavigate(currentPath)}
          style={{
            padding: '6px 10px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            color: '#9090a0',
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
              background: 'rgba(0, 212, 170, 0.15)',
              border: '1px solid rgba(0, 212, 170, 0.3)',
              borderRadius: '6px',
              color: '#00d4aa',
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
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '6px',
              color: '#a855f7',
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
          backgroundColor: '#0d0d12',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
            color: '#00d4aa',
            borderRadius: '4px',
          }}
        >
          /sdcard
        </button>
        {pathParts.slice(1).map((part, index) => (
          <React.Fragment key={index}>
            <span style={{ color: '#6b6b7b' }}>/</span>
            <button
              onClick={() => handleBreadcrumbClick(index + 1)}
              style={{
                padding: '4px 8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: index === pathParts.length - 2 ? '#ffffff' : '#00d4aa',
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 212, 170, 0.05)',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#00d4aa',
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
      <div style={{ flex: 1, overflowY: 'auto', background: '#0d0d12' }}>
        {currentPath !== '/sdcard' && (
          <div
            onClick={handleParentClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 14px',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9090a0',
              marginRight: '12px',
            }}>
              ↑
            </div>
            <span style={{ fontWeight: 500, color: '#9090a0' }}>..</span>
          </div>
        )}

        {sortedFiles.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#6b6b7b',
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
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#16161f',
          maxHeight: '150px',
          overflowY: 'auto',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#9090a0',
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
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#16161f',
          fontSize: '11px',
          color: '#6b6b7b',
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
