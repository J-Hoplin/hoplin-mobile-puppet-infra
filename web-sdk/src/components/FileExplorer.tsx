import React, { useCallback } from 'react';
import type { FileInfo } from '../types';

export interface FileExplorerProps {
  files: FileInfo[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onFileSelect?: (file: FileInfo) => void;
  onDownload?: (file: FileInfo) => void;
  onDelete?: (file: FileInfo) => void;
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

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const FileIcon: React.FC<{ isDirectory: boolean }> = ({ isDirectory }) => (
  <span style={{ marginRight: '8px', fontSize: '16px' }}>
    {isDirectory ? '📁' : '📄'}
  </span>
);

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  currentPath,
  onNavigate,
  onFileSelect,
  onDownload,
  onDelete,
  className,
  style,
}) => {
  const pathParts = currentPath.split('/').filter(Boolean);

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
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #ddd',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          fontSize: '12px',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => onNavigate('/')}
          style={{
            padding: '2px 6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#1976D2',
          }}
        >
          🏠
        </button>
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <span style={{ color: '#666' }}>/</span>
            <button
              onClick={() => handleBreadcrumbClick(index)}
              style={{
                padding: '2px 6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: index === pathParts.length - 1 ? '#333' : '#1976D2',
                fontWeight: index === pathParts.length - 1 ? 600 : 400,
              }}
            >
              {part}
            </button>
          </React.Fragment>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {currentPath !== '/' && (
          <div
            onClick={handleParentClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
              backgroundColor: '#fafafa',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fafafa';
            }}
          >
            <span style={{ marginRight: '8px', fontSize: '16px' }}>📂</span>
            <span style={{ fontWeight: 500 }}>..</span>
          </div>
        )}

        {sortedFiles.length === 0 && currentPath === '/' ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            Empty directory
          </div>
        ) : (
          sortedFiles.map((file) => (
            <div
              key={file.path}
              onClick={() => handleFileClick(file)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FileIcon isDirectory={file.isDirectory} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: '13px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#666',
                  }}
                >
                  {file.isDirectory ? '--' : formatBytes(file.size)} •{' '}
                  {formatDate(file.modifiedAt)}
                </div>
              </div>
              {!file.isDirectory && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {onDownload && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(file);
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      ⬇
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file);
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        border: '1px solid #f44336',
                        borderRadius: '4px',
                        background: '#fff',
                        color: '#f44336',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #ddd',
          backgroundColor: '#f5f5f5',
          fontSize: '11px',
          color: '#666',
        }}
      >
        {files.length} items
      </div>
    </div>
  );
};
