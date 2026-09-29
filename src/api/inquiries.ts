import axiosInstance from './axiosInstance'

export type InquiryPayload = {
  name: string
  phone: string
  email?: string
  message: string
  propertyId?: number
}

export type Inquiry = {
  id: number
  name: string
  phone: string
  email: string | null
  message: string
  createdAt: string
  property: { id: number; title: string } | null
}

type SubmitInquiryResponse = {
  success: boolean
  message: string
}

type InquiryListResponse = {
  success: boolean
  data: Inquiry[]
}

export const submitInquiryRequest = async (payload: InquiryPayload) => {
  const response = await axiosInstance.post<SubmitInquiryResponse>('/inquiries', payload)

  return response.data
}

export const getAdminInquiries = async () => {
  const response = await axiosInstance.get<InquiryListResponse>('/inquiries')

  return response.data.data ?? []
}

export const deleteInquiry = async (inquiryId: number) => {
  await axiosInstance.delete(`/inquiries/${inquiryId}`)
}
