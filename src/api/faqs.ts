import axiosInstance from './axiosInstance'

type ApiResponse = {
  success?: boolean
  message?: string
  error?: string
  data?: unknown
  faqs?: unknown
  faq?: unknown
}

export type Faq = {
  id?: string | number
  _id?: string
  question?: string
  answer?: string
  questionNp?: string | null
  answerNp?: string | null
  category?: string
  [key: string]: unknown
}

export type FaqFormPayload = {
  question: string
  answer: string
  questionNp?: string
  answerNp?: string
  category: string
}

const normalizeFaqs = (response: ApiResponse): Faq[] => {
  if (response.success === false) {
    throw new Error(
      response.error ?? response.message ?? 'Unable to load FAQs right now.',
    )
  }

  const payload = response.data ?? response.faqs ?? response.faq

  if (Array.isArray(payload)) {
    return payload as Faq[]
  }

  if (payload && typeof payload === 'object') {
    return [payload as Faq]
  }

  return []
}

export const getFaqs = async () => {

  const response = await axiosInstance.get<ApiResponse>('/faqs')

  return normalizeFaqs(response.data)
}

export const createFaq = async (payload: FaqFormPayload) => {

  const response = await axiosInstance.post<ApiResponse>('/faqs', payload)

  if (response.data.success === false) {
    throw new Error(response.data.error ?? response.data.message ?? 'FAQ create failed.')
  }

  return response.data
}

export const updateFaq = async (faqId: string | number, payload: FaqFormPayload) => {

  const response = await axiosInstance.put<ApiResponse>(`/faqs/${faqId}`, payload)

  if (response.data.success === false) {
    throw new Error(response.data.error ?? response.data.message ?? 'FAQ update failed.')
  }

  return response.data
}

export const deleteFaq = async (faqId: string | number) => {

  const response = await axiosInstance.delete<ApiResponse>(`/faqs/${faqId}`)

  if (response.data.success === false) {
    throw new Error(response.data.error ?? response.data.message ?? 'FAQ delete failed.')
  }

  return response.data
}
