import React from 'react';
import { colors } from '../tokens/colors';
import { borderRadius, spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: colors.primary, color: colors.foreground, border: 'none' },
  secondary: { backgroundColor: colors.surfaceElevated, color: colors.foreground, border: 'none' },
  outline: { backgroundColor: 'transparent', color: colors.foreground, border: `1px solid ${colors.border}` },
  danger: { backgroundColor: colors.error, color: colors.foreground, border: 'none' },
  ghost: { backgroundColor: 'transparent', color: colors.mutedForeground, border: 'none' },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: `${spacing[1]} ${spacing[3]}`, fontSize: typography.small.fontSize },
  md: { padding: `${spacing[2]} ${spacing[4]}`, fontSize: typography.body.fontSize },
  lg: { padding: `${spacing[3]} ${spacing[5]}`, fontSize: typography.bodyLarge.fontSize },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  style,
  disabled,
  ...props
}) => (
  <button
    style={{
      ...variantStyles[variant],
      ...sizeStyles[size],
      fontFamily: typography.button.fontFamily,
      fontWeight: typography.button.fontWeight,
      borderRadius: borderRadius.md,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      transition: 'all 0.2s',
      ...style,
    }}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);
