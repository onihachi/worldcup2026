export const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260720&limit=200';
export const JST_OFFSET = '+09:00';

const TEAM_NAME_ALIASES = {
  'メキシコ': ['Mexico'],
  '南アフリカ': ['South Africa'],
  '韓国': ['South Korea', 'Korea Republic'],
  'チェコ': ['Czechia', 'Czech Republic'],
  'カナダ': ['Canada'],
  'ボスニア・ヘルツェゴビナ': ['Bosnia-Herzegovina', 'Bosnia and Herzegovina'],
  'アメリカ': ['United States', 'USA', 'US'],
  'パラグアイ': ['Paraguay'],
  'ハイチ': ['Haiti'],
  'スコットランド': ['Scotland'],
  'オーストラリア': ['Australia'],
  'トルコ': ['Türkiye', 'Turkey'],
  'ブラジル': ['Brazil'],
  'モロッコ': ['Morocco'],
  'カタール': ['Qatar'],
  'スイス': ['Switzerland'],
  'コートジボワール': ['Ivory Coast', "Côte d'Ivoire", 'Cote d Ivoire'],
  'エクアドル': ['Ecuador'],
  'ドイツ': ['Germany'],
  'キュラソー': ['Curaçao', 'Curacao'],
  'オランダ': ['Netherlands'],
  '日本': ['Japan'],
  'スウェーデン': ['Sweden'],
  'チュニジア': ['Tunisia'],
  'サウジアラビア': ['Saudi Arabia'],
  'ウルグアイ': ['Uruguay'],
  'スペイン': ['Spain'],
  'カーボベルデ': ['Cape Verde'],
  'イラン': ['Iran'],
  'ニュージーランド': ['New Zealand'],
  'ベルギー': ['Belgium'],
  'エジプト': ['Egypt'],
  'フランス': ['France'],
  'セネガル': ['Senegal'],
  'イラク': ['Iraq'],
  'ノルウェー': ['Norway'],
  'アルゼンチン': ['Argentina'],
  'アルジェリア': ['Algeria'],
  'オーストリア': ['Austria'],
  'ヨルダン': ['Jordan'],
  'ガーナ': ['Ghana'],
  'パナマ': ['Panama'],
  'イングランド': ['England'],
  'クロアチア': ['Croatia'],
  'ポルトガル': ['Portugal'],
  'コンゴ民主共和国': ['Congo DR', 'DR Congo', 'Democratic Republic of Congo'],
  'ウズベキスタン': ['Uzbekistan'],
  'コロンビア': ['Colombia'],
};

const SITE_TEAM_BY_ALIAS = new Map();
for (const [siteTeam, aliases] of Object.entries(TEAM_NAME_ALIASES)) {
  for (const alias of [siteTeam, ...aliases]) {
    SITE_TEAM_BY_ALIAS.set(normalizeTeamName(alias), siteTeam);
  }
}

export function normalizeTeamName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isPlaceholderTeamName(value) {
  const normalized = normalizeTeamName(value);
  return [
    'group',
    'round of',
    'winner',
    'loser',
    'place',
    'third',
    'quarterfinal',
    'semifinal',
    'final',
  ].some((token) => normalized.includes(token));
}

function aliasesForSiteTeam(siteTeam) {
  const directAliases = TEAM_NAME_ALIASES[siteTeam];
  if (directAliases) return new Set(directAliases.map(normalizeTeamName));

  const groupRank = siteTeam.match(/^([A-L])組([12])位$/);
  if (groupRank) {
    return new Set([
      normalizeTeamName(groupRank[2] === '1' ? `Group ${groupRank[1]} Winner` : `Group ${groupRank[1]} 2nd Place`),
    ]);
  }

  const thirdPlace = siteTeam.match(/^([A-L](?:\/[A-L])+)組3位$/);
  if (thirdPlace) return new Set([normalizeTeamName(`Third Place Group ${thirdPlace[1]}`)]);

  return new Set([normalizeTeamName(siteTeam)]);
}

function eventCompetitors(event) {
  return event.competitions?.[0]?.competitors || [];
}

