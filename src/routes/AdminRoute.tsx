import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader } from '../components/common/Loader'
import { useAuth } from '../hooks/useAuth'

export function AdminRoute() {
  const { isAdmin, isCheckingSession } = useAuth()
  const location = useLocation()

  if (isCheckingSession) {
    return <Loader label="Checking your session..." />
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
