import { Modal } from 'react-bootstrap'
import { formatNprPrice, type Plot, type Property } from '../../api/properties'
import { useLanguage } from '../../hooks/useLanguage'
import { getPhoneHref, getPropertyWhatsAppMessage, getWhatsAppUrl } from '../../utils/contact'
import { translatePlotStatus } from '../../utils/translateHelpers'
import { InquiryForm } from '../common/InquiryForm'
import { PhoneIcon, WhatsAppIcon } from '../common/Icons'
import { PropertyGallery } from '../property/PropertyGallery'

type PlotDetailModalProps = {
  project: Property
  plot: Plot | null
  onClose: () => void
  onShowAvailable: () => void
}

export function PlotDetailModal({ project, plot, onClose, onShowAvailable }: PlotDetailModalProps) {
  const { language } = useLanguage()
  const isNp = language === 'np'

  if (!plot) return null

  const price = formatNprPrice(plot.price)
  const isSold = plot.status === 'SOLD'
  const area = plot.area ? `${plot.area}${plot.areaUnit ? ` ${plot.areaUnit}` : ''}` : null
  const pageUrl = window.location.href
  const whatsappUrl = getWhatsAppUrl(getPropertyWhatsAppMessage(project.title, pageUrl, isNp, plot.plotNumber))
  const inquiryMessage = isNp
    ? `नमस्ते, मलाई "${project.title}" परियोजनाको प्लट नं. ${plot.plotNumber} मा रुचि छ। कृपया थप जानकारी दिनुहोला।`
    : `Hello, I am interested in plot ${plot.plotNumber} in "${project.title}". Could you provide more information?`

  const facts = [
    area ? { label: isNp ? 'क्षेत्रफल' : 'Area', value: area } : null,
    plot.facing ? { label: isNp ? 'मोहडा' : 'Facing', value: plot.facing } : null,
    { label: isNp ? 'मूल्य' : 'Price', value: isSold ? '—' : price ?? (isNp ? 'मूल्यका लागि सम्पर्क गर्नुहोस्' : 'Contact for price') },
  ].filter((fact): fact is { label: string; value: string } => fact !== null)

  return (
    <Modal show onHide={onClose} size="lg" centered fullscreen="sm-down" scrollable aria-labelledby="plot-modal-title">
      <Modal.Header closeButton>
        <Modal.Title id="plot-modal-title" as="h2" className="h5 d-flex align-items-center gap-2 flex-wrap">
          {isNp ? 'प्लट नं.' : 'Plot'} {plot.plotNumber}
          <span className={`plot-status plot-status--${plot.status.toLowerCase()}`}>
            {translatePlotStatus(plot.status, language)}
          </span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {plot.images.length > 0 ? (
          <div className="mb-3">
            {/* Reuses the property gallery with this plot's photos */}
            <PropertyGallery
              key={plot.id}
              property={{ ...project, title: `${project.title} — ${plot.plotNumber}`, images: plot.images }}
            />
          </div>
        ) : null}

        <dl className="plot-facts">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {plot.description ? <p className="plot-description">{plot.description}</p> : null}

        {isSold ? (
          <div className="plot-sold-note">
            <p className="mb-2">
              {isNp ? 'यो प्लट बिक्री भइसकेको छ।' : 'This plot has already been sold.'}
            </p>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onShowAvailable}>
              {isNp ? 'उपलब्ध प्लटहरू हेर्नुहोस्' : 'Show available plots'}
            </button>
          </div>
        ) : (
          <>
            <div className="plot-actions">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon />
                <span>{isNp ? 'यो प्लटबारे सोध्नुहोस्' : 'Ask about this plot'}</span>
              </a>
              <a href={getPhoneHref()} className="btn btn-outline-primary">
                <PhoneIcon />
                <span>{isNp ? 'फोन गर्नुहोस्' : 'Call'}</span>
              </a>
            </div>
            <details className="plot-inquiry">
              <summary>{isNp ? 'वा सन्देश पठाउनुहोस्' : 'Or send an inquiry'}</summary>
              <InquiryForm key={plot.id} propertyId={project.id} defaultMessage={inquiryMessage} compact />
            </details>
          </>
        )}
      </Modal.Body>
    </Modal>
  )
}
