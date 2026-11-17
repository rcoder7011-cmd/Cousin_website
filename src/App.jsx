import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import WhatsAppButton from './components/common/WhatsAppButton';
import HomePage from './pages/HomePage';
import AdminRouteGuard from './components/admin/AdminRouteGuard';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { refreshScrollTrigger } from './utils/gsapConfig';

// Code-split Public Pages (Preloaded or on-demand to optimize initial bundle)
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

// Code-split Admin Pages (Isolates heavy studio management suite from public visitors)
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminForgotPasswordPage = lazy(() => import('./pages/admin/AdminForgotPasswordPage'));
const AdminResetPasswordPage = lazy(() => import('./pages/admin/AdminResetPasswordPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProjectsPage = lazy(() => import('./pages/admin/AdminProjectsPage'));
const AdminProjectFormPage = lazy(() => import('./pages/admin/AdminProjectFormPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminCategoryFormPage = lazy(() => import('./pages/admin/AdminCategoryFormPage'));
const AdminMediaLibraryPage = lazy(() => import('./pages/admin/AdminMediaLibraryPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));

/**
 * Utility to reset scroll position on route change and refresh GSAP ScrollTrigger
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      refreshScrollTrigger();
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

/**
 * Sleek loading fallback for code-split route chunks
 */
function PageLoadingFallback({ isAdmin }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        flexDirection: 'column',
        gap: '14px',
        color: '#666'
      }}
      role="status"
      aria-label="Loading content"
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(197, 160, 89, 0.2)',
          borderTopColor: '#c5a059',
          borderRadius: '50%',
          animation: 'studioSpinner 0.8s linear infinite'
        }}
        aria-hidden="true"
      />
      <span style={{ fontSize: '0.82rem', letterSpacing: '0.06em', color: '#888', textTransform: 'uppercase' }}>
        {isAdmin ? 'Loading Studio Portal...' : 'Saifi Interior Hub'}
      </span>
      <style>{`@keyframes studioSpinner { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * Conditional layout wrapper: renders public header/footer only for public routes
 */
function AppLayout({ children }) {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      {!isAdminRoute && <Navbar />}
      <main id="main-content" tabIndex="-1" style={{ flex: 1, display: 'flex', flexDirection: 'column', outline: 'none' }}>
        <Suspense fallback={<PageLoadingFallback isAdmin={isAdminRoute} />}>
          {children}
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <WhatsAppButton />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppLayout>
            <Routes>
            {/* Public Portfolio Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Admin Authentication Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
            <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRouteGuard>
                  <AdminDashboardPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRouteGuard>
                  <AdminDashboardPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <AdminRouteGuard>
                  <AdminProjectsPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/projects/new"
              element={
                <AdminRouteGuard>
                  <AdminProjectFormPage mode="create" />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/projects/:id/edit"
              element={
                <AdminRouteGuard>
                  <AdminProjectFormPage mode="edit" />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminRouteGuard>
                  <AdminCategoriesPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/categories/new"
              element={
                <AdminRouteGuard>
                  <AdminCategoryFormPage mode="create" />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/categories/:id/edit"
              element={
                <AdminRouteGuard>
                  <AdminCategoryFormPage mode="edit" />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/media"
              element={
                <AdminRouteGuard>
                  <AdminMediaLibraryPage />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRouteGuard>
                  <AdminSettingsPage />
                </AdminRouteGuard>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </SettingsProvider>
  </AuthProvider>
);
}
