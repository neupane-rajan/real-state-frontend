import type { Language } from '../constants/translations'

// Nepali labels for the fixed lookup values seeded in the backend (prisma/seed.ts).
// Admin-entered content (titles, descriptions, addresses) is shown exactly as entered.

const categoryLabels: Record<string, string> = {
  House: 'घर',
  Land: 'जग्गा',
  'Plot Project': 'प्लटिङ परियोजना',
}

// Emoji shown next to each property type (home tiles, admin type choice).
export const categoryEmoji = (category: { name: string; isPlotProject?: boolean }) => {
  if (category.isPlotProject) return '📐'
  if (category.name === 'Land') return '🏞️'
  if (category.name === 'House') return '🏠'
  return '🏷️'
}

const statusLabels: Record<string, string> = {
  Available: 'उपलब्ध',
  'Under Construction': 'निर्माणाधीन',
  Sold: 'बिक्री भइसकेको',
}

const amenityLabels: Record<string, string> = {
  Parking: 'पार्किङ',
  'Water supply': 'खानेपानी',
  'Road access': 'सडक पहुँच',
  'Main road': 'मुख्य सडक',
  'Clear boundary': 'स्पष्ट सिमाना',
  'Market nearby': 'नजिकै बजार',
  'Peaceful area': 'शान्त वातावरण',
  Balcony: 'बार्दली',
  Garden: 'बगैंचा',
  Security: 'सुरक्षा',
  Garage: 'ग्यारेज',
  Generator: 'जेनेरेटर',
  Internet: 'इन्टरनेट',
  Elevator: 'लिफ्ट',
  Gym: 'जिम',
  'Swimming Pool': 'स्विमिङ पूल',
}

const translate = (labels: Record<string, string>) => (name: string | undefined, lang: Language) => {
  if (!name) return ''
  return lang === 'np' ? labels[name] ?? name : name
}

export const translateCategory = translate(categoryLabels)
export const translateStatus = translate(statusLabels)
export const translateAmenity = translate(amenityLabels)

const plotStatusLabels: Record<string, { np: string; en: string }> = {
  AVAILABLE: { np: 'उपलब्ध', en: 'Available' },
  RESERVED: { np: 'बुक भएको', en: 'Reserved' },
  SOLD: { np: 'बिक्री भइसकेको', en: 'Sold' },
}

export const translatePlotStatus = (status: string, lang: Language) =>
  plotStatusLabels[status]?.[lang] ?? status
