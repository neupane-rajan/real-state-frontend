import { useEffect } from 'react'
import { companyInfo } from '../constants/companyInfo'
import { useLanguage } from './useLanguage'

type PageMeta = {
  title?: string
  description?: string
  image?: string
}

const setMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

// Sets the document title, meta description and Open Graph tags for the current page.
export function usePageMeta({ title, description, image }: PageMeta) {
  const { language } = useLanguage()
  const siteName = language === 'np' ? companyInfo.nameNp : companyInfo.nameEn
  const defaultDescription = language === 'np' ? companyInfo.shortIntroNp : companyInfo.aboutEn

  useEffect(() => {
    const fullTitle = title ? `${title} | ${siteName}` : siteName
    const metaDescription = (description || defaultDescription).replace(/\s+/g, ' ').trim().slice(0, 160)

    document.title = fullTitle
    setMetaTag('name', 'description', metaDescription)
    setMetaTag('property', 'og:title', fullTitle)
    setMetaTag('property', 'og:description', metaDescription)
    setMetaTag('property', 'og:site_name', siteName)
    setMetaTag('property', 'og:url', window.location.href)
    setMetaTag('property', 'og:image', image || `${window.location.origin}/logo.png`)
  }, [title, description, image, siteName, defaultDescription])
}
