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
/* ── NAV : cacher au scroll vers le bas, réafficher au scroll vers le haut ──
   Ajuste aussi le "top" de toute barre secondaire sticky (ex: .ancres sur
   accessoires.html, .tab-bar sur marchepied.html) pour qu'elle colle au
   bord de l'écran quand la nav est cachée, et sous la nav quand elle est visible. */
function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const navHauteur = nav.offsetHeight || 58;
  const barreSecondaire = document.querySelector('.ancres, .tab-bar');

  let dernierScroll = window.scrollY;
  const seuil = 6; // ignore les micro-mouvements pour éviter le tremblement

  nav.style.transition = 'transform .25s ease';
  if (barreSecondaire) barreSecondaire.style.transition = 'top .25s ease';

  function afficherNav() {
    nav.style.transform = 'translateY(0)';
    if (barreSecondaire) barreSecondaire.style.top = navHauteur + 'px';
  }
  function cacherNav() {
    nav.style.transform = 'translateY(-100%)';
    if (barreSecondaire) barreSecondaire.style.top = '0px';
  }

  afficherNav(); // état initial cohérent

  window.addEventListener('scroll', () => {
    const actuel = window.scrollY;
    const diff = actuel - dernierScroll;

    if (Math.abs(diff) < seuil) return;

    if (diff > 0 && actuel > navHauteur) {
      // scroll vers le bas → cacher la nav
      cacherNav();
    } else {
      // scroll vers le haut (ou tout en haut de la page) → réafficher la nav
      afficherNav();
    }
    dernierScroll = actuel;
  }, { passive: true });
}
function initNav() {
  marquerPageActive();
  initNavScroll();
  appliquerLangueSauvegardee();
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
/* ── LANGUE FR / EN ──
   Le choix de langue est mémorisé dans localStorage (clé "langue-accescible")
   pour rester actif d'une page à l'autre, jusqu'à ce que la personne clique
   à nouveau sur le bouton pour revenir à l'autre langue. */
window.langue = 'fr';

function appliquerTexteLangue() {
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
  /* Signal global pour toute section qui a besoin de réagir au changement
     de langue indépendamment du système data-fr/data-en (ex: accessoires.html
     section Couleurs, qui affiche le nom de la teinte dans la bonne langue). */
  document.dispatchEvent(new CustomEvent('langueChange', { detail: window.langue }));
}

// Appelé une fois la nav injectée (donc #langBtn disponible) à chaque
// chargement de page — relit le choix précédent et l'applique sans
// attendre de clic, pour que la langue reste la même partout sur le site.
function appliquerLangueSauvegardee() {
  let sauvegardee = 'fr';
  try { sauvegardee = localStorage.getItem('langue-accescible') || 'fr'; } catch (e) { /* navigation privée ou stockage bloqué : reste en fr */ }
  window.langue = sauvegardee;
  appliquerTexteLangue();
}

function toggleLangue() {
  window.langue = window.langue === 'fr' ? 'en' : 'fr';
  try { localStorage.setItem('langue-accescible', window.langue); } catch (e) { /* stockage indisponible : le choix ne survivra pas au changement de page, sans plus */ }
  appliquerTexteLangue();
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
