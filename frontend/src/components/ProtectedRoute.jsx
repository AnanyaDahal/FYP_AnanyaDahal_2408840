import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // Not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // No role specified = any authenticated user
  if (!role) {
    return children;
  }

  // Role doesn't match user's role
  if (user.role !== role) {
    // Redirect based on user's actual role
    if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" />;
    }
    return <Navigate to="/dashboard" />;
  }

  // Role matches
  return children;
};

export default ProtectedRoute;
