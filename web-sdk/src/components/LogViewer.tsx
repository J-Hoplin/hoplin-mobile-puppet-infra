import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { LogEntry, LogFilter } from '../types';

export interface LogViewerProps {
  logs: LogEntry[];
  filter?: LogFilter;
  onFilterChange?: (filter: LogFilter) => void;
  className?: string;
  style?: React.CSSProperties;
  maxHeight?: string;
  autoScroll?: boolean;
}

const LOG_LEVEL_COLORS: Record<LogEntry['level'], string> = {
  verbose: '#8b8b8b',
  debug: '#5ba8ff',
  info: '#00d4aa',
  warn: '#ffb347',
  error: '#ff6b6b',
  fatal: '#e066ff',
};

const LOG_LEVEL_BG: Record<LogEntry['level'], string> = {
  verbose: 'transparent',
  debug: 'transparent',
  info: 'transparent',
  warn: 'rgba(255, 179, 71, 0.08)',
  error: 'rgba(255, 107, 107, 0.12)',
  fatal: 'rgba(224, 102, 255, 0.15)',
};

const LOG_LEVEL_LABELS: Record<LogEntry['level'], string> = {
  verbose: 'V',
  debug: 'D',
  info: 'I',
  warn: 'W',
  error: 'E',
  fatal: 'F',
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${time}.${ms}`;
};

const LogRow: React.FC<{ entry: LogEntry }> = ({ entry }) => (
  <div
    style={{
      display: 'flex',
      gap: '12px',
      padding: '6px 12px',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontSize: '12px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      backgroundColor: LOG_LEVEL_BG[entry.level],
      transition: 'background-color 0.15s ease',
    }}
  >
    <span style={{
      color: '#6b6b7b',
      minWidth: '85px',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {formatTimestamp(entry.timestamp)}
    </span>
    <span
      style={{
        color: LOG_LEVEL_COLORS[entry.level],
        fontWeight: 600,
        minWidth: '14px',
        textShadow: entry.level === 'error' || entry.level === 'fatal'
          ? `0 0 8px ${LOG_LEVEL_COLORS[entry.level]}40`
          : 'none',
      }}
    >
      {LOG_LEVEL_LABELS[entry.level]}
    </span>
    <span style={{
      color: '#a78bfa',
      minWidth: '120px',
      maxWidth: '120px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {entry.tag}
    </span>
    <span style={{
      flex: 1,
      wordBreak: 'break-all',
      color: '#e0e0e8',
    }}>
      {entry.message}
    </span>
  </div>
);

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  filter,
  onFilterChange,
  className,
  style,
  maxHeight = '400px',
  autoScroll = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState(filter?.searchText || '');
  const [selectedLevels, setSelectedLevels] = useState<Set<LogEntry['level']>>(
    new Set(filter?.levels || ['verbose', 'debug', 'info', 'warn', 'error', 'fatal'])
  );

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((entry) => {
    if (!selectedLevels.has(entry.level)) return false;
    if (searchText) {
      const search = searchText.toLowerCase();
      return (
        entry.message.toLowerCase().includes(search) ||
        entry.tag.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const toggleLevel = useCallback((level: LogEntry['level']) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      onFilterChange?.({ levels: Array.from(next), searchText });
      return next;
    });
  }, [searchText, onFilterChange]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setSearchText(text);
      onFilterChange?.({ levels: Array.from(selectedLevels), searchText: text });
    },
    [selectedLevels, onFilterChange]
  );

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#12121a',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#16161f',
        }}
      >
        <input
          type="text"
          placeholder="Search logs..."
          value={searchText}
          onChange={handleSearchChange}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '8px 14px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            fontSize: '13px',
            backgroundColor: '#0d0d12',
            color: '#e0e0e8',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(0, 212, 170, 0.5)';
            e.target.style.boxShadow = '0 0 0 3px rgba(0, 212, 170, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {(Object.keys(LOG_LEVEL_COLORS) as LogEntry['level'][]).map((level) => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedLevels.has(level)
                  ? LOG_LEVEL_COLORS[level]
                  : 'rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                backgroundColor: selectedLevels.has(level)
                  ? `${LOG_LEVEL_COLORS[level]}25`
                  : 'transparent',
                color: selectedLevels.has(level)
                  ? LOG_LEVEL_COLORS[level]
                  : '#6b6b7b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textShadow: selectedLevels.has(level)
                  ? `0 0 8px ${LOG_LEVEL_COLORS[level]}40`
                  : 'none',
              }}
            >
              {LOG_LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Log Content */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          maxHeight: maxHeight === '100%' ? 'none' : maxHeight,
          overflowY: 'auto',
          backgroundColor: '#0d0d12',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: '#6b6b7b',
              fontSize: '13px',
            }}
          >
            <div style={{
              fontSize: '32px',
              marginBottom: '12px',
              opacity: 0.5,
            }}>
              📋
            </div>
            {logs.length === 0
              ? 'Waiting for logs...'
              : 'No logs match the current filter'}
          </div>
        ) : (
          filteredLogs.map((entry, index) => (
            <LogRow key={`${entry.timestamp}-${index}`} entry={entry} />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#16161f',
          fontSize: '11px',
          color: '#6b6b7b',
        }}
      >
        <span>
          {filteredLogs.length === logs.length
            ? `${logs.length} entries`
            : `${filteredLogs.length} / ${logs.length} entries`}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#00d4aa',
            boxShadow: '0 0 6px rgba(0, 212, 170, 0.5)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          Live
        </span>
      </div>
    </div>
  );
};
