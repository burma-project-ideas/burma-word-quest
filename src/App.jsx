import { useCallback, useEffect, useRef, useState } from 'react'
import { languages } from './languages'
import { categories, difficulties, drawPuzzle } from './gameData'
import { drawSlang, isSlangAnswer, normalizeSlang, slangWords } from './slangData'
import { drawProverb, isProverbAnswer, proverbCredit, proverbCount } from './proverbData'
import Panel from './components/Panel'
import useButtonShortcuts from './useButtonShortcuts'
import ShortcutHelp from './components/ShortcutHelp'
import Feedback from './components/Feedback'
import Account from './components/Online'
import LeaderboardPage from './components/LeaderboardPage'
import PlayerProfile from './components/PlayerProfile'
import AboutCredits, { SlangCredit } from './components/AboutCredits'
import GameModeArt from './components/GameModeArt'
import MyanmarChallenge from './components/MyanmarChallenge'
import Lives from './components/Lives'
import { formatTime } from './time'
import { onlineError } from './supabase'
import useGameAccount from './useGameAccount'
import useLocale from './useLocale'
import ReactConfetti from 'react-confetti'
import { SpeakerLoudIcon, SpeakerOffIcon, InfoCircledIcon, BarChartIcon, PersonIcon } from '@radix-ui/react-icons'

function AccountAvatar({ user, onClick, expanded }) {
  const { ui } = useLocale()
  const [failedImage, setFailedImage] = useState(null)
  const metadata = user?.user_metadata || {}
  const name = metadata.display_name || metadata.full_name || metadata.name || user?.email || 'ကစားသူ'
  const photo = metadata.avatar_url || metadata.picture
  const initial = [...new Intl.Segmenter('my', { granularity: 'grapheme' }).segment(name.trim())][0]?.segment || 'A'
  return <button className={`header-account${user ? ' signed-in' : ''}`} onClick={onClick} aria-expanded={expanded} aria-controls="account-actions" aria-label={ui(user ? `ကစားသူ: ${name}` : 'နာမည်ထည့်မယ်')} title={user ? name : ui('နာမည်ထည့်မယ်')}>
    {user ? photo && failedImage !== photo ? <img src={photo} alt="" referrerPolicy="no-referrer" onError={() => setFailedImage(photo)} /> : <span aria-hidden="true">{initial.toUpperCase()}</span> : <PersonIcon width={24} height={24} aria-hidden="true" />}
  </button>
}

