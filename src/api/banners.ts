import axiosInstance from './axiosInstance'

type ApiResponse = {
  success?: boolean
  message?: string
  error?: string
  data?: unknown
  banners?: unknown
  banner?: unknown
}

export type Banner = {
  id?: string | number
  _id?: string
  title?: string
  image?: string
  imageUrl?: string
  bannerImage?: string
  url?: string
  secure_url?: string
  [key: string]: unknown
}

export type BannerFormPayload = {
  title?: string
  bannerImage?: FileList
}

const getFailureMessage = (response: ApiResponse) =>
  response.error ?? response.message ?? 'Unable to load banners right now.'

const getBannerImage = (banner: Banner) =>
  banner.imageUrl ??
  banner.bannerImage ??
  banner.image ??
  banner.url ??
  banner.secure_url ??
  null

const normalizeBanners = (response: ApiResponse): Banner[] => {
  if (response.success === false) {
    throw new Error(getFailureMessage(response))
  }

  const payload = response.data ?? response.banners ?? response.banner

  if (Array.isArray(payload)) {
    return payload as Banner[]
  }

  if (payload && typeof payload === 'object') {
    return [payload as Banner]
  }

  return []
}

export { getBannerImage }

export const getBanners = async () => {

  const response = await axiosInstance.get<ApiResponse>('/banners')

  return normalizeBanners(response.data)
}

const buildBannerFormData = (payload: BannerFormPayload) => {
  const formData = new FormData()

  if (payload.title) {
    formData.append('title', payload.title)
  }

  const image = payload.bannerImage?.[0]
  if (image) {
    formData.append('bannerImage', image)
  }

  return formData
}

export const createBanner = async (payload: BannerFormPayload) => {

  const response = await axiosInstance.post<ApiResponse>(
    '/banners/upload',
    buildBannerFormData(payload),
  )

  if (response.data.success === false) {
    throw new Error(getFailureMessage(response.data))
  }

  return response.data
}

export const updateBanner = async (
  bannerId: string | number,
  payload: BannerFormPayload,
) => {

  const response = await axiosInstance.put<ApiResponse>(
    `/banners/${bannerId}`,
    buildBannerFormData(payload),
  )

  if (response.data.success === false) {
    throw new Error(getFailureMessage(response.data))
  }

  return response.data
}

export const deleteBanner = async (bannerId: string | number) => {

  const response = await axiosInstance.delete<ApiResponse>(`/banners/${bannerId}`)

  if (response.data.success === false) {
    throw new Error(getFailureMessage(response.data))
  }

  return response.data
}
