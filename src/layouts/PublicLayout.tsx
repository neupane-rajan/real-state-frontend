import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { Navbar } from '../components/layout/Navbar'
import { AutoTranslate } from '../components/layout/AutoTranslate'
import { WhatsAppIcon } from '../components/common/Icons'
import { useLanguage } from '../hooks/useLanguage'
import { getWhatsAppUrl } from '../utils/contact'

export function PublicLayout() {
  const { pathname } = useLocation()
  const { language } = useLanguage()
  const isNp = language === 'np'

  // Start each new page at the top (SPA navigation keeps the old scroll position otherwise).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="public-layout">
      <a href="#main-content" className="skip-link">
        {isNp ? 'मुख्य सामग्रीमा जानुहोस्' : 'Skip to main content'}
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <AutoTranslate />
      <a
        href={getWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className={`whatsapp-float ${/^\/properties\/[^/]+$/.test(pathname) ? 'whatsapp-float--hide-mobile' : ''}`}
        aria-label={isNp ? 'व्हाट्सएपमा कुरा गर्नुहोस्' : 'Chat on WhatsApp'}
      >
        <WhatsAppIcon size={28} />
      </a>
    </div>
  )
}
