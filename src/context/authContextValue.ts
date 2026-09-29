import { createContext } from 'react'
import type { AdminLoginPayload, AdminUser } from '../api/auth'

export type AuthContextValue = {
  admin: AdminUser | null
  isAdmin: boolean
  // True while a stored token is being verified with the server on page load.
  isCheckingSession: boolean
  adminLogin: (payload: AdminLoginPayload) => Promise<AdminUser>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
