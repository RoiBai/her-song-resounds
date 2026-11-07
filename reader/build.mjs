import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const story = JSON.parse(await readFile(resolve(here, 'story.json'), 'utf8'));
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url = value => `./${value.replace(/^\.?\//, '').replace(/\.png$/i, '.webp')}`;
const assets = new Set();
const dimensions = new Map();
function imageDimensions(path) {
  if (dimensions.has(path)) return dimensions.get(path);
  const bytes = readFileSync(resolve(root, path));
  let size;
  for (let offset = 12; offset + 8 < bytes.length;) {
    const kind = bytes.toString('ascii', offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (kind === 'VP8X') size = [bytes.readUIntLE(start + 4, 3) + 1, bytes.readUIntLE(start + 7, 3) + 1];
    if (kind === 'VP8 ') size = [bytes.readUInt16LE(start + 6) & 0x3fff, bytes.readUInt16LE(start + 8) & 0x3fff];
    if (kind === 'VP8L') { const packed = bytes.readUInt32LE(start + 1); size = [(packed & 0x3fff) + 1, ((packed >>> 14) & 0x3fff) + 1]; }
    if (size) break;
    offset = start + length + length % 2;
  }
  if (!size || !size.every(n => n > 0)) throw new Error(`Cannot determine image dimensions: ${path}`);
  dimensions.set(path, size);
  return size;
}
function image(src, alt = '', attributes = '') {
  const path = url(src);
  assets.add(path);
  const [width, height] = imageDimensions(path);
  return `<img src="${esc(path)}" alt="${esc(alt)}" width="${width}" height="${height}" loading="${path.includes('/opening/') ? 'eager' : 'lazy'}" decoding="async" ${attributes}>`;
}
function text(item) {
  let value = item.text;
  const ranges = (item.boldRanges ?? []).filter(r => r.end > r.start).sort((a, b) => a.start - b.start);
  let html = '', cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    html += esc(value.slice(cursor, range.start)) + '<strong>' + esc(value.slice(range.start, range.end)) + '</strong>';
    cursor = range.end;
  }
  html += esc(value.slice(cursor));
  return `<div class="prose">${html.split(/\n\s*\n/).map(p => `<p>${p.replaceAll('\n', '<br>')}</p>`).join('')}</div>`;
}
function art(item) {
  if (item.type === 'gallery') return `<div class="memory-gallery" aria-label="往事回望">${item.images.map(entry => `<figure>${image(entry.src, entry.alt)}</figure>`).join('')}</div>`;
  if (item.type === 'scene') {
    const layers = [...item.layers].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
    return `<figure class="art scene-art"><div class="scene" role="img" aria-label="${esc(item.alt)}" style="aspect-ratio:${Number(item.aspectRatio) || 1.5}">${layers.map(layer => image(layer.src, '', `style="left:${layer.x ?? 0}%;top:${layer.y ?? 0}%;width:${layer.w ?? 100}%;${layer.h != null ? `height:${layer.h}%;` : ''}object-fit:${layer.fit || (layer.kind === 'cover' ? 'cover' : 'contain')};${layer.clipPath ? `clip-path:${esc(layer.clipPath)};` : ''}transform:rotate(${layer.rotation || 0}deg) scaleX(${layer.flip ? -1 : 1});"`)).join('')}</div>${item.caption ? `<figcaption>${esc(item.caption)}</figcaption>` : ''}</figure>`;
  }
  return `<figure class="art">${image(item.src, item.alt)}${item.caption ? `<figcaption>${esc(item.caption)}</figcaption>` : ''}</figure>`;
}
function renderItems(items) {
  let out = '';
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type === 'scene' && items[i + 1]?.type === 'scene') {
      const run = [item];
      while (items[i + 1]?.type === 'scene') run.push(items[++i]);
      out += `<div class="scene-run">${run.map(art).join('')}</div>`;
    } else if (item.type === 'image' && items[i + 1]?.type === 'text') {
      out += `<div class="passage">${art(item)}${text(items[++i])}</div>`;
    } else if (item.type === 'text' && items[i + 1]?.type === 'image') {
      out += `<div class="passage passage-text-first">${text(item)}${art(items[++i])}</div>`;
    } else {
      out += `<div class="reading-block${item.type === 'gallery' ? ' gallery-block' : ''}">${item.type === 'text' ? text(item) : art(item)}</div>`;
    }
  }
  return out;
}
const chapterLinks = story.chapters.map((chapter, i) => `<a href="#${esc(chapter.id)}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(chapter.title)}</a>`).join('');
const titleImage = story.cover.titleImage || '/assets/story/opening/opening-title.webp';
const palaceImage = story.cover.palaceImage || '/assets/story/opening/opening-palace.webp';
const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#eee8dc"><meta name="description" content="颂声起：一卷关于上官婉儿与太平公主的故事。循着图画与文字，从唐宫往事读到千年后的回响。">
<meta property="og:title" content="颂声起 · 长卷阅读"><meta property="og:description" content="循着图画与文字，从唐宫往事读到千年后的回响。"><meta property="og:image" content="./og.png">
<title>颂声起 · 长卷阅读</title><link rel="icon" href="./favicon.png">
<link rel="preload" href="./fonts/SourceHanSerifCN-Regular-subset.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="./reader/reader.css"><script defer src="./reader/reader.js"></script>
</head>
<body>
<a class="skip-link" href="#${esc(story.chapters[0].id)}">跳到正文</a>
<header class="reader-bar"><a class="wordmark" href="#top" aria-label="颂声起，回到卷首">颂声起<span>长卷阅读</span></a><div class="reader-tools"><span class="reading-location" aria-hidden="true">卷首</span><button id="music-toggle" type="button" aria-pressed="false" hidden>音乐 <span>关</span></button><details class="contents"><summary>目录</summary><nav aria-label="阅读目录">${chapterLinks}<a href="#top"><span>↑</span>回到卷首</a></nav></details></div><div class="progress-track" aria-hidden="true"><div id="reading-progress"></div></div></header>
<main id="top">
<section class="cover" aria-label="颂声起，长卷阅读">
${image('/assets/story/opening/opening-cloud-back.webp', '', 'class="cover-cloud cloud-back"')}
${image('/assets/story/opening/opening-cloud-front.webp', '', 'class="cover-cloud cloud-front"')}
<p class="cover-eyebrow">上官婉儿 · 太平公主</p>
<h1>${image(titleImage, '颂声起', 'fetchpriority="high"')}</h1>
<p class="cover-subtitle">循着她们的名字，展开一卷往事。</p>
${image(palaceImage, '宫城前的上官婉儿与太平公主', 'class="cover-palace"')}
<a class="unroll" href="#${esc(story.chapters[0].id)}">向下，展开故事<span aria-hidden="true">↓</span></a>
<a id="resume-reading" class="resume-link" hidden>继续上次阅读</a>
</section>
${story.chapters.map((chapter, i) => `<section class="chapter${/credits|references|sources/.test(chapter.id) ? ' colophon' : ''}" id="${esc(chapter.id)}" aria-labelledby="${esc(chapter.id)}-title" data-chapter-title="${esc(chapter.title)}"><header class="chapter-heading"><span class="chapter-ornament" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><p>${esc(chapter.kicker || '颂声起')}</p><h2 id="${esc(chapter.id)}-title">${esc(chapter.title)}</h2></header>${renderItems(chapter.items)}</section>`).join('')}
<footer class="reader-footer"><p>千年万岁，椒花颂声。</p><a href="#top">回到卷首 ↑</a><span>颂声起 · 长卷阅读</span></footer>
</main>
<audio id="story-music" preload="none" loop src="./assets/audio/bgm/bgm-1.mp3"></audio>
<p id="reader-status" class="sr-only" role="status"></p>
</body></html>`;
assets.add('./assets/audio/bgm/bgm-1.mp3');
const missing = [];
for (const asset of assets) {
  try { await stat(resolve(root, asset)); } catch { missing.push(asset); }
}
if (missing.length) throw new Error(`Missing reading assets:\n${missing.join('\n')}`);
await writeFile(resolve(root, 'index.html'), html);
console.log(`Built ${story.chapters.length} chapters, ${assets.size} verified assets. All story content is readable without JavaScript.`);
