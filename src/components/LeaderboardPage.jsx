import useLocale from '../useLocale'
import { useEffect, useState } from 'react'
import { supabase, onlineError } from '../supabase'
import { proverbCount } from '../proverbData'
import { formatTime } from '../time'
import './leaderboard.css'

const groups = [
  { id: 'proverb', label: 'စကားပုံ', modes: [['proverb-choice', 'ရွေးဖြေ'], ['proverb-input', 'ရိုက်ဖြေ']] },
  { id: 'slang', label: 'Slang', modes: [['slang', 'မြန်မာ Slang']] },
  { id: 'english', label: 'English', modes: [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']] },
]

function PlayerRow({ row, userId, challenge, onProfile }) {
  const { ui } = useLocale()
  return <>
    <span className="leaderboard-rank">#{row.rank}</span>
    <span className="leaderboard-avatar" aria-hidden="true">{Array.from(row.display_name.trim())[0] || '?'}</span>
    <div className="leaderboard-player"><strong><a href={`/players/${row.player_id}`} onClick={event => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onProfile(row.player_id) } }}>{row.display_name}</a>{row.player_id === userId && <span className="leaderboard-you-label">{ui(" သင်")}</span>}</strong><span>{ui(challenge ? `ပြီးစီး ${row.correct + row.incorrect + row.skipped} / ${row.total} · ${ui(row.finish_reason === 'completed' ? 'အားလုံးပြီးဆုံး' : row.finish_reason === 'lives' ? 'အသက်ကုန်' : row.finish_reason === 'paused' ? 'ခဏနားထား' : 'အဆုံးသတ်ထား')}` : `Best streak ${row.best_streak} · စကားပုံနိုင်ပွဲ ${row.proverb_wins}`)}</span></div>
    <div className="leaderboard-score"><strong>{ui(challenge ? row.correct : row.wins)} <small>{ui(challenge ? 'ဖြေမှန်' : 'နိုင်ပွဲ')}</small></strong><span>{ui(challenge ? `စုစုပေါင်း ${formatTime(row.elapsed_ms)}` : row.average_ms == null ? 'အချိန် မရှိသေး' : `ပျမ်းမျှ ${formatTime(row.average_ms)}`)}</span></div>
  </>
}

