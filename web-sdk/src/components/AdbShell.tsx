import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface AdbShellProps {
  onCommand: (command: string) => void;
  output: string;
  className?: string;
  style?: React.CSSProperties;
  maxHeight?: string;
  prompt?: string;
}

export const AdbShell: React.FC<AdbShellProps> = ({
  onCommand,
  output,
  className,
  style,
  maxHeight = '400px',
  prompt = '$ ',
}) => {
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (command.trim()) {
        onCommand(command.trim());
        setHistory((prev) => [...prev, command.trim()]);
        setCommand('');
        setHistoryIndex(-1);
      }
    },
    [command, onCommand]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length > 0) {
          const newIndex =
            historyIndex === -1
              ? history.length - 1
              : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setCommand(history[newIndex]);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex !== -1) {
          const newIndex = historyIndex + 1;
          if (newIndex >= history.length) {
            setHistoryIndex(-1);
            setCommand('');
          } else {
            setHistoryIndex(newIndex);
            setCommand(history[newIndex]);
          }
        }
      } else if (e.key === 'c' && e.ctrlKey) {
        setCommand('');
        setHistoryIndex(-1);
      }
    },
    [history, historyIndex]
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className={className}
      onClick={focusInput}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        overflow: 'hidden',
        fontFamily: 'monospace',
        ...style,
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#333',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ color: '#4CAF50' }}>●</span>
        ADB Shell
      </div>

      <div
        ref={outputRef}
        style={{
          flex: 1,
          minHeight: 0,
          maxHeight: maxHeight === 'none' ? undefined : maxHeight,
          overflowY: 'auto',
          padding: '12px',
          color: '#d4d4d4',
          fontSize: '13px',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {output || (
          <span style={{ color: '#666' }}>
            Type a command and press Enter to execute.
            {'\n'}Use ↑/↓ for command history.
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            borderTop: '1px solid #333',
            backgroundColor: '#252525',
          }}
        >
          <span
            style={{
              color: '#4CAF50',
              marginRight: '8px',
              fontWeight: 'bold',
            }}
          >
            {prompt}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '13px',
              fontFamily: 'monospace',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '4px 12px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Run
          </button>
        </div>
      </form>
    </div>
  );
};
