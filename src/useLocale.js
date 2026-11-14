import { useContext } from 'react'
import { LocaleContext } from './localeContext'

export default function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale requires LocaleProvider')
  return value
}
