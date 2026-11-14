import messages from './uiMessages.json' with { type: 'json' }

const catalogs = { en: new Map(), my: new Map() }
const patterns = { en: [], my: [] }
const canonicalMyanmar = new Map()
for (const [english, myanmar] of messages) {
  if (!canonicalMyanmar.has(english)) canonicalMyanmar.set(english, myanmar)
}
for (const pair of messages) {
  for (const [index, locale] of ['en', 'my'].entries()) {
    const target = index === 0 ? pair[0] : canonicalMyanmar.get(pair[0])
    for (const source of pair) {
      if (!catalogs[locale].has(source)) catalogs[locale].set(source, target)
      if (!/\{\d+\}/.test(source)) continue
      const slots = []
      const escaped = source.split(/(\{\d+\})/).map(part => {
        if (/^\{\d+\}$/.test(part)) { slots.push(part); return '(.+?)' }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }).join('')
      patterns[locale].push({ expression: new RegExp(`^${escaped}$`, 'u'), target, slots })
    }
  }
}
// Prefer a complete sentence over a shorter pattern sharing the same ending.
for (const locale of ['en', 'my']) patterns[locale].sort((a, b) => b.expression.source.length - a.expression.source.length)

// Only registered UI strings are translated. Learning data and player names
// are rendered directly by the owning components.
export function translateUI(value, locale) {
  if (typeof value !== 'string' || !value.trim()) return value
  const text = value.trim()
  let translated = catalogs[locale].get(text)
  if (translated === undefined) {
    for (const { expression, target, slots } of patterns[locale]) {
      const match = expression.exec(text)
      if (!match) continue
      const values = Object.fromEntries(slots.map((slot, index) => [slot, match[index + 1]]))
      translated = target.replace(/\{\d+\}/g, slot => values[slot] ?? slot)
      break
    }
  }
  return translated === undefined ? value : value.slice(0, value.indexOf(text)) + translated + value.slice(value.indexOf(text) + text.length)
}
