import React from 'react';
import { colors } from '../tokens/colors';
import { borderRadius, spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({
  icon,
  rightIcon,
  containerStyle,
  ...props
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: `${spacing[3]} ${spacing[4]}`,
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    ...containerStyle,
  }}>
    {icon && <span style={{ color: colors.mutedForeground, display: 'flex' }}>{icon}</span>}
    <input
      style={{
        flex: 1,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: colors.foreground,
        fontFamily: typography.body.fontFamily,
        fontSize: typography.bodyLarge.fontSize,
        width: '100%',
      }}
      {...props}
    />
    {rightIcon && (
      <span style={{ color: colors.mutedForeground, cursor: 'pointer', display: 'flex' }}>
        {rightIcon}
      </span>
    )}
  </div>
);
