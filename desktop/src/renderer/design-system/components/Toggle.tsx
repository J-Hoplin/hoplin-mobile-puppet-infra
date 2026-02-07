import React from 'react';
import { borderRadius } from '../tokens/spacing';
import { useTheme } from '../hooks/useTheme';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled }) => {
  const { colors } = useTheme();

  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: '48px',
        height: '28px',
        borderRadius: borderRadius.full,
        backgroundColor: checked ? colors.primary : colors.border,
        border: 'none',
        padding: '2px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        transition: 'all 0.2s',
      }}
      disabled={disabled}
      type="button"
    >
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: borderRadius.full,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.2s',
      }} />
    </button>
  );
};
