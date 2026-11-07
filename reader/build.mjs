import { readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '..');
const base = 'f121b31d690a880fd40ed81280c092b36968e4e0';
const originalScript = 'assets/index-BaMNG1A0.js';
const source = await readFile(resolve(root, originalScript), 'utf8');
// Fail closed if the original build has changed; never patch a different bundle.
const baseline = execFileSync('git', ['show', `${base}:${originalScript}`], { cwd: root });
if (createHash('sha256').update(source).digest('hex') !== createHash('sha256').update(baseline).digest('hex')) throw new Error('Original bundle differs from the preserved base.');
const scenes = JSON.parse(await readFile(resolve(directory, 'vertical-levels.json'), 'utf8'));
const expected = ['level-one', 'level-two', 'level-three', 'level-four', 'level-five', 'level-six', 'story-final-chapter'];
if (Object.keys(scenes).length !== expected.length) throw new Error('Expected exactly seven reading areas.');
for (const key of expected) {
  if (scenes[key]?.length !== 3) throw new Error(`Expected three panels for ${key}`);
  for (const scene of scenes[key]) for (const layer of scene.layers) await stat(resolve(root, layer.src));
}
let output = source;
function replaceOnce(before, after) {
  if (output.split(before).length !== 2) throw new Error(`Patch anchor is not unique: ${before.slice(0, 100)}`);
  output = output.replace(before, after);
}
replaceOnce('function ra(e,t){let n=[];for(let r of e)if(r.enabled&&r.id!==`story-opening`&&(n.push(r),r.kind===`level`&&r.requiredToContinue&&!t.has(r.id)||r.kind===`story`&&r.id===`story-final-chapter`&&!t.has(r.id)))break;return n}', 'function ra(e,t){return e.filter(r=>r.enabled&&r.id!==`story-opening`)}');
// Retain the original asset-loading boundary and retry UI, without requiring
// puzzle completion before the loading/retry indicator can become visible.
replaceOnce('e.blocks.slice(0,P).every(e=>!e.enabled||e.kind!==`level`||!e.requiredToContinue||S.has(e.id))', '!0');
const levelStart = 'children:t.template===`level-one`?';
const levelEnd = '},`${t.id}:${O}`)),L&&';
const start = output.indexOf(levelStart);
const end = output.indexOf(levelEnd, start);
if (start < 0 || end < 0 || output.indexOf(levelStart, start + 1) !== -1) throw new Error('Puzzle renderer anchor changed.');
output = output.slice(0, start) + 'children:(0,K.jsx)(LinearReadingPanels,{block:t})' + output.slice(end);
replaceOnce('(0,K.jsx)(Ti,{initialConfig:t.finalChapterConfig,initiallyComplete:S.has(t.id),onCompletionChange:e=>ae(t.id,e)})', '(0,K.jsx)(LinearReadingPanels,{block:t})');
// Keep the reading edition's clear/resume controls from touching game saves.
replaceOnce('Ui=`her-song-resounds:game-progress:v1`', 'Ui=`her-song-resounds:linear-progress:v1`');
const component = await readFile(resolve(directory, 'vertical-levels.js'), 'utf8');
replaceOnce('function ra(e,t)', `const LINEAR_READING_SCENES=${JSON.stringify(scenes)};\n${component}\nfunction ra(e,t)`);
await writeFile(resolve(root, 'assets/index-linear-reading.js'), output);
const originalHtml = execFileSync('git', ['show', `${base}:index.html`], { cwd: root, encoding: 'utf8' });
if (!originalHtml.includes(originalScript)) throw new Error('Original HTML script changed.');
const html = originalHtml.replace(originalScript, 'assets/index-linear-reading.js').replace('</head>', '  <link rel="stylesheet" href="./reader/vertical-levels.css">\n  </head>');
await writeFile(resolve(root, 'index.html'), html);
console.log('Built 7 vertical reading areas × 3 panels. Original cover, stories, CSS, art, motion, music and loading flow preserved.');
