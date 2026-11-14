import { useEffect, useMemo, useState } from 'react'
import { LocaleContext } from '../localeContext'
import { translateUI } from '../uiTranslation'

export default function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    try { return localStorage.getItem('assembly-locale') === 'en' ? 'en' : 'my' }
    catch { return 'my' }
  })
  useEffect(() => {
    document.documentElement.lang = locale
    try { localStorage.setItem('assembly-locale', locale) } catch { /* Keep the selection in memory. */ }
  }, [locale])
  const value = useMemo(() => ({
    locale, setLocale,
    t: (english, myanmar) => locale === 'en' ? english : myanmar,
    ui: text => translateUI(text, locale),
  }), [locale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
