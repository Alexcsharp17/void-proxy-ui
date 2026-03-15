import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

export function AuthProviderWithRedirect({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <AuthProvider onUnauthorizedRedirect={() => navigate('/login', { replace: true })}>
      {children}
    </AuthProvider>
  );
}
