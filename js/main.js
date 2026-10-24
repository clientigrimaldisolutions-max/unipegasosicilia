document.documentElement.classList.remove('no-js');

// Menu laterale (come il sito di riferimento: hamburger su tutte le risoluzioni)
const toggleMenu = open => document.body.classList.toggle('menu-open', open);
document.querySelector('.burger')?.addEventListener('click', () => toggleMenu(true));
document.querySelector('.menu-close')?.addEventListener('click', () => toggleMenu(false));
document.querySelector('.menu-overlay')?.addEventListener('click', () => toggleMenu(false));
document.addEventListener('keydown', e => e.key === 'Escape' && toggleMenu(false));
document.querySelectorAll('.has-sub > a').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); a.parentElement.classList.toggle('open');
}));

// Slideshow hero: alterna le foto di Siracusa e Caltagirone
const slides = [...document.querySelectorAll('.slide')];
const label = document.querySelector('.slide-label .txt');
if (slides.length > 1) {
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove('on');
    i = (i + 1) % slides.length;
    slides[i].classList.add('on');
    if (label) { label.style.opacity = 0; setTimeout(() => { label.textContent = slides[i].dataset.label; label.style.opacity = 1; }, 800); }
  }, 6000);
}

// ---------------------------------------------------------------- MOTION
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(hover: none)').matches;  // su telefono niente parallax: più fluido

// Titolo hero: le parole salgono una alla volta
const h1 = document.querySelector('.hb-panel h1');
if (h1 && !reduce) {
  let i = 0;
  h1.innerHTML = h1.textContent.trim().split(/\s+/)
    .map(w => `<span class="w"><span style="--i:${i++}">${w}</span></span>`).join(' ');
  [['.hb-panel .sub-h', .7], ['.hb-panel .hero-actions', .85], ['.hb-logo', 1.05]].forEach(([sel, d]) => {
    const el = document.querySelector(sel);
    if (el) { el.classList.add('fade-in'); el.style.setProperty('--d', d + 's'); }
  });
}
setTimeout(() => document.documentElement.classList.add('intro-done'), 1800);
document.querySelector('.hero-brand')?.insertAdjacentHTML('beforeend', '<span class="scroll-hint" aria-hidden="true"></span>');

// Comparsa allo scroll, con effetto a cascata sugli elementi in griglia
document.querySelectorAll('.cols-3, .grid-2, .grid-3, .courses, .icons-2, .partners').forEach(g =>
  [...g.children].forEach((c, n) => { c.classList.add('reveal'); c.style.setProperty('--d', (n % 6) * 0.08 + 's'); }));
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Header compatto, barra di avanzamento, parallax foto, barra contatti mobile
const header = document.querySelector('.site-header');
const progress = document.querySelector('.progress');
const mobileCta = document.querySelector('.mobile-cta');
const parallax = [...document.querySelectorAll('.ph')];
let ticking = false;
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  header?.classList.toggle('scrolled', y > 40);
  progress?.style.setProperty('--p', h > 0 ? y / h : 0);
  mobileCta?.classList.toggle('show', y > innerHeight * .6);
  if (!reduce && !touch) parallax.forEach(el => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) el.style.setProperty('--py', ((r.top + r.height / 2 - innerHeight / 2) * -0.06).toFixed(1) + 'px');
  });
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

// Chiama / WhatsApp: con due sedi si apre una finestrella per scegliere quale
const closePicks = () => document.querySelectorAll('.pick.open').forEach(p => p.classList.remove('open'));
document.querySelectorAll('[data-pick]').forEach(btn => btn.addEventListener('click', e => {
  e.preventDefault(); e.stopPropagation();
  const p = document.getElementById(btn.dataset.pick), wasOpen = p.classList.contains('open');
  closePicks();
  if (!wasOpen) p.classList.add('open');
}));
document.addEventListener('click', e => { if (!e.target.closest('.pick')) closePicks(); });
document.addEventListener('keydown', e => e.key === 'Escape' && closePicks());

// Scelta del corso in due passaggi: tipo di percorso -> corsi di quel tipo (raggruppati per ateneo)
document.querySelectorAll('form.lead').forEach(form => {
  const tipo = form.querySelector('[name=tipo]'), corso = form.querySelector('[name=corso]');
  if (!tipo || !corso || !window.CATALOGO) return;
  const wrap = corso.closest('.corso-wrap');
  const fill = () => {
    const gruppi = window.CATALOGO[tipo.value];
    if (!gruppi) { wrap.hidden = true; corso.disabled = true; corso.required = false; return; }
    const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const opt = n => `<option value="${esc(n)}"${n === corso.dataset.sel ? ' selected' : ''}>${esc(n)}</option>`;
    corso.innerHTML = '<option value="" disabled selected>Scegli…</option>' + Object.entries(gruppi).map(([g, lista]) =>
      g ? `<optgroup label="${esc(g)}">${lista.map(opt).join('')}</optgroup>` : lista.map(opt).join('')).join('');
    if (corso.dataset.sel && [...corso.options].some(o => o.value === corso.dataset.sel)) corso.value = corso.dataset.sel;
    wrap.hidden = false; corso.disabled = false; corso.required = true;
    corso.dataset.sel = '';
  };
  tipo.addEventListener('change', fill);
  if (tipo.value) fill();
});

