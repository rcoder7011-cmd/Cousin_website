import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import WhatsAppButton from './components/common/WhatsAppButton';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import AdminRouteGuard from './components/admin/AdminRouteGuard';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { refreshScrollTrigger } from './utils/gsapConfig';
import { ADMIN_ROUTES } from './config/adminRoutes';

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
  const isAdminRoute = pathname.startsWith('/nimda-portal') || pathname.startsWith('/studio-portal');

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

              {/* Hardened Admin Portal Authentication Routes (/nimda-portal/*) */}
              <Route path={ADMIN_ROUTES.LOGIN} element={<AdminLoginPage />} />
              <Route path={ADMIN_ROUTES.FORGOT_PASSWORD} element={<AdminForgotPasswordPage />} />
              <Route path={ADMIN_ROUTES.RESET_PASSWORD} element={<AdminResetPasswordPage />} />

              {/* Protected Admin Routes */}
              <Route
                path={ADMIN_ROUTES.BASE}
                element={
                  <AdminRouteGuard>
                    <AdminDashboardPage />
                  </AdminRouteGuard>
                }
              />
              <Route
                path={ADMIN_ROUTES.DASHBOARD}
                element={
                  <AdminRouteGuard>
                    <AdminDashboardPage />
                  </AdminRouteGuard>
                }
              />
              <Route
                path={ADMIN_ROUTES.PROJECTS}
                element={
                  <AdminRouteGuard>
                    <AdminProjectsPage />
                  </AdminRouteGuard>
                }
              />
              <Route
                path={ADMIN_ROUTES.PROJECTS_NEW}
                element={
                  <AdminRouteGuard>
                    <AdminProjectFormPage mode="create" />
                  </AdminRouteGuard>
                }
              />
              <Route
                path="/nimda-portal/projects/:id/edit"
                element={
                  <AdminRouteGuard>
                    <AdminProjectFormPage mode="edit" />
                  </AdminRouteGuard>
                }
              />
              <Route
                path={ADMIN_ROUTES.CATEGORIES}
                element={
                  <AdminRouteGuard>
                    <AdminCategoriesPage />
                  </AdminRouteGuard>
                }
              />
              <Route
                path={ADMIN_ROUTES.CATEGORIES_NEW}
                element={
                  <AdminRouteGuard>
                    <AdminCategoryFormPage mode="create" />
                  </AdminRouteGuard>
                }
              />
              <Route
                path="/nimda-portal/categories/:id/edit"
                element={
                  <AdminRouteGuard>
                    <AdminCategoryFormPage mode="edit" />
                  </AdminRouteGuard>
                }
              />
              <Route
                path={ADMIN_ROUTES.MEDIA}
                element={
                  <AdminRouteGuard>
                    <AdminMediaLibraryPage />
                  </AdminRouteGuard>
                }
              />
              <Route
                path={ADMIN_ROUTES.SETTINGS}
                element={
                  <AdminRouteGuard>
                    <AdminSettingsPage />
                  </AdminRouteGuard>
                }
              />

              {/* Studio Portal Protection: Visiting /studio-portal without login MUST NOT show dashboard */}
              <Route
                path="/studio-portal"
                element={
                  <AdminRouteGuard>
                    <Navigate to={ADMIN_ROUTES.DASHBOARD} replace />
                  </AdminRouteGuard>
                }
              />
              <Route
                path="/studio-portal/*"
                element={
                  <AdminRouteGuard>
                    <Navigate to={ADMIN_ROUTES.DASHBOARD} replace />
                  </AdminRouteGuard>
                }
              />

              {/* Old /admin Route Protection: Safely return 404 Response and never expose dashboard */}
              <Route path="/admin" element={<NotFoundPage />} />
              <Route path="/admin/*" element={<NotFoundPage />} />

              {/* Catch-all 404 fallback for undefined routes */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
