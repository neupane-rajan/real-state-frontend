import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'
export const AUTH_TOKEN_STORAGE_KEY = 'realStateAuthToken'
export const AUTH_EXPIRED_EVENT = 'realstate:auth-expired'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// When the server rejects the admin token (expired or invalid), end the admin session.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    ) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }

    return Promise.reject(error)
  },
)

// Extracts the user-facing message the API sent ({ error } / { message }), or a fallback.
export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Could not reach the server. Please check your connection and try again.'
    }

    const data = error.response.data as { error?: unknown; message?: unknown } | undefined
    const message = data?.error ?? data?.message

    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallback
}

export default axiosInstance
