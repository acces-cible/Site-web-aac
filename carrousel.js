/* ═══════════════════════════════════════════════
   Les Adaptations Accès-Cible — carrousel.js
   Composant carrousel photo + lightbox — PARTAGÉ
   ═══════════════════════════════════════════════
   Remplace les 4 implémentations dupliquées sur
   ergo.html / marchepied.html / surmesure.html /
   accessoires.html par UNE seule API déclarative.

   ───────────────────────────────────────────────
   COMMENT UTILISER (déclaratif, pas de JS par page)
   ───────────────────────────────────────────────

   1. Donner à la zone-image un id unique et la classe "crsl-zone" :
      <div class="crsl-zone carnet-photo-inner" id="photo-ergo-standard">
        <img src="..." alt="...">
      </div>

   2. Appeler Carrousel.init(id, photos, options) une fois les photos connues :
      Carrousel.init('photo-ergo-standard', [
        'images/Chaises/IMG_1314_rogner.png'
      ], { alt: 'Chaise ERGO standard', caption: '— ERGO · standard' });

      Avec plusieurs photos, flèches/dots apparaissent automatiquement :
      Carrousel.init('photo-ergo-xl', [
        'images/Chaises/Chaise 24po.jpg',
        'images/Chaises/Chaise 24po(2).jpg'
      ], { alt: 'ERGO XL', caption: '— ERGO · XL 24po' });

   3. Pour changer les photos d'une zone déjà initialisée (ex: sélecteur
      d'options qui change la combinaison affichée), rappeler Carrousel.init
      avec le même id et les nouvelles photos — il met à jour proprement.

   4. Si aucune photo n'est disponible encore, passer un tableau vide :
      Carrousel.init('photo-x', [], { alt: 'Produit à venir' });
      → affiche automatiquement un placeholder "Photo à venir" cohérent.

   5. Le bouton zoom est activé par défaut. Pour le désactiver sur une zone
      précise (ex: petites photos décoratives qui n'ont pas besoin d'être
      vues en grand) :
      Carrousel.init('photo-deco', ['...'], { alt: '...', zoom: false });

   Le composant gère pour chaque zone : l'image courante, les flèches
   (masquées si une seule photo), les points indicateurs, le bouton zoom,
   et partage UNE SEULE lightbox globale pour tout le site (créée une fois,
   injectée automatiquement au premier appel de Carrousel.init).

   Navigation clavier dans la lightbox : ← → pour naviguer, Échap pour fermer.
   ═══════════════════════════════════════════════ */

