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
  - Reads ESPN's public FIFA World Cup scoreboard endpoint and updates final scores by matching kickoff UTC plus teams.
  - During the knockout stage, propagates known winners/losers into later bracket placeholders as soon as each source match is complete. Partial next-card names are allowed, e.g. `カナダ vs M75勝者`.
  - Applies only curated Japan-viewable highlight links from `data/highlights.json`; local runs check URLs by default, while GitHub Actions skips link checks to avoid DAZN bot/IP blocking.
- `scripts/preflight-update-needs.mjs`
  - Token-saving preflight for Mac/Codex heartbeat runs.
  - Prints concise `resultUpdates`, `matchupUpdates`, `highlightGaps`, `unsyncedCuratedHighlights`, `inProgress`, and `recommendedAction` lines.
  - `matchupUpdates` includes both ESPN-provided concrete knockout card names and bracket-derived partial winner/loser propagation.
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
  - https://sports.yahoo.co.jp/video/player/26563149
  - https://sports.yahoo.co.jp/video/player/26565921
  - https://sports.yahoo.co.jp/video/player/26575710
  - https://sports.yahoo.co.jp/video/player/26574189
  - https://sports.yahoo.co.jp/video/player/26574168
  - https://sports.yahoo.co.jp/video/player/26578050
  - https://sports.yahoo.co.jp/video/player/26588724
  - https://sports.yahoo.co.jp/video/player/26588745
  - https://sports.yahoo.co.jp/video/player/26589153
  - https://sports.yahoo.co.jp/video/player/26591469
  - https://sports.yahoo.co.jp/video/player/26604537
  - https://sports.yahoo.co.jp/video/player/26602755
  - https://sports.yahoo.co.jp/video/player/26606511
  - https://sports.yahoo.co.jp/video/player/26602023
  - https://sports.yahoo.co.jp/video/player/26614053
  - https://sports.yahoo.co.jp/video/player/26616207
  - https://sports.yahoo.co.jp/video/player/26613303
  - https://sports.yahoo.co.jp/video/player/26618442
  - https://sports.yahoo.co.jp/video/player/26626473
  - https://sports.yahoo.co.jp/video/player/26625885
  - https://sports.yahoo.co.jp/video/player/26628933
  - https://sports.yahoo.co.jp/video/player/26640237
  - https://sports.yahoo.co.jp/video/player/26641800
  - https://sports.yahoo.co.jp/video/player/26645877
  - https://sports.yahoo.co.jp/video/player/26655663
  - https://sports.yahoo.co.jp/video/player/26657361
  - https://sports.yahoo.co.jp/video/player/26659980
  - https://sports.yahoo.co.jp/video/player/26671674
  - https://sports.yahoo.co.jp/video/player/26671707
  - https://sports.yahoo.co.jp/video/player/26672583
  - https://sports.yahoo.co.jp/video/player/26672637
  - https://sports.yahoo.co.jp/video/player/26675265
  - https://sports.yahoo.co.jp/video/player/26675268
  - https://sports.yahoo.co.jp/video/player/26687859
  - https://sports.yahoo.co.jp/video/player/26687898
  - https://sports.yahoo.co.jp/video/player/26689182
  - https://sports.yahoo.co.jp/video/player/26689221
  - https://sports.yahoo.co.jp/video/player/26691498
  - https://sports.yahoo.co.jp/video/player/26691642
  - https://sports.yahoo.co.jp/video/player/26702703
  - https://sports.yahoo.co.jp/video/player/26702706
  - https://sports.yahoo.co.jp/video/player/26704578
  - https://sports.yahoo.co.jp/video/player/26704584
  - https://sports.yahoo.co.jp/video/player/26706975
  - https://sports.yahoo.co.jp/video/player/26707059
  - https://sports.yahoo.co.jp/video/player/26715447
  - https://sports.yahoo.co.jp/video/player/26715483
  - https://sports.yahoo.co.jp/video/player/26716668
  - https://sports.yahoo.co.jp/video/player/26716671
  - https://sports.yahoo.co.jp/video/player/26718471
  - https://sports.yahoo.co.jp/video/player/26718591
  - https://sports.yahoo.co.jp/video/player/26727129
  - https://sports.yahoo.co.jp/video/player/26741319
  - https://sports.yahoo.co.jp/video/player/26742357
  - https://sports.yahoo.co.jp/video/player/26745543
  - https://sports.yahoo.co.jp/video/player/26757180
  - https://sports.yahoo.co.jp/video/player/26757879
  - https://sports.yahoo.co.jp/video/player/26775591
  - https://sports.yahoo.co.jp/video/player/26775948
