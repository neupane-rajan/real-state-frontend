import { formatShortPrice, type Plot, type PlotLayoutRow } from '../../api/properties'
import { useLanguage } from '../../hooks/useLanguage'
import { translatePlotStatus } from '../../utils/translateHelpers'

type PlotLayoutViewProps = {
  rows: PlotLayoutRow[]
  plots: Plot[]
  onSelect?: (plot: Plot) => void
  selectedId?: number | null
  // Plots that don't match the current status filter are faded
  isDimmed?: (plot: Plot) => boolean
}

const plotArea = (plot: Plot) => (plot.area ? `${plot.area}${plot.areaUnit ? ` ${plot.areaUnit}` : ''}` : '')

// Draws the project as rows of plots with roads between them. Every plot row spans
// the full width, so the two sides of a road line up even with different plot counts.
export function PlotLayoutView({ rows, plots, onSelect, selectedId = null, isDimmed }: PlotLayoutViewProps) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const byId = new Map(plots.map((plot) => [plot.id, plot]))

  return (
    <div className="plot-layout">
      {rows.map((row, index) => {
        if (row.type === 'road') {
          return (
            <div key={index} className="plot-layout__road">
              <span>{row.label?.trim() || (isNp ? 'सडक' : 'Road')}</span>
            </div>
          )
        }

        const rowPlots = row.plotIds.map((id) => byId.get(id)).filter((plot): plot is Plot => Boolean(plot))
        if (rowPlots.length === 0) return null

        return (
          <div key={index} className="plot-layout__row">
            {rowPlots.map((plot) => {
              const status = translatePlotStatus(plot.status, language)
              const price = plot.status === 'SOLD' ? null : formatShortPrice(plot.price, isNp)
              const label = `${isNp ? 'प्लट' : 'Plot'} ${plot.plotNumber}, ${status}${plotArea(plot) ? `, ${plotArea(plot)}` : ''}`
              const className = `plot-cell plot-cell--${plot.status.toLowerCase()} ${isDimmed?.(plot) ? 'is-dimmed' : ''} ${selectedId === plot.id ? 'is-selected' : ''}`
              const content = (
                <>
                  <strong>{plot.plotNumber}</strong>
                  {plotArea(plot) ? <span className="plot-cell__area">{plotArea(plot)}</span> : null}
                  {price ? <span className="plot-cell__price">{price}</span> : null}
                  <span className="plot-cell__status">{status}</span>
                </>
              )

              return onSelect ? (
                <button key={plot.id} type="button" className={className} onClick={() => onSelect(plot)} aria-label={label} title={label}>
                  {content}
                </button>
              ) : (
                <div key={plot.id} className={className} title={label}>{content}</div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
