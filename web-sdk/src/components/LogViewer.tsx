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
  verbose: '#9E9E9E',
  debug: '#2196F3',
  info: '#4CAF50',
  warn: '#FF9800',
  error: '#F44336',
  fatal: '#9C27B0',
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
      gap: '8px',
      padding: '2px 8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      borderBottom: '1px solid #eee',
      backgroundColor: entry.level === 'error' || entry.level === 'fatal'
        ? 'rgba(244, 67, 54, 0.1)'
        : 'transparent',
    }}
  >
    <span style={{ color: '#666', minWidth: '90px' }}>
      {formatTimestamp(entry.timestamp)}
    </span>
    <span
      style={{
        color: LOG_LEVEL_COLORS[entry.level],
        fontWeight: 'bold',
        minWidth: '16px',
      }}
    >
      {LOG_LEVEL_LABELS[entry.level]}
    </span>
    <span style={{ color: '#9C27B0', minWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {entry.tag}
    </span>
    <span style={{ flex: 1, wordBreak: 'break-all' }}>{entry.message}</span>
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
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px',
          borderBottom: '1px solid #ddd',
          backgroundColor: '#f5f5f5',
        }}
      >
        <input
          type="text"
          placeholder="Search logs..."
          value={searchText}
          onChange={handleSearchChange}
          style={{
            flex: 1,
            minWidth: '150px',
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          {(Object.keys(LOG_LEVEL_COLORS) as LogEntry['level'][]).map((level) => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid',
                borderColor: LOG_LEVEL_COLORS[level],
                borderRadius: '4px',
                backgroundColor: selectedLevels.has(level)
                  ? LOG_LEVEL_COLORS[level]
                  : 'transparent',
                color: selectedLevels.has(level) ? '#fff' : LOG_LEVEL_COLORS[level],
                cursor: 'pointer',
              }}
            >
              {LOG_LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          maxHeight,
          overflowY: 'auto',
          backgroundColor: '#fafafa',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px',
            }}
          >
            No logs to display
          </div>
        ) : (
          filteredLogs.map((entry, index) => (
            <LogRow key={`${entry.timestamp}-${index}`} entry={entry} />
          ))
        )}
      </div>

      <div
        style={{
          padding: '4px 8px',
          borderTop: '1px solid #ddd',
          backgroundColor: '#f5f5f5',
          fontSize: '10px',
          color: '#666',
        }}
      >
        {filteredLogs.length} / {logs.length} entries
      </div>
    </div>
  );
};
