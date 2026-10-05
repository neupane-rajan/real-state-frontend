import axiosInstance from './axiosInstance'

type ApiResponse = {
  success?: boolean
  message?: string
  error?: string
  data?: unknown
  testimonials?: unknown
  testimonial?: unknown
}

export type Testimonial = {
  id?: string | number
  _id?: string
  clientName?: string
  role?: string
  company?: string
  message?: string
  clientNameNp?: string | null
  roleNp?: string | null
  messageNp?: string | null
  rating?: string | number
  avatar?: string
  avatarUrl?: string
  image?: string
  url?: string
  secure_url?: string
  [key: string]: unknown
}

export type TestimonialFormPayload = {
  clientName: string
  role: string
  company: string
  message: string
  clientNameNp?: string
  roleNp?: string
  messageNp?: string
  rating: string
  avatar?: FileList
}

export const getTestimonialAvatar = (testimonial: Testimonial) =>
  testimonial.avatarUrl ??
  testimonial.avatar ??
  testimonial.image ??
  testimonial.url ??
  testimonial.secure_url ??
  null

const normalizeTestimonials = (response: ApiResponse): Testimonial[] => {
  if (response.success === false) {
    throw new Error(
      response.error ?? response.message ?? 'Unable to load testimonials right now.',
    )
  }

  const payload = response.data ?? response.testimonials ?? response.testimonial

  if (Array.isArray(payload)) {
    return payload as Testimonial[]
  }

  if (payload && typeof payload === 'object') {
    return [payload as Testimonial]
  }

  return []
}

export const getTestimonials = async () => {

  const response = await axiosInstance.get<ApiResponse>('/testimonials')

  return normalizeTestimonials(response.data)
}

const buildTestimonialFormData = (payload: TestimonialFormPayload) => {
  const formData = new FormData()
  formData.append('clientName', payload.clientName)
  formData.append('role', payload.role)
  formData.append('company', payload.company)
  formData.append('message', payload.message)
  formData.append('rating', payload.rating)
  for (const field of ['clientNameNp', 'roleNp', 'messageNp'] as const) {
    if (payload[field] !== undefined) formData.append(field, payload[field] ?? '')
  }

  const avatar = payload.avatar?.[0]
  if (avatar) {
    formData.append('avatar', avatar)
  }

  return formData
}

export const createTestimonial = async (payload: TestimonialFormPayload) => {

  const response = await axiosInstance.post<ApiResponse>(
    '/testimonials',
    buildTestimonialFormData(payload),
  )

  if (response.data.success === false) {
    throw new Error(
      response.data.error ?? response.data.message ?? 'Testimonial create failed.',
    )
  }

  return response.data
}

export const updateTestimonial = async (
  testimonialId: string | number,
  payload: TestimonialFormPayload,
) => {
  const response = await axiosInstance.put<ApiResponse>(
    `/testimonials/${testimonialId}`,
    buildTestimonialFormData(payload),
  )

  if (response.data.success === false) {
    throw new Error(
      response.data.error ?? response.data.message ?? 'Testimonial update failed.',
    )
  }

  return response.data
}

export const deleteTestimonial = async (testimonialId: string | number) => {

  const response = await axiosInstance.delete<ApiResponse>(
    `/testimonials/${testimonialId}`,
  )

  if (response.data.success === false) {
    throw new Error(
      response.data.error ?? response.data.message ?? 'Testimonial delete failed.',
    )
  }

  return response.data
}