const Carrousel = (function () {
  const zones = {}; // id -> { photos, index, alt, caption, el }
  let lightboxOuverte = null; // id de la zone actuellement dans la lightbox

  const SVG_GAUCHE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
  const SVG_DROITE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
  const SVG_ZOOM = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/><path d="M11 8v6M8 11h6"/></svg>';
  const SVG_FERMER = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  const SVG_GAUCHE_GD = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
  const SVG_DROITE_GD = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

  function injecterLightbox() {
    if (document.getElementById('crsl-lightbox')) return;
    const overlay = document.createElement('div');
    overlay.id = 'crsl-lightbox';
    overlay.innerHTML =
      '<div class="crsl-lightbox-wrap">' +
        '<img id="crsl-lightbox-img" src="" alt="">' +
        '<div class="crsl-lightbox-caption" id="crsl-lightbox-caption"></div>' +
      '</div>' +
      '<button class="crsl-lightbox-fermer" id="crsl-lightbox-fermer" aria-label="Fermer">' + SVG_FERMER + '</button>' +
      '<button class="crsl-lightbox-nav gauche" id="crsl-lightbox-gauche" aria-label="Photo précédente">' + SVG_GAUCHE_GD + '</button>' +
      '<button class="crsl-lightbox-nav droite" id="crsl-lightbox-droite" aria-label="Photo suivante">' + SVG_DROITE_GD + '</button>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) fermerLightbox(); });
    document.getElementById('crsl-lightbox-fermer').addEventListener('click', fermerLightbox);
    document.getElementById('crsl-lightbox-gauche').addEventListener('click', () => naviguer(lightboxOuverte, -1));
    document.getElementById('crsl-lightbox-droite').addEventListener('click', () => naviguer(lightboxOuverte, 1));

    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('visible')) return;
      if (e.key === 'Escape') fermerLightbox();
      if (e.key === 'ArrowRight') naviguer(lightboxOuverte, 1);
      if (e.key === 'ArrowLeft') naviguer(lightboxOuverte, -1);
    });
  }

  function placeholderHTML(label) {
    return '<div class="crsl-placeholder" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:100%;height:100%;color:var(--c-muted,#7a7060);font-size:12px;text-align:center;padding:16px;">' +
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="m21 15-5-5L5 21"/></svg>' +
      '<span>' + (label || 'Photo à venir') + '</span></div>';
  }

  function construireStructure(id) {
    const z = zones[id];
    const el = z.el;
    if (!el) return;

    if (!z.photos.length) {
      el.innerHTML = placeholderHTML(z.alt);
      return;
    }

    const plusieurs = z.photos.length > 1;
    el.innerHTML =
      '<img src="' + z.photos[z.index] + '" alt="' + (z.alt || '') + '" ' +
        'onerror="this.style.display=\'none\';this.insertAdjacentHTML(\'afterend\', Carrousel._placeholderHTML(\'' + (z.alt || 'Photo à venir').replace(/'/g, "\\'") + '\'))">' +
      (plusieurs ? '<button class="crsl-fleche gauche" aria-label="Photo précédente" onclick="Carrousel.prev(\'' + id + '\')">' + SVG_GAUCHE + '</button>' : '') +
      (plusieurs ? '<button class="crsl-fleche droite" aria-label="Photo suivante" onclick="Carrousel.next(\'' + id + '\')">' + SVG_DROITE + '</button>' : '') +
      (z.zoom ? '<button class="crsl-zoom" aria-label="Agrandir la photo" onclick="Carrousel.openLightbox(\'' + id + '\')">' + SVG_ZOOM + '</button>' : '') +
      (plusieurs ? '<div class="crsl-dots" data-position="overlay">' +
        z.photos.map((_, i) => '<button class="crsl-dot' + (i === z.index ? ' actif' : '') + '" aria-label="Photo ' + (i+1) + '" onclick="Carrousel.goTo(\'' + id + '\',' + i + ')"></button>').join('') +
      '</div>' : '');

    if (z.captionEl) z.captionEl.textContent = z.caption || '';
    if (lightboxOuverte === id) majLightbox(id);
  }

  // Met à jour seulement l'image + les points actifs, sans reconstruire les
  // flèches/zoom déjà en place — évite le flash de cadre vide à chaque clic.
  // Si la structure ne correspond plus (ex: nombre de photos différent du
  // rendu précédent, OU un placeholder résiduel d'un onerror précédent traîne
  // encore dans le DOM), reconstruit tout via construireStructure() à la place.
  //
  // CORRECTIF : l'ancienne version ne détectait QUE l'absence du <img> ou un
  // mauvais nombre de dots comme signe de structure invalide. Mais le onerror
  // de construireStructure() insère un placeholder *en plus* du <img> caché
  // (insertAdjacentHTML('afterend', ...)) sans jamais le retirer — donc si une
  // image avait échoué à charger lors d'un appel précédent, ce placeholder
  // restait pour toujours dans le DOM, empilé sous le nouveau contenu à
  // chaque appel suivant (le bug de texte/photo dupliqués visible à l'écran).
  // On détecte maintenant explicitement ce résidu et on force une reconstruction
  // complète dans ce cas, qui vide proprement tout le innerHTML au passage.
  function mettreAJourImage(id) {
    const z = zones[id];
    const el = z.el;
    if (!el) return;

    const img = el.querySelector('img');
    const placeholderResiduel = el.querySelector('.crsl-placeholder');
    const dotsActuels = el.querySelectorAll('.crsl-dot').length;
    const structureValide = z.photos.length
      ? (img && !placeholderResiduel && dotsActuels === (z.photos.length > 1 ? z.photos.length : 0))
      : !img;

    if (!structureValide) {
      construireStructure(id);
      return;
    }

    if (!z.photos.length) return; // déjà en placeholder, rien à mettre à jour

    img.src = z.photos[z.index];
    img.alt = z.alt || '';
    img.style.display = '';
    el.querySelectorAll('.crsl-dot').forEach((dot, i) => dot.classList.toggle('actif', i === z.index));

    if (z.captionEl) z.captionEl.textContent = z.caption || '';
    if (lightboxOuverte === id) majLightbox(id);
  }

  function naviguer(id, delta) {
    if (!id || !zones[id]) return;
    const z = zones[id];
    if (z.photos.length < 2) return;
    z.index = (z.index + delta + z.photos.length) % z.photos.length;
    mettreAJourImage(id);
  }

  function majLightbox(id) {
    const z = zones[id];
    document.getElementById('crsl-lightbox-img').src = z.photos[z.index];
    document.getElementById('crsl-lightbox-img').alt = z.alt || '';
    document.getElementById('crsl-lightbox-caption').textContent = z.caption || '';
    const plusieurs = z.photos.length > 1;
    document.getElementById('crsl-lightbox-gauche').hidden = !plusieurs;
    document.getElementById('crsl-lightbox-droite').hidden = !plusieurs;
  }

  function fermerLightbox() {
    const overlay = document.getElementById('crsl-lightbox');
    if (overlay) overlay.classList.remove('visible');
    lightboxOuverte = null;
  }

  // ── API publique ──
  return {
    /**
     * Initialise ou met à jour une zone carrousel.
     * @param {string} id - id de l'élément DOM (doit déjà exister, classe crsl-zone recommandée)
     * @param {string[]} photos - chemins des photos, dans l'ordre d'affichage
     * @param {object} options - { alt, caption, captionElId }
     *   captionElId : id d'un élément séparé pour afficher la légende
     *   (sinon la légende n'est affichée que dans la lightbox)
     */
    init(id, photos, options) {
      injecterLightbox();
      const opts = options || {};
      const dejaInitialisee = !!zones[id];
      const nouvellesPhotos = photos || [];

      // CORRECTIF : l'ancienne condition ne comparait que la LONGUEUR des
      // deux tableaux de photos ([Surdimensionnee.jpg] vs [IMG_1314.png] sont
      // tous deux de longueur 1, donc jugés "même structure" alors que ce sont
      // des photos différentes). Ça déclenchait mettreAJourImage() au lieu de
      // construireStructure() à chaque changement de modèle ayant le même
      // nombre de photos — exactement le cas pour Garderie → Standard →
      // Surdimensionnée, qui n'ont chacun qu'une seule image. On compare
      // maintenant aussi le contenu (chemins des fichiers), pas seulement
      // le compte, pour ne prendre le raccourci "mise à jour légère" que
      // lorsque c'est vraiment la même combinaison de photos qui se répète
      // (ex: un sélecteur d'options qui ne change rien à l'image affichée).
      const memesPhotos = dejaInitialisee &&
        zones[id].photos.length === nouvellesPhotos.length &&
        zones[id].photos.every((p, i) => p === nouvellesPhotos[i]);

      zones[id] = {
        el: document.getElementById(id),
        captionEl: opts.captionElId ? document.getElementById(opts.captionElId) : null,
        photos: nouvellesPhotos,
        index: 0,
        alt: opts.alt || '',
        caption: opts.caption || '',
        zoom: opts.zoom !== false // activé par défaut, désactiver avec { zoom: false }
      };

      if (memesPhotos) mettreAJourImage(id);
      else construireStructure(id);
    },
    next(id) { naviguer(id, 1); },
    prev(id) { naviguer(id, -1); },
    goTo(id, index) {
      if (!zones[id]) return;
      zones[id].index = index;
      mettreAJourImage(id);
    },
    openLightbox(id) {
      if (!zones[id] || !zones[id].photos.length || zones[id].zoom === false) return;
      lightboxOuverte = id;
      majLightbox(id);
      document.getElementById('crsl-lightbox').classList.add('visible');
    },
    closeLightbox: fermerLightbox,
    _placeholderHTML: placeholderHTML // exposé pour le onerror inline des <img>
  };
})();
