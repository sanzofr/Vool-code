import { Navigate } from "react-router-dom";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If no role is assigned, redirect to role selection
  if (!role) {
    return <Navigate to="/select-role" replace />;
  }

  // If allowedRoles is specified, check if user has one of them
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect based on user's actual role
    if (role === "client") {
      return <Navigate to="/client-dashboard" replace />;
    }
    if (role === "coach") {
      return <Navigate to="/" replace />;
    }
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