- DAZN Japan YouTube highlight pages:
  - https://www.youtube.com/watch?v=WKj3oYyMnPs
  - https://www.youtube.com/watch?v=-4YQtF10DKI
- ABEMA / DAZN highlight pages:
  - https://abema.tv/video/episode/8yv0weg08n0m1jp8iz3x8zx0g
- Dentsu release:
  - https://kyodonewsprwire.jp/prwfile/release/M101216/202512030307/_prw_PR1fl_88QT5542.pdf
- JFA Japan match broadcast page:
  - https://www.jfa.jp/samuraiblue/worldcup_2026/tv.html
- NTV broadcast schedule:
  - https://www.ntv.co.jp/FIFAworldcup2026/articles/5505vd19787pv9f0fche.html
  - https://www.ntv.co.jp/FIFAworldcup2026/oa/
- Fuji TV broadcast schedule:
  - https://www.fujitv.co.jp/fujitv/news/20260494.html
  - https://www.fujitv.co.jp/sports/soccer/FIFAworldcup/
- NHK announcement citation:
  - https://news.mynavi.jp/article/20251204-3760153/
- FIFA Canada vs Bosnia-Herzegovina match report:
  - https://www.fifa.com/ja/articles/canada-bosnia-and-herzegovina-highlights-match-report-ja

Important interpretation:

