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
  - Visible row/card fields are condensed to date+kickoff time, match card with group suffix, small venue text, and broadcaster/streaming provider chips.
  - Finished matches can display a final score plus a highlight card with thumbnail and play overlay.
  - Includes filters for search, stage, provider, and Japan matches.
  - Includes description/canonical/Open Graph/Twitter summary metadata.
  - Uses a responsive card-style layout for match rows below 720px viewport width.
  - Hides the top broadcaster-count summary cards on mobile.
  - Hides the filter/search toolbar on mobile so the page opens directly into match cards.
  - Shows a top-of-page last-updated data note.
  - Keeps rows in chronological order, then scrolls the first view to the first today-or-later match so past matches are available by scrolling upward.
- `README.md`
  - Short project description, public URLs, basic publish commands, and the free update flow.
- `HANDOFF.md`
  - This file.
- `scripts/update-free-data.mjs`
  - Free fallback updater for GitHub Actions.
  - Reads ESPN's public FIFA World Cup scoreboard endpoint and updates final scores by matching kickoff UTC.
  - Applies only curated Japan-viewable highlight links from `data/highlights.json`; local runs check URLs by default, while GitHub Actions skips link checks to avoid DAZN bot/IP blocking.
- `scripts/preflight-update-needs.mjs`
  - Token-saving preflight for Mac/Codex heartbeat runs.
  - Prints concise `resultUpdates`, `highlightGaps`, `unsyncedCuratedHighlights`, `inProgress`, and `recommendedAction` lines.
  - Run this first and only do web/highlight research for listed `highlightGaps` matches.
- `scripts/validate-page.mjs`
  - Reusable static page validation used locally and in GitHub Actions.
- `data/highlights.json`
  - Small curated list of confirmed Japan-viewable highlight links for the free fallback.
  - Update this whenever the Mac/Codex primary run adds a highlight to `index.html`; otherwise the GitHub fallback can add scores but cannot discover brand-new highlight videos.
- `.github/workflows/free-fallback-update.yml`
  - No-cost GitHub Actions fallback.
  - Runs at 8:20, 13:10, and 19:10 JST, after the Mac-first update windows.
  - Commits and pushes only when `index.html` has a real data change.

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
git add index.html README.md HANDOFF.md scripts/update-free-data.mjs scripts/preflight-update-needs.mjs scripts/validate-page.mjs data/highlights.json .github/workflows/free-fallback-update.yml
git commit -m "Update schedule"
git push origin main
```

GitHub Pages publishes automatically from `main`.

## Free Update Workflow

Primary path:

- The Mac/Codex heartbeat automation runs at 7:00, 12:00, and 18:00 JST.
- Start with `git pull --ff-only origin main`, then `node scripts/preflight-update-needs.mjs`.
- If `recommendedAction=NONE`, stop without web searches, validation, commits, or user notification.
- If only result or curated-highlight updates are listed, run `node scripts/update-free-data.mjs`, validate, commit, and push without web searches.
- Only perform web/highlight research for the exact matches listed under `highlightGaps`.
- It should remain the main path because it can confirm Japan-viewable highlights, update notes, validate, commit, and push when the preflight says work is needed.
- If the Mac is asleep, that local heartbeat will not run until the Mac wakes.

Fallback path:

- GitHub Actions runs `.github/workflows/free-fallback-update.yml` at 8:20, 13:10, and 19:10 JST.
- This is intended as insurance after the Mac-first windows, not the main updater.
- It uses only free public HTTP data and the standard free GitHub-hosted runner for this public repository.
- It updates final scores from ESPN's public scoreboard endpoint.
- It does not do open-ended AI/web research for new highlights. It only applies highlights already curated in `data/highlights.json`, which should be updated when the Mac/Codex run verifies a DAZN Japan or other Japan-viewable highlight.
- The workflow runs `node scripts/update-free-data.mjs --skip-link-check` because DAZN can block GitHub-hosted runner link probes even when the same URL is valid in Japan/local checks.
- It commits only when `index.html` changes.

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

Or run:

```sh
node scripts/preflight-update-needs.mjs
node scripts/update-free-data.mjs --dry-run
node scripts/validate-page.mjs
git diff --check
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
- DAZN Japan highlight listing:
  - https://www.dazn.com/ja-JP/home
