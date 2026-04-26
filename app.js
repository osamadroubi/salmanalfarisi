
const root = document.documentElement;
const liveRegion = document.getElementById('liveRegion');
function announce(message){
  if (!liveRegion) return;
  liveRegion.textContent = '';
  setTimeout(() => { liveRegion.textContent = message; }, 20);
}
const toggle = document.getElementById('themeToggle');
const storedTheme = localStorage.getItem('theme');
function setThemeToggleLabel(){
  if (!toggle) return;
  const dark = root.classList.contains('dark');
  toggle.innerHTML = `<span aria-hidden="true">${dark ? '☀' : '☾'}</span><b>${dark ? 'نهار' : 'ليل'}</b>`;
  toggle.setAttribute('aria-label', dark ? 'تبديل إلى الوضع النهاري' : 'تبديل إلى الوضع الليلي');
}
if (storedTheme === 'dark') {
  root.classList.add('dark');
}
setThemeToggleLabel();
toggle?.addEventListener('click', () => {
  root.classList.toggle('dark');
  const dark = root.classList.contains('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  setThemeToggleLabel();
  announce(dark ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع النهاري');
});

const progress = document.getElementById('progressBar');
function updateProgress(){
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? (window.scrollY / max) * 100 : 0;
  progress.style.width = `${value}%`;
}
document.addEventListener('scroll', updateProgress, {passive:true});
updateProgress();

const filter = document.getElementById('filterInput');
const sections = Array.from(document.querySelectorAll('.story-section'));
const links = Array.from(document.querySelectorAll('.toc a'));
filter?.addEventListener('input', (event) => {
  const q = event.target.value.trim().toLowerCase();
  sections.forEach(section => {
    const text = section.innerText.toLowerCase();
    const match = !q || text.includes(q);
    section.classList.toggle('hidden-by-filter', !match);
  });
  links.forEach(link => {
    const target = document.querySelector(link.getAttribute('href'));
    link.style.display = target && target.classList.contains('hidden-by-filter') ? 'none' : '';
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      links.forEach(a => a.removeAttribute('aria-current'));
      const active = document.querySelector(`.toc a[href="#${entry.target.id}"]`);
      active?.setAttribute('aria-current','true');
    }
  })
}, {rootMargin:'-40% 0px -55% 0px', threshold:0});
sections.forEach(s => observer.observe(s));


const fontIncrease = document.getElementById('fontIncrease');
const fontDecrease = document.getElementById('fontDecrease');
const memorizeToggle = document.getElementById('memorizeToggle');
let fontLevel = Number(localStorage.getItem('fontLevel') || '0');
function applyFontLevel(){
  document.body.classList.toggle('large-text', fontLevel === 1);
  document.body.classList.toggle('extra-large-text', fontLevel >= 2);
}
fontIncrease?.addEventListener('click', () => {
  fontLevel = Math.min(2, fontLevel + 1);
  localStorage.setItem('fontLevel', String(fontLevel));
  applyFontLevel();
  announce(fontLevel === 2 ? 'تم تكبير الخط إلى أكبر حجم' : 'تم تكبير الخط');
});
fontDecrease?.addEventListener('click', () => {
  fontLevel = Math.max(0, fontLevel - 1);
  localStorage.setItem('fontLevel', String(fontLevel));
  applyFontLevel();
  announce(fontLevel === 0 ? 'تم تصغير الخط إلى الحجم الأساسي' : 'تم تصغير الخط');
});
applyFontLevel();

function escapeHTML(value){
  return String(value || '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function buildMemorizationView(){
  const story = document.querySelector('.story');
  if (!story || document.querySelector('.memory-route')) return;

  const routeItems = sections.map((section, index) => {
    const title = section.querySelector('.story-card h2')?.textContent.trim() || '';
    const summary = section.querySelector('.memory-summary span')?.textContent.trim() || '';
    return `<li><span>${String(index + 1).padStart(2,'0')}</span><b>${escapeHTML(title)}</b><em>${escapeHTML(summary)}</em></li>`;
  }).join('');

  const route = document.createElement('section');
  route.className = 'memory-route memory-mode-only';
  route.setAttribute('aria-label','خريطة الحفظ المختصرة');
  route.innerHTML = `
    <div class="memory-route-head">
      <p class="eyebrow">وضع الحفظ</p>
      <h2>خريطة مختصرة قبل القراءة</h2>
      <p>هذه الخريطة تجمع السيرة في ترتيب سريع. مرّي عليها أولًا، ثم افتحي بطاقات الحفظ في كل مشهد.</p>
    </div>
    <ol class="memory-route-list">${routeItems}</ol>
  `;
  story.before(route);

  sections.forEach((section, index) => {
    const card = section.querySelector('.story-card');
    if (!card || card.querySelector('.memory-transform-card')) return;

    const title = card.querySelector('h2')?.textContent.trim() || '';
    const meta = card.querySelector('.section-meta span')?.textContent.trim() || `المشهد ${index + 1}`;
    const rank = card.querySelector('.section-meta strong')?.textContent.trim() || '';
    const summary = card.querySelector('.memory-summary span')?.textContent.trim() || '';
    const lesson = card.querySelector('.lesson span')?.textContent.trim() || '';
    const question = card.querySelector('.quiz-question')?.textContent.trim() || '';
    const answer = card.querySelector('.answer-card p')?.textContent.trim() || '';
    const sources = Array.from(card.querySelectorAll('.source-chip')).slice(0, 2).map(a => a.textContent.trim()).join('، ');
    const fullParagraphs = Array.from(card.children)
      .filter(el => el.tagName === 'P')
      .map(p => `<p>${escapeHTML(p.textContent.trim())}</p>`)
      .join('');

    const memoryCard = document.createElement('div');
    memoryCard.className = 'memory-transform-card memory-mode-only';
    memoryCard.innerHTML = `
      <div class="memory-transform-top">
        <span class="memory-number">${String(index + 1).padStart(2,'0')}</span>
        <div>
          <small>${escapeHTML(meta)}${rank ? ' • ' + escapeHTML(rank) : ''}</small>
          <h3>${escapeHTML(title)}</h3>
        </div>
      </div>
      <div class="memory-transform-grid">
        <div class="memory-point primary-point">
          <b>الجملة التي تُحفظ</b>
          <p>${escapeHTML(summary)}</p>
        </div>
        <div class="memory-point">
          <b>المغزى</b>
          <p>${escapeHTML(lesson)}</p>
        </div>
        <div class="memory-point">
          <b>اختبار سريع</b>
          <p>${escapeHTML(question)}</p>
          <details class="memory-answer">
            <summary>إظهار الجواب</summary>
            <p>${escapeHTML(answer)}</p>
          </details>
        </div>
        <div class="memory-point source-point">
          <b>مصدر التثبيت</b>
          <p>${escapeHTML(sources || 'راجعي مصادر هذا المشهد في نهاية البطاقة.')}</p>
        </div>
      </div>
    `;

    const marker = card.querySelector('h2');
    marker ? marker.after(memoryCard) : card.prepend(memoryCard);

    if (fullParagraphs) {
      const fullText = document.createElement('details');
      fullText.className = 'full-story-drawer memory-mode-only';
      fullText.innerHTML = `<summary>فتح النص القصصي الكامل لهذا المشهد</summary><div>${fullParagraphs}</div>`;
      card.appendChild(fullText);
    }
  });
}

buildMemorizationView();

function setMemorizeLabel(on){
  if (!memorizeToggle) return;
  memorizeToggle.innerHTML = `<span aria-hidden="true">${on ? '☷' : '▣'}</span><b>${on ? 'القصة' : 'الحفظ'}</b>`;
  memorizeToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  memorizeToggle.setAttribute('aria-label', on ? 'العودة إلى وضع القراءة والقصة الكاملة' : 'تفعيل وضع الحفظ كبطاقات مختصرة');
}

const readingModeBtn = document.getElementById('readingModeBtn');
const studyModeBtn = document.getElementById('studyModeBtn');

function applyMemorizeMode(on, scrollToGuide = false){
  document.body.classList.toggle('memorize-mode', Boolean(on));
  localStorage.setItem('memorizeMode', on ? 'on' : 'off');
  setMemorizeLabel(Boolean(on));
  announce(on ? 'تم تفعيل وضع الحفظ' : 'تم الرجوع إلى وضع القراءة');
  readingModeBtn?.classList.toggle('active', !on);
  studyModeBtn?.classList.toggle('active', Boolean(on));
  readingModeBtn?.setAttribute('aria-pressed', !on ? 'true' : 'false');
  studyModeBtn?.setAttribute('aria-pressed', on ? 'true' : 'false');
  if (scrollToGuide) {
    document.getElementById('modeSwitcher')?.scrollIntoView({behavior:'smooth', block:'start'});
  }
}

applyMemorizeMode(localStorage.getItem('memorizeMode') === 'on');
memorizeToggle?.addEventListener('click', () => {
  applyMemorizeMode(!document.body.classList.contains('memorize-mode'), true);
});
readingModeBtn?.addEventListener('click', () => applyMemorizeMode(false, false));
studyModeBtn?.addEventListener('click', () => applyMemorizeMode(true, false));

/* Accessibility tools: screen-reader view, continuous text, and speech synthesis. */
const screenReaderToggle = document.getElementById('screenReaderToggle');
const screenReaderMain = document.getElementById('screenReaderMain');
const continuousReadToggle = document.getElementById('continuousReadToggle');
const continuousMain = document.getElementById('continuousMain');
const continuousReading = document.getElementById('continuousReading');
const continuousBody = document.getElementById('continuousBody');
const readContinuous = document.getElementById('readContinuous');
const hideContinuous = document.getElementById('hideContinuous');
const readPageSummary = document.getElementById('readPageSummary');
const stopSpeechButton = document.getElementById('stopSpeech');

function getSectionData(section, index){
  const card = section.querySelector('.story-card');
  const title = card?.querySelector('h2')?.textContent.trim() || '';
  const meta = card?.querySelector('.section-meta span')?.textContent.trim() || `المشهد ${index + 1}`;
  const paragraphs = Array.from(card?.children || [])
    .filter(el => el.tagName === 'P')
    .map(p => p.textContent.trim())
    .filter(Boolean);
  const lesson = card?.querySelector('.lesson span')?.textContent.trim() || '';
  const summary = card?.querySelector('.memory-summary span')?.textContent.trim() || '';
  const question = card?.querySelector('.quiz-question')?.textContent.trim() || '';
  const answer = card?.querySelector('.answer-card p')?.textContent.trim() || '';
  const sources = Array.from(card?.querySelectorAll('.source-chip') || []).map(a => a.textContent.trim()).filter(Boolean);
  return {title, meta, paragraphs, lesson, summary, question, answer, sources};
}

function sectionFullText(section, index){
  const data = getSectionData(section, index);
  return [
    data.meta,
    data.title,
    ...data.paragraphs,
    data.lesson ? `المغزى: ${data.lesson}` : '',
    data.summary ? `خلاصة الحفظ: ${data.summary}` : '',
    data.question ? `سؤال تثبيت: ${data.question}` : '',
    data.answer ? `الجواب: ${data.answer}` : ''
  ].filter(Boolean).join('. ');
}

function sectionSummaryText(section, index){
  const data = getSectionData(section, index);
  return [
    data.title,
    data.summary ? `خلاصة الحفظ: ${data.summary}` : '',
    data.lesson ? `المغزى: ${data.lesson}` : '',
    data.question ? `سؤال سريع: ${data.question}` : ''
  ].filter(Boolean).join('. ');
}

function splitSpeechText(text){
  const normalized = String(text || '').replace(/\s+/g,' ').trim();
  if (!normalized) return [];
  const sentences = normalized.split(/(?<=[.!؟؛])\s+/);
  const chunks = [];
  let current = '';
  sentences.forEach(sentence => {
    if ((current + ' ' + sentence).trim().length > 700) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = (current + ' ' + sentence).trim();
    }
  });
  if (current) chunks.push(current.trim());
  return chunks.length ? chunks : [normalized.slice(0,700)];
}

let speechQueue = [];
let speechIndex = 0;

function getArabicVoice(){
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return voices.find(v => /^ar/i.test(v.lang)) || voices.find(v => /arabic|عرب/i.test(v.name)) || null;
}

function stopSpeech(announceStop = true){
  speechQueue = [];
  speechIndex = 0;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (announceStop) announce('تم إيقاف القراءة الصوتية');
}

function speakNext(){
  if (!speechQueue.length || !('speechSynthesis' in window)) return;
  const text = speechQueue[speechIndex];
  if (!text) {
    speechQueue = [];
    speechIndex = 0;
    announce('انتهت القراءة الصوتية');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar';
  utterance.rate = 0.92;
  utterance.pitch = 1;
  const voice = getArabicVoice();
  if (voice) utterance.voice = voice;
  utterance.onend = () => {
    speechIndex += 1;
    speakNext();
  };
  utterance.onerror = () => {
    speechIndex += 1;
    speakNext();
  };
  window.speechSynthesis.speak(utterance);
}

function speakText(text, label = 'النص'){
  if (!('speechSynthesis' in window)) {
    announce('القراءة الصوتية غير مدعومة في هذا المتصفح');
    alert('القراءة الصوتية غير مدعومة في هذا المتصفح.');
    return;
  }
  stopSpeech(false);
  speechQueue = splitSpeechText(text);
  speechIndex = 0;
  announce(`بدأت قراءة ${label}`);
  speakNext();
}

function addListenButtons(){
  sections.forEach((section, index) => {
    const card = section.querySelector('.story-card');
    const heading = card?.querySelector('h2');
    if (!card || !heading || card.querySelector('.listen-controls')) return;
    const controls = document.createElement('div');
    controls.className = 'listen-controls';
    controls.setAttribute('aria-label','أدوات القراءة الصوتية لهذا المشهد');
    controls.innerHTML = `
      <button class="read-scene" type="button">استمع للمشهد</button>
      <button class="read-summary" type="button">استمع للخلاصة</button>
      <button class="stop-scene" type="button">إيقاف الصوت</button>
    `;
    heading.after(controls);
    controls.querySelector('.read-scene')?.addEventListener('click', () => speakText(sectionFullText(section, index), `المشهد ${index + 1}`));
    controls.querySelector('.read-summary')?.addEventListener('click', () => speakText(sectionSummaryText(section, index), `خلاصة المشهد ${index + 1}`));
    controls.querySelector('.stop-scene')?.addEventListener('click', () => stopSpeech(true));
  });
}

function buildContinuousReading(){
  if (!continuousBody || continuousBody.dataset.ready === 'true') return;
  const html = sections.map((section, index) => {
    const data = getSectionData(section, index);
    const paragraphHtml = data.paragraphs.map(p => `<p>${escapeHTML(p)}</p>`).join('');
    const sourceText = data.sources.slice(0,2).join('، ');
    return `
      <article class="continuous-item">
        <h3>${String(index + 1).padStart(2,'0')} — ${escapeHTML(data.title)}</h3>
        ${paragraphHtml}
        ${data.summary ? `<p class="continuous-memory">خلاصة الحفظ: ${escapeHTML(data.summary)}</p>` : ''}
        ${data.lesson ? `<p><b>المغزى:</b> ${escapeHTML(data.lesson)}</p>` : ''}
        ${data.question ? `<p><b>سؤال:</b> ${escapeHTML(data.question)}</p>` : ''}
        ${data.answer ? `<p><b>الجواب:</b> ${escapeHTML(data.answer)}</p>` : ''}
        ${sourceText ? `<p><b>مصدر التثبيت:</b> ${escapeHTML(sourceText)}</p>` : ''}
      </article>
    `;
  }).join('');
  continuousBody.innerHTML = html;
  continuousBody.dataset.ready = 'true';
}

function showContinuous(scroll = true){
  buildContinuousReading();
  if (continuousReading) continuousReading.hidden = false;
  if (scroll) continuousReading?.scrollIntoView({behavior:'smooth', block:'start'});
  announce('تم عرض السيرة كنص متصل');
}

function hideContinuousSection(){
  if (continuousReading) continuousReading.hidden = true;
  announce('تم إخفاء النص المتصل');
}

function setScreenReaderLabel(on){
  const text = on ? 'عادي' : 'قارئ';
  const label = on ? 'إيقاف وضع قارئ الشاشة والعودة للعرض العادي' : 'تفعيل وضع قارئ الشاشة';
  if (screenReaderToggle) {
    screenReaderToggle.innerHTML = `<span aria-hidden="true">${on ? '↩' : '♿'}</span><b>${text}</b>`;
    screenReaderToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    screenReaderToggle.setAttribute('aria-label', label);
  }
  if (screenReaderMain) {
    screenReaderMain.textContent = on ? 'إيقاف وضع قارئ الشاشة' : 'تفعيل وضع قارئ الشاشة';
    screenReaderMain.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}

function applyScreenReaderMode(on, scroll = false){
  document.body.classList.toggle('screen-reader-mode', Boolean(on));
  localStorage.setItem('screenReaderMode', on ? 'on' : 'off');
  setScreenReaderLabel(Boolean(on));
  if (on) showContinuous(false);
  if (scroll) document.getElementById('accessibility')?.scrollIntoView({behavior:'smooth', block:'start'});
  announce(on ? 'تم تفعيل وضع قارئ الشاشة' : 'تم إيقاف وضع قارئ الشاشة');
}

function pageSummaryText(){
  return [
    'سلمان الفارسي، الباحث عن الحقيقة.',
    'ولد في فارس، وخرج باحثًا عن اليقين، وتنقل بين المعلمين حتى وصل إلى المدينة.',
    'عرف النبي صلى الله عليه وسلم بعلامات ثلاث: لا يأكل الصدقة، ويأكل الهدية، وبين كتفيه خاتم النبوة.',
    'اشتهر يوم الخندق برأيه في حفر الخندق، وعُرف بالزهد والتواضع وفقه التوازن.',
    'هذه السيرة تركز على صدق البحث، وخدمة الحق، والتواضع بعد المكانة.'
  ].join(' ');
}

addListenButtons();
buildContinuousReading();

applyScreenReaderMode(localStorage.getItem('screenReaderMode') === 'on', false);
screenReaderToggle?.addEventListener('click', () => applyScreenReaderMode(!document.body.classList.contains('screen-reader-mode'), true));
screenReaderMain?.addEventListener('click', () => applyScreenReaderMode(!document.body.classList.contains('screen-reader-mode'), true));
continuousReadToggle?.addEventListener('click', () => showContinuous(true));
continuousMain?.addEventListener('click', () => showContinuous(true));
hideContinuous?.addEventListener('click', hideContinuousSection);
readContinuous?.addEventListener('click', () => {
  buildContinuousReading();
  const text = Array.from(continuousBody?.querySelectorAll('.continuous-item') || []).map(el => el.textContent.trim()).join('. ');
  speakText(text, 'النص المتصل');
});
readPageSummary?.addEventListener('click', () => speakText(pageSummaryText(), 'خلاصة السيرة'));
stopSpeechButton?.addEventListener('click', () => stopSpeech(true));

document.addEventListener('toggle', (event) => {
  const details = event.target;
  if (!(details instanceof HTMLDetailsElement) || !details.open) return;
  if (details.classList.contains('answer-card') || details.classList.contains('memory-answer')) {
    announce('تم إظهار الجواب');
  } else if (details.classList.contains('sources-drawer')) {
    announce('تم فتح مصادر هذا المشهد');
  }
}, true);


// Floating quick tools menu
const quickTools = document.getElementById('quickTools');
const quickToolsToggle = document.getElementById('quickToolsToggle');
const quickToolsMenu = document.getElementById('quickToolsMenu');
function setQuickToolsOpen(open){
  quickTools?.classList.toggle('open', Boolean(open));
  quickToolsToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  quickToolsToggle?.setAttribute('aria-label', open ? 'إغلاق الأدوات السريعة' : 'فتح الأدوات السريعة');
  announce(open ? 'تم فتح الأدوات السريعة' : 'تم إغلاق الأدوات السريعة');
}
quickToolsToggle?.addEventListener('click', (event) => {
  event.stopPropagation();
  setQuickToolsOpen(!quickTools?.classList.contains('open'));
});
quickToolsMenu?.addEventListener('click', (event) => {
  const target = event.target.closest('a');
  if (target) setQuickToolsOpen(false);
});
document.addEventListener('click', (event) => {
  if (quickTools?.classList.contains('open') && !quickTools.contains(event.target)) {
    setQuickToolsOpen(false);
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && quickTools?.classList.contains('open')) {
    setQuickToolsOpen(false);
    quickToolsToggle?.focus({preventScroll:true});
  }
});

// PWA install support
const installButton = document.getElementById('installButton');
const installHint = document.getElementById('installHint');
let deferredInstallPrompt = null;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      if (installHint) installHint.textContent = 'للتثبيت كتطبيق، افتحوا الموقع من رابط HTTPS أو من استضافة آمنة، وليس من ملف مباشر.';
    });
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.body.classList.add('pwa-ready');
  if (installButton) installButton.hidden = false;
  if (installHint) installHint.textContent = 'جاهز للتثبيت: اضغطي زر تثبيت كبرنامج وسيظهر بين التطبيقات على الموبايل.';
});

