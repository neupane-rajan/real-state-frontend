import { useEffect } from 'react'
import { useLanguage } from '../../hooks/useLanguage'

// Free automatic translation of admin-entered English content into Nepali, using the
// Google Website Translator (the same widget many government sites use). It only runs on
// public pages in Nepali mode, and only touches elements marked translate="yes" (AutoText).

const COOKIE = 'googtrans'
const TARGET = '/en/ne'
const SCRIPT_ID = 'google-translate-script'

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: { translate?: { TranslateElement: new (options: object, elementId: string) => unknown } }
  }
}

const readCookie = () => document.cookie.split('; ').find((row) => row.startsWith(`${COOKIE}=`))?.split('=')[1]

// The widget may store its cookie for the host or the parent domain, so set/clear both.
const writeCookie = (value: string | null) => {
  const expires = value ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  const domains = ['', `; domain=${window.location.hostname}`, `; domain=.${window.location.hostname.split('.').slice(-2).join('.')}`]
  for (const domain of domains) document.cookie = `${COOKIE}=${value ?? ''}; path=/${domain}${expires}`
}

const loadWidget = () => {
  if (document.getElementById(SCRIPT_ID)) return
  window.googleTranslateElementInit = () => {
    if (window.google?.translate) {
      new window.google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'ne', autoDisplay: false }, 'google_translate_element')
    }
  }
  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  script.async = true
  document.body.appendChild(script)
}

export function AutoTranslate() {
  const { language } = useLanguage()

  useEffect(() => {
    if (language === 'np') {
      if (readCookie() !== TARGET) writeCookie(TARGET)
      loadWidget()
    } else if (readCookie()) {
      writeCookie(null)
      // The translated text can only be undone by reloading; only needed if the widget ran.
      if (document.getElementById(SCRIPT_ID)) window.location.reload()
    }
  }, [language])

  return <div id="google_translate_element" hidden />
}
