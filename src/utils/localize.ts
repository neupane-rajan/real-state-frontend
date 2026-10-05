import type { BlogPost } from '../api/blogs'
import type { Faq } from '../api/faqs'
import type { Plot, Property } from '../api/properties'
import type { Testimonial } from '../api/testimonials'
import { localized } from './nepali'

// Return a copy with the Nepali versions of admin-entered text swapped in (Nepali mode only;
// empty Nepali fields keep the English text). Components then render the copy as usual.

export const localizeProperty = <T extends Property>(property: T, isNp: boolean): T =>
  isNp
    ? {
        ...property,
        title: localized(property.title, property.titleNp, true),
        address: localized(property.address, property.addressNp, true),
        description: localized(property.description, property.descriptionNp, true),
      }
    : property

export const localizePlot = (plot: Plot, isNp: boolean): Plot =>
  isNp ? { ...plot, description: localized(plot.description, plot.descriptionNp, true) || null } : plot

export const localizeBlog = (blog: BlogPost, isNp: boolean): BlogPost =>
  isNp ? { ...blog, title: localized(blog.title, blog.titleNp, true), content: localized(blog.content, blog.contentNp, true) } : blog

export const localizeFaq = (faq: Faq, isNp: boolean): Faq =>
  isNp ? { ...faq, question: localized(faq.question, faq.questionNp, true), answer: localized(faq.answer, faq.answerNp, true) } : faq

export const localizeTestimonial = (testimonial: Testimonial, isNp: boolean): Testimonial =>
  isNp
    ? {
        ...testimonial,
        clientName: localized(testimonial.clientName, testimonial.clientNameNp, true),
        role: localized(testimonial.role, testimonial.roleNp, true),
        message: localized(testimonial.message, testimonial.messageNp, true),
      }
    : testimonial
