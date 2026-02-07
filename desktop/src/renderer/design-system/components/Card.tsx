import React from 'react';
import { colors } from '../tokens/colors';
import { borderRadius, spacing, BorderRadiusToken, SpacingToken } from '../tokens/spacing';

interface CardProps {
  children: React.ReactNode;
  padding?: SpacingToken;
  radius?: BorderRadiusToken;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 6,
  radius = 'xl',
  style
}) => (
  <div style={{
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius[radius],
    padding: spacing[padding],
    ...style,
  }}>
    {children}
  </div>
);
