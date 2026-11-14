import useLocale from '../useLocale'
import { useEffect, useRef } from 'react'

export default function Panel({ title, onClose, children, className = '' }) {
  const { ui } = useLocale()
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    dialog.showModal()
    return () => { dialog.close(); previous?.focus() }
  }, [])
  return <dialog className={`app-panel ${className}`} ref={ref} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <header className="panel-heading"><h2>{ui(title)}</h2><button aria-label={ui("ပိတ်မယ်")} onClick={onClose}>×</button></header>
    <div className="panel-body">{children}</div>
  </dialog>
}
