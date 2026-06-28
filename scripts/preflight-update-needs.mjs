import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import {
  SCOREBOARD_URL,
  eventCandidatesByKickoff,
  eventForMatch,
  outcomeFromEvent,
  resolvedBracketMatchName,
  scheduledMatchNameFromEvent,
  scoreFromEventForMatch,
} from './scoreboard-matching.mjs';

const INDEX_PATH = new URL('../index.html', import.meta.url);
const HIGHLIGHTS_PATH = new URL('../data/highlights.json', import.meta.url);

function parseBlock(html, label, pattern) {
  const match = html.match(pattern);
  if (!match) throw new Error(`${label} block not found`);
  return Function(`return ${match[1]}`)();
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
const eventsByKickoff = eventCandidatesByKickoff(scoreboard.events || []);

const resultUpdates = [];
const matchupUpdates = [];
const highlightGaps = [];
const inProgress = [];
const unsyncedCuratedHighlights = [];
const outcomesByMatchNo = {};
const seenMatchupUpdates = new Set();

function addMatchupUpdate(match, nextMatchName) {
  if (!nextMatchName || match.match === nextMatchName) return;
  const key = `${match.no}:${nextMatchName}`;
  if (seenMatchupUpdates.has(key)) return;
  seenMatchupUpdates.add(key);
  matchupUpdates.push(matchLine(match, ` -> ${nextMatchName}`));
}

for (const match of matches) {
  const event = eventForMatch(match, eventsByKickoff);
  if (!event) continue;

  const status = event.status?.type;
  const score = scoreFromEventForMatch(match, event);
  const detail = currentDetails[match.no] || {};
  const curatedHighlight = curatedHighlights[String(match.no)]?.highlight;
  const outcome = outcomeFromEvent(event);
  if (match.stage !== 'グループステージ' && outcome) {
    outcomesByMatchNo[match.no] = outcome;
  }

  if (match.stage !== 'グループステージ') {
    const scheduledMatchName = scheduledMatchNameFromEvent(event);
    addMatchupUpdate(match, scheduledMatchName);
  }

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

for (const match of matches) {
  if (match.stage === 'グループステージ') continue;
  const resolvedMatchName = resolvedBracketMatchName(match, outcomesByMatchNo);
  addMatchupUpdate(match, resolvedMatchName);
}

console.log('Preflight update needs');
console.log(`resultUpdates=${resultUpdates.length}`);
for (const line of resultUpdates) console.log(`- ${line}`);
console.log(`matchupUpdates=${matchupUpdates.length}`);
for (const line of matchupUpdates) console.log(`- ${line}`);
console.log(`highlightGaps=${highlightGaps.length}`);
for (const line of highlightGaps) console.log(`- ${line}`);
console.log(`unsyncedCuratedHighlights=${unsyncedCuratedHighlights.length}`);
for (const line of unsyncedCuratedHighlights) console.log(`- ${line}`);
console.log(`inProgress=${inProgress.length}`);
for (const line of inProgress.slice(0, 5)) console.log(`- ${line}`);

if (!resultUpdates.length && !matchupUpdates.length && !highlightGaps.length && !unsyncedCuratedHighlights.length) {
  console.log('recommendedAction=NONE');
} else if (!highlightGaps.length) {
  console.log('recommendedAction=RUN_FREE_UPDATER_ONLY');
} else {
  console.log('recommendedAction=RUN_FREE_UPDATER_THEN_SEARCH_LISTED_HIGHLIGHTS_ONLY');
}
