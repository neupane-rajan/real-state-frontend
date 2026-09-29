import { Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { AdminRoute } from './AdminRoute'
import { AdminLogin } from '../pages/admin/AdminLogin'
import { BannersManage } from '../pages/admin/BannersManage'
import { Dashboard } from '../pages/admin/Dashboard'
import { FaqsManage } from '../pages/admin/FaqsManage'
import { Inquiries } from '../pages/admin/Inquiries'
import { PropertiesManage } from '../pages/admin/PropertiesManage'
import { PlotsManage } from '../pages/admin/PlotsManage'
import { TestimonialsManage } from '../pages/admin/TestimonialsManage'
import { Contact } from '../pages/public/Contact'
import { Home } from '../pages/public/Home'
import { PropertyDetail } from '../pages/public/PropertyDetail'
import { PropertyList } from '../pages/public/PropertyList'
import { NotFound } from '../pages/public/NotFound'
import { About } from '../pages/public/About'
import { Blogs } from '../pages/public/Blogs'
import { BlogDetail } from '../pages/public/BlogDetail'
import { BlogsManage } from '../pages/admin/BlogsManage'

// Visitors browse without an account; only /admin is protected.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="properties" element={<PropertyList />} />
        <Route path="properties/:propertyId" element={<PropertyDetail />} />
        <Route path="contact" element={<Contact />} />
        <Route path="about" element={<About />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="blogs/:slug" element={<BlogDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin/login" element={<AdminLogin />} />
      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="properties" element={<PropertiesManage />} />
          <Route path="properties/:propertyId/plots" element={<PlotsManage />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="banners" element={<BannersManage />} />
          <Route path="blogs" element={<BlogsManage />} />
          <Route path="faqs" element={<FaqsManage />} />
          <Route path="testimonials" element={<TestimonialsManage />} />
        </Route>
      </Route>
    </Routes>
  )
}
