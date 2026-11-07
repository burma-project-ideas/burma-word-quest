import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

await mkdir('public/icons', { recursive: true })
await sharp('public/brand.svg').resize(512, 512).png().toFile('public/logo.png')
for (const [name, size, scale] of [
  ['icon-192', 192, .8],
  ['icon-512', 512, .8],
  ['maskable-512', 512, .6],
  ['apple-touch-icon', 180, .8],
]) {
  const artwork = await sharp('public/logo.png').resize(Math.round(size * scale), Math.round(size * scale), { fit: 'contain' }).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: '#090f18' } })
    .composite([{ input: artwork, gravity: 'centre' }]).png().toFile(`public/icons/${name}.png`)
}

const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#090f18"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="#15212e" stroke="#2d3d50"/>
  <text x="110" y="160" fill="#a9f06a" font-family="sans-serif" font-size="24" letter-spacing="4">BURMA PROJECT IDEAS</text>
  <text x="110" y="285" fill="#f0f4fc" font-family="sans-serif" font-weight="700" font-size="80">Burma Word Quest</text>
  <text x="110" y="375" fill="#c1cbe0" font-family="sans-serif" font-size="30">English words. Myanmar slang. Burmese proverbs.</text>
  <text x="110" y="485" fill="#a9f06a" font-family="sans-serif" font-size="28">Choose a challenge. Find your words.</text>
</svg>`
await sharp(Buffer.from(preview)).png().toFile('public/og-game-preview.png')
