import axiosInstance from './axiosInstance'

// Shapes returned by the backend (see backend prisma/schema.prisma).

export type LookupItem = {
  id: number
  name: string
}

// Property types additionally say whether they are a land development / plot project.
export type PropertyCategory = LookupItem & {
  isPlotProject?: boolean
}

export type PlotStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD'

export const PLOT_STATUSES: PlotStatus[] = ['AVAILABLE', 'RESERVED', 'SOLD']

// Listing responses only include this summary; the detail response includes full Plot data.
export type PlotSummary = {
  id: number
  status: PlotStatus
  price: number | null
}

export type Plot = PlotSummary & {
  plotNumber: string
  area: number | null
  areaUnit: string | null
  facing: string | null
  description: string | null
  layoutX: number | null
  layoutY: number | null
  images: PropertyImage[]
}

// Plot project layout, top to bottom. Plot rows always span the full width,
// so each side of a road can hold a different number of plots.
export type PlotLayoutRow =
  | { type: 'plots'; plotIds: number[] }
  | { type: 'road'; label?: string }

export type PropertyImage = {
  id: number
  image_url: string
}

export type PropertyVideo = {
  id: number
  video_url: string
}

export type PropertyDocument = {
  id: number
  doc_url: string
  doc_name: string
}

export type Property = {
  id: number
  title: string
  description: string
  price: number | null
  address: string
  locationLink: string | null
  bedrooms: number | null
  bathrooms: number | null
  area: string | null
  roadAccess: string | null
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  sitePlanUrl: string | null
  plotLayout?: PlotLayoutRow[] | null
  plots?: Array<PlotSummary | Plot>
  category: PropertyCategory
  status: LookupItem
  images: PropertyImage[]
  videos: PropertyVideo[]
  documents: PropertyDocument[]
  property_amenities: Array<{ amenity: LookupItem }>
}

export type PropertyMeta = {
  categories: PropertyCategory[]
  statuses: LookupItem[]
  amenities: LookupItem[]
}

// Values from the admin form. Empty strings mean "not provided" and clear the field on update.
export type PropertyFormPayload = {
  title: string
  description: string
  address: string
  categoryId: string
  statusId: string
  price: string
  bedrooms: string
  bathrooms: string
  area: string
  roadAccess: string
  locationLink: string
  isPublished: boolean
  isFeatured: boolean
  amenityIds: string[]
  propertyImages?: FileList
  propertyVideos?: FileList
  propertyDocs?: FileList
  sitePlan?: FileList
}

// Values from the admin plot form. Empty strings clear optional fields on update.
export type PlotFormPayload = {
  plotNumber: string
  area: string
  areaUnit: string
  status: PlotStatus
  price: string
  facing: string
  description: string
  layoutX: string
  layoutY: string
  plotImages?: FileList
}

export type PropertyMediaType = 'images' | 'videos' | 'documents'

type DataResponse<T> = {
  success: boolean
  data: T
}

// ---------- Display helpers ----------

export const getPropertyImageUrls = (property: Property) =>
  (property.images ?? []).map((image) => image.image_url).filter(Boolean)

export const getPropertyAmenities = (property: Property) =>
  (property.property_amenities ?? []).map(({ amenity }) => amenity)

export const isPlotProject = (property: Pick<Property, 'category'>) =>
  Boolean(property.category?.isPlotProject)

// Counts plots by status; used for availability summaries on cards and the detail page.
export const getPlotStats = (plots: Array<Pick<PlotSummary, 'status'>> = []) => ({
  total: plots.length,
  AVAILABLE: plots.filter((plot) => plot.status === 'AVAILABLE').length,
  RESERVED: plots.filter((plot) => plot.status === 'RESERVED').length,
  SOLD: plots.filter((plot) => plot.status === 'SOLD').length,
})

// Lowest price among plots that are still available, or null if none have a price.
export const getLowestAvailablePlotPrice = (plots: PlotSummary[] = []) => {
  const prices = plots
    .filter((plot) => plot.status === 'AVAILABLE' && typeof plot.price === 'number' && plot.price > 0)
    .map((plot) => plot.price as number)
  return prices.length > 0 ? Math.min(...prices) : null
}

// Natural order: A-2 before A-10.
export const sortPlots = <T extends { plotNumber: string }>(plots: T[]) =>
  [...plots].sort((a, b) => a.plotNumber.localeCompare(b.plotNumber, undefined, { numeric: true, sensitivity: 'base' }))

export const hasPrice = (property: Pick<Property, 'price'>) =>
  typeof property.price === 'number' && Number.isFinite(property.price) && property.price > 0

// Full price, e.g. "Rs. 1,45,00,000". Returns null when no price is set.
export const formatNprPrice = (price: number | null) => {
  if (price === null || !Number.isFinite(price) || price <= 0) {
    return null
  }

  return `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price)}`
}

// Compact price, e.g. "Rs. 1.45 Cr" / "रु. १.४५ करोड". Returns null when no price is set.
export const formatShortPrice = (price: number | null, isNp = false) => {
  if (price === null || !Number.isFinite(price) || price <= 0) {
    return null
  }

  const trim = (value: number) =>
    value % 1 === 0 ? value.toFixed(0) : value.toFixed(2).replace(/\.?0+$/, '')

  if (price >= 10000000) {
    const value = trim(price / 10000000)
    return isNp ? `रु. ${value} करोड` : `Rs. ${value} Cr`
  }

  if (price >= 100000) {
    const value = trim(price / 100000)
    return isNp ? `रु. ${value} लाख` : `Rs. ${value} Lakh`
  }

  return formatNprPrice(price)
}

