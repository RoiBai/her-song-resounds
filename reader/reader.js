(() => {
  const storageKey = 'her-song-linear-reading:v1';
  const chapters = [...document.querySelectorAll('.chapter')];
  const progress = document.querySelector('#reading-progress');
  const location = document.querySelector('.reading-location');
  const contents = document.querySelector('.contents');
  const status = document.querySelector('#reader-status');
  const resume = document.querySelector('#resume-reading');
  const audio = document.querySelector('#story-music');
  const music = document.querySelector('#music-toggle');
  let frame = 0, currentChapter = null, lastSaved = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    const chapter = saved && document.getElementById(saved.chapterId);
    if (chapter && chapters.includes(chapter)) {
      resume.href = `#${chapter.id}`;
      resume.textContent = `继续上次阅读 · ${chapter.dataset.chapterTitle}`;
      resume.hidden = false;
    }
  } catch { /* Storage is optional; the complete story remains available. */ }
  function save() {
    if (!currentChapter) return;
    try { localStorage.setItem(storageKey, JSON.stringify({chapterId:currentChapter.id})); } catch {}
  }
  function update() {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1,Math.max(0,scrollY/max)) : 0})`;
    const marker = innerHeight * .38;
    currentChapter = [...chapters].reverse().find(el => el.getBoundingClientRect().top <= marker) || null;
    location.textContent = currentChapter?.dataset.chapterTitle || '卷首';
    for (const link of contents.querySelectorAll('a')) {
      if (currentChapter && link.hash === `#${currentChapter.id}`) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
    if (Date.now() - lastSaved > 1500) { save(); lastSaved = Date.now(); }
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  addEventListener('pagehide', save);
  addEventListener('load', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.querySelector('main'));
  contents.addEventListener('click', event => { if (event.target.closest('a')) contents.open = false; });
  document.addEventListener('click', event => { if (!contents.contains(event.target)) contents.open = false; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && contents.open) { contents.open = false; contents.querySelector('summary').focus(); } });
  music.hidden = false;
  music.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    music.disabled = true;
    try { await audio.play(); status.textContent = ''; }
    catch { status.textContent = '音乐暂时无法播放，请稍后重试。'; }
    finally { music.disabled = false; }
  });
  const syncMusic = () => {
    const playing = !audio.paused;
    music.setAttribute('aria-pressed', String(playing));
    music.setAttribute('aria-label', playing ? '关闭背景音乐' : '播放背景音乐');
    music.querySelector('span').textContent = playing ? '开' : '关';
  };
  audio.addEventListener('play', syncMusic);
  audio.addEventListener('pause', syncMusic);
  audio.volume = .45;
  syncMusic();
  update();
})();