export default function LeaderboardPage({ initialMode, userId, onBack, headingRef, onProfile }) {
  const { ui, locale } = useLocale()
  const [mode, setMode] = useState(initialMode)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const challenge = mode === 'slang' || mode.startsWith('proverb-')
  useEffect(() => {
    let active = true
    supabase.rpc(challenge ? 'get_challenge_leaderboard' : 'get_timed_leaderboard', { game_mode: mode }).then(({ data, error }) => {
      if (!active) return
      if (error) { setError(onlineError(error)); setStatus('error') }
      else { setResult(data); setStatus('ready') }
    }).catch(error => { if (active) { setError(onlineError(error)); setStatus('error') } })
    return () => { active = false }
  }, [mode, attempt, challenge])
  const rows = result?.rows || []
  const ready = status === 'ready'
  const group = groups.find(item => item.modes.some(([id]) => id === mode)) || groups[0]
  const personalRow = result?.personal || rows.find(row => row.player_id === userId)
  function chooseMode(nextMode) { if (nextMode !== mode) { setMode(nextMode); setStatus('loading') } }
  return <section className="leaderboard-page" aria-labelledby="leaderboard-title">
    <header className="leaderboard-header">
      <button className="setup-back" onClick={onBack} aria-label={ui("နောက်သို့ / Back")}>{ui("← Back")}</button>
      <h1 id="leaderboard-title" ref={headingRef} tabIndex={-1}>{ui("Leaderboard")}</h1>
      <svg className="leaderboard-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 13v5m-5 3h10m-8-3h6v3H9z" /></svg>
    </header>
    <div className="leaderboard-totals">
      <div><strong>{ui(ready ? result.total_users.toLocaleString() : '—')}</strong><span>{ui("ကစားသူ · Players")}</span></div>
      <div><strong>{ui(proverbCount.toLocaleString())}</strong><span>{ui("စကားပုံ · Proverbs")}</span></div>
    </div>
    <p className="leaderboard-total-wins">{ui(challenge ? 'ပွဲရှည် စကားပုံဖြေမှန် စုစုပေါင်း' : 'စကားပုံနိုင်ပွဲ စုစုပေါင်း')} <strong>{ui(ready ? (challenge ? result.total_proverb_correct : result.total_proverb_wins).toLocaleString() : '—')}</strong></p>
    <nav className="leaderboard-filters" aria-label={ui("Leaderboard game")}>
      <div className="leaderboard-games">{groups.map(item => <button key={item.id} aria-pressed={group.id === item.id} onClick={() => chooseMode(item.modes[0][0])}>{ui(item.label)}</button>)}</div>
      {group.modes.length > 1 && <div className="leaderboard-subfilters" aria-label={ui("Game variant")}>{group.modes.map(([id, label]) => <button key={id} lang={locale} aria-pressed={mode === id} onClick={() => chooseMode(id)}>{ui(label)}</button>)}</div>}
    </nav>
    <p className="leaderboard-rule">{ui(challenge ? 'အကောင်းဆုံးပွဲတစ်ပွဲရဲ့ ဖြေမှန်အရေအတွက်နဲ့ စီပါတယ်။ ဖြေမှန်တူရင် စုစုပေါင်းဖြေချိန် ပိုနည်းသူက အပေါ်ရောက်ပါမယ်။' : 'နိုင်ပွဲတူရင် ပျမ်းမျှဖြေချိန် ပိုမြန်သူက အပေါ်ရောက်ပါမယ်။')}</p>
    <div aria-busy={status === 'loading'}>
      {status === 'loading' ? <p role="status">{ui("ရလဒ်တွေ ယူနေပါတယ်…")}</p> : status === 'error' ? <div role="alert"><p>{ui(error)}</p><button onClick={() => { setStatus('loading'); setAttempt(value => value + 1) }}>{ui("ပြန်စမ်းမယ်")}</button></div> : <>
        {userId && <section className="leaderboard-personal" aria-label={ui("Your position")}><h2>{ui("သင့်အဆင့် · Your position")}</h2>{personalRow ? <div className="leaderboard-personal-row"><PlayerRow row={personalRow} userId={userId} challenge={challenge} onProfile={onProfile} /></div> : <p>{ui("ဒီအမျိုးအစားမှာ သင့်ရလဒ် မရှိသေးပါ။")}</p>}</section>}
        <div className="leaderboard-list-heading"><h2>{ui("Top 100")}</h2><p className="leaderboard-count">{ui("ကစားသူ ")}{ui(result.participants.toLocaleString())}{ui(" ဦး · ပြသထားသူ ")}{ui(rows.length)}{ui(" ဦး")}</p></div>
        {!rows.length ? <p>{ui("ရလဒ် မရှိသေးပါ။ ပထမဆုံး ကစားသူ ဖြစ်လိုက်ပါ!")}</p> : <ol className="leaderboard-players">{rows.map(row => <li key={row.player_id} className={`${row.rank <= 3 ? 'leaderboard-winner' : ''} ${row.player_id === userId ? 'leaderboard-you' : ''}`}><PlayerRow row={row} userId={userId} challenge={challenge} onProfile={onProfile} /></li>)}</ol>}

      </>}
    </div>
    {challenge ? <p className="leaderboard-note">{ui("ပွဲရှည်ရလဒ်များကိုသာ ပြထားပါတယ်။ အရင်မေးခွန်းတစ်ခုချင်း နိုင်ပွဲတွေကို ပွဲရှည်အမှတ်အဖြစ် မပေါင်းပါ။ ခဏနားထားတဲ့ပွဲတွေလည်း ပါဝင်ပါတယ်။ ပြန်ဆက်ရင် မူလပွဲရလဒ်ကို update လုပ်ပါတယ်။ Pause နဲ့ အဖြေဖတ်ချိန်ကို ဖြေချိန်ထဲ မထည့်ပါ။")}</p> : <p className="leaderboard-note">{ui("ပျမ်းမျှအချိန်ကို အချိန်မှတ်ထားသော နိုင်ပွဲများမှ တွက်ထားပါတယ်။ အဟောင်းပွဲများကို ၀ စက္ကန့်လို့ မတွက်ပါ။ အချိန်လည်းတူရင် best streak နဲ့ စီပါတယ်။")}</p>}

  </section>
}

