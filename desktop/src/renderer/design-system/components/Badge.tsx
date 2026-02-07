import React from 'react';
import { colors } from '../tokens/colors';
import { borderRadius, spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

type BadgeVariant = 'success' | 'error' | 'warning' | 'default' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  success: { backgroundColor: colors.successAlpha, color: colors.success },
  error: { backgroundColor: colors.errorAlpha, color: colors.error },
  warning: { backgroundColor: `${colors.warning}20`, color: colors.warning },
  default: { backgroundColor: colors.surfaceElevated, color: colors.mutedForeground },
  primary: { backgroundColor: colors.primary, color: colors.foreground },
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, style }) => (
  <span style={{
    ...variantStyles[variant],
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: borderRadius.sm,
    fontSize: typography.small.fontSize,
    fontFamily: typography.body.fontFamily,
    fontWeight: typography.label.fontWeight,
    display: 'inline-flex',
    alignItems: 'center',
    ...style,
  }}>
    {children}
  </span>
);
