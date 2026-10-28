import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export type ProtectedRouteProps = {
    role?: "USER" | "ADMIN";
}

function ProtectedRoute({ role }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return (<div className="loading">
            <span className="spinner"></span>
            <p className="loading__text">טוען...</p>
        </div>)
    }
    if(!user){
        return <Navigate to="/login" replace />
    }
    if(role && user.role !== role){
         return <Navigate to="/" replace />
    }
    return <Outlet />
}
export default ProtectedRoute