import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DevicesPage } from './pages/DevicesPage';
import { ControlPage } from './pages/ControlPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuthStore } from './store/authStore';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/devices" replace /> : <LoginPage />
          }
        />
        <Route
          path="/devices"
          element={
            <PrivateRoute>
              <DevicesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/control/:deviceId"
          element={
            <PrivateRoute>
              <ControlPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? '/devices' : '/login'} replace />
          }
        />
      </Route>
    </Routes>
  );
};

export default App;
