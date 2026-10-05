import { getPlotStats, isPlotProject, type Property } from '../api/properties'
import { AreaIcon, BathIcon, BedIcon, CheckIcon, RoadIcon } from '../components/common/Icons'
import { useLanguage } from './useLanguage'
import { localDigits, toNepaliDigits, translateMeasure } from '../utils/nepali'

export type PropertyFact = { key: string; icon: React.ReactNode; label: string; value: string }

// Returns only the facts the admin actually filled in, so nothing empty is rendered.
export function usePropertyFacts(property: Property): PropertyFact[] {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const facts: PropertyFact[] = []

  // Land development projects: plot availability comes first.
  if (isPlotProject(property) && property.plots && property.plots.length > 0) {
    const stats = getPlotStats(property.plots)
    facts.push({
      key: 'plots',
      icon: <CheckIcon />,
      label: isNp ? 'उपलब्ध प्लट' : 'Plots available',
      value: isNp ? toNepaliDigits(`${stats.total} मध्ये ${stats.AVAILABLE}`) : `${stats.AVAILABLE} of ${stats.total}`,
    })
  }

  if (property.bedrooms !== null && property.bedrooms !== undefined) {
    facts.push({ key: 'bedrooms', icon: <BedIcon />, label: isNp ? 'शयनकक्ष' : 'Bedrooms', value: localDigits(property.bedrooms, isNp) })
  }
  if (property.bathrooms !== null && property.bathrooms !== undefined) {
    facts.push({ key: 'bathrooms', icon: <BathIcon />, label: isNp ? 'बाथरुम' : 'Bathrooms', value: localDigits(property.bathrooms, isNp) })
  }
  if (property.area) {
    facts.push({ key: 'area', icon: <AreaIcon />, label: isNp ? 'क्षेत्रफल' : 'Area', value: translateMeasure(property.area, isNp) })
  }
  if (property.roadAccess) {
    facts.push({ key: 'road', icon: <RoadIcon />, label: isNp ? 'सडक पहुँच' : 'Road access', value: translateMeasure(property.roadAccess, isNp) })
  }

  return facts
}
