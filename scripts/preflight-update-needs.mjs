import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const INDEX_PATH = new URL('../index.html', import.meta.url);
const HIGHLIGHTS_PATH = new URL('../data/highlights.json', import.meta.url);
const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260720&limit=200';
const JST_OFFSET = '+09:00';

function parseBlock(html, label, pattern) {
  const match = html.match(pattern);
  if (!match) throw new Error(`${label} block not found`);
  return Function(`return ${match[1]}`)();
}

function kickoffUtcKey(match) {
  return new Date(`${match.date}T${match.time}:00${JST_OFFSET}`).toISOString().slice(0, 16);
}

function eventUtcKey(event) {
  const competition = event.competitions?.[0];
  return new Date(competition?.startDate || event.date).toISOString().slice(0, 16);
}

function scoreFromEvent(event) {
  if (!event.status?.type?.completed) return null;
  const competitors = event.competitions?.[0]?.competitors || [];
  const home = competitors.find((competitor) => competitor.homeAway === 'home');
  const away = competitors.find((competitor) => competitor.homeAway === 'away');
  if (!home || !away || home.score == null || away.score == null) return null;
  return `${home.score} - ${away.score}`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'worldcup2026-preflight/1.0' },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return response.json();
}

async function loadCuratedHighlights() {
  if (!existsSync(HIGHLIGHTS_PATH)) return {};
  const payload = JSON.parse(await readFile(HIGHLIGHTS_PATH, 'utf8'));
  return payload.matches || {};
}

function matchLine(match, suffix = '') {
  return `M${match.no} ${match.dateLabel} ${match.time} ${match.match}${suffix}`;
}

const html = await readFile(INDEX_PATH, 'utf8');
const matches = parseBlock(html, 'matches', /const matches = (\[[\s\S]*?\]);\n\s*const matchDetails = /);
const currentDetails = parseBlock(html, 'matchDetails', /const matchDetails = (\{[\s\S]*?\n    \});\n\n    const enrichedMatches/);
const curatedHighlights = await loadCuratedHighlights();
const scoreboard = await fetchJson(SCOREBOARD_URL);
const eventsByKickoff = new Map((scoreboard.events || []).map((event) => [eventUtcKey(event), event]));

const resultUpdates = [];
const highlightGaps = [];
const inProgress = [];
const unsyncedCuratedHighlights = [];

for (const match of matches) {
  const event = eventsByKickoff.get(kickoffUtcKey(match));
  if (!event) continue;

  const status = event.status?.type;
  const score = scoreFromEvent(event);
  const detail = currentDetails[match.no] || {};
  const curatedHighlight = curatedHighlights[String(match.no)]?.highlight;

  if (score && detail.result?.score !== score) {
    resultUpdates.push(matchLine(match, ` -> ${score}`));
  }

  if (score && !detail.highlight && !curatedHighlight) {
    highlightGaps.push(matchLine(match, ` (${score})`));
  }

  if (curatedHighlight && JSON.stringify(detail.highlight) !== JSON.stringify(curatedHighlight)) {
    unsyncedCuratedHighlights.push(matchLine(match));
  }

  if (status && !status.completed && ['STATUS_IN_PROGRESS', 'STATUS_FIRST_HALF', 'STATUS_HALFTIME', 'STATUS_SECOND_HALF'].includes(status.name)) {
    inProgress.push(matchLine(match, ` (${status.shortDetail || status.name})`));
  }
}

console.log('Preflight update needs');
console.log(`resultUpdates=${resultUpdates.length}`);
for (const line of resultUpdates) console.log(`- ${line}`);
console.log(`highlightGaps=${highlightGaps.length}`);
for (const line of highlightGaps) console.log(`- ${line}`);
console.log(`unsyncedCuratedHighlights=${unsyncedCuratedHighlights.length}`);
for (const line of unsyncedCuratedHighlights) console.log(`- ${line}`);
console.log(`inProgress=${inProgress.length}`);
for (const line of inProgress.slice(0, 5)) console.log(`- ${line}`);

if (!resultUpdates.length && !highlightGaps.length && !unsyncedCuratedHighlights.length) {
  console.log('recommendedAction=NONE');
} else if (!highlightGaps.length) {
  console.log('recommendedAction=RUN_FREE_UPDATER_ONLY');
} else {
  console.log('recommendedAction=RUN_FREE_UPDATER_THEN_SEARCH_LISTED_HIGHLIGHTS_ONLY');
}
