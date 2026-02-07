import React from 'react';
import { Check } from 'lucide-react';
import { useSettingsStore, useTranslation, languageLabels, type Language } from '../store/settingsStore';
import {
  spacing,
  borderRadius,
  fontFamily,
  fontSize,
  fontWeight,
  useTheme,
} from '../design-system';
import { Toggle } from '../design-system/components';

export const SettingsPage: React.FC = () => {
  const { language, setLanguage, darkMode, toggleDarkMode } = useSettingsStore();
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <div style={{ padding: `${spacing[8]} ${spacing[10]}` }}>
      {/* Page Header */}
      <div style={{ marginBottom: spacing[8] }}>
        <h1
          style={{
            fontFamily: fontFamily.display,
            fontSize: fontSize['4xl'],
            fontWeight: fontWeight.semibold,
            color: colors.foreground,
            marginBottom: spacing[2],
          }}
        >
          {t('settings.title')}
        </h1>
        <p
          style={{
            fontFamily: fontFamily.primary,
            fontSize: fontSize.md,
            color: colors.mutedForeground,
          }}
        >
          {t('settings.description')}
        </p>
      </div>

      {/* Settings Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        {/* Language Card */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.xl,
            padding: spacing[6],
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing[5],
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: fontFamily.display,
                  fontSize: fontSize.xl,
                  fontWeight: fontWeight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing[1],
                }}
              >
                {t('settings.language')}
              </h3>
              <p
                style={{
                  fontFamily: fontFamily.primary,
                  fontSize: fontSize.md,
                  color: colors.mutedForeground,
                }}
              >
                {t('settings.languageDescription')}
              </p>
            </div>
          </div>

          {/* Language Options */}
          <div style={{ display: 'flex', gap: spacing[3] }}>
            {(Object.keys(languageLabels) as Language[]).map((lang) => {
              const isSelected = language === lang;
              return (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    padding: `${spacing[3]} ${spacing[4]}`,
                    borderRadius: borderRadius.lg,
                    border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                    background: isSelected ? colors.primaryAlpha : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontFamily: fontFamily.primary,
                      fontSize: fontSize.lg,
                      fontWeight: isSelected ? fontWeight.medium : fontWeight.normal,
                      color: isSelected ? colors.foreground : colors.mutedForeground,
                    }}
                  >
                    {languageLabels[lang]}
                  </span>
                  {isSelected && (
                    <Check size={16} color={colors.primary} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dark Mode Card */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.xl,
            padding: spacing[6],
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: fontFamily.display,
                fontSize: fontSize.xl,
                fontWeight: fontWeight.semibold,
                color: colors.foreground,
                marginBottom: spacing[1],
              }}
            >
              {t('settings.darkMode')}
            </h3>
            <p
              style={{
                fontFamily: fontFamily.primary,
                fontSize: fontSize.md,
                color: colors.mutedForeground,
              }}
            >
              {t('settings.darkModeDescription')}
            </p>
          </div>
          <Toggle checked={darkMode} onChange={toggleDarkMode} />
        </div>
      </div>
    </div>
  );
};
