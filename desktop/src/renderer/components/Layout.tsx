import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Smartphone,
  Folder,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../store/settingsStore';
import { spacing, borderRadius, sizing, fontFamily, fontSize, fontWeight, useTheme } from '../design-system';

export const Layout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const location = useLocation();

  // Hide sidebar on login page
  const showSidebar = isAuthenticated && !location.pathname.includes('/login');

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: colors.background,
        position: 'relative',
      }}
    >
      {/* Global Drag Region - overlays on top */}
      <div
        className="drag-region"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '38px',
          zIndex: 10,
        }}
      />

      {/* Sidebar */}
      {showSidebar && (
        <aside
          style={{
            width: sizing.sidebar,
            background: colors.background,
            borderRight: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: `38px ${spacing[6]} ${spacing[8]}`,
          }}
        >
          {/* Top Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
              <div
                style={{
                  width: sizing.logoMarkSmall,
                  height: sizing.logoMarkSmall,
                  borderRadius: borderRadius.sm,
                  background: colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Smartphone size={18} color={colors.foreground} />
              </div>
              <span
                style={{
                  fontFamily: fontFamily.display,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.semibold,
                  color: colors.foreground,
                }}
              >
                Hoplin Mobile Puppet
              </span>
            </div>

            {/* Navigation */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
              <NavItem
                to="/devices"
                icon={<LayoutDashboard size={20} />}
                label={t('nav.devices')}
                colors={colors}
              />
              <NavItem
                to="/folders"
                icon={<Folder size={20} />}
                label={t('nav.folders')}
                colors={colors}
              />
              <NavItem
                to="/settings"
                icon={<Settings size={20} />}
                label={t('nav.settings')}
                colors={colors}
              />
            </nav>
          </div>

          {/* Bottom Section - User Profile */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
              padding: `${spacing[3]} ${spacing[4]}`,
              borderRadius: borderRadius.sm,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                width: sizing.avatar,
                height: sizing.avatar,
                borderRadius: borderRadius.full,
                background: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fontFamily.display,
                fontSize: fontSize.lg,
                fontWeight: fontWeight.semibold,
                color: colors.foreground,
              }}
            >
              {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: fontFamily.display,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.medium,
                  color: colors.foreground,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.firstName || user?.email?.split('@')[0] || 'User'}
              </div>
              <div
                style={{
                  fontSize: fontSize.sm,
                  color: colors.mutedForeground,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email || ''}
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                padding: spacing[2],
                cursor: 'pointer',
                color: colors.mutedForeground,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: borderRadius.sm,
                transition: 'all 0.2s',
              }}
              title={t('nav.logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          background: colors.background,
          paddingTop: showSidebar ? 0 : '38px', // space for traffic lights when no sidebar
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  colors: import('../design-system').ThemeColors;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, colors }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: spacing[3],
      padding: `${spacing[3]} ${spacing[4]}`,
      borderRadius: borderRadius.sm,
      textDecoration: 'none',
      color: isActive ? colors.foreground : colors.mutedForeground,
      backgroundColor: isActive ? colors.surface : 'transparent',
      transition: 'all 0.15s ease',
    })}
  >
    {({ isActive }) => (
      <>
        <span style={{ display: 'flex', color: isActive ? colors.primary : colors.mutedForeground }}>
          {icon}
        </span>
        <span
          style={{
            fontFamily: fontFamily.display,
            fontSize: fontSize.lg,
            fontWeight: isActive ? fontWeight.medium : fontWeight.normal,
          }}
        >
          {label}
        </span>
      </>
    )}
  </NavLink>
);
