import React from 'react';
import type { MetricsData, ProcessInfo } from '../types';

export interface MetricsPanelProps {
  metrics: MetricsData | null;
  className?: string;
  style?: React.CSSProperties;
  showProcesses?: boolean;
  maxProcesses?: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const ProgressBar: React.FC<{
  value: number;
  max: number;
  color?: string;
  label?: string;
}> = ({ value, max, color = '#4CAF50', label }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div style={{ marginBottom: '8px' }}>
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            marginBottom: '4px',
          }}
        >
          <span>{label}</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, percentage)}%`,
            height: '100%',
            backgroundColor:
              percentage > 80 ? '#f44336' : percentage > 60 ? '#ff9800' : color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

const ProcessRow: React.FC<{ process: ProcessInfo }> = ({ process }) => (
  <tr style={{ borderBottom: '1px solid #eee' }}>
    <td style={{ padding: '4px 8px', fontSize: '12px' }}>{process.pid}</td>
    <td
      style={{
        padding: '4px 8px',
        fontSize: '12px',
        maxWidth: '120px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {process.name}
    </td>
    <td style={{ padding: '4px 8px', fontSize: '12px', textAlign: 'right' }}>
      {process.cpuPercent.toFixed(1)}%
    </td>
    <td style={{ padding: '4px 8px', fontSize: '12px', textAlign: 'right' }}>
      {formatBytes(process.memoryBytes)}
    </td>
  </tr>
);

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  className,
  style,
  showProcesses = true,
  maxProcesses = 5,
}) => {
  if (!metrics) {
    return (
      <div
        className={className}
        style={{
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          ...style,
        }}
      >
        <p style={{ color: '#666', textAlign: 'center' }}>No metrics data</p>
      </div>
    );
  }

  const memoryUsedPercent =
    metrics.totalMemoryBytes > 0
      ? ((metrics.totalMemoryBytes - metrics.availableMemoryBytes) /
          metrics.totalMemoryBytes) *
        100
      : 0;

  return (
    <div
      className={className}
      style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        ...style,
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600 }}>
        System Metrics
      </h3>

      <ProgressBar
        value={metrics.totalCpuPercent}
        max={100}
        color="#2196F3"
        label="CPU"
      />

      <ProgressBar
        value={memoryUsedPercent}
        max={100}
        color="#9C27B0"
        label={`Memory (${formatBytes(metrics.usedMemoryBytes)} / ${formatBytes(
          metrics.totalMemoryBytes
        )})`}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#fff',
          borderRadius: '4px',
        }}
      >
        <div>
          <span style={{ color: '#666' }}>Battery: </span>
          <span>{(metrics.batteryLevel * 100).toFixed(0)}%</span>
          {metrics.isCharging && <span> ⚡</span>}
        </div>
        <div>
          <span style={{ color: '#666' }}>Temp: </span>
          <span>{metrics.temperatureCelsius}°C</span>
        </div>
      </div>

      {showProcesses && metrics.topProcesses.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600 }}>
            Top Processes
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    textAlign: 'left',
                  }}
                >
                  PID
                </th>
                <th
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    textAlign: 'left',
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    textAlign: 'right',
                  }}
                >
                  CPU
                </th>
                <th
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    textAlign: 'right',
                  }}
                >
                  MEM
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.topProcesses.slice(0, maxProcesses).map((proc) => (
                <ProcessRow key={proc.pid} process={proc} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
