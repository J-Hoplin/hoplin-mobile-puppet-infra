import React, { useMemo } from 'react';
import type { MetricsData, ProcessInfo, DeviceInfo } from '../types';
import { useSDKTheme } from '../theme';

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

// Circular Gauge Component
const CircularGauge: React.FC<{
  value: number;
  max: number;
  label: string;
  color: string;
  size?: number;
  icon?: React.ReactNode;
}> = ({ value, max, label, color, size = 100, icon }) => {
  const theme = useSDKTheme();
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          inset: '10%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }} />

        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme.border}
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#gradient-${label})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon && (
            <div style={{
              color: color,
              opacity: 0.8,
              marginBottom: '2px',
              fontSize: '14px'
            }}>
              {icon}
            </div>
          )}
          <span style={{
            fontSize: '18px',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: theme.foreground,
            textShadow: `0 0 20px ${color}40`,
          }}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      <span style={{
        fontSize: '11px',
        fontWeight: 600,
        color: theme.foregroundSecondary,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {label}
      </span>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  isActive?: boolean;
}> = ({ icon, label, value, subValue, color, isActive }) => {
  const theme = useSDKTheme();
  return (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    background: `linear-gradient(135deg, ${theme.hover} 0%, transparent 100%)`,
    borderRadius: '10px',
    border: `1px solid ${theme.border}`,
    transition: 'all 0.2s ease',
    minWidth: 0,
    overflow: 'hidden',
  }}>
    <div style={{
      width: '36px',
      height: '36px',
      flexShrink: 0,
      borderRadius: '10px',
      background: `linear-gradient(135deg, ${color}20 0%, ${color}08 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
      fontSize: '16px',
      boxShadow: isActive ? `0 0 12px ${color}30` : 'none',
      position: 'relative',
    }}>
      {icon}
      {isActive && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '10px',
          border: `1px solid ${color}40`,
          animation: 'pulse-border 2s ease-in-out infinite',
        }} />
      )}
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: '10px',
        color: theme.foregroundSecondary,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '2px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px',
      }}>
        <span style={{
          fontSize: '16px',
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: theme.foreground,
        }}>
          {value}
        </span>
        {subValue && (
          <span style={{
            fontSize: '11px',
            color: theme.success,
          }}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  </div>
  );
};

// Process Row Component
const ProcessRow: React.FC<{
  process: ProcessInfo;
  index: number;
  maxCpu: number;
}> = ({ process, index, maxCpu }) => {
  const theme = useSDKTheme();
  const cpuBarWidth = maxCpu > 0 ? (process.cpuPercent / maxCpu) * 100 : 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '52px 1fr 70px 70px',
      alignItems: 'center',
      padding: '10px 12px',
      background: index % 2 === 0 ? theme.hover : 'transparent',
      borderRadius: '6px',
      transition: 'background 0.15s ease',
    }}>
      <span style={{
        fontSize: '11px',
        fontFamily: "'JetBrains Mono', monospace",
        color: theme.foregroundMuted,
      }}>
        {process.pid}
      </span>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0,
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: `hsl(${170 - index * 15}, 70%, 50%)`,
          boxShadow: `0 0 6px hsl(${170 - index * 15}, 70%, 50%, 0.5)`,
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: '12px',
          color: theme.foreground,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {process.name.split('.').pop() || process.name}
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        justifyContent: 'flex-end',
      }}>
        <div style={{
          width: '32px',
          height: '4px',
          borderRadius: '2px',
          background: theme.border,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${cpuBarWidth}%`,
            background: 'linear-gradient(90deg, #00d4aa, #00b894)',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{
          fontSize: '11px',
          fontFamily: "'JetBrains Mono', monospace",
          color: theme.foregroundSecondary,
          width: '32px',
          textAlign: 'right',
        }}>
          {process.cpuPercent.toFixed(1)}%
        </span>
      </div>

      <span style={{
        fontSize: '11px',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#a0a0b0',
        textAlign: 'right',
      }}>
        {formatBytes(process.memoryBytes)}
      </span>
    </div>
  );
};

// Loading/Empty State
const EmptyState: React.FC = () => {
  const theme = useSDKTheme();
  return (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'rgba(0, 212, 170, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 212, 170, 0.5)" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
    <p style={{
      fontSize: '13px',
      color: theme.foregroundSecondary,
    }}>
      Waiting for metrics...
    </p>
  </div>
  );
};

// Icons
const CpuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
  </svg>
);

const MemoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 19v-3M10 19v-3M14 19v-3M18 19v-3M6 8V5M10 8V5M14 8V5M18 8V5" />
    <rect x="3" y="8" width="18" height="8" rx="1" />
  </svg>
);

const BatteryIcon: React.FC<{ level: number; isCharging: boolean }> = ({ level, isCharging }) => {
  const theme = useSDKTheme();
  return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="18" height="10" rx="2" />
    <path d="M22 11v2" />
    {level > 0 && (
      <rect
        x="4"
        y="9"
        width={Math.max(1, (level * 14))}
        height="6"
        rx="1"
        fill={level < 0.2 ? theme.error : level < 0.5 ? theme.warning : theme.success}
        stroke="none"
      />
    )}
    {isCharging && (
      <path d="M10 10l2 2-2 2" stroke={theme.warning} strokeWidth="2" fill="none" />
    )}
  </svg>
  );
};

const TempIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M12 18h.01" />
  </svg>
);

