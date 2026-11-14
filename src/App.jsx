import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import WhatsAppButton from './components/common/WhatsAppButton';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ServicesPage from './pages/ServicesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage';
import AdminResetPasswordPage from './pages/admin/AdminResetPasswordPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import AdminProjectFormPage from './pages/admin/AdminProjectFormPage';
import AdminPlaceholderModule from './pages/admin/AdminPlaceholderModule';
import AdminRouteGuard from './components/admin/AdminRouteGuard';
import { AuthProvider } from './context/AuthContext';
import { refreshScrollTrigger } from './utils/gsapConfig';

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
 * Conditional layout wrapper: renders public header/footer only for public routes
 */
function AppLayout({ children }) {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAdminRoute && <Navbar />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <WhatsAppButton />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
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
                  <AdminPlaceholderModule moduleKey="categories" />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/media"
              element={
                <AdminRouteGuard>
                  <AdminPlaceholderModule moduleKey="media" />
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRouteGuard>
                  <AdminPlaceholderModule moduleKey="settings" />
                </AdminRouteGuard>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
