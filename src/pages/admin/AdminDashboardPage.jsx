import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminDashboardOverview from './AdminDashboardOverview';

/**
 * AdminDashboardPage
 * Main entrance for authenticated administrators under /admin and /admin/dashboard.
 * Wraps the dashboard layout with real Supabase metrics and recent projects overview.
 */
export default function AdminDashboardPage() {
  return (
    <AdminLayout pageTitle="Dashboard Overview">
      <AdminDashboardOverview />
    </AdminLayout>
  );
}