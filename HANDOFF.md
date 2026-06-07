# Handoff: worldcup2026

このファイルは、新しいCodexチャットを `/Users/m1max/Desktop/dev/codex_test/worldcup2026` で開き直すための引き継ぎメモです。

## Project

- Repository: `onihachi/worldcup2026`
- Local path: `/Users/m1max/Desktop/dev/codex_test/worldcup2026`
- Public GitHub Pages URL: https://onihachi.github.io/worldcup2026/
- CDN fallback URL: https://cdn.jsdelivr.net/gh/onihachi/worldcup2026@main/index.html
- GitHub Pages source: `main` branch, `/` root
- Pages status at handoff: `built`

## Current Files

- `index.html`
  - Standalone static HTML.
  - Contains all CSS, JavaScript, and match data inline.
  - Lists all 104 FIFA World Cup 2026 matches.
  - Columns: match number, date, kickoff time in Japan, stage, group, match card, venue, broadcaster/streaming provider, notes.
  - Includes filters for search, stage, provider, and Japan matches.
- `README.md`
  - Short project description, public URLs, and basic publish commands.
- `HANDOFF.md`
  - This file.

## Current Git State

At the time of this handoff, the local repository was clean and tracking:

```sh
main...origin/main
```

The repository has local Git user config set to:

```sh
user.name=onihachi
user.email=152955272+onihachi@users.noreply.github.com
```

## GitHub / CLI

`gh` CLI is installed and authenticated as `onihachi`.

Useful checks:

```sh
gh auth status
gh repo view onihachi/worldcup2026 --json nameWithOwner,url,defaultBranchRef,visibility
gh api repos/onihachi/worldcup2026/pages --jq '{status:.status, html_url:.html_url, source:.source}'
```

## Publish Workflow

After editing:

```sh
git status --short
git add index.html README.md HANDOFF.md
git commit -m "Update schedule"
git push origin main
```

GitHub Pages publishes automatically from `main`.

## Verification

Before committing meaningful HTML changes, run:

```sh
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
for (const script of scripts) new Function(script);
const matchBlock = html.match(/const matches = (\[[\s\S]*?\]);/);
if (!matchBlock) throw new Error('matches block not found');
const matches = Function(`return ${matchBlock[1]}`)();
console.log(JSON.stringify({
  scripts: scripts.length,
  matches: matches.length,
  first: matches[0].no,
  last: matches.at(-1).no
}, null, 2));
NODE
```

Expected:

```json
{
  "scripts": 1,
  "matches": 104,
  "first": 1,
  "last": 104
}
```

## Data Notes

Research used for the original page:

- FIFA official schedule PDF:
  - https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf
- FIFA Inside schedule article:
  - https://inside.fifa.com/organisation/news/updated-world-cup-2026-match-schedule-now-available
- DAZN Japan rights:
  - https://dazngroup.com/press-room/251204/
- Dentsu release:
  - https://kyodonewsprwire.jp/prwfile/release/M101216/202512030307/_prw_PR1fl_88QT5542.pdf
- JFA Japan match broadcast page:
  - https://www.jfa.jp/samuraiblue/worldcup_2026/tv.html
- NTV broadcast schedule:
  - https://www.ntv.co.jp/FIFAworldcup2026/articles/5505vd19787pv9f0fche.html
- Fuji TV broadcast schedule:
  - https://www.fujitv.co.jp/fujitv/news/20260494.html
- NHK announcement citation:
  - https://news.mynavi.jp/article/20251204-3760153/

Important interpretation:

- FIFA PDF uses venue-local date columns but ET kickoff times inside match cards.
- The current `index.html` already contains the converted Japan kickoff times.
- DAZN and NHK BS Premium 4K are shown for all 104 matches.
- NTV semifinal coverage is represented on both M101 and M102 with the note `準決勝のいずれか一方`, because the exact semifinal slot was not fixed.
- Fuji TV has 10 planned slots, but only 5 fixed group-stage cards were known at creation time.

## Suggested Next Improvements

- Add Open Graph metadata for nicer social sharing.
- Add a small "last updated" source note near the top.
- Add mobile-friendly card view below a certain width if table scrolling feels cramped.
- Split match data into `matches.js` only if editing the inline HTML becomes annoying.
