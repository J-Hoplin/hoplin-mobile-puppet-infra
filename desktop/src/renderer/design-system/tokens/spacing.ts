export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
} as const;

export const sizing = {
  sidebar: '260px',
  folderPanel: '240px',
  metricsPanel: '300px',
  loginCard: '420px',
  signupCard: '560px',
  folderCard: '320px',
  controlButton: '44px',
  logoMark: '56px',
  logoMarkSmall: '32px',
  avatar: '36px',
  iconSm: '14px',
  iconMd: '16px',
  iconLg: '18px',
  iconXl: '20px',
  iconXxl: '32px',
} as const;

export type SpacingToken = keyof typeof spacing;
export type BorderRadiusToken = keyof typeof borderRadius;
export type SizingToken = keyof typeof sizing;
