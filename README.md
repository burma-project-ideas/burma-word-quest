# Burma Word Quest

A word challenge game featuring English vocabulary, Myanmar slang, and Burmese proverbs. Built with React, Vite, and Supabase, with an installable PWA and offline guest play after caching.

[Repository](https://github.com/burma-project-ideas/burma-word-quest) · [Live app](https://swnt-end-game.vercel.app/)

The existing live domain was publicly accessible on 7 November 2026. It is retained to preserve browser progress and authentication redirects.

## Playing

Choose a mode, review its rules, and start. No account is required for local play. The interface defaults to Myanmar and remembers the English/Myanmar selection. Translation is partial: clues, explanations, some controls, and source content remain Burmese.

| Mode | Input | Rules and output |
| --- | --- | --- |
| English Words | Guess letters on screen or using a physical keyboard | 240 words across four categories and three difficulties; eight lives and one free hint per round. Reveals answers and meanings; tracks local wins and streaks. |
| Myanmar Slang | Type the Burmese slang word described by its meaning | A shuffled, non-repeating deck of 20 entries with three shared lives. |
| Proverbs: choice | Choose the missing second half | 869 playable proverbs with the first half visible. |
| Proverbs: input | Type the missing second half | The same proverb dataset with a separate run and ranking. |

In Myanmar challenges, each wrong answer or skip consumes a life and reveals the answer. Correct answers preserve lives. Runs end on deck completion, life exhaustion, or explicit Stop. Checkpoints let players pause and resume in the same browser. Only active answer time counts; reading explanations, pauses, background tabs, and account dialogs are excluded. English rounds use wall-clock round timing, including time in other panels or background tabs.

Open the `?` help dialog for keyboard shortcuts. On the home screen, `1`, `2`, and `3` choose modes; Tab and Enter navigate and activate controls. Typed Myanmar answers require a Myanmar keyboard.

## Accounts and saved results

The app implements nickname-only anonymous accounts, email/password accounts, and Google sign-in. Availability depends on Supabase provider settings. Earlier setup notes record Google enabled and anonymous sign-ins/manual identity linking disabled; this rebrand does not change those administrative settings.

Signed-in results enter a UUID-based retry outbox. Challenge progress can publish while paused; final results are immutable. Each player's best challenge run ranks by correct count descending, then active time ascending. English rankings retain wins/time/streak ordering. Results belong to the identity captured at run start; guest history is not automatically uploaded.

`/leaderboard` shows rankings. `/players/<player UUID>` is a shareable public profile with a 365-day correct-answer chart grouped by Myanmar date. Public profile RPCs return IDs, display names, and aggregate activity without email or authentication metadata. Feedback requires an authenticated player and allows one submission per Myanmar calendar day.

## Local setup

Use a current Node.js LTS release with npm. Node.js 24 was used for verification.

```sh
npm ci
npm run dev
```

The frontend includes the existing Supabase URL and a browser-safe publishable key. For your own backend, create an untracked `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never put service-role keys, database passwords, or OAuth secrets in `VITE_` variables. Configure row-level security and RPCs before using online features. Update the Supabase hostname allowed by the CSP in `vercel.json` when using another backend.

See [Supabase setup](supabase/README.md) and [Google setup](supabase/GOOGLE_SETUP.md). For a new database, review and apply every file in `supabase/migrations/` in filename order, from `202610140001_game_leaderboard.sql` through `202610170008_legacy_result_execute_permissions.sql`. They cover rankings, feedback, timing, challenges, paused snapshots, activity, submission limits, and legacy RPC permissions. Do not reset an existing production database. Configure provider credentials and the actual site/redirect URLs in the provider dashboards.

## Structure

| Path | Purpose |
| --- | --- |
| `src/App.jsx` | Navigation, English game, setup, and account panels |
| `src/components/MyanmarChallenge.jsx` | Slang and proverb challenge screens |
| `src/challenge.js`, `src/challengeOutbox.js` | Challenge transitions, checkpoint validation, and queued snapshots |
| `src/gameData.js`, `src/slangData.js`, `src/proverbs.json` | Vocabulary, clues, and proverb data |
| `src/useGameAccount.js`, `src/supabase.js` | Authentication, result retries, and backend client |
| `src/components/LeaderboardPage.jsx`, `src/components/PlayerProfile.jsx` | Rankings and public activity |
| `src/index.css`, `src/mobile.css`, `src/theme.css` | Layout, mobile behavior, and navy/mint styling |
| `public/` | Brand artwork, fonts, PWA icons, legal pages, and social preview |
| `scripts/` | Tests and artwork generation |
| `supabase/` | Migrations, SQL tests, and provider setup |

## Checks and build

```sh
node --test scripts/*.test.mjs
npm run lint
npm run build
npm run preview
```

The build emits `dist/`, a PWA manifest, and a service worker. Regenerate the logo, install icons, and social preview with `npm run generate:pwa-icons` after editing `public/brand.svg` or the artwork script. Editing inline JSON-LD in `index.html` requires updating its SHA-256 hash in `vercel.json`; the security-header test checks this.

SQL checks in `supabase/tests/` require a configured database. Review fixture and rollback behavior before running them. Frontend tests do not establish that production migrations or provider settings are correct.

## Deployment

Connect the destination repository to Vercel using `npm run build` and output directory `dist`. The configuration supplies security headers and direct-entry rewrites for `/leaderboard`, `/about`, and `/players/:id`. Other hosts need equivalent routing while serving real assets, `/privacy.html`, and `/terms.html` directly. HTTPS is required for deployed PWA installation and service workers.

Retain `https://swnt-end-game.vercel.app/` unless a replacement is deliberately configured. Browser storage does not follow a domain change. When changing domains, update canonical/social URLs, legal-page links, Supabase Site URL/redirects, Google OAuth origins, and catalogs together.

After transfer, verify the Vercel GitHub App can access the organization repository and the existing Vercel project is linked to it. Preserve environment variables and domains. Vercel administrative access requires an authenticated connection; a local build alone does not verify automatic deployment.

## Design and compatibility

The app uses navy surfaces, mint actions, a speech-tile wordmark, consistent panel borders, and responsive challenge cards. Styling is app-specific CSS reusing existing components and Radix icons. No external UI template or dependency was added.

Myanmar rendering, focus indicators, keyboard shortcuts, dialogs, and reduced-motion CSS are retained. There is one dark theme. Original `assembly-*` storage keys and PWA app ID `/` remain stable to preserve progress and preferences on the same origin.

## Limitations

- Rankings are casual and client-reported, unsuitable for trusted competition or prizes.
- Accounts, feedback, rankings, and cloud saves require network access. During verification on 7 November 2026, the configured Supabase hostname did not resolve from the test environment and the live leaderboard displayed its connection-error state. Sign-in and cloud writes remain unverified. Offline play requires an initial successful visit and completed caching.
- Clearing browser storage removes local checkpoints, guest history, and unsent results. Another device or origin does not share them.
- Translation is incomplete; source datasets may need editorial corrections. Dataset total changes require matching database validation updates.
- The build currently triggers Vite's chunk-size warning.
- The inherited dependency installation reports nine audit findings (three low, six moderate); dependency upgrades are outside this rebrand.

## Credits and source terms

- Original creator and inspiration: **Sai Wanna Tun**, historically credited as **Jeff307-kib**, now [SaiWunnaTun-KP/End-Game](https://github.com/SaiWunnaTun-KP/End-Game). The original project is **Assembly: End-Game**; its Git history and fork relationship are retained.
- Additional development and adaptations: **[Sann Lynn Htun](https://github.com/sannlynnhtun-coding)**, including Myanmar modes, Burmese clues, categories/difficulty, mobile layout, Google sign-in, timed rankings, feedback, PWA support, and Burma Word Quest.
- Myanmar slang: **[Ban Sagar (ဗန်းစကား)](https://bansagar.com/)**; clues were rewritten for the game.
- Myanmar proverbs: **Dr. Win Thein's website**, as credited in the original dataset; the organization's [Myanmar Proverbs source credits](https://github.com/burma-project-ideas/myanmar-proverbs#readme) provide further context.
- Mobile reading font: **Noto Sans Myanmar**, with its [SIL Open Font License](public/fonts/noto-sans-myanmar-OFL.txt).
- Existing YoeShin and Octagon fonts are retained from the source repository; redistribution notices were not found in this checkout.

No repository-wide license was found in this project or upstream at the time of the rebrand. Attribution and public source availability do not establish permission to redistribute all code, datasets, or fonts. Confirm source terms before reuse; this change does not assign a license to inherited material.
