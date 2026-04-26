
const root = document.documentElement;
const toggle = document.getElementById('themeToggle');
const storedTheme = localStorage.getItem('theme');
if (storedTheme === 'dark') {
  root.classList.add('dark');
  toggle.textContent = 'الوضع النهاري';
}
toggle?.addEventListener('click', () => {
  root.classList.toggle('dark');
  const dark = root.classList.contains('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  toggle.textContent = dark ? 'الوضع النهاري' : 'الوضع الليلي';
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
});
fontDecrease?.addEventListener('click', () => {
  fontLevel = Math.max(0, fontLevel - 1);
  localStorage.setItem('fontLevel', String(fontLevel));
  applyFontLevel();
});
applyFontLevel();

if (localStorage.getItem('memorizeMode') === 'on') {
  document.body.classList.add('memorize-mode');
  if (memorizeToggle) memorizeToggle.textContent = 'إيقاف الحفظ';
}
memorizeToggle?.addEventListener('click', () => {
  document.body.classList.toggle('memorize-mode');
  const on = document.body.classList.contains('memorize-mode');
  localStorage.setItem('memorizeMode', on ? 'on' : 'off');
  memorizeToggle.textContent = on ? 'إيقاف الحفظ' : 'وضع الحفظ';
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
}
function closeToc(){
  document.body.classList.remove('toc-open');
  tocToggle?.setAttribute('aria-expanded','false');
  tocDrawer?.setAttribute('aria-hidden','true');
  if (tocBackdrop) tocBackdrop.hidden = true;
  tocToggle?.focus({preventScroll:true});
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