- ESPN public FIFA World Cup scoreboard endpoint:
  - https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260720&limit=200
- SportsNavi DAZN highlight pages:
  - https://sports.yahoo.co.jp/video/player/26512344
  - https://sports.yahoo.co.jp/video/player/26521872
  - https://sports.yahoo.co.jp/video/player/26523828
  - https://sports.yahoo.co.jp/video/player/26520258
  - https://sports.yahoo.co.jp/video/player/26520765
  - https://sports.yahoo.co.jp/video/player/26532702
  - https://sports.yahoo.co.jp/video/player/26530908
  - https://sports.yahoo.co.jp/video/player/26531223
  - https://sports.yahoo.co.jp/video/player/26536455
  - https://sports.yahoo.co.jp/video/player/26549043
  - https://sports.yahoo.co.jp/video/player/26545203
  - https://sports.yahoo.co.jp/video/player/26549046
  - https://sports.yahoo.co.jp/video/player/26545128
  - https://sports.yahoo.co.jp/video/player/26559492
  - https://sports.yahoo.co.jp/video/player/26560554
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
- FIFA Canada vs Bosnia-Herzegovina match report:
  - https://www.fifa.com/ja/articles/canada-bosnia-and-herzegovina-highlights-match-report-ja

Important interpretation:

- FIFA PDF uses venue-local date columns but ET kickoff times inside match cards.
- The current `index.html` already contains the converted Japan kickoff times.
- DAZN and NHK BS Premium 4K are shown for all 104 matches.
- NTV semifinal coverage is represented on both M101 and M102 with the note `準決勝のいずれか一方`, because the exact semifinal slot was not fixed.
- Fuji TV has 10 planned slots, but only 5 fixed group-stage cards were known at creation time.
- As of the 2026-06-13 update, M1, M2, and M3 include final scores and DAZN Japan highlight links.
- M4 includes the final score from ESPN and a SportsNavi/DAZN Japan-viewable highlight page.
- As of the 2026-06-14 18:00 JST update, M5 and M6 include final scores from ESPN and SportsNavi/DAZN Japan-viewable highlight pages.
- As of the 2026-06-14 late-morning JST update, M7 and M8 include final scores from ESPN and SportsNavi/DAZN Japan-viewable highlight pages.
- As of the 2026-06-15 7:00 JST update, M10 and M11 include final scores from ESPN and SportsNavi/DAZN Japan-viewable highlight pages.
- As of the 2026-06-15 noon JST update, M9 includes the final score from ESPN and a SportsNavi/DAZN Japan-viewable highlight page; M12 was still at halftime and should be rechecked in the 18:00 run.
- As of the 2026-06-15 18:00 JST update, M12 includes the final score from ESPN and a SportsNavi/DAZN Japan-viewable highlight page.
- As of the 2026-06-16 7:00 JST update, M14 and M16 include final scores from ESPN; SportsNavi/DAZN highlight pages had not surfaced yet and should be rechecked around 12:00.
- As of the 2026-06-16 noon JST update, M14 and M16 include SportsNavi/DAZN Japan-viewable highlight pages; M13 and M15 include final scores from ESPN, but no verified SportsNavi/DAZN highlight had surfaced yet for those two matches.
- As of the 2026-06-16 18:00 JST update, M13 and M15 include SportsNavi/DAZN Japan-viewable highlight pages.
- As of the 2026-06-17 7:00 JST update, M17 and M18 include final scores from ESPN and SportsNavi/DAZN Japan-viewable highlight pages; M19 was still in progress.
- FOX Sports YouTube highlights were removed from the cards because they were not viewable in Japan. Prefer DAZN Japan highlight pages or DAZN Japan YouTube videos for this site. Use other YouTube/rightsholder clips only after confirming Japan availability.
- Keep `data/highlights.json` in sync with newly verified highlight links so the free GitHub fallback can reapply them safely.

## Suggested Next Improvements

- Add an `og:image` asset if richer social cards are needed.
- Split match data into `matches.js` only if editing the inline HTML becomes annoying.
