import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

for (const script of scripts) {
  Function(script);
}

const matchBlock = html.match(/const matches = (\[[\s\S]*?\]);/);
if (!matchBlock) throw new Error('matches block not found');

const matches = Function(`return ${matchBlock[1]}`)();
const first = matches[0]?.no;
const last = matches.at(-1)?.no;

if (scripts.length !== 1) throw new Error(`Expected 1 script block, got ${scripts.length}`);
if (matches.length !== 104) throw new Error(`Expected 104 matches, got ${matches.length}`);
if (first !== 1 || last !== 104) throw new Error(`Unexpected match range: ${first}..${last}`);

console.log(JSON.stringify({ scripts: scripts.length, matches: matches.length, first, last }, null, 2));
