import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductionPage } from './pages/ProductionPage';
import { ProductsPage } from './pages/ProductsPage';
import { SetsAndSizesPage } from './pages/SetsAndSizesPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { InventoryPage } from './pages/InventoryPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { DispatchPage } from './pages/DispatchPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { AiManagerPage } from './pages/AiManagerPage';
import { NotificationsPage } from './pages/NotificationsPage';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { SyncManager } from './services/sync/syncManager';

export const App: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    SyncManager.init();

    const handleUnauthorized = () => {
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Factory Operations Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* 1. Dashboard */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute module="DASHBOARD">
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 2. Order Management */}
        <Route
          path="orders"
          element={
            <ProtectedRoute module="ORDERS">
              <OrdersPage />
            </ProtectedRoute>
          }
        />

        {/* 3. Production Management */}
        <Route
          path="production"
          element={
            <ProtectedRoute module="PRODUCTION">
              <ProductionPage />
            </ProtectedRoute>
          }
        />

        {/* 4. Inventory Ledger */}
        <Route
          path="inventory"
          element={
            <ProtectedRoute module="INVENTORY">
              <InventoryPage />
            </ProtectedRoute>
          }
        />

        {/* 5. Purchases & Inward */}
        <Route
          path="purchases"
          element={
            <ProtectedRoute module="PURCHASES">
              <PurchasesPage />
            </ProtectedRoute>
          }
        />

        {/* 6. Dispatch & Logistics */}
        <Route
          path="dispatch"
          element={
            <ProtectedRoute module="DISPATCH">
              <DispatchPage />
            </ProtectedRoute>
          }
        />

        {/* 7. Product Catalog */}
        <Route
          path="products"
          element={
            <ProtectedRoute module="PRODUCTS">
              <ProductsPage />
            </ProtectedRoute>
          }
        />

        {/* 8. Sets & Sizes */}
        <Route
          path="sets-sizes"
          element={
            <ProtectedRoute module="SETS_SIZES">
              <SetsAndSizesPage />
            </ProtectedRoute>
          }
        />

        {/* 9. Customers Master */}
        <Route
          path="customers"
          element={
            <ProtectedRoute module="CUSTOMERS">
              <CustomersPage />
            </ProtectedRoute>
          }
        />

        {/* 10. Suppliers Master */}
        <Route
          path="suppliers"
          element={
            <ProtectedRoute module="SUPPLIERS">
              <SuppliersPage />
            </ProtectedRoute>
          }
        />

        {/* 11. Payments & Collections */}
        <Route
          path="payments"
          element={
            <ProtectedRoute module="PAYMENTS">
              <PaymentsPage />
            </ProtectedRoute>
          }
        />

        {/* 12. Expenses & Overheads */}
        <Route
          path="expenses"
          element={
            <ProtectedRoute module="EXPENSES">
              <ExpensesPage />
            </ProtectedRoute>
          }
        />

        {/* 13. Reports & Analytics */}
        <Route
          path="reports"
          element={
            <ProtectedRoute module="REPORTS">
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* 14. AI Factory Manager */}
        <Route
          path="ai-manager"
          element={
            <ProtectedRoute module="AI_MANAGER">
              <AiManagerPage />
            </ProtectedRoute>
          }
        />

        {/* 15. Notification Alert Center */}
        <Route
          path="notifications"
          element={
            <ProtectedRoute module="DASHBOARD">
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* 16. Factory Settings */}
        <Route
          path="settings"
          element={
            <ProtectedRoute module="SETTINGS">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
