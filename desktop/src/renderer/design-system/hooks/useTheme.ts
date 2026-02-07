import { useSettingsStore } from '../../store/settingsStore';
import { darkColors, lightColors } from '../tokens/colors';

export function useTheme() {
  const darkMode = useSettingsStore((state) => state.darkMode);

  return {
    colors: darkMode ? darkColors : lightColors,
    isDark: darkMode,
  };
}

// For static usage outside of React components
export function getThemeColors(isDark: boolean) {
  return isDark ? darkColors : lightColors;
}
