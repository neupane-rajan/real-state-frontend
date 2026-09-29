import { companyInfo } from '../constants/companyInfo'

const NEPAL_COUNTRY_CODE = '977'

// Converts a local Nepali number (e.g. 9858476888) to international digits (9779858476888).
const toInternationalDigits = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith(NEPAL_COUNTRY_CODE) ? digits : `${NEPAL_COUNTRY_CODE}${digits}`
}

export const getPhoneHref = (phone: string = companyInfo.phones[0]) =>
  `tel:+${toInternationalDigits(phone)}`

export const getWhatsAppUrl = (message?: string) => {
  const base = `https://wa.me/${toInternationalDigits(companyInfo.whatsapp)}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export const getPropertyWhatsAppMessage = (
  propertyTitle: string,
  propertyUrl: string,
  isNp: boolean,
  plotNumber?: string,
) => {
  if (plotNumber) {
    return isNp
      ? `नमस्ते, मलाई "${propertyTitle}" परियोजनाको प्लट नं. ${plotNumber} मा रुचि छ। कृपया थप जानकारी दिनुहोला।\n${propertyUrl}`
      : `Hello, I am interested in plot ${plotNumber} in "${propertyTitle}". Could you provide more information?\n${propertyUrl}`
  }

  return isNp
    ? `नमस्ते, मलाई "${propertyTitle}" सम्पत्तिमा रुचि छ। कृपया थप जानकारी दिनुहोला।\n${propertyUrl}`
    : `Hello, I am interested in the property "${propertyTitle}". Could you provide more information?\n${propertyUrl}`
}