// ---------- Public API ----------

export const getProperties = async (params?: { featured?: boolean; limit?: number }) => {
  const response = await axiosInstance.get<DataResponse<Property[]>>('/properties', {
    params: {
      ...(params?.featured ? { featured: 'true' } : {}),
      ...(params?.limit ? { limit: params.limit } : {}),
    },
  })

  return response.data.data ?? []
}

export const getPropertyById = async (propertyId: string) => {
  const response = await axiosInstance.get<DataResponse<Property>>(`/properties/${propertyId}`)

  return response.data.data
}

export const getPropertyMeta = async () => {
  const response = await axiosInstance.get<DataResponse<PropertyMeta>>('/properties/meta')

  return response.data.data
}

// ---------- Admin API ----------

export const getAdminProperties = async () => {
  const response = await axiosInstance.get<DataResponse<Property[]>>('/properties/admin/all')

  return response.data.data ?? []
}

const buildPropertyFormData = (payload: Partial<PropertyFormPayload>) => {
  const formData = new FormData()
  const textFields = [
    'title', 'description', 'address', 'categoryId', 'statusId', 'price',
    'bedrooms', 'bathrooms', 'area', 'roadAccess', 'locationLink',
  ] as const

  textFields.forEach((field) => {
    const value = payload[field]
    if (value !== undefined) {
      formData.append(field, value.trim())
    }
  })

  if (payload.isPublished !== undefined) formData.append('isPublished', String(payload.isPublished))
  if (payload.isFeatured !== undefined) formData.append('isFeatured', String(payload.isFeatured))
  if (payload.amenityIds !== undefined) formData.append('amenityIds', JSON.stringify(payload.amenityIds))

  Array.from(payload.propertyImages ?? []).forEach((file) => formData.append('propertyImages', file))
  Array.from(payload.propertyVideos ?? []).forEach((file) => formData.append('propertyVideos', file))
  Array.from(payload.propertyDocs ?? []).forEach((file) => formData.append('propertyDocs', file))
  if (payload.sitePlan?.[0]) formData.append('sitePlan', payload.sitePlan[0])

  return formData
}

export const createProperty = async (payload: PropertyFormPayload) => {
  const response = await axiosInstance.post<DataResponse<Property>>(
    '/properties',
    buildPropertyFormData(payload),
  )

  return response.data.data
}

export const updateProperty = async (
  propertyId: number,
  payload: Partial<PropertyFormPayload>,
) => {
  const response = await axiosInstance.put<DataResponse<Property>>(
    `/properties/${propertyId}`,
    buildPropertyFormData(payload),
  )

  return response.data.data
}

export const deleteProperty = async (propertyId: number) => {
  await axiosInstance.delete(`/properties/${propertyId}`)
}

export const deletePropertyMedia = async (
  propertyId: number,
  mediaType: PropertyMediaType,
  mediaId: number,
) => {
  await axiosInstance.delete(`/properties/${propertyId}/${mediaType}/${mediaId}`)
}

// ---------- Admin: land development / plot projects ----------

export const getAdminPropertyById = async (propertyId: number) => {
  const response = await axiosInstance.get<DataResponse<Property>>(`/properties/admin/${propertyId}`)

  return response.data.data
}

export const deleteSitePlan = async (propertyId: number) => {
  await axiosInstance.delete(`/properties/${propertyId}/site-plan`)
}

const buildPlotFormData = (payload: Partial<PlotFormPayload>) => {
  const formData = new FormData()
  const fields = ['plotNumber', 'area', 'areaUnit', 'status', 'price', 'facing', 'description', 'layoutX', 'layoutY'] as const

  fields.forEach((field) => {
    const value = payload[field]
    if (value !== undefined) formData.append(field, String(value).trim())
  })
  Array.from(payload.plotImages ?? []).forEach((file) => formData.append('plotImages', file))

  return formData
}

export const createPlot = async (propertyId: number, payload: PlotFormPayload) => {
  const response = await axiosInstance.post<DataResponse<Plot>>(`/properties/${propertyId}/plots`, buildPlotFormData(payload))

  return response.data.data
}

export const updatePlot = async (propertyId: number, plotId: number, payload: Partial<PlotFormPayload>) => {
  const response = await axiosInstance.put<DataResponse<Plot>>(
    `/properties/${propertyId}/plots/${plotId}`,
    buildPlotFormData(payload),
  )

  return response.data.data
}

export const savePlotLayout = async (propertyId: number, rows: PlotLayoutRow[]) => {
  await axiosInstance.put(`/properties/${propertyId}/plot-layout`, { rows })
}

export const deletePlot = async (propertyId: number, plotId: number) => {
  await axiosInstance.delete(`/properties/${propertyId}/plots/${plotId}`)
}

export const deletePlotImage = async (propertyId: number, plotId: number, imageId: number) => {
  await axiosInstance.delete(`/properties/${propertyId}/plots/${plotId}/images/${imageId}`)
}