- FIFA PDF uses venue-local date columns but ET kickoff times inside match cards.
- The current `index.html` already contains the converted Japan kickoff times.
- DAZN and NHK BS Premium 4K are shown for all 104 matches.
- NTV semifinal coverage is represented on both M101 and M102 with the note `準決勝のいずれか一方`, because the exact semifinal slot was not fixed.
- Fuji TV has 10 planned slots. As of 2026-06-28, 6 fixed cards are shown in `index.html`: 5 group-stage cards plus M76 Brazil vs Japan. 4 knockout-stage Fuji slots remain card-undetermined.
- As of the 2026-06-28 broadcast recheck, M76 Brazil vs Japan includes Fuji TV from 00:50, NHK BS, and DAZN, based on the current Fuji special page and JFA Japan match broadcast page. NTV's current JSON-backed schedule still matches the existing NTV knockout slots.
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
- As of the 2026-06-17 noon JST update, M19 includes the final score from ESPN; no verified SportsNavi/DAZN highlight had surfaced yet.
- As of the 2026-06-17 18:00 JST update, M19 and M20 include SportsNavi/DAZN Japan-viewable highlight pages; M20 final score was already applied by the GitHub fallback.
- As of the 2026-06-18 7:00 JST update, M22 and M23 include final scores from ESPN and SportsNavi/DAZN Japan-viewable highlight pages.
- As of the 2026-06-18 noon JST update, M21 includes a SportsNavi/DAZN Japan-viewable highlight page; M21 final score was already applied by the GitHub fallback.
- As of the 2026-06-18 18:00 JST update, M24 includes a SportsNavi/DAZN Japan-viewable highlight page; M24 final score was already applied by the GitHub fallback.
- As of the 2026-06-19 7:00 JST update, M25 and M26 include final scores from ESPN; no verified SportsNavi/DAZN highlight had surfaced yet.
- As of the 2026-06-19 18:00 JST update, M25, M26, M27, and M28 include SportsNavi/DAZN Japan-viewable highlight pages; M27 and M28 final scores were already applied by the GitHub fallback.
- As of the 2026-06-20 7:00 JST update, M30 and M32 include final scores from ESPN and SportsNavi/DAZN Japan-viewable highlight pages.
- As of the 2026-06-20 noon JST update, M29 and M31 include final scores from ESPN and SportsNavi/DAZN Japan-viewable highlight pages.
- As of the 2026-06-21 7:00 JST update, M33 and M35 include final scores from ESPN; M35 includes a SportsNavi/DAZN Japan-viewable highlight page, but no verified M33 SportsNavi/DAZN highlight had surfaced yet.
- As of the 2026-06-21 noon JST update, M34 and M36 include final scores from ESPN, and M33, M34, and M36 include SportsNavi/DAZN Japan-viewable highlight pages.
- As of the 2026-06-22 7:00 JST update, M38 and M39 include final scores from ESPN, and M38 includes a SportsNavi/DAZN Japan-viewable highlight page; no verified M39 highlight had surfaced yet, while M37 was still in progress.
- As of the 2026-06-22 noon JST update, M37 and M40 include final scores from ESPN, and M37 includes a SportsNavi/DAZN Japan-viewable highlight page; no verified M39 or M40 highlight had surfaced yet.
- As of the 2026-06-22 18:00 JST update, M40 includes a SportsNavi/DAZN Japan-viewable highlight page; no verified M39 highlight had surfaced yet.
- As of the 2026-06-23 7:00 JST update, M43 includes the final score from ESPN and a SportsNavi/DAZN Japan-viewable highlight page; no verified M39 highlight had surfaced yet.
- As of the 2026-06-23 noon JST update, M41 includes the final score from ESPN, M41 includes a DAZN Japan YouTube highlight clip, and M42 includes a SportsNavi/DAZN Japan-viewable highlight page. A SportsNavi search result for M39 appeared at player/26625909, but direct HTTP validation redirected to /error/notfound, so M39 is still not curated.
- As of the 2026-06-23 18:00 JST update, M44 includes a SportsNavi/DAZN Japan-viewable highlight page; M44 final score was already applied by the GitHub fallback. M39 still redirects to /error/notfound and remains uncurated.
- As of the 2026-06-24 7:00 JST update, M45 and M47 include final scores from ESPN, and M47 includes a DAZN Japan YouTube highlight clip. No verified M45 highlight had surfaced yet; M39 still redirects to /error/notfound.
- As of the 2026-06-24 noon JST update, M45 and M46 include SportsNavi/DAZN Japan-viewable highlight pages; M46 final score was applied in this run. M39 still redirects to /error/notfound.
- As of the 2026-06-27 repair, result matching was changed from kickoff-only to kickoff-plus-team matching. The kickoff-only map collapsed simultaneous fixtures into one ESPN event and caused wrong scores for M50, M52, M53, M55, M57, M60, and would have caused M61. M48-M60 highlights are now curated where verified; M39 still redirects to /error/notfound, and M61/M62 highlights had not surfaced yet.
- As of the 2026-06-27 noon JST update, M65 and M66 include final scores from ESPN, and M61/M62 include SportsNavi/DAZN Japan-viewable highlight pages. No verified M65/M66 highlight had surfaced yet; M39 still redirects to /error/notfound.
- As of the 2026-06-28 knockout update, M73-M88 Round of 32 placeholders were replaced with confirmed country names from ESPN scheduled fixtures, keeping the ESPN home team on the left to preserve bracket order. M76 is now marked as a Japan match. M63-M72 include SportsNavi/DAZN Japan-viewable highlight pages. `update-free-data.mjs` can now apply future knockout matchup name updates when ESPN replaces winner placeholders with concrete teams.
- As of the 2026-06-28 broadcast recheck, M39 includes an ABEMA / DAZN Japan-viewable highlight page because no working SportsNavi/DAZN page was found for that match.
- As of the 2026-06-29 7:00 JST update, M73 South Africa vs Canada includes the final score from ESPN, and M90 is partially resolved to `カナダ vs M75勝者`. No verified SportsNavi/DAZN, DAZN Japan, or DAZN Japan YouTube highlight had surfaced yet for M73.
- As of the 2026-06-29 7:00 JST script update, knockout bracket propagation no longer waits for ESPN to publish a fully concrete next fixture. When a source match is complete, the updater can replace only the known side of future fixtures and leave the other side as `Mxx勝者` or `Mxx敗者`.
- As of the 2026-06-29 10:00 JST update, M73 includes a SportsNavi/DAZN Japan-viewable highlight page.
- As of the 2026-06-30 7:00 JST update, M74 includes the final score with penalties `1 - 1 (PK 3 - 4)`, M89 is already partially resolved to `パラグアイ vs M77勝者`, and M74/M76 include SportsNavi/DAZN Japan-viewable highlight pages. M75 was still in progress.
- As of the 2026-06-30 13:00 JST update, M75 includes the final score with penalties `1 - 1 (PK 2 - 3)`, M90 is resolved to `カナダ vs モロッコ`, and M75 includes a SportsNavi/DAZN Japan-viewable highlight page.
- As of the 2026-07-01 7:00 JST update, M77 and M78 include final scores from ESPN, M89/M91 are resolved to `パラグアイ vs フランス` and `ブラジル vs ノルウェー`, and M77/M78 include SportsNavi/DAZN Japan-viewable highlight pages.
- As of the 2026-07-02 7:00 JST update, M80 includes the final score `2 - 1` from ESPN, and M92 is partially resolved to `M79勝者 vs イングランド`. No verified M80 SportsNavi/DAZN highlight had surfaced yet. The updater still reported ESPN event 79 as unmatched, so M79 should be rechecked in the next run.
- As of the 2026-07-02 10:00 JST update, M82 includes the final score `3 - 2`, M92 is resolved to `メキシコ vs イングランド`, M94 is partially resolved to `M81勝者 vs ベルギー`, and M80/M82 include SportsNavi/DAZN Japan-viewable highlight pages. `resolvedBracketMatchName` now preserves concrete scheduled teams that ESPN already supplied instead of replacing them with a placeholder when only the opposite source match outcome is missing.
- FOX Sports YouTube highlights were removed from the cards because they were not viewable in Japan. Prefer DAZN Japan highlight pages or DAZN Japan YouTube videos for this site. Use other YouTube/rightsholder clips only after confirming Japan availability.
- Keep `data/highlights.json` in sync with newly verified highlight links so the free GitHub fallback can reapply them safely.

