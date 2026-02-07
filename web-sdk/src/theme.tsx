import React, { createContext, useContext } from 'react';

export interface SDKThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceDeep: string;

  // Text
  foreground: string;
  foregroundSecondary: string;
  foregroundMuted: string;

  // Borders
  border: string;
  borderLight: string;

  // Interactive
  primary: string;
  primaryHover: string;
  accent: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Input
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;

  // Overlay & Hover
  overlay: string;
  hover: string;
}

export const darkTheme: SDKThemeColors = {
  background: '#0F1117',
  surface: '#16161f',
  surfaceElevated: '#1a1a24',
  surfaceDeep: '#0d0d12',

  foreground: '#ffffff',
  foregroundSecondary: '#9090a0',
  foregroundMuted: '#6b6b7b',

  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',

  primary: '#3B82F6',
  primaryHover: '#2563EB',
  accent: '#a855f7',

  success: '#00d68f',
  warning: '#ffaa00',
  error: '#ff6b6b',
  info: '#5ba8ff',

  inputBackground: 'transparent',
  inputBorder: 'rgba(255, 255, 255, 0.15)',
  inputPlaceholder: '#6b6b7b',

  overlay: 'rgba(0, 0, 0, 0.6)',
  hover: 'rgba(255, 255, 255, 0.05)',
};

export const lightTheme: SDKThemeColors = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceElevated: '#FFFFFF',
  surfaceDeep: '#F1F5F9',

  foreground: '#0F172A',
  foregroundSecondary: '#64748B',
  foregroundMuted: '#94A3B8',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  primary: '#3B82F6',
  primaryHover: '#2563EB',
  accent: '#8B5CF6',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  inputBackground: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputPlaceholder: '#9CA3AF',

  overlay: 'rgba(0, 0, 0, 0.3)',
  hover: 'rgba(0, 0, 0, 0.04)',
};

const ThemeContext = createContext<SDKThemeColors>(darkTheme);

export interface SDKThemeProviderProps {
  mode?: 'dark' | 'light';
  theme?: SDKThemeColors;
  children: React.ReactNode;
}

export const SDKThemeProvider: React.FC<SDKThemeProviderProps> = ({
  mode = 'dark',
  theme,
  children,
}) => {
  const colors = theme ?? (mode === 'light' ? lightTheme : darkTheme);
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
};

export function useSDKTheme(): SDKThemeColors {
  return useContext(ThemeContext);
}
