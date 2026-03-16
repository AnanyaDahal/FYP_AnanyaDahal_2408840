import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "../pages/Layout";
import Dashboard from "../pages/Dashboard";
import History from "../pages/History";
import Report from "../pages/Report";
import Login from "../pages/login";
import Signup from "../pages/signup";
import ForgotPassword from "../pages/forgotpassword";

import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/report/:id" element={<Report />} />
      </Route>

    </Routes>
  );
}

export default AppRoutes;