function competitorAliases(competitor) {
  const team = competitor?.team || {};
  return new Set([
    normalizeTeamName(team.displayName),
    normalizeTeamName(team.shortDisplayName),
    normalizeTeamName(team.name),
    normalizeTeamName(team.abbreviation),
  ].filter(Boolean));
}

export function siteTeamNameForCompetitor(competitor) {
  const aliases = competitorAliases(competitor);
  for (const alias of aliases) {
    const siteTeam = SITE_TEAM_BY_ALIAS.get(alias);
    if (siteTeam) return siteTeam;
  }
  return competitor?.team?.displayName || null;
}

export function concreteSiteTeamNameForCompetitor(competitor) {
  if (!competitor?.team?.displayName || isPlaceholderTeamName(competitor.team.displayName)) return null;
  return siteTeamNameForCompetitor(competitor);
}

export function scheduledMatchNameFromEvent(event) {
  const competitors = eventCompetitors(event);
  const home = competitors.find((competitor) => competitor.homeAway === 'home');
  const away = competitors.find((competitor) => competitor.homeAway === 'away');
  const homeName = concreteSiteTeamNameForCompetitor(home);
  const awayName = concreteSiteTeamNameForCompetitor(away);
  if (!homeName || !awayName) return null;
  return `${homeName} vs ${awayName}`;
}

function competitorForSiteTeam(event, siteTeam) {
  const siteAliases = aliasesForSiteTeam(siteTeam);
  return eventCompetitors(event).find((competitor) => {
    const aliases = competitorAliases(competitor);
    return [...siteAliases].some((alias) => aliases.has(alias));
  });
}

function scheduleTeams(match) {
  return match.match.split(' vs ').map((team) => team.trim());
}

export function kickoffUtcKey(match) {
  return new Date(`${match.date}T${match.time}:00${JST_OFFSET}`).toISOString().slice(0, 16);
}

export function eventUtcKey(event) {
  const competition = event.competitions?.[0];
  return new Date(competition?.startDate || event.date).toISOString().slice(0, 16);
}

export function eventCandidatesByKickoff(events) {
  const map = new Map();
  for (const event of events) {
    const key = eventUtcKey(event);
    const candidates = map.get(key) || [];
    candidates.push(event);
    map.set(key, candidates);
  }
  return map;
}

export function eventMatchesScheduleTeams(match, event) {
  const [firstTeam, secondTeam] = scheduleTeams(match);
  if (!firstTeam || !secondTeam) return false;
  const firstCompetitor = competitorForSiteTeam(event, firstTeam);
  const secondCompetitor = competitorForSiteTeam(event, secondTeam);
  return Boolean(firstCompetitor && secondCompetitor && firstCompetitor !== secondCompetitor);
}

export function eventForMatch(match, eventsByKickoff) {
  const candidates = eventsByKickoff.get(kickoffUtcKey(match)) || [];
  if (!candidates.length) return null;

  const teamMatchedEvent = candidates.find((event) => eventMatchesScheduleTeams(match, event));
  if (teamMatchedEvent) return teamMatchedEvent;

  return candidates.length === 1 ? candidates[0] : null;
}

export function scoreFromEventForMatch(match, event) {
  if (!event?.status?.type?.completed) return null;

  const [firstTeam, secondTeam] = scheduleTeams(match);
  const firstCompetitor = competitorForSiteTeam(event, firstTeam);
  const secondCompetitor = competitorForSiteTeam(event, secondTeam);
  if (firstCompetitor?.score != null && secondCompetitor?.score != null) {
    return `${firstCompetitor.score} - ${secondCompetitor.score}`;
  }

  const competitors = eventCompetitors(event);
  const home = competitors.find((competitor) => competitor.homeAway === 'home');
  const away = competitors.find((competitor) => competitor.homeAway === 'away');
  if (!home || !away || home.score == null || away.score == null) return null;
  return `${home.score} - ${away.score}`;
}

export function describeEvent(event) {
  const competitors = eventCompetitors(event);
  const home = competitors.find((competitor) => competitor.homeAway === 'home');
  const away = competitors.find((competitor) => competitor.homeAway === 'away');
  return `${away?.team?.displayName || 'Unknown'} @ ${home?.team?.displayName || 'Unknown'}`;
}
