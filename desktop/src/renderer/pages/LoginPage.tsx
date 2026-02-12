import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Server, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../store/settingsStore';
import {
  spacing,
  borderRadius,
  sizing,
  fontFamily,
  fontSize,
  fontWeight,
  useTheme,
  ThemeColors,
} from '../design-system';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, serverUrl, setServerUrl } = useAuthStore();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin
        ? { email, password }
        : { email, password, firstName: firstName || undefined, lastName: lastName || undefined };

      const response = await fetch(`${serverUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('auth.authFailed'));
      }

      setAuth(data.accessToken, data.user);
      navigate('/devices');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const cardWidth = isLogin ? sizing.loginCard : sizing.signupCard;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.background,
        padding: spacing[5],
      }}
    >
      <div
        style={{
          width: cardWidth,
          background: colors.surface,
          borderRadius: borderRadius['2xl'],
          border: `1px solid ${colors.border}`,
          padding: spacing[10],
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing[4],
            marginBottom: spacing[8],
          }}
        >
          <div
            style={{
              width: sizing.logoMark,
              height: sizing.logoMark,
              borderRadius: borderRadius.xl,
              background: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Smartphone size={28} color="#FFFFFF" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontFamily: fontFamily.display,
                fontSize: fontSize['4xl'],
                fontWeight: fontWeight.semibold,
                color: colors.foreground,
                marginBottom: spacing[2],
              }}
            >
              Hoplin Mobile Puppet
            </h1>
            <p
              style={{
                fontFamily: fontFamily.primary,
                fontSize: fontSize.lg,
                color: colors.mutedForeground,
              }}
            >
              {isLogin ? t('auth.subtitle') : t('auth.signupSubtitle')}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
          {/* Server URL Field */}
          <FormField label={t('auth.serverUrl')} colors={colors}>
            <InputWithIcon
              icon={<Server size={18} />}
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://hoplin.cloud"
              colors={colors}
            />
          </FormField>

          {/* Signup: Name Fields */}
          {!isLogin && (
            <div style={{ display: 'flex', gap: spacing[4] }}>
              <FormField label={t('auth.firstName')} style={{ flex: 1 }} colors={colors}>
                <InputWithIcon
                  icon={<User size={18} />}
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="JunHo"
                  colors={colors}
                />
              </FormField>
              <FormField label={t('auth.lastName')} style={{ flex: 1 }} colors={colors}>
                <InputWithIcon
                  icon={<User size={18} />}
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Yoon"
                  colors={colors}
                />
              </FormField>
            </div>
          )}

          {/* Email Field */}
          <FormField label={t('auth.email')} colors={colors}>
            <InputWithIcon
              icon={<Mail size={18} />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.here"
              required
              colors={colors}
            />
          </FormField>

          {/* Password Fields */}
          {isLogin ? (
            <FormField label={t('auth.password')} colors={colors}>
              <InputWithIcon
                icon={<Lock size={18} />}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                colors={colors}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.mutedForeground,
                      display: 'flex',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </FormField>
          ) : (
            <div style={{ display: 'flex', gap: spacing[4] }}>
              <FormField label={t('auth.password')} style={{ flex: 1 }} colors={colors}>
                <InputWithIcon
                  icon={<Lock size={18} />}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  colors={colors}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: colors.mutedForeground,
                        display: 'flex',
                        padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </FormField>
              <FormField label={t('auth.confirmPassword')} style={{ flex: 1 }} colors={colors}>
                <InputWithIcon
                  icon={<Lock size={18} />}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  colors={colors}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: colors.mutedForeground,
                        display: 'flex',
                        padding: 0,
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </FormField>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: `${spacing[3]} ${spacing[4]}`,
                background: colors.errorAlpha,
                border: `1px solid ${colors.error}30`,
                borderRadius: borderRadius.lg,
                color: colors.error,
                fontSize: fontSize.md,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: `${spacing[3]} 0`,
              background: colors.primary,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: borderRadius.lg,
              fontFamily: fontFamily.display,
              fontSize: '15px',
              fontWeight: fontWeight.semibold,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? t('common.loading') : isLogin ? t('auth.login') : t('auth.signup')}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[4],
            margin: `${spacing[8]} 0`,
          }}
        >
          <div style={{ flex: 1, height: '1px', background: colors.border }} />
          <span style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>{t('auth.or')}</span>
          <div style={{ flex: 1, height: '1px', background: colors.border }} />
        </div>

        {/* Switch Mode Link */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing[2],
          }}
        >
          <span style={{ fontSize: fontSize.lg, color: colors.mutedForeground }}>
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.primary,
              fontSize: fontSize.lg,
              fontWeight: fontWeight.medium,
              cursor: 'pointer',
            }}
          >
            {isLogin ? t('auth.signup') : t('auth.login')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Form Field Component
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  colors: ThemeColors;
}

const FormField: React.FC<FormFieldProps> = ({ label, children, style, colors }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], ...style }}>
    <label
      style={{
        fontFamily: fontFamily.primary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

// Input with Icon Component
interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  rightIcon?: React.ReactNode;
  colors: ThemeColors;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({ icon, rightIcon, style, colors, ...props }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: spacing[3],
      padding: `${spacing[3]} ${spacing[4]}`,
      background: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: borderRadius.lg,
      ...style,
    }}
  >
    <span style={{ color: colors.mutedForeground, display: 'flex' }}>{icon}</span>
    <input
      style={{
        flex: 1,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: colors.foreground,
        fontFamily: fontFamily.primary,
        fontSize: fontSize.lg,
        width: '100%',
      }}
      {...props}
    />
    {rightIcon}
  </div>
);
