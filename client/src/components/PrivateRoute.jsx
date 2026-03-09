import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

const PrivateRoute = () => {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) return <div>Loading...</div>;

  return userId ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