function HeaderAccount({ user, onAccount, onFeedback, onProfile, onLogout }) {
  const { ui, t } = useLocale()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const root = useRef(null)
  useEffect(() => {
    if (!open) return
    function outside(event) { if (!root.current?.contains(event.target)) setOpen(false) }
    function escape(event) { if (event.key === 'Escape') { setOpen(false); root.current?.querySelector('button').focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  async function logout() {
    setBusy(true); setError('')
    setOpen(false)
    try {
      await onLogout()
    } catch (error) { setError(onlineError(error)); setOpen(true) }
    finally { setBusy(false) }
  }
  function choose(action) { setOpen(false); action() }
  return <div className="header-account-menu" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <AccountAvatar key={user?.id || 'guest'} user={user} expanded={open} onClick={() => setOpen(!open)} />
    {open && <div id="account-actions" className="account-actions" aria-label={ui("Account actions")} onKeyDown={event => { if (event.key !== 'Escape') event.stopPropagation() }}>
      <button onClick={() => choose(onAccount)}>{ui(user ? t('Your account', 'သင့်အကောင့်') : t('Sign in', 'ဝင်မယ်'))}</button>
      <button onClick={() => choose(onFeedback)}>{ui("Feedback")}</button>
      {user && <button onClick={() => choose(onProfile)}>{ui(t('Your profile · Activity', 'သင့် Profile · Activity'))}</button>}
      {user && <button disabled={busy} onClick={logout}>{ui(busy ? t('Please wait…', 'ခဏစောင့်ပါ…') : t('Logout', 'ထွက်မယ်'))}</button>}
      {error && <p role="alert">{ui(error)}</p>}
    </div>}
  </div>
}

function readStored(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch { return {} }
}
function readStats() {
  const stored = readStored('assembly-stats-v2')
  if (!stored.normal) stored.normal = readStored('assembly-stats')
  return Object.fromEntries([...difficulties, { id: 'slang' }, { id: 'proverb-choice' }, { id: 'proverb-input' }].map(({ id }) => {
    const record = stored[id] || {}
    const count = field => Number.isSafeInteger(record[field]) && record[field] >= 0 ? record[field] : 0
    return [id, { streak: count('streak'), best: count('best'), wins: count('wins') }]
  }))
}
export default function BurmaWordQuest() {
  const { locale, setLocale, t, ui } = useLocale()
  useButtonShortcuts()
  const [googleSetup, setGoogleSetup] = useState(false)
  const [panel, setPanel] = useState(null)
  const { session, authReady, logout, startOnlineRound, saveOnlineResult, cloudMessage, retryCloud, pendingCloud, saveChallengeResult } = useGameAccount()
  useEffect(() => {
    const url = new URL(window.location.href)
    if (session && url.searchParams.get('login') === 'google') {
      setGoogleSetup(true); setPanel('account')
      url.searchParams.delete('login')
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    }
  }, [session])

  const [mode, setMode] = useState('english')
  const [screen, setScreen] = useState(() => window.location.pathname === '/leaderboard' ? 'leaderboard' : window.location.pathname === '/about' ? 'about' : window.location.pathname.startsWith('/players/') ? 'profile' : 'landing')
  const [profileId, setProfileId] = useState(() => window.location.pathname.split('/')[2] || '')
  const leaderboardReturn = useRef('landing')
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  useEffect(() => {
    const navigate = () => { setProfileId(window.location.pathname.split('/')[2] || ''); setScreen(window.location.pathname === '/leaderboard' ? 'leaderboard' : window.location.pathname === '/about' ? 'about' : window.location.pathname.startsWith('/players/') ? 'profile' : leaderboardReturn.current) }
    window.addEventListener('popstate', navigate)
    return () => window.removeEventListener('popstate', navigate)
  }, [])
  function openPage(page) {
    const target = page.startsWith('players/') ? 'profile' : page
    if (screen === target && (target !== 'profile' || profileId === page.split('/')[1])) return
    if (!['leaderboard', 'about', 'profile'].includes(screen)) leaderboardReturn.current = screen
    window.history.pushState({ auxiliaryPage: true }, '', `/${page}`)
    if (target === 'profile') setProfileId(page.split('/')[1])
    setScreen(target)
  }
  function closePage() {
    if (window.history.state?.auxiliaryPage) window.history.back()
    else { window.history.replaceState({}, '', '/'); setScreen('landing') }
  }
  const [setupMode, setSetupMode] = useState(null)
  const [setupCategory, setSetupCategory] = useState('daily')
  const [setupDifficulty, setSetupDifficulty] = useState('normal')
  const [setupPlay, setSetupPlay] = useState('choice')
  const screenTitle = useRef(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (screen !== 'game') screenTitle.current?.focus({ preventScroll: true })
  }, [screen])
  const isSlang = mode === 'slang'
  const isProverb = mode === 'proverb'
  const isMyanmar = isSlang || isProverb
  const [proverbPlay, setProverbPlay] = useState('choice')
  const [answer, setAnswer] = useState('')
  const [wrongAnswers, setWrongAnswers] = useState([])
  const [slangSolved, setSlangSolved] = useState(false)
  const composing = useRef(false)
  const answerInput = useRef(null)
  const [category, setCategory] = useState('daily')
  const [difficulty, setDifficulty] = useState('normal')
  const [round, setRound] = useState(() => drawPuzzle('daily', 'normal', readStored('assembly-word-history-v1')))
  const { puzzle, history } = round
  const [guessed, setGuessed] = useState([])
  const [surrendered, setSurrendered] = useState(false)
  const [clueShown, setClueShown] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [sound, setSound] = useState(false)
  const [stats, setStats] = useState(readStats)
  const [pendingSettings, setPendingSettings] = useState(null)
  const [message, setMessage] = useState('စာလုံးတစ်လုံး ရွေးပြီး စတင်လိုက်ပါ။')
  const scored = useRef(false)
  const audio = useRef(null)
  const wrong = isMyanmar ? wrongAnswers.length : guessed.filter(letter => !puzzle.word.includes(letter)).length
  const won = isMyanmar ? slangSolved : [...puzzle.word].every(letter => guessed.includes(letter))
  const maxLives = isMyanmar ? 3 : languages.length
  const remainingLives = Math.max(0, maxLives - wrong)
  const lost = surrendered || wrong >= maxLives
  const over = won || lost
  useEffect(() => {
    if (startedAt == null || over || screen !== 'game') return
    const tick = () => setElapsedMs(Math.max(1, Math.round(performance.now() - startedAt)))
    const timer = setInterval(tick, 100)
    return () => clearInterval(timer)
  }, [startedAt, over, screen])
  const activeCategory = categories.find(item => item.id === category)
  const activeDifficulty = difficulties.find(item => item.id === difficulty)
  const statsKey = isProverb ? `proverb-${proverbPlay}` : isSlang ? 'slang' : difficulty
  const record = stats[statsKey]

  useEffect(() => {
    function resize() {
      const height = window.visualViewport?.height || window.innerHeight
      document.documentElement.style.setProperty('--game-height', `${height}px`)
      document.documentElement.dataset.keyboard = height < window.innerHeight * .75 ? 'open' : 'closed'
    }
    resize()
    window.visualViewport?.addEventListener('resize', resize)
    window.addEventListener('resize', resize)
    return () => {
      window.visualViewport?.removeEventListener('resize', resize)
      window.removeEventListener('resize', resize)
      document.documentElement.style.removeProperty('--game-height')
      delete document.documentElement.dataset.keyboard
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('assembly-word-history-v1', JSON.stringify(history)) } catch { /* In-memory word cycles still work. */ }
  }, [history])

  useEffect(() => {
    try { localStorage.setItem('assembly-stats-v2', JSON.stringify(stats)) } catch { /* Play remains available without storage. */ }
  }, [stats])

  const playTone = useCallback((correct) => {
    if (!sound) return
    try {
      audio.current ||= new (window.AudioContext || window.webkitAudioContext)()
      const ctx = audio.current
      void ctx.resume()
      const oscillator = ctx.createOscillator(), gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(correct ? 660 : 180, ctx.currentTime)
      gain.gain.setValueAtTime(0.055, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      oscillator.connect(gain); gain.connect(ctx.destination)
      oscillator.start(); oscillator.stop(ctx.currentTime + 0.15)
    } catch { /* Sound is optional when browser audio is unavailable. */ }
  }, [sound])

  const guess = useCallback((letter) => {
    if (screen !== 'game' || isMyanmar || over || pendingSettings || panel || guessed.includes(letter)) return
    const correct = puzzle.word.includes(letter)
    setGuessed(previous => [...previous, letter])
    setMessage(correct ? `${letter.toUpperCase()} ပါတယ်။ ကယ်တင်ဖို့ နီးလာပြီ!` : `${letter.toUpperCase()} မပါဘူး။ ${languages[wrong].name} ထွက်သွားပြီ… ဆက်ကြိုးစားမယ်!`)
    playTone(correct)
  }, [screen, isMyanmar, over, pendingSettings, panel, guessed, puzzle.word, wrong, playTone])

  useEffect(() => {
    function onKey(event) {
      if (panel || pendingSettings || screen !== 'game' || over) return
      if (event.repeat || event.target.isContentEditable) return
      if (isMyanmar || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) return
      if (/^[a-z]$/i.test(event.key)) { event.preventDefault(); guess(event.key.toLowerCase()) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [guess, pendingSettings, isMyanmar, panel, screen, over])

  useEffect(() => {
    if (!over || scored.current) return
    scored.current = true
    const duration = Math.max(1, Math.round(performance.now() - startedAt))
    setElapsedMs(duration)
    saveOnlineResult(statsKey, won, startedAt != null && duration <= 86400000 ? duration : null)
    const current = stats[statsKey]
    const streak = won ? current.streak + 1 : 0
    setStats({ ...stats, [statsKey]: { streak, best: Math.max(current.best, streak), wins: current.wins + (won ? 1 : 0) } })
  }, [over, won, stats, statsKey, saveOnlineResult, startedAt])

  function newGame(nextCategory = category, nextDifficulty = difficulty, nextMode = mode, nextPlay = proverbPlay, onlinePlayerId) {
    if (nextMode === 'slang' || nextMode === 'proverb') {
      const checkpointKey = `assembly-challenge-v1:${nextMode === 'slang' ? 'slang' : `proverb-${nextPlay}`}`
      if (readStored(checkpointKey).phase === 'finished') {
        try { localStorage.removeItem(checkpointKey) } catch { /* A new run can still start in memory. */ }
      }
      setMode(nextMode); setProverbPlay(nextPlay); setScreen('myanmar-game'); setPanel(null); setPendingSettings(null); setGoogleSetup(false)
      setStartedAt(null); setSurrendered(false); setWrongAnswers([]); setSlangSolved(false); setGuessed([])
      return
    }
    window.scrollTo(0, 0)
    setStartedAt(performance.now()); setElapsedMs(0)
    const nextStatsKey = nextMode === 'proverb' ? `proverb-${nextPlay}` : nextMode === 'slang' ? 'slang' : nextDifficulty
    if (nextStatsKey !== statsKey) {
      setStats(previous => ({ ...previous, [nextStatsKey]: { ...previous[nextStatsKey], streak: 0 } }))
    }
    startOnlineRound(onlinePlayerId); setPanel(null); setGoogleSetup(false)
    setScreen('game')
    setCategory(nextCategory); setDifficulty(nextDifficulty); setMode(nextMode); setProverbPlay(nextPlay)
    setRound(nextMode === 'proverb' ? drawProverb(history, puzzle.word) : nextMode === 'slang' ? drawSlang(history, puzzle.word) : drawPuzzle(nextCategory, nextDifficulty, history, puzzle.word))
    setGuessed([]); setSurrendered(false); setAnswer(''); setWrongAnswers([]); setSlangSolved(false); composing.current = false
    setClueShown(nextMode === 'proverb' || nextMode === 'slang' || nextDifficulty === 'easy'); setHintUsed(false); setPendingSettings(null)
    setMessage(nextMode === 'proverb' ? 'ပြထားတဲ့တစ်ဝက်ကို ကြည့်ပြီး ကွက်လပ်ကို ဖြည့်ပါ။' : nextMode === 'slang' ? 'မြန်မာ keyboard နဲ့ အဖြေအပြည့်ရိုက်ပါ။' : 'စာလုံးတစ်လုံး ရွေးပြီး စတင်လိုက်ပါ။'); scored.current = false
  }
  function changeSettings(nextCategory, nextDifficulty, nextMode = mode, nextPlay = proverbPlay) {
    if (nextCategory === category && nextDifficulty === difficulty && nextMode === mode && nextPlay === proverbPlay) return
    if (!over && (guessed.length || clueShown || wrongAnswers.length || answer)) setPendingSettings({ category: nextCategory, difficulty: nextDifficulty, mode: nextMode, play: nextPlay })
    else newGame(nextCategory, nextDifficulty, nextMode, nextPlay)
  }
  function checkAnswer(value) {
    if (over || pendingSettings) return
    const normalized = normalizeSlang(value)
    if (!normalized) { setMessage('အဖြေကို မြန်မာလို ရိုက်ထည့်ပါ။'); return }
    if (wrongAnswers.includes(normalized)) { setMessage('ဒီအဖြေ စမ်းပြီးသားပါ။'); return }
    const correct = isProverb ? isProverbAnswer(puzzle, value) : isSlangAnswer(puzzle, value)
    if (correct) setSlangSolved(true)
    else { setWrongAnswers(previous => [...previous, normalized]); setMessage('မမှန်သေးဘူး။ ပြန်စမ်းကြည့်ပါ။') }
    playTone(correct)
  }
  function submitAnswer(event) {
    event.preventDefault()
    if (composing.current || event.nativeEvent.isComposing || over || pendingSettings) return
    const normalized = normalizeSlang(answer)
    if (!normalized) { setMessage('အဖြေကို မြန်မာလို ရိုက်ထည့်ပါ။'); return }
    if (!/[\u1000-\u109f]/.test(normalized)) { setMessage('မြန်မာ keyboard ကို ပြောင်းပြီး မြန်မာလို ရိုက်ပါ။'); return }
    if (wrongAnswers.includes(normalized)) { setMessage('ဒီအဖြေ စမ်းပြီးသားပါ။ အသက်ထပ်မလျော့ပါဘူး။'); return }
    checkAnswer(answer)
    answerInput.current?.focus()
  }
  function revealLetter() {
    if (over || hintUsed || pendingSettings) return
    if (isMyanmar) { setHintUsed(true); setMessage('စကားလုံးအစကို ဖော်ပေးထားပါတယ်။ အသက်မလျော့ပါဘူး။'); return }
    const remaining = [...new Set([...puzzle.word].filter(letter => !guessed.includes(letter)))]
    const letter = remaining[Math.floor(Math.random() * remaining.length)]
    setHintUsed(true); setGuessed(previous => [...previous, letter])
    setMessage(`${letter.toUpperCase()} ကို ဖော်ပေးလိုက်ပြီ။ အသက်မလျော့ပါဘူး။`); playTone(true)
  }

  return <main className={`arcade-shell ${screen !== 'game' ? 'landing-shell' : 'viewport-game'}${over ? ' round-finished' : ''}`}>
    <header className="topbar">
      <a className="brand" href="/" aria-label={ui("Burma Word Quest · Home")} onClick={event => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); window.history.pushState({}, '', '/'); leaderboardReturn.current = 'landing'; setSetupMode(null); setScreen('landing') } }}><img className="brand-mark" src="/brand.svg" width="44" height="44" alt="" /><span>BURMA<span className="brand-sub">WORD QUEST</span></span></a>
      <div className="header-controls">
        <button className="header-locale" type="button" aria-label={ui(t('Switch to Myanmar', 'Switch to English'))} title={ui(t('Switch to Myanmar', 'အင်္ဂလိပ်လို ပြောင်းမယ်'))} onClick={() => setLocale(locale === 'en' ? 'my' : 'en')}><span lang="en" className={locale === 'en' ? 'locale-active' : ''}>{ui("EN")}</span><span aria-hidden="true">/</span><span lang="my" className={locale === 'my' ? 'locale-active' : ''}>{ui("MM")}</span></button>
        <ShortcutHelp />
        <a className="header-icon" href="/leaderboard" aria-label={ui(t("Leaderboard", "အဆင့်စာရင်း"))} title={ui(t("Leaderboard", "အဆင့်စာရင်း"))} aria-current={screen === 'leaderboard' ? 'page' : undefined} onClick={event => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); openPage('leaderboard') } }}><BarChartIcon width={24} height={24} aria-hidden="true" /></a>
        <a className="header-icon" href="/about" aria-label={ui(t("About & Credits", "အကြောင်းနှင့် ကျေးဇူးတင်လွှာ"))} title={ui(t("About & Credits", "အကြောင်းနှင့် ကျေးဇူးတင်လွှာ"))} aria-current={screen === 'about' ? 'page' : undefined} onClick={event => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); openPage('about') } }}><InfoCircledIcon width={24} height={24} aria-hidden="true" /></a>
        <button className="header-sound" aria-label={ui(sound ? t('Mute sound', 'အသံ ပိတ်မယ်') : t('Enable sound', 'အသံ ဖွင့်မယ်'))} title={ui(sound ? t('Mute sound', 'အသံ ပိတ်မယ်') : t('Enable sound', 'အသံ ဖွင့်မယ်'))} aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? <SpeakerLoudIcon width={24} height={24} aria-hidden="true" /> : <SpeakerOffIcon width={24} height={24} aria-hidden="true" />}</button>
        <HeaderAccount user={session?.user} onLogout={logout} onAccount={() => setPanel('account')} onFeedback={() => setPanel('feedback')} onProfile={() => openPage(`players/${session.user.id}`)} />
      </div>
    </header>
    {screen === 'myanmar-game' ? authReady ? <MyanmarChallenge key={statsKey} mode={statsKey} userId={session?.user.id || null} blocked={Boolean(panel)} onExit={() => { setSetupMode(null); setScreen('landing') }} saveResult={saveChallengeResult} cloudMessage={cloudMessage} pendingCloud={pendingCloud} retryCloud={retryCloud} /> : <p role="status">{ui("ပွဲကို ပြင်ဆင်နေပါတယ်…")}</p> : screen === 'profile' ? <PlayerProfile key={profileId} playerId={profileId} userId={session?.user.id} onBack={closePage} headingRef={screenTitle} /> : screen === 'leaderboard' ? <LeaderboardPage initialMode={statsKey} userId={session?.user.id} onBack={closePage} headingRef={screenTitle} onProfile={id => openPage(`players/${id}`)} /> : screen === 'about' ? <section className="about-page" aria-labelledby="about-title"><button className="setup-back" onClick={closePage}>{ui(t("← Back", "← နောက်သို့"))}</button><h1 id="about-title" ref={screenTitle} tabIndex={-1}>{ui("About & Credits")}</h1><AboutCredits /></section> : screen === 'landing' ? <section className="landing-page" aria-labelledby="landing-title">
      <div className="landing-intro"><span className="eyebrow">{ui("BURMA WORD QUEST")}</span><h1 id="landing-title" ref={screenTitle} tabIndex={-1}>{ui(t("What will you play today?", "ဒီနေ့ ဘာကစားမလဲ?"))}</h1><p>{ui(t("Discover English words, Myanmar slang, and the wisdom in Burmese proverbs.", "ကစားချင်တဲ့ mode ကို ရွေးပြီး စတင်လိုက်ပါ။"))}</p><p className="start-shortcuts-help"><kbd>1</kbd>{ui(" English · ")}<kbd>2</kbd>{ui(" Slang · ")}<kbd>3</kbd>{ui(" စကားပုံ ")}<span>{ui(t("You can also move with Tab and select with Enter.", "Tab နဲ့ ရွှေ့ပြီး Enter နဲ့လည်း ရွေးနိုင်ပါတယ်။"))}</span></p></div>
      <div className="challenge-resume-links">{[['slang', t("Myanmar Slang", "မြန်မာ Slang")], ['proverb-choice', 'စကားပုံ · ရွေးဖြေ'], ['proverb-input', 'စကားပုံ · ရိုက်ဖြေ']].filter(([id]) => { const saved = readStored(`assembly-challenge-v1:${id}`); return saved.id && saved.phase !== 'finished' && saved.userId === (session?.user.id || null) }).map(([id, label]) => <button key={id} data-shortcut={String(4 + ['slang', 'proverb-choice', 'proverb-input'].indexOf(id))} onClick={() => newGame(category, difficulty, id === 'slang' ? 'slang' : 'proverb', id === 'proverb-input' ? 'input' : 'choice')}>{ui(label)}{ui(" · ပြန်ဆက်မယ် →")}</button>)}</div>
      <div className="game-mode-cards" aria-label={ui("Game mode")}>
        {[
          ['english', 'A–Z', 'English Words', t("Read the Burmese clue and guess the English word one letter at a time.", "မြန်မာလို clue ဖတ်ပြီး အင်္ဂလိပ်စကားလုံးကို တစ်လုံးချင်း ခန့်မှန်းပါ။")],
          ['slang', 'က', t("Myanmar Slang", "မြန်မာ Slang"), t("Look at the meaning and type the Burmese slang word.", "ပေးထားတဲ့ အဓိပ္ပာယ်ကို ကြည့်ပြီး မြန်မာဗန်းစကားကို ရိုက်ဖြေပါ။")],
          ['proverb', 'စကားပုံ', t("Burmese proverbs", "မြန်မာစကားပုံ"), t("Read the proverb and fill in the blank.", "စကားပုံရဲ့ အစတစ်ဝက်ကို ကြည့်ပြီး ကွက်လပ်ကို ဖြည့်ပါ။")],
        ].map(([id, , label, description], index) => <button data-shortcut={String(index + 1)} className={`game-mode-card mode-card-${id}`} key={id} onClick={() => { setSetupMode(id); setScreen('setup') }}><span className="mode-card-copy"><strong>{ui(label)}</strong><span className="mode-card-description">{ui(description)}</span><span className="mode-card-action">{ui(t("Choose this mode", "ဒီ mode ရွေးမယ်"))} <kbd className="start-shortcut-key">{index + 1}</kbd><span aria-hidden="true">→</span></span></span><GameModeArt mode={id} /></button>)}
      </div>
      <footer className="creator-credit">{ui("Inspired by ")}<a href="https://github.com/Jeff307-kib/End-Game" target="_blank" rel="noreferrer">{ui("Jeff307-kib (Sai Wanna Tun)")}</a><span>{ui("Additional development by Sann Lynn Htun")}</span><button className="text-button" onClick={() => openPage('about')}>{ui("About & Credits")}</button></footer>
    </section> : screen === 'setup' ? <section className="landing-page setup-page" aria-labelledby="setup-title">
      <button className="setup-back" onClick={() => setScreen('landing')}>{ui(t("← Back", "← နောက်သို့"))}</button>
      <p className="start-shortcuts-help"><kbd>{ui("Enter")}</kbd>{ui(" စကစားမယ် · ")}<kbd>{ui("Esc")}</kbd>{ui(" နောက်သို့")}</p>
      <form id="game-setup" className="game-setup" onSubmit={event => { event.preventDefault(); changeSettings(setupCategory, setupDifficulty, setupMode, setupPlay); if (setupCategory === category && setupDifficulty === difficulty && setupMode === mode && setupPlay === proverbPlay) newGame(setupCategory, setupDifficulty, setupMode, setupPlay) }}>
        <h1 id="setup-title" ref={screenTitle} tabIndex={-1}>{ui(setupMode === 'english' ? 'English Words' : setupMode === 'slang' ? t("Myanmar Slang", "မြန်မာ Slang") : t("Burmese proverbs", "မြန်မာစကားပုံ"))} {ui(t("· Game setup", "ကစားဖို့ ပြင်ဆင်မယ်"))}</h1>
        {setupMode === 'english' ? <><label className="category-label" htmlFor="setup-category">{ui(t("Category", "အမျိုးအစား"))}</label><select id="setup-category" value={setupCategory} onChange={event => setSetupCategory(event.target.value)}>{categories.map(item => <option key={item.id} value={item.id}>{ui(item.name)}</option>)}</select><fieldset className="difficulty-picker"><legend>{ui(t("Difficulty", "အခက်အခဲအဆင့်"))}</legend><div className="difficulty-options">{difficulties.map(item => <button type="button" key={item.id} aria-pressed={setupDifficulty === item.id} onClick={() => setSetupDifficulty(item.id)}>{ui(item.name)}</button>)}</div></fieldset></> : <><p>{ui(t("Category", "အမျိုးအစား"))} — {ui(setupMode === 'slang' ? 'မြန်မာဗန်းစကား' : t("Burmese proverbs", "မြန်မာစကားပုံ"))}{ui(t(". This mode has no difficulty levels.", "။ ဒီ mode မှာ အခက်အခဲအဆင့် ခွဲမထားပါ။"))}</p>{setupMode === 'proverb' && <fieldset className="mode-picker"><legend>{ui(t("Answer mode", "ဖြေနည်း"))}</legend><div>{[['choice', t('Multiple choice', 'ရွေးဖြေမယ်')], ['input', t('Type the answer', 'ရိုက်ဖြေမယ်')]].map(([id, label]) => <button type="button" key={id} aria-pressed={setupPlay === id} onClick={() => setSetupPlay(id)}>{ui(label)}</button>)}</div></fieldset>}</>}
        <p>{ui(setupMode === 'english' ? t('8 lives. One free hint. No time limit.', 'မှားခွင့် ၈ ကြိမ်။ Hint အခမဲ့ တစ်ကြိမ်။ အချိန်ကန့်သတ်ချက် မရှိပါ။') : t(`Play all ${setupMode === "slang" ? slangWords.length : proverbCount} questions with 3 lives. Each wrong answer or skip costs one life. Only answering time counts; reading and pauses are excluded. Pause and resume later in this browser.`, `မေးခွန်း ${setupMode === 'slang' ? slangWords.length : proverbCount} ခုလုံးကို တစ်ပွဲတည်း ကစားမယ်။ ပွဲတစ်ပွဲလုံးအတွက် အသက် ၃ ခု။ မှားဖြေခြင်း သို့မဟုတ် ကျော်ခြင်းတိုင်း အသက် ၁ ခု လျော့ပါမယ်။ အဖြေဖတ်ချိန်နဲ့ Pause အချိန်ကို ဖယ်ပြီး ဖြေချိန်ပဲ ရေတွက်ပါတယ်။ ဒီ browser မှာ ခဏနားပြီး ပြန်ဆက်နိုင်ပါတယ်။`))}</p><button className="next-game" type="submit">{ui(t("Start playing →", "စကစားမယ် →"))}</button>
        {setupMode === 'proverb' && <p className="proverb-credit">{ui(proverbCredit)}</p>}
        {setupMode === 'slang' && <SlangCredit />}
      </form>
    </section> : <section className={`game-board ${isMyanmar ? 'myanmar-board' : 'english-board'}`} aria-label={ui("Burma Word Quest game")}>
      <div className="board-top"><span className="eyebrow">{ui(isProverb ? `စကားပုံ · ${ui(proverbPlay === 'choice' ? 'ရွေးဖြေ' : 'ရိုက်ဖြေ')}` : isSlang ? 'MYANMAR SLANG' : `${ui(activeCategory.label)} · ${ui(activeDifficulty.name)}`)}</span><span className="round-timer" aria-label={ui("ပွဲကစားချိန်")}>{ui("အချိန် ")}{formatTime(elapsedMs)}</span><span className="compact-stats">{ui("Streak ")}{ui(record.streak)}{ui(" · Best ")}{ui(record.best)}</span></div>
      <div className="life-heading"><span>{ui("ကျန်တဲ့ မှားခွင့်")}</span><strong className={remainingLives <= (isMyanmar ? 1 : 2) ? 'danger' : ''}>{remainingLives}<span> / {maxLives}</span></strong></div>
      <Lives remaining={remainingLives} total={maxLives} label={ui(`မှားခွင့် ${remainingLives} ကြိမ်ကျန်`)} />
      {!isMyanmar && <div className="language-chips">{languages.map((language,index) => <span key={language.name} className={`chip ${index < wrong ? 'lost' : ''}`} style={{'--chip-color':language.backgroundColor}}>{language.name}</span>)}</div>}
      <div className="puzzle-space">
        {isProverb ? <div className="slang-word-area proverb-prompt" lang="my"><span className="eyebrow">{ui("ကွက်လပ်ကို ဖြည့်ပါ")}</span><p className={puzzle.word.length > 80 ? 'long-proverb' : ''}>{puzzle.prefix}<span className="proverb-blank">{ui(over ? ' ' + puzzle.suffix : ' ______')}</span>{puzzle.trailing ? ' ' + puzzle.trailing : ''}</p>{hintUsed && !over && <small>{ui("အစ — ")}{puzzle.hint}…</small>}</div> : isSlang ? <div className="slang-word-area"><span className="eyebrow">{ui("မြန်မာဗန်းစကားကို ရိုက်ဖြေပါ")}</span><p>{over ? puzzle.word : hintUsed ? puzzle.hint + '…' : ui('ဘယ်စကားလုံးလဲ?')}</p></div> : <div className="word-area"><span className="eyebrow">{puzzle.word.length}{ui(" LETTERS")}</span><div className={'word ' + (puzzle.word.length > 10 ? 'compact' : '')} aria-label={ui("ခန့်မှန်းရမယ့် စကားလုံး")}>{[...puzzle.word].map((letter,index) => <span key={index} className={guessed.includes(letter) ? 'revealed' : lost ? 'missed' : ''}>{guessed.includes(letter) || lost ? letter.toUpperCase() : <span className="blank-mark"/>}</span>)}</div></div>}
      </div>
      <div className={'status ' + (won ? 'won' : lost ? 'failed' : '')} data-instruction={!over && isMyanmar && (message === 'ပြထားတဲ့တစ်ဝက်ကို ကြည့်ပြီး ကွက်လပ်ကို ဖြည့်ပါ။' || message === 'မြန်မာ keyboard နဲ့ အဖြေအပြည့်ရိုက်ပါ။')} role="status" aria-live="polite">{ui(won ? 'ကယ်တင်နိုင်ပြီ! နောက်တစ်ပွဲ ဆက်ကစားမယ်။' : lost ? `အဖြေ — ${puzzle.word}` : message)}</div>
      {!over && <div className="hint-panel"><p>{isProverb ? ui('တစ်ဝက်ကို hint အဖြစ် ပြထားပါတယ်။') : clueShown ? puzzle.clue : ui('ခက်နေပြီလား? Clue ကို အခမဲ့ ကြည့်ပါ။')}</p><div className="hint-actions">{!isProverb && <button disabled={clueShown} onClick={() => setClueShown(true)}>{ui("Clue ကြည့်မယ်")}</button>}<button disabled={hintUsed} onClick={revealLetter}>{ui(hintUsed ? 'Hint သုံးပြီး' : isMyanmar ? 'အစ ဖော်မယ်' : 'Letter ဖော်မယ်')}</button></div></div>}
      {!over && <div className="surrender-action"><button className="text-button surrender-button" onClick={() => setPanel('surrender')}>{ui("အဖြေကြည့်ပြီး အရှုံးပေးမယ်")}</button></div>}
      {!over && (isProverb && proverbPlay === 'choice' ? <div className="proverb-options" aria-label={ui("ကျန်တစ်ဝက် ရွေးပါ")}>{puzzle.options.map(option => <button key={option} disabled={wrongAnswers.includes(normalizeSlang(option))} className={wrongAnswers.includes(normalizeSlang(option)) ? 'incorrect' : ''} onClick={() => checkAnswer(option)}>{option}</button>)}</div> : isMyanmar ? <form className="slang-form" onSubmit={submitAnswer}><label className="sr-only" htmlFor="slang-answer">{ui("သင့်အဖြေ")}</label><div><input id="slang-answer" ref={answerInput} value={answer} onChange={event => setAnswer(event.target.value)} onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }} onKeyDown={event => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || composing.current || event.keyCode === 229)) event.preventDefault() }} placeholder={ui(isProverb ? 'ကျန်တစ်ဝက်ကို ရိုက်ပါ…' : 'မြန်မာလို ရိုက်ပါ…')} lang="my" autoComplete="off" spellCheck={false} maxLength={500}/><button className="next-game" type="submit" disabled={!answer.trim()}>{ui("စစ်မယ်")}</button></div></form> : <div className="keyboard" role="group" aria-label={ui("စာလုံးရွေးပါ")}><p className="play-controls-help">{ui("A–Z · Type a letter or tap a key / စာလုံးကို နှိပ်ပါ")}</p>{['qwertyuiop','asdfghjkl','zxcvbnm'].map(row => <div className="keyboard-row" key={row}>{[...row].map(letter => <button key={letter} disabled={guessed.includes(letter)} className={guessed.includes(letter) ? puzzle.word.includes(letter) ? 'correct' : 'wrong' : ''} aria-label={ui(`Letter ${letter.toUpperCase()}`)} onClick={() => guess(letter)}>{letter.toUpperCase()}</button>)}</div>)}</div>)}
      {over && <div className="result-summary"><p>{puzzle.word}</p><p className="answer-meaning"><strong>{ui("အဓိပ္ပာယ်")}</strong>{puzzle.meaning}</p>{isProverb && <p className="proverb-credit">{ui(proverbCredit)}</p>}{isSlang && <SlangCredit />}{cloudMessage && <small role="status">{ui(cloudMessage)}{pendingCloud && <button className="text-button" onClick={retryCloud}>{ui("ပြန်သိမ်းမယ်")}</button>}</small>}</div>}
      {over && <footer className="board-footer"><button className="next-game" onClick={() => newGame()}>{ui("နောက်တစ်ပွဲ ကစားမယ် →")}</button></footer>}
    </section>}
    {panel === 'account' && <Panel title={ui(session ? 'သင့်ကစားသူနာမည်' : 'နာမည်ထည့်ပြီး စကစားပါ')} onClose={() => setPanel(null)}><Account session={session} confirmGoogleName={googleSetup} onPlayerReady={userId => { if (screen === 'game') newGame(category, difficulty, mode, proverbPlay, userId); else { setPanel(null); setGoogleSetup(false) } }}/></Panel>}
    {panel === 'surrender' && <Panel className="confirm" title={ui("အရှုံးပေးမလား?")} onClose={() => setPanel(null)}><p>{ui("ဒီပွဲကို အရှုံးပေးပြီး အဖြေကြည့်မလား? အရှုံးအဖြစ် မှတ်တမ်းဝင်ပြီး လက်ရှိ streak ပြတ်ပါမယ်။")}</p><button onClick={() => setPanel(null)}>{ui("ဆက်ကြိုးစားမယ်")}</button><button className="next-game" onClick={() => { setSurrendered(true); setPanel(null) }}>{ui("အဖြေကြည့်ပြီး အရှုံးပေးမယ်")}</button></Panel>}
    {panel === 'feedback' && <Panel title={ui("Feedback ပေးမယ်")} onClose={() => setPanel(null)}><Feedback key={session?.user.id || 'guest'} session={session} onSignIn={() => setPanel('account')}/></Panel>}
    {screen === 'game' && won && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && <ReactConfetti recycle={false} numberOfPieces={80} style={{position:'fixed',pointerEvents:'none'}}/>}
    {pendingSettings && <Panel className="confirm" title={ui("ပွဲအသစ် ပြန်စမလား?")} onClose={() => setPendingSettings(null)}><p>{ui("လက်ရှိပွဲကို ရပ်ပြီး ရွေးထားတဲ့ပုံစံနဲ့ ပွဲအသစ် စပါမယ်။")}</p><button onClick={() => { setPendingSettings(null); setScreen('game') }}>{ui("လက်ရှိပွဲ ဆက်ကစားမယ်")}</button><button className="next-game" onClick={() => newGame(pendingSettings.category,pendingSettings.difficulty,pendingSettings.mode,pendingSettings.play)}>{ui("ပြောင်းပြီး ပွဲအသစ်စမယ်")}</button></Panel>}
  </main>
}
