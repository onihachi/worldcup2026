import { readFile, writeFile } from 'node:fs/promises';
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

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const skipLinkCheck = args.has('--skip-link-check');

function parseBlock(html, label, pattern) {
  const match = html.match(pattern);
  if (!match) throw new Error(`${label} block not found`);
  return Function(`return ${match[1]}`)();
}

function jsString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function serializeDetails(details) {
  const keys = Object.keys(details).map(Number).sort((a, b) => a - b);
  if (keys.length === 0) return '{}';

  const lines = ['{'];
  for (const key of keys) {
    const detail = details[key];
    lines.push(`      ${key}: {`);
    if (detail.result?.score) {
      lines.push(`        result: { score: '${jsString(detail.result.score)}' },`);
    }
    if (detail.highlight) {
      lines.push('        highlight: {');
      lines.push(`          title: '${jsString(detail.highlight.title)}',`);
      lines.push(`          provider: '${jsString(detail.highlight.provider)}',`);
      lines.push(`          url: '${jsString(detail.highlight.url)}',`);
      lines.push(`          thumbnail: '${jsString(detail.highlight.thumbnail)}',`);
      lines.push('        },');
    }
    lines.push('      },');
  }
  lines.push('    }');
  return lines.join('\n');
}

function serializeMatches(matches) {
  return JSON.stringify(matches);
}

function updateSearchIndex(match) {
  match.search = `${match.no} ${match.stage} ${match.group.toLowerCase()} ${match.match.toLowerCase()} ${match.venue}`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'worldcup2026-free-updater/1.0' },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return response.json();
}

async function okUrl(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const response = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'user-agent': 'worldcup2026-free-updater/1.0' },
      });
      if (response.ok) return true;
      if (![403, 405].includes(response.status)) return false;
    } catch {
      // Try the fallback method before giving up.
    }
  }
  return false;
}

async function loadCuratedHighlights() {
  if (!existsSync(HIGHLIGHTS_PATH)) return {};
  const payload = JSON.parse(await readFile(HIGHLIGHTS_PATH, 'utf8'));
  return payload.matches || {};
}

async function validateHighlight(matchNo, highlight) {
  const required = ['title', 'provider', 'url', 'thumbnail'];
  for (const field of required) {
    if (!highlight?.[field]) {
      throw new Error(`Highlight for M${matchNo} is missing ${field}`);
    }
  }
  if (skipLinkCheck) return true;
  const [urlOk, thumbnailOk] = await Promise.all([
    okUrl(highlight.url),
    okUrl(highlight.thumbnail),
  ]);
  if (!urlOk || !thumbnailOk) {
    throw new Error(`Highlight link check failed for M${matchNo}`);
  }
  return true;
}

function japanDateLabel(now = new Date()) {
  const parts = new Intl.DateTimeFormat('ja-JP-u-ca-gregory', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}年${values.month}月${values.day}日（日本時間）`;
}

function updateDateNotes(html) {
  const label = japanDateLabel();
  return html
    .replace(/調査日: \d{4}年\d{1,2}月\d{1,2}日（日本時間）/, `調査日: ${label}`)
    .replace(/<strong>最終更新:<\/strong> \d{4}年\d{1,2}月\d{1,2}日（日本時間）/, `<strong>最終更新:</strong> ${label}`);
}

const html = await readFile(INDEX_PATH, 'utf8');
const matches = parseBlock(html, 'matches', /const matches = (\[[\s\S]*?\]);\n\s*const matchDetails = /);
const nextMatches = structuredClone(matches);
const currentDetails = parseBlock(html, 'matchDetails', /const matchDetails = (\{[\s\S]*?\n    \});\n\n    const enrichedMatches/);
const details = structuredClone(currentDetails);

const scoreboard = await fetchJson(SCOREBOARD_URL);
const eventsByKickoff = eventCandidatesByKickoff(scoreboard.events || []);
const curatedHighlights = await loadCuratedHighlights();

const updates = [];
const missingEvents = [];
const outcomesByMatchNo = {};

for (const match of nextMatches) {
  const event = eventForMatch(match, eventsByKickoff);
  if (!event) {
    missingEvents.push(match.no);
    continue;
  }

  if (match.stage !== 'グループステージ') {
    const scheduledMatchName = scheduledMatchNameFromEvent(event);
    if (scheduledMatchName && match.match !== scheduledMatchName) {
      match.match = scheduledMatchName;
      match.isJapan = scheduledMatchName.includes('日本');
      updateSearchIndex(match);
      updates.push(`M${match.no} matchup ${scheduledMatchName}`);
    }
  }

  const outcome = outcomeFromEvent(event);
  if (match.stage !== 'グループステージ' && outcome) {
    outcomesByMatchNo[match.no] = outcome;
  }

  const score = scoreFromEventForMatch(match, event);
  if (score && details[match.no]?.result?.score !== score) {
    details[match.no] = {
      ...(details[match.no] || {}),
      result: { score },
    };
    updates.push(`M${match.no} result ${score}`);
  }
}

for (const match of nextMatches) {
  if (match.stage === 'グループステージ') continue;
  const resolvedMatchName = resolvedBracketMatchName(match, outcomesByMatchNo);
  if (resolvedMatchName && match.match !== resolvedMatchName) {
    match.match = resolvedMatchName;
    match.isJapan = resolvedMatchName.includes('日本');
    updateSearchIndex(match);
    updates.push(`M${match.no} matchup ${resolvedMatchName}`);
  }
}

for (const [matchNo, entry] of Object.entries(curatedHighlights)) {
  if (!entry.highlight) continue;
  await validateHighlight(matchNo, entry.highlight);
  const currentHighlight = details[matchNo]?.highlight;
  if (JSON.stringify(currentHighlight) !== JSON.stringify(entry.highlight)) {
    details[matchNo] = {
      ...(details[matchNo] || {}),
      highlight: entry.highlight,
    };
    updates.push(`M${matchNo} highlight ${entry.highlight.provider}`);
  }
}

const nextDetailsBlock = `    const matchDetails = ${serializeDetails(details)};`;
let nextHtml = html.replace(
  /const matches = \[[\s\S]*?\];\n\s*const matchDetails = /,
  `const matches = ${serializeMatches(nextMatches)};\n    const matchDetails = `,
);

nextHtml = nextHtml.replace(
  /    const matchDetails = \{[\s\S]*?\n    \};\n\n    const enrichedMatches/,
  `${nextDetailsBlock}\n\n    const enrichedMatches`,
);

if (nextHtml !== html) {
  nextHtml = updateDateNotes(nextHtml);
}

if (missingEvents.length) {
  console.warn(`ESPN events not matched for ${missingEvents.length} matches: ${missingEvents.join(', ')}`);
}

if (nextHtml === html) {
  console.log('No free data updates found.');
} else if (dryRun) {
  console.log(`Dry run: ${updates.length} updates would be applied.`);
  for (const update of updates) console.log(`- ${update}`);
} else {
  await writeFile(INDEX_PATH, nextHtml);
  console.log(`Applied ${updates.length} free data updates.`);
  for (const update of updates) console.log(`- ${update}`);
}