// Pagina corsi: "Richiedi informazioni" preseleziona il corso nel form in fondo
document.querySelectorAll('[data-corso]').forEach(a => a.addEventListener('click', () => {
  const form = document.querySelector('#richiedi form.lead'); if (!form || !window.CATALOGO) return;
  const nome = a.dataset.corso;
  const tipo = Object.keys(window.CATALOGO).find(t => Object.values(window.CATALOGO[t]).some(l => l.includes(nome)));
  if (!tipo) return;
  form.tipo.value = tipo; form.corso.dataset.sel = nome;
  form.tipo.dispatchEvent(new Event('change'));
}));

// Form: la richiesta viene salvata nel foglio Google (e parte l'email di avviso), poi si apre
// WhatsApp verso la sede scelta e la pagina passa a "Grazie" (utile anche per le conversioni).
// Invio con URLSearchParams e NESSUN header: richiesta "semplice", senza preflight, che le web app
// di Apps Script non gestiscono. Se la risposta non è leggibile si riprova in no-cors.
document.querySelectorAll('form.lead').forEach(form => form.addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  if (d['bot-field']) return;                       // compilato solo dai bot
  delete d['bot-field'];
  const sede = form.querySelector('[name=sede] option:checked');
  const numero = sede?.dataset.wa;
  const testo = `Richiesta informazioni dal sito\nNome: ${d.nome} ${d.cognome || ''}\nEmail: ${d.email}\nTelefono: ${d.telefono}\nSede: ${d.sede}\nPercorso: ${d.tipo || '-'}${d.corso ? ' – ' + d.corso : ''}${d.messaggio ? '\nMessaggio: ' + d.messaggio : ''}`;
  if (window.ENDPOINT_MODULO) {
    const body = new URLSearchParams({ ...d, pagina: location.pathname, origine: location.hostname });
    fetch(window.ENDPOINT_MODULO, { method: 'POST', body, keepalive: true })
      .catch(() => fetch(window.ENDPOINT_MODULO, { method: 'POST', body, mode: 'no-cors', keepalive: true }).catch(() => {}));
  } else {
    console.warn('[modulo] ENDPOINT_MODULO non impostato: la richiesta parte solo su WhatsApp');
  }
  const btn = form.querySelector('button[type=submit]'), lbl = btn.querySelector('.lbl');
  btn.classList.add('sent'); if (lbl) lbl.textContent = 'Richiesta inviata';
  form.querySelector('.form-ok').style.display = 'block';
  if (window.fbq) fbq('track', 'Lead');
  if (numero) window.open(`https://wa.me/${numero}?text=${encodeURIComponent(testo)}`, '_blank');
  setTimeout(() => { location.href = 'grazie.html'; }, 700);
}));

// Meta Pixel con consenso: attivo solo se in build.py è impostato PIXEL_ID
(function () {
  if (!window.PIXEL_ID) return;
  const KEY = 'consenso-cookie';
  const carica = () => {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', window.PIXEL_ID); fbq('track', 'PageView');
    if (/grazie\.html$/.test(location.pathname)) fbq('track', 'Lead');
  };
  let scelta = null; try { scelta = localStorage.getItem(KEY); } catch (e) {}
  if (scelta === 'si') return carica();
  if (scelta === 'no') return;
  const b = document.createElement('div');
  b.className = 'cookie-bar'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Preferenze cookie');
  b.innerHTML = '<p>Usiamo cookie di misurazione per migliorare le nostre campagne. <a href="privacy-cookie-policy.html">Informativa</a></p><div><button class="btn ghost" data-c="no">Rifiuta</button><button class="btn" data-c="si">Accetta</button></div>';
  document.body.append(b);
  b.addEventListener('click', e => { const c = e.target.dataset.c; if (!c) return; try { localStorage.setItem(KEY, c); } catch (err) {} b.remove(); if (c === 'si') carica(); });
})();

// Filtro corsi per ateneo
document.querySelectorAll('.filter').forEach(f => f.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  f.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  const uni = b.dataset.uni;
  document.querySelectorAll('.course').forEach(c => c.hidden = uni !== 'tutti' && c.dataset.uni !== uni);
}));