installButton?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

if (isStandalone) {
  if (installButton) installButton.hidden = true;
  if (installHint) installHint.textContent = 'الموقع مفتوح الآن كتطبيق مستقل.';
}

// Off-canvas table of contents
const tocToggle = document.getElementById('tocToggle');
const tocDrawer = document.getElementById('tocDrawer');
const tocClose = document.getElementById('tocClose');
const tocBackdrop = document.getElementById('tocBackdrop');

function openToc(){
  document.body.classList.add('toc-open');
  tocToggle?.setAttribute('aria-expanded','true');
  tocDrawer?.setAttribute('aria-hidden','false');
  if (tocBackdrop) tocBackdrop.hidden = false;
  if (!window.matchMedia('(max-width: 760px)').matches) {
    setTimeout(() => filter?.focus({preventScroll:true}), 80);
  }
  announce('تم فتح الفهرس');
}
function closeToc(){
  document.body.classList.remove('toc-open');
  tocToggle?.setAttribute('aria-expanded','false');
  tocDrawer?.setAttribute('aria-hidden','true');
  if (tocBackdrop) tocBackdrop.hidden = true;
  tocToggle?.focus({preventScroll:true});
  announce('تم إغلاق الفهرس');
}

tocToggle?.addEventListener('click', () => {
  document.body.classList.contains('toc-open') ? closeToc() : openToc();
});
tocClose?.addEventListener('click', closeToc);
tocBackdrop?.addEventListener('click', closeToc);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('toc-open')) closeToc();
});
links.forEach(link => link.addEventListener('click', () => {
  if (document.body.classList.contains('toc-open')) {
    document.body.classList.remove('toc-open');
    tocToggle?.setAttribute('aria-expanded','false');
    tocDrawer?.setAttribute('aria-hidden','true');
    if (tocBackdrop) tocBackdrop.hidden = true;
  }
}));