## Knockout Update Plan

- Round of 32 has Japanese kickoff clusters at 02:00, 04:00-06:00, 07:00-08:00, 09:00-10:30, and one 12:00 match. The best heartbeat windows are 07:00, 10:30, 13:30, 16:00, and 20:00 JST during 2026-06-29 to 2026-07-04.
- From Round of 16 onward, most matches kick off at 01:00, 02:00, 04:00, 05:00, 06:00, 09:00, or 10:00 JST. Use 07:00, 12:00, and 18:00 JST as the normal cadence; add a 13:30 JST check on days with 09:00 or 10:00 kickoffs.
- At each run, first apply free data. This now covers final scores and concrete knockout matchup names from ESPN when available, while preserving already concrete scheduled teams during partial bracket propagation.
- Search highlights only for matches listed by preflight as `highlightGaps`, prioritizing SportsNavi/DAZN. Most SportsNavi highlights have appeared roughly 1-3 hours after full time, so the midday and late-afternoon checks are the most important for user-visible video updates.
- M39 now uses an ABEMA / DAZN highlight. SportsNavi still redirected to `/error/notfound`; do not spend broad search time replacing it unless a working SportsNavi/DAZN page appears.

## Suggested Next Improvements

- Add an `og:image` asset if richer social cards are needed.
- Split match data into `matches.js` only if editing the inline HTML becomes annoying.
