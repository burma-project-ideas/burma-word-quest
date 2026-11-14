import useLocale from '../useLocale'
import { useEffect, useRef, useState } from 'react'
import { supabase, onlineError } from '../supabase'
import { activityCalendar, activityLevel } from '../activityCalendar'
import './profile.css'

export default function PlayerProfile({ playerId, userId, onBack, headingRef }) {
  const { ui, locale } = useLocale()
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const chart = useRef(null)
  useEffect(() => {
    if (status === 'ready') {
      headingRef.current?.focus({ preventScroll: true })
      if (chart.current) chart.current.scrollLeft = chart.current.scrollWidth
    }
  }, [status, headingRef])
  useEffect(() => {
    let active = true
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(playerId || '')) { setStatus('missing'); return }
    supabase.rpc('get_player_profile', { target_player: playerId }).then(({ data, error }) => {
      if (!active) return
      if (error) { setError(onlineError(error)); setStatus('error') }
      else { setProfile(data); setStatus(data ? 'ready' : 'missing') }
    }).catch(error => { if (active) { setError(onlineError(error)); setStatus('error') } })
    return () => { active = false }
  }, [playerId, attempt])
  if (status !== 'ready') return <section className="profile-page"><button className="setup-back" onClick={onBack}>{ui("← Back")}</button>{status === 'loading' ? <p role="status">{ui("Profile ကို ယူနေပါတယ်…")}</p> : status === 'missing' ? <h1>{ui("ကစားသူကို မတွေ့ပါ။")}</h1> : <div role="alert"><p>{ui(error)}</p><button onClick={() => { setStatus('loading'); setAttempt(value => value + 1) }}>{ui("ပြန်စမ်းမယ်")}</button></div>}</section>
  const weeks = activityCalendar(profile.today, profile.days)
  const total = profile.days.reduce((sum, day) => sum + Number(day.count), 0)
  const activeDays = profile.days.filter(day => day.count > 0).length
  const monthName = date => new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' })
  return <section className="profile-page" aria-labelledby="profile-title">
    <button className="setup-back" onClick={onBack}>{ui("← နောက်သို့ / Back")}</button>
    <header className="profile-heading"><span className="profile-avatar" aria-hidden="true">{[...new Intl.Segmenter('my', { granularity: 'grapheme' }).segment(profile.display_name)][0]?.segment}</span><div><h1 id="profile-title" ref={headingRef} tabIndex={-1}>{profile.display_name}</h1><p>{ui(playerId === userId ? 'သင့် Profile' : 'Player profile')}</p></div></header>
    <div className="profile-stats"><div><strong>{ui(Number(profile.total_correct).toLocaleString())}</strong><span>{ui("ဖြေမှန် စုစုပေါင်း")}</span></div><div><strong>{total.toLocaleString()}</strong><span>{ui("ပြီးခဲ့တဲ့ ၃၆၅ ရက် ဖြေမှန်")}</span></div><div><strong>{activeDays}</strong><span>{ui("ကစားခဲ့တဲ့ရက်")}</span></div></div>
    <section className="profile-activity" aria-labelledby="activity-title"><h2 id="activity-title">{ui("ကစားမှုမှတ်တမ်း · Activity")}</h2><p>{ui("ပြီးခဲ့တဲ့ ၃၆၅ ရက်အတွင်း ဖြေမှန် ")}{total.toLocaleString()}{ui(" ခု")}</p>
      <div className="activity-scroll" ref={chart} tabIndex={0} role="img" aria-label={ui(`Last 365 days: ${total} correct answers across ${activeDays} active days. Scroll horizontally to explore the chart; daily totals are listed below.`)}>
        <div className="activity-calendar" aria-hidden="true"><div className="activity-weekdays"><span>{ui("Mon")}</span><span>{ui("Wed")}</span><span>{ui("Fri")}</span></div><div className="activity-weeks">{weeks.map((week, i) => <div className="activity-week" key={i}><span className="activity-month">{ui(i === 0 ? monthName(week.find(Boolean).date) : week.some(day => day?.date.endsWith('-01')) ? monthName(week.find(day => day?.date.endsWith('-01')).date) : '')}</span>{week.map((day, j) => <span key={j} className={`activity-cell ${day ? `activity-level-${activityLevel(day.count)}` : 'activity-padding'}`} title={ui(day ? `${day.date}: ${day.count} correct answers` : undefined)} />)}</div>)}</div></div>
      </div>
      <p className="profile-note">{ui("Chart ကို ဘယ်ညာရွှေ့ပြီး ကြည့်နိုင်ပါတယ်။")}</p><div className="activity-legend"><span>{ui("Less")}</span>{[0,1,2,3,4].map(level => <span key={level} className={`activity-cell activity-level-${level}`} aria-label={ui(['0','1–2','3–5','6–9','10+'][level]+' correct answers')} />)}<span>{ui("More")}</span></div>
      <p className="profile-note">{ui("မြန်မာစံတော်ချိန်အလိုက် သိမ်းထားတဲ့ ဖြေမှန်တွေကို ရေတွက်ပါတယ်။ Pause / End Game မှာ သိမ်းတဲ့ ပွဲရှည်အမှတ်လည်း ပါဝင်ပါတယ်။ အမှတ်တူကို ထပ်မပေါင်းပါ။ အဟောင်းရလဒ်များကို မူလသိမ်းရက်အလိုက် ပြထားပါတယ်။")}</p>
      <details className="activity-details"><summary>{ui("ရက်အလိုက် ကြည့်မယ် · Daily totals")}</summary>{activeDays ? <ul>{[...profile.days].filter(day => day.count > 0).reverse().map(day => <li key={day.date}><time dateTime={day.date}>{ui(day.date)}</time><strong>{ui(Number(day.count).toLocaleString())}{ui(" ဖြေမှန်")}</strong></li>)}</ul> : <p>{ui("ကစားမှုမှတ်တမ်း မရှိသေးပါ။")}</p>}</details>
    </section>
  </section>
}
