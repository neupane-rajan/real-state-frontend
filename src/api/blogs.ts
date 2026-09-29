import axiosInstance from './axiosInstance'


type ApiResponse = {
  success?: boolean
  message?: string
  error?: string
  data?: unknown
  blogs?: unknown
  blog?: unknown
}

export type BlogPost = {
  id?: string | number
  _id?: string
  title?: string
  slug?: string
  content?: string
  coverImage?: string | null
  author?: string
  createdAt?: string
  updatedAt?: string
}

export type BlogFormPayload = {
  title: string
  content: string
  author?: string
  coverImage?: FileList
}

const getErrorMessage = (response: ApiResponse) =>
  response.error ?? response.message ?? 'Unable to process blog action right now.'

const normalizeBlogs = (response: ApiResponse): BlogPost[] => {
  if (response.success === false) {
    throw new Error(getErrorMessage(response))
  }

  const payload = response.data ?? response.blogs

  if (Array.isArray(payload)) {
    return payload as BlogPost[]
  }

  return []
}

const normalizeBlog = (response: ApiResponse): BlogPost => {
  if (response.success === false) {
    throw new Error(getErrorMessage(response))
  }

  const payload = response.data ?? response.blog

  if (payload && typeof payload === 'object') {
    return payload as BlogPost
  }

  throw new Error('Blog post not found.')
}

export const getBlogs = async (): Promise<BlogPost[]> => {

  const response = await axiosInstance.get<ApiResponse>('/blogs')
  return normalizeBlogs(response.data)
}

export const getBlogBySlug = async (slug: string): Promise<BlogPost> => {

  const response = await axiosInstance.get<ApiResponse>(`/blogs/${slug}`)
  return normalizeBlog(response.data)
}

const buildBlogFormData = (payload: BlogFormPayload) => {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('content', payload.content)
  formData.append('author', payload.author ?? '')
  if (payload.coverImage && payload.coverImage.length > 0) {
    formData.append('coverImage', payload.coverImage[0])
  }
  return formData
}

export const createBlog = async (payload: BlogFormPayload): Promise<BlogPost> => {
  const response = await axiosInstance.post<ApiResponse>('/blogs', buildBlogFormData(payload))
  return normalizeBlog(response.data)
}

export const updateBlog = async (id: string | number, payload: BlogFormPayload): Promise<BlogPost> => {
  const response = await axiosInstance.put<ApiResponse>(`/blogs/${id}`, buildBlogFormData(payload))
  return normalizeBlog(response.data)
}

export const deleteBlog = async (id: string | number): Promise<void> => {

  const response = await axiosInstance.delete<ApiResponse>(`/blogs/${id}`)
  if (response.data.success === false) {
    throw new Error(getErrorMessage(response.data))
  }
}
