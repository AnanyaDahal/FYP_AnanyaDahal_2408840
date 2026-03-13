import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" />; // Send unauthorized users to their dashboard
  }

  return children;
};