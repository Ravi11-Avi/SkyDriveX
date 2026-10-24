import React from "react";
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";

// Drive & Workspace Pages
import DashboardPage from "./pages/DashboardPage";
import CategoryPage from "./pages/CategoryPage";
import FavoritesPage from "./pages/FavoritesPage";
import TrashPage from "./pages/TrashPage";
import StoragePage from "./pages/StoragePage";
import SharesPage from "./pages/SharesPage";
import SettingsPage from "./pages/SettingsPage";

// Public & Auth Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OAuthSuccessPage from "./pages/OAuthSuccessPage";
import PublicSharePage from "./pages/PublicSharePage";
import NotFoundPage from "./pages/NotFoundPage";

/**
 * ProtectedRoute: Ensures user is authenticated before rendering drive views.
 * If user is not authenticated, redirects to /login with previous location preserved.
 */
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-boot-loading">
        <div className="ambient-glow purple-glow"></div>
        <div className="boot-spinner-wrap">
          <div className="loading-spinner large"></div>
          <p>Initialising SkyDriveX...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

/**
 * PublicAuthRoute: Redirects already authenticated users away from /login & /register back to Drive.
 */
function PublicAuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Guest Share Landing Page (Accessible by anyone with link) */}
      <Route path="/share/:token" element={<PublicSharePage />} />

      {/* OAuth Callback Redirect Landing */}
      <Route path="/oauth-success" element={<OAuthSuccessPage />} />

      {/* Public Authentication Pages */}
      <Route
        path="/login"
        element={
          <PublicAuthRoute>
            <LoginPage />
          </PublicAuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicAuthRoute>
            <RegisterPage />
          </PublicAuthRoute>
        }
      />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Authenticated Workspace & Drive Pages */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/folder/:folderId" element={<DashboardPage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/storage" element={<StoragePage />} />
        <Route path="/shares" element={<SharesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
