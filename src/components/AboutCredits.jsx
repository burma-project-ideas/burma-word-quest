import useLocale from '../useLocale'
import { proverbCredit } from '../proverbData'

export function SlangCredit() {
  const { ui } = useLocale()
  return <p className="source-credit">{ui("မြန်မာဗန်းစကားများအတွက် အရင်းအမြစ် — ")}<a href="https://bansagar.com/" target="_blank" rel="noreferrer">{ui("Ban Sagar (ဗန်းစကား)")}</a>{ui("။ Game အတွက် clues များကို ပြန်လည်ရေးသားထားပါတယ်။")}</p>
}

export default function AboutCredits() {
  const { ui } = useLocale()
  return <div className="about-credits">
    <section><h3>Burma Word Quest</h3><p>{ui("English words, Myanmar slang, and Burmese proverb challenges.")}</p><a href="https://github.com/burma-project-ideas/burma-word-quest" target="_blank" rel="noreferrer">{ui("Source code · Burma Project Ideas ↗")}</a></section>
    <section><h3>{ui("Original creator & inspiration")}</h3><p>{ui("ဒီ game ဟာ ")}<strong>{ui("Jeff307-kib (Sai Wanna Tun)")}</strong>{ui(" ရဲ့ ")}<strong>{ui("Assembly: End-Game")}</strong>{ui(" ကို အခြေခံပြီး စိတ်ကူးရယူ ဖန်တီးထားပါတယ်။")}</p><p>{ui("မူရင်း game မှာ စာလုံးတစ်လုံးချင်း ခန့်မှန်းပြီး programming languages များကို ကယ်တင်ရပါတယ်။")}</p><a href="https://github.com/Jeff307-kib/End-Game" target="_blank" rel="noreferrer">{ui("Original repository · Jeff307-kib/End-Game ↗")}</a></section>
    <section><h3>{ui("Additional development")}</h3><p><strong>{ui("Sann Lynn Htun")}</strong>{ui(" က ဒီ version အတွက် ထပ်မံဖြည့်စွက် ပြင်ဆင်ထားပါတယ်။")}</p><p>{ui("မြန်မာ Slang နဲ့ စကားပုံ modes၊ မြန်မာလို clues၊ difficulty နဲ့ categories၊ mobile layout၊ Google sign-in၊ timed leaderboard၊ feedback နဲ့ PWA support တို့ ပါဝင်ပါတယ်။")}</p></section>
    <section><h3>{ui("Myanmar slang source")}</h3><SlangCredit /></section>
    <section><h3>{ui("Myanmar proverb source")}</h3><p>{ui(proverbCredit)}</p></section>
    <section><h3>{ui("Mobile reading font")}</h3><p><a href="https://github.com/google/fonts/tree/main/ofl/notosansmyanmar" target="_blank" rel="noreferrer">{ui("Noto Sans Myanmar")}</a> · <a href="/fonts/noto-sans-myanmar-OFL.txt" target="_blank" rel="noreferrer">{ui("SIL Open Font License")}</a></p></section>
  </div>
}
