import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { MdPhoneAndroid, MdSettings, MdLogout } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';

export const Layout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Header / Title Bar */}
      <header
        className="drag-region"
        style={{
          height: 'var(--header-height)',
          background: 'linear-gradient(180deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 'var(--traffic-light-offset)',
          paddingRight: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 10px var(--accent)',
            }}
          />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.5px',
            }}
          >
            Remote Puppet
          </span>
        </div>
        {isAuthenticated && (
          <div
            className="no-drag"
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                background: 'var(--bg-elevated)',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
              }}
            >
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="btn btn-ghost"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                gap: '4px',
              }}
            >
              <MdLogout size={14} />
              Logout
            </button>
          </div>
        )}
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        {isAuthenticated && (
          <aside
            style={{
              width: 'var(--sidebar-width)',
              background: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <nav style={{ padding: '20px 12px', flex: 1 }}>
              <div style={{ marginBottom: '8px', padding: '0 12px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--text-muted)',
                  }}
                >
                  Navigation
                </span>
              </div>
              <NavItem to="/devices" icon={<MdPhoneAndroid size={18} />} label="Devices" />
              <NavItem to="/settings" icon={<MdSettings size={18} />} label="Settings" />
            </nav>

            {/* Sidebar Footer */}
            <div
              style={{
                padding: '16px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    boxShadow: '0 0 6px var(--success)',
                  }}
                />
                <span>Connected to server</span>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: isAuthenticated ? '24px 32px' : 0,
            background: 'var(--bg-primary)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({
  to,
  icon,
  label,
}) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '8px',
      textDecoration: 'none',
      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
      backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent',
      marginBottom: '4px',
      transition: 'all 0.2s',
      border: isActive ? '1px solid rgba(0, 212, 170, 0.2)' : '1px solid transparent',
      position: 'relative' as const,
      overflow: 'hidden',
    })}
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '3px',
              height: '20px',
              background: 'var(--accent)',
              borderRadius: '0 2px 2px 0',
            }}
          />
        )}
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontWeight: 500, fontSize: '13px' }}>{label}</span>
      </>
    )}
  </NavLink>
);