// Device Info Card Component
const DeviceInfoCard: React.FC<{ deviceInfo?: DeviceInfo }> = ({ deviceInfo }) => {
  const theme = useSDKTheme();
  const getValue = (value?: string | number): string => value?.toString() ?? '-';

  return (
    <div style={{
      padding: '14px',
      background: `linear-gradient(135deg, ${theme.success}14 0%, ${theme.accent}0d 100%)`,
      borderRadius: '12px',
      border: `1px solid ${theme.success}33`,
    }}>
      {/* Device Name Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(0, 212, 170, 0.3)',
        }}>
          <PhoneIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 700,
            color: theme.foreground,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {getValue(deviceInfo?.deviceName)}
          </div>
          <div style={{
            fontSize: '11px',
            color: theme.foregroundSecondary,
          }}>
            {getValue(deviceInfo?.manufacturer)} {getValue(deviceInfo?.model)}
          </div>
        </div>
      </div>

      {/* Device Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
      }}>
        <DeviceInfoRow label="Serial" value={getValue(deviceInfo?.serialNumber)} mono />
        <DeviceInfoRow
          label="Android"
          value={deviceInfo?.androidVersion
            ? `${deviceInfo.androidVersion} (API ${deviceInfo.apiLevel ?? '-'})`
            : '-'}
        />
        <DeviceInfoRow label="Model" value={getValue(deviceInfo?.model)} />
        <DeviceInfoRow label="CPU" value={getValue(deviceInfo?.cpuAbi)} />
      </div>
    </div>
  );
};

// Device Info Row Component
const DeviceInfoRow: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
}> = ({ label, value, mono }) => {
  const theme = useSDKTheme();
  return (
  <div style={{ minWidth: 0 }}>
    <div style={{
      fontSize: '9px',
      color: theme.foregroundMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '2px',
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '11px',
      color: theme.foreground,
      fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {value}
    </div>
  </div>
  );
};

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  className,
  style,
  showProcesses = true,
  maxProcesses = 5,
}) => {
  const theme = useSDKTheme();
  const memoryUsedPercent = useMemo(() => {
    if (!metrics || metrics.totalMemoryBytes === 0) return 0;
    return ((metrics.totalMemoryBytes - metrics.availableMemoryBytes) / metrics.totalMemoryBytes) * 100;
  }, [metrics]);

  const maxProcessCpu = useMemo(() => {
    if (!metrics?.topProcesses?.length) return 0;
    return Math.max(...metrics.topProcesses.map(p => p.cpuPercent), 1);
  }, [metrics]);

  if (!metrics) {
    return (
      <div className={className} style={{ ...style }}>
        <EmptyState />
      </div>
    );
  }

  const batteryColor = metrics.batteryLevel < 0.2 ? theme.error :
                       metrics.batteryLevel < 0.5 ? theme.warning : theme.success;

  const tempColor = metrics.temperatureCelsius > 45 ? theme.error :
                    metrics.temperatureCelsius > 35 ? theme.warning : theme.success;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        ...style,
      }}
    >
      {/* CSS Animation */}
      <style>{`
        @keyframes pulse-border {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }
      `}</style>

      {/* Device Info */}
      <DeviceInfoCard deviceInfo={metrics.deviceInfo} />

      {/* Circular Gauges */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        padding: '8px 0',
      }}>
        <CircularGauge
          value={metrics.totalCpuPercent}
          max={100}
          label="CPU"
          color="#00d4aa"
          size={90}
          icon={<CpuIcon />}
        />
        <CircularGauge
          value={memoryUsedPercent}
          max={100}
          label="Memory"
          color="#a855f7"
          size={90}
          icon={<MemoryIcon />}
        />
      </div>

      {/* Memory Details */}
      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        color: theme.foregroundSecondary,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {formatBytes(metrics.usedMemoryBytes)} / {formatBytes(metrics.totalMemoryBytes)}
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
      }}>
        <StatCard
          icon={<BatteryIcon level={metrics.batteryLevel} isCharging={metrics.isCharging} />}
          label="Battery"
          value={`${(metrics.batteryLevel * 100).toFixed(0)}%`}
          subValue={metrics.isCharging ? 'Charging' : ''}
          color={batteryColor}
          isActive={metrics.isCharging}
        />
        <StatCard
          icon={<TempIcon />}
          label="Temperature"
          value={`${metrics.temperatureCelsius.toFixed(0)}°C`}
          color={tempColor}
        />
      </div>

      {/* Top Processes */}
      {showProcesses && metrics.topProcesses && metrics.topProcesses.length > 0 && (
        <div style={{
          marginTop: '4px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${theme.border}`,
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: theme.foregroundSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Top Processes
            </span>
            <span style={{
              fontSize: '10px',
              color: theme.foregroundMuted,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {metrics.topProcesses.length} active
            </span>
          </div>

          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '52px 1fr 70px 70px',
            padding: '0 12px 8px',
          }}>
            {['PID', 'PROCESS', 'CPU', 'MEM'].map((header) => (
              <span key={header} style={{
                fontSize: '9px',
                fontWeight: 600,
                color: theme.foregroundMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: header === 'CPU' || header === 'MEM' ? 'right' : 'left',
              }}>
                {header}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            {metrics.topProcesses.slice(0, maxProcesses).map((proc, index) => (
              <ProcessRow
                key={proc.pid}
                process={proc}
                index={index}
                maxCpu={maxProcessCpu}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
