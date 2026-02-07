// Color theme type (from Pencil design file)
export interface ThemeColors {
  // Primary
  primary: string;
  primaryHover: string;
  accent: string;

  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;

  // Text
  foreground: string;
  mutedForeground: string;
  inputPlaceholder: string;

  // Borders
  border: string;

  // Status
  success: string;
  warning: string;
  error: string;

  // Status with alpha (for badges)
  successAlpha: string;
  errorAlpha: string;
  primaryAlpha: string;
  warningAlpha: string;
}

// Dark Mode colors from Pencil design
export const darkColors: ThemeColors = {
  // Primary (same in both themes)
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  accent: '#8B5CF6',

  // Backgrounds
  background: '#0F1117',
  surface: '#1A1D24',
  surfaceElevated: '#252A34',

  // Text
  foreground: '#FFFFFF',
  mutedForeground: '#8B949E',
  inputPlaceholder: '#6B7280',

  // Borders
  border: '#2E3440',

  // Status (same in both themes)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Status with alpha (for badges)
  successAlpha: '#10B98120',
  errorAlpha: '#EF444420',
  primaryAlpha: '#3B82F620',
  warningAlpha: '#F59E0B20',
};

// Light Mode colors from Pencil design
export const lightColors: ThemeColors = {
  // Primary (same in both themes)
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  accent: '#8B5CF6',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceElevated: '#F1F5F9',

  // Text
  foreground: '#0F172A',
  mutedForeground: '#64748B',
  inputPlaceholder: '#9CA3AF',

  // Borders
  border: '#E2E8F0',

  // Status (same in both themes)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Status with alpha (for badges)
  successAlpha: '#10B98120',
  errorAlpha: '#EF444420',
  primaryAlpha: '#3B82F620',
  warningAlpha: '#F59E0B20',
};

// Default export for backward compatibility (dark theme)
export const colors = darkColors;

export type ColorToken = keyof ThemeColors;
