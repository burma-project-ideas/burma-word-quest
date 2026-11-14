import useLocale from '../useLocale'
import { useState } from 'react'
import Panel from './Panel'

export default function ShortcutHelp() {
  const { ui } = useLocale()
  const [shortcuts, setShortcuts] = useState(null)
  function openHelp() {
    const controls = [...document.querySelectorAll('#root [aria-keyshortcuts]')]
      .filter(element => element.getClientRects().length && !element.closest('.keyboard'))
    setShortcuts(controls.map(element => ({
      label: element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent.trim(),
      keys: element.getAttribute('aria-keyshortcuts').replaceAll('Escape', 'Esc').replaceAll('Control', 'Ctrl'),
      disabled: element.disabled,
    })))
  }
  return <>
    <button className="header-icon shortcut-help-button" data-shortcut="?" aria-label={ui("Keyboard shortcuts · ဖြတ်လမ်းခလုတ်များ")} aria-haspopup="dialog" onClick={openHelp}>?</button>
    {shortcuts && <Panel className="shortcut-help" title={ui("Keyboard shortcuts · ဖြတ်လမ်းခလုတ်များ")} onClose={() => setShortcuts(null)}>
      <p>{ui("လက်ရှိစာမျက်နှာမှာ သုံးနိုင်တဲ့ shortcut များ။ Popup ဖွင့်ထားချိန်မှာ နောက်ခံဂိမ်း shortcut များ ရပ်ထားပါတယ်။")}</p>
      <h3>{ui("လက်ရှိစာမျက်နှာ")}</h3>
      <dl className="shortcut-list">{shortcuts.map(({ label, keys, disabled }, index) => <div key={index}>
        <dt>{ui(label)}{disabled && <small>{ui(" · လောလောဆယ် မရနိုင်ပါ")}</small>}</dt><dd><kbd>{ui(keys)}</kbd></dd>
      </div>)}</dl>
      <h3>{ui("ဂိမ်းအားလုံးအတွက် လမ်းညွှန်")}</h3>
      <dl className="shortcut-list">
        <div><dt>{ui("Mode / အဖြေ / အခက်အခဲအဆင့် ရွေးရန်")}</dt><dd><kbd>1–9</kbd></dd></div>
        <div><dt>{ui("English စာလုံး ခန့်မှန်းရန်")}</dt><dd><kbd>{ui("A–Z")}</kbd></dd></div>
        <div><dt>{ui("Start / Next / Confirm")}</dt><dd><kbd>{ui("Enter")}</kbd></dd></div>
        <div><dt>{ui("Back / Close / Challenge pause")}</dt><dd><kbd>{ui("Esc")}</kbd></dd></div>
        <div><dt>{ui("Challenge pause / resume")}</dt><dd><kbd>{ui("P")}</kbd></dd></div>
        <div><dt>{ui("Hint · English မှာ ခလုတ်ရဲ့ shortcut ကို သုံးပါ")}</dt><dd><kbd>{ui("H")}</kbd></dd></div>
        <div><dt>{ui("အသံ · English မှာ ခလုတ်ရဲ့ shortcut ကို သုံးပါ")}</dt><dd><kbd>{ui("M")}</kbd></dd></div>
        <div><dt>{ui("ပွဲပြီးချိန် နောက်တစ်ပွဲ")}</dt><dd><kbd>{ui("R")}</kbd></dd></div>
        <div><dt>{ui("ခလုတ်များကြား ရွှေ့ရန်")}</dt><dd><kbd>{ui("Tab / Shift+Tab")}</kbd></dd></div>
        <div><dt>{ui("ရွေးထားတဲ့ခလုတ်ကို နှိပ်ရန်")}</dt><dd><kbd>{ui("Enter / Space")}</kbd></dd></div>
        <div><dt>{ui("Shortcut လမ်းညွှန်ဖွင့်ရန်")}</dt><dd><kbd>?</kbd></dd></div>
      </dl>
      <p>{ui("ကျန်ခလုတ်များအတွက် Alt+Shift နဲ့ တွဲသုံးပါ။ Header ကို hover သို့မဟုတ် focus လုပ်ရင် shortcut ပြပါမယ်။ စာရိုက်နေချိန်မှာ စာရိုက်ခြင်းကို ဦးစားပေးပါတယ်။")}</p>
    </Panel>}
  </>
}
