// Детальные логи только для админов (импорт первым)
import './utils/console-override';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { initI18n } from './i18n/config';
import { runEnvValidation } from './utils/envValidation';
import { AuthProviderWithRedirect } from './contexts/AuthProviderWithRedirect';
import ThemeSync from './components/ThemeSync';
import ErrorBoundary from './components/ErrorBoundary';
import ApiUrlBanner from './components/ApiUrlBanner';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProxiesPage from './pages/ProxiesPage';
import RootRoute from './pages/RootRoute';
import NotFoundPage from './pages/NotFoundPage';
import App from './App.tsx';
import './index.css';

initI18n();
runEnvValidation();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ApiUrlBanner />
      <Provider store={store}>
        <ThemeSync />
        <BrowserRouter>
          <AuthProviderWithRedirect>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/proxies" element={<ProxiesPage />} />
            <Route path="/" element={<RootRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </AuthProviderWithRedirect>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
