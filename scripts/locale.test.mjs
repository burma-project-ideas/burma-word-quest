import test from 'node:test'
import assert from 'node:assert/strict'
import messages from '../src/uiMessages.json' with { type: 'json' }
import { translateUI } from '../src/uiTranslation.js'
import { onlineError } from '../src/onlineError.js'

test('every registered UI message has an English translation and matching placeholders', () => {
  const slots = text => [...new Set(text.match(/\{\d+\}/g) || [])].sort()
  for (const [english, myanmar] of messages) {
    assert.ok(english.trim() && myanmar.trim())
    assert.deepEqual(slots(english), slots(myanmar), english)
    for (const source of [english, myanmar]) {
      const rendered = translateUI(source.replace(/\{(\d+)\}/g, (_, index) => `value${index}`), 'en')
      assert.doesNotMatch(rendered, /[\u1000-\u109f]/u, source)
      assert.doesNotMatch(rendered, /\{\d+\}/, source)
    }
  }
})

test('existing notices translate at render time, including auth and cloud statuses', () => {
  const savedNotice = onlineError({ code: 'invalid_credentials' })
  assert.equal(translateUI(savedNotice, 'en'), 'Incorrect email or password.')
  assert.equal(translateUI(savedNotice, 'my'), savedNotice)
  assert.equal(translateUI('ရလဒ် သိမ်းနေပါတယ်…', 'en'), 'Saving results…')
  assert.equal(translateUI('နာမည် သိမ်းပြီးပါပြီ။', 'en'), 'Name saved.')
  assert.equal(translateUI('Name saved.', 'my'), 'နာမည် သိမ်းပြီးပါပြီ။')
})

test('dynamic counters, countdowns and accessibility labels preserve their values', () => {
  assert.equal(translateUI('2 စက္ကန့်နောက် ပြန်စမ်းပါ။', 'en'), 'Try again in 2 seconds.')
  assert.equal(translateUI('Try again in 2 seconds.', 'my'), '2 စက္ကန့်နောက် ပြန်စမ်းပါ။')
  assert.equal(translateUI('အသက် 3 ခုကျန်', 'en'), '3 lives left')
  assert.equal(translateUI('Players 123 · Showing 20', 'my'), 'ကစားသူ 123 ဦး · ပြသထားသူ 20 ဦး')
  assert.equal(translateUI('2026-10-17: 8 correct answers', 'my'), '2026-10-17: ဖြေမှန် 8 ခု')
  assert.equal(translateUI('A မပါဘူး။ Python ထွက်သွားပြီ… ဆက်ကြိုးစားမယ်!', 'en'), 'A is not in the word. Python is lost… Keep trying!')
  assert.equal(translateUI('ကစားသူ: မြန်မာကစားသူ', 'en'), 'Player: မြန်မာကစားသူ')
})

test('translation leaves unregistered learning content and whitespace unchanged', () => {
  for (const text of ['သူခိုးက လူ လူ ဟစ်', 'အခြောက်ခံပြီး သိမ်းထားနိုင်ကာ ရေစိမ်ပြီးမှ ဟင်းချက်လေ့ရှိတဲ့ အစေ့တစ်မျိုး။', 'မြန်မာကစားသူ']) {
    assert.equal(translateUI(text, 'en'), text)
    assert.equal(translateUI(text, 'my'), text)
  }
  assert.equal(translateUI(' သင် ', 'en'), ' You ')
  assert.equal(translateUI(null, 'en'), null)
  assert.equal(translateUI(3, 'my'), 3)
})
