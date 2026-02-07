export const fontFamily = {
  primary: "'Inter', sans-serif",
  display: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const fontSize = {
  xs: '11px',
  sm: '12px',
  md: '13px',
  lg: '14px',
  xl: '16px',
  '2xl': '18px',
  '3xl': '20px',
  '4xl': '24px',
  '5xl': '28px',
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Typography presets
export const typography = {
  h1: { fontFamily: fontFamily.display, fontSize: fontSize['5xl'], fontWeight: fontWeight.bold },
  h2: { fontFamily: fontFamily.display, fontSize: fontSize['4xl'], fontWeight: fontWeight.semibold },
  h3: { fontFamily: fontFamily.display, fontSize: fontSize['2xl'], fontWeight: fontWeight.semibold },
  h4: { fontFamily: fontFamily.display, fontSize: fontSize.xl, fontWeight: fontWeight.semibold },
  body: { fontFamily: fontFamily.primary, fontSize: fontSize.md, fontWeight: fontWeight.normal },
  bodyLarge: { fontFamily: fontFamily.primary, fontSize: fontSize.lg, fontWeight: fontWeight.normal },
  small: { fontFamily: fontFamily.primary, fontSize: fontSize.sm, fontWeight: fontWeight.normal },
  label: { fontFamily: fontFamily.primary, fontSize: fontSize.lg, fontWeight: fontWeight.medium },
  button: { fontFamily: fontFamily.display, fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  buttonLarge: { fontFamily: fontFamily.display, fontSize: '15px', fontWeight: fontWeight.semibold },
  mono: { fontFamily: fontFamily.mono, fontSize: fontSize.md, fontWeight: fontWeight.normal },
} as const;
