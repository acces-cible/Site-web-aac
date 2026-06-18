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
/* ── NAV : cacher au scroll vers le bas, réafficher au scroll vers le haut ── */
function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  let dernierScroll = window.scrollY;
  const seuil = 6; // ignore les micro-mouvements pour éviter le tremblement

  nav.style.transition = 'transform .25s ease';

  window.addEventListener('scroll', () => {
    const actuel = window.scrollY;
    const diff = actuel - dernierScroll;

    if (Math.abs(diff) < seuil) return;

    if (diff > 0 && actuel > nav.offsetHeight) {
      // scroll vers le bas → cacher la nav
      nav.style.transform = 'translateY(-100%)';
    } else {
      // scroll vers le haut (ou tout en haut de la page) → réafficher la nav
      nav.style.transform = 'translateY(0)';
    }
    dernierScroll = actuel;
  }, { passive: true });
}
function initNav() {
  marquerPageActive();
  initNavScroll();
}
document.addEventListener('DOMContentLoaded', () => {
  chargerComposant('nav.html',    'nav-container',    initNav);
  chargerComposant('footer.html', 'footer-container', null);
  initLightbox();
});
/* ── MENU HAMBURGER ── */
function toggleMenu() {
  const mobile = document.getElementById('navMobile');
  if (mobile) mobile.classList.toggle('ouvert');
}
/* ── LANGUE FR / EN ── */
window.langue = 'fr';
function toggleLangue() {
  window.langue = window.langue === 'fr' ? 'en' : 'fr';
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = window.langue === 'fr' ? 'EN' : 'FR';
  document.documentElement.lang = window.langue;
  /* Texte simple */
  document.querySelectorAll('[data-fr]').forEach(el => {
    const val = el.dataset[window.langue];
    if (!val) return;
    if (val.includes('<')) el.innerHTML = val;
    else el.textContent = val;
  });
  /* HTML riche (titres avec <em>, <br>) */
  document.querySelectorAll('[data-fr-html]').forEach(el => {
    const val = el.dataset[window.langue + 'Html'];
    if (val) el.innerHTML = val;
  });
}
/* ── LIGHTBOX (zoom image, partagée sur tout le site) ──
   Usage : ajouter class="zoomable" sur n'importe quelle <img>.
   Le clic ouvre l'image en grand. Échap ou clic hors-image ferme.
   N'affecte jamais les images sans cette classe (ex: swatches couleur). */
function initLightbox() {
  if (document.getElementById('lightbox-overlay')) return; // déjà injecté
  const overlay = document.createElement('div');
  overlay.id = 'lightbox-overlay';
  overlay.innerHTML = '<button id="lightbox-close" aria-label="Fermer">&times;</button><img id="lightbox-img" src="" alt="">';
  document.body.appendChild(overlay);
  const imgEl = document.getElementById('lightbox-img');
  function ouvrir(src, alt) {
    imgEl.src = src;
    imgEl.alt = alt || '';
    overlay.classList.add('ouvert');
    document.body.style.overflow = 'hidden';
  }
  function fermer() {
    overlay.classList.remove('ouvert');
    document.body.style.overflow = '';
    imgEl.src = '';
  }
  // Délégation d'événement : capte aussi les images chargées dynamiquement plus tard
  document.addEventListener('click', (e) => {
    const img = e.target.closest('img.zoomable');
    if (img) {
      ouvrir(img.currentSrc || img.src, img.alt);
      return;
    }
    if (e.target === overlay) fermer();
  });
  document.getElementById('lightbox-close').addEventListener('click', fermer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('ouvert')) fermer();
  });
}
