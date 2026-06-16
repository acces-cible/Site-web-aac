/* ═══════════════════════════════════════════════
   Les Adaptations Accès-Cible — scripts.js
   Script global · Toutes les pages
   ═══════════════════════════════════════════════ */

/* ── CHARGEMENT NAV + FOOTER ── */
function chargerComposant(fichier, conteneurId, callback) {
  fetch(fichier)
    .then(r => r.text())
    .then(html => {
      document.getElementById(conteneurId).innerHTML = html;
      if (callback) callback();
    })
    .catch(() => console.warn('Impossible de charger ' + fichier));
}

function marquerPageActive() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-liens a, .nav-mobile a').forEach(lien => {
    const href = lien.getAttribute('href');
    if (href && href.split('#')[0] === page) {
      lien.classList.add('actif');
    }
  });
}

function initNav() {
  marquerPageActive();
}

document.addEventListener('DOMContentLoaded', () => {
  chargerComposant('nav.html',    'nav-container',    initNav);
  chargerComposant('footer.html', 'footer-container', null);
});

/* ── MENU HAMBURGER ── */
function toggleMenu() {
  const mobile = document.getElementById('navMobile');
  if (mobile) mobile.classList.toggle('ouvert');
}

/* ── LANGUE FR / EN ── */
let langue = 'fr';

function toggleLangue() {
  langue = langue === 'fr' ? 'en' : 'fr';

  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = langue === 'fr' ? 'EN' : 'FR';
  document.documentElement.lang = langue;

  /* Texte simple */
  document.querySelectorAll('[data-fr]').forEach(el => {
    const val = el.dataset[langue];
    if (!val) return;
    if (val.includes('<')) el.innerHTML = val;
    else el.textContent = val;
  });

  /* HTML riche (titres avec <em>, <br>) */
  document.querySelectorAll('[data-fr-html]').forEach(el => {
    const val = el.dataset[langue + 'Html'];
    if (val) el.innerHTML = val;
  });
}
