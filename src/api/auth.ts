import axiosInstance from './axiosInstance'

// Only administrators log in. Visitors browse and contact the business without an account.

export type AdminUser = {
  username: string
}

export type AdminLoginPayload = {
  username: string
  password: string
}

type AdminLoginResponse = {
  success: boolean
  token: string
  admin: AdminUser
}

type AdminSessionResponse = {
  success: boolean
  admin: AdminUser
}

export const adminLoginRequest = async (payload: AdminLoginPayload) => {
  const response = await axiosInstance.post<AdminLoginResponse>('/auth/admin/login', payload)

  if (!response.data.token || !response.data.admin) {
    throw new Error('Login response was incomplete. Please try again.')
  }

  return response.data
}

export const getAdminSessionRequest = async () => {
  const response = await axiosInstance.get<AdminSessionResponse>('/auth/admin/me')

  return response.data.admin
}
