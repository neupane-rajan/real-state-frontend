import axiosInstance from './axiosInstance'

// Admin only: is automatic English → Nepali translation set up on the server?
export const getTranslateStatus = async () => {
  const response = await axiosInstance.get<{ data: { enabled: boolean } }>('/translate/status')
  return response.data.data.enabled
}

// Admin only: translate several English texts to Nepali (empty texts come back empty).
export const translateToNepali = async (texts: string[]) => {
  const response = await axiosInstance.post<{ data: { translations: string[] } }>('/translate', { texts })
  return response.data.data.translations
}
