import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NegotiationProvider } from './context/NegotiationContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { UserDashboard } from './features/dashboard/UserDashboard';
import { NegotiationRoomPage } from './features/negotiations/NegotiationRoomPage';
import { AgreementPage } from './features/agreement/AgreementPage';
import { AdminDashboard } from './features/admin/AdminDashboard';

// Role Gate Component to protect routes
const RoleGate: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'negotiator' | 'admin' | 'observer')[];
}> = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Verifying Credentials...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If an owner/negotiator hits an admin route, redirect to user dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Marketing Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Authenticated Workspace with Dashboard Sidebar Layout */}
        <Route
          element={
            <RoleGate>
              <DashboardLayout />
            </RoleGate>
          }
        >
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/rooms/:roomId" element={<NegotiationRoomPage />} />
          <Route path="/agreement/:roomId" element={<AgreementPage />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <RoleGate allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleGate>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleGate allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleGate>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RoleGate allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleGate>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NegotiationProvider>
          <AppContent />
        </NegotiationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
