import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  adminLoginRequest,
  getAdminSessionRequest,
  type AdminLoginPayload,
  type AdminUser,
} from '../api/auth'
import { AUTH_EXPIRED_EVENT, AUTH_TOKEN_STORAGE_KEY } from '../api/axiosInstance'
import { AuthContext } from './authContextValue'

const readStoredToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(() => Boolean(readStoredToken()))

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    } catch {
      // Storage unavailable; nothing to clear.
    }
    setAdmin(null)
    queryClient.removeQueries({ queryKey: ['admin'] })
  }, [queryClient])

  // Verify a token left over from a previous visit before trusting it.
  useEffect(() => {
    if (!readStoredToken()) {
      return
    }

    let cancelled = false

    getAdminSessionRequest()
      .then((sessionAdmin) => {
        if (!cancelled) setAdmin(sessionAdmin)
      })
      .catch(() => {
        if (!cancelled) clearSession()
      })
      .finally(() => {
        if (!cancelled) setIsCheckingSession(false)
      })

    return () => {
      cancelled = true
    }
  }, [clearSession])

  // The axios interceptor fires this when the API rejects the token (e.g. it expired).
  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, clearSession)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, clearSession)
  }, [clearSession])

  const adminLogin = useCallback(async (payload: AdminLoginPayload) => {
    const response = await adminLoginRequest(payload)
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, response.token)
    setAdmin(response.admin)
    return response.admin
  }, [])

  const value = useMemo(
    () => ({
      admin,
      isAdmin: Boolean(admin),
      isCheckingSession,
      adminLogin,
      logout: clearSession,
    }),
    [admin, adminLogin, clearSession, isCheckingSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
