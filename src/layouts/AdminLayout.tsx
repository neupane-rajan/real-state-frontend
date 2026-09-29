import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { companyInfo } from '../constants/companyInfo'
import { useAuth } from '../hooks/useAuth'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/properties', label: 'Properties' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/banners', label: 'Home banner' },
  { to: '/admin/blogs', label: 'Blogs' },
  { to: '/admin/faqs', label: 'FAQs' },
  { to: '/admin/testimonials', label: 'Testimonials' },
]

export function AdminLayout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Keep the browser tab title meaningful for each admin section.
  useEffect(() => {
    const current = adminLinks.find((link) => (link.end ? pathname === link.to : pathname.startsWith(link.to)))
    document.title = `${current?.label ?? 'Admin'} | Admin — ${companyInfo.nameEn}`
  }, [pathname])

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__top">
          <Link to="/admin" className="admin-brand">
            <img src="/logo-small.webp" alt="" width={40} height={40} />
            <span>
              <strong>Admin panel</strong>
              <small>{companyInfo.nameEn}</small>
            </span>
          </Link>
          <button
            type="button"
            className="admin-menu-toggle"
            aria-expanded={isMenuOpen}
            aria-controls="admin-nav"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
        <nav id="admin-nav" aria-label="Admin" className={isMenuOpen ? 'is-open' : ''}>
          {adminLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setIsMenuOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          <div className="admin-sidebar__footer">
            <a href="/" target="_blank" rel="noopener noreferrer">View website ↗</a>
            <p className="admin-sidebar__user">Signed in as <strong>{admin?.username}</strong></p>
            <button type="button" className="btn btn-outline-light btn-sm w-100" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </nav>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
