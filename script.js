/* Santos & Flor — Royal Luxury
 * Interactividad y datos editables en este archivo.
 * La asistencia NO se envía a un servidor: el invitado la comparte o copia.
 */
(() => {
  'use strict';

  const CONFIG = {
    pareja: 'Santos & Flor',
    fecha: '2026-12-09',
    horaCeremonia: '10:00 a. m.',
    lugarCeremonia: 'Iglesia Matriz San Pedro de Sapallanga',
    recepcion: 'Wallpa Wasi',
    direccionRecepcion: 'Jr. Gonzales Prada, a dos cuadras de la comisaría de Sapallanga',
    // Para habilitar un envío a WhatsApp, escribe aquí el número del organizador
    // con código de país y sin signos: por ejemplo, 519XXXXXXXX.
    // Déjalo vacío si todavía no tienes autorización para publicar un número.
    whatsappOrganizador: ''
  };

  const $ = (selector) => document.querySelector(selector);
  const intro = $('#intro');
  const video = $('#openingVideo');
  const welcome = $('#welcome');
  const openButton = $('#openButton');
  const skipButton = $('#skipButton');
  const progressFill = $('#progressFill');
  const progressNumber = $('#progressNumber');
  const site = $('#site');
  const mainNav = $('#mainNav');
  const menuToggle = $('#menuToggle');
  let opening = false;
  let finished = false;
  let revealTimer = null;
  let toastTimer = null;
  let confirmationText = '';

  // La canción está integrada directamente en el mismo MP4 que comienza
  // al pulsar «Abrir invitación». Los primeros 4,04 s son silencio,
  // después empieza la pista musical, sin interrupciones ni botones.
  const INTRO_LENGTH = 4.04;
  const MUSIC_LOOP_POINT = 4.05;

  function showSite() {
    if (finished) return;
    finished = true;
    intro.classList.add('finishing');
    // No pausar: este mismo video lleva la música y sigue sonando detrás.
    progressFill.style.width = '100%';
    progressNumber.textContent = '100%';
    window.setTimeout(() => {
      site.classList.add('is-visible');
      site.setAttribute('aria-hidden','false');
      intro.classList.add('is-hidden');
      intro.setAttribute('aria-hidden','true');
      document.body.classList.remove('locked');
      initReveals();
      // Mantener la pista reproduciéndose en una capa detrás de la web.
    }, 850);
  }

  async function beginOpening() {
    if (opening || finished) return;
    opening = true;
    intro.classList.add('playing');
    $('#playbackUi').setAttribute('aria-hidden','false');
    welcome.setAttribute('aria-hidden','true');
    video.currentTime = 0;
    video.muted = false; // Audio habilitado desde el clic; la pista está en silencio hasta el segundo 4.
    video.volume = 0.9;
    // Fallback prevents the visitor becoming stuck if MP4 decoding fails.
    revealTimer = window.setTimeout(showSite, 12000);
    try {
      await video.play();
    } catch (error) {
      console.warn('El navegador no pudo reproducir el video:', error);
      showSite();
    }
  }

  video.addEventListener('timeupdate', () => {
    if (opening && !finished) {
      const percentage = Math.round(100 * Math.min(video.currentTime / INTRO_LENGTH, 1));
      progressFill.style.width = `${percentage}%`;
      progressNumber.textContent = `${percentage}%`;
      if (video.currentTime >= INTRO_LENGTH - 0.05) {
        clearTimeout(revealTimer);
        showSite();
      }
    }
    // Repetir solo la canción; no volver a mostrar la apertura.
    if (finished && video.duration && video.currentTime >= video.duration - 0.28) {
      video.currentTime = MUSIC_LOOP_POINT;
    }
  });
  video.addEventListener('ended', () => {
    if (!finished) showSite();
    else {
      video.currentTime = MUSIC_LOOP_POINT;
      video.play().catch(() => {});
    }
  });
  video.addEventListener('error', () => { if (opening) showSite(); });
  openButton.addEventListener('click', beginOpening);
  skipButton.addEventListener('click', () => {
    clearTimeout(revealTimer);
    video.muted = false;
    video.volume = 0.9;
    // El mismo clic del invitado autoriza el inicio audible.
    const skipToMusic = () => { video.currentTime = MUSIC_LOOP_POINT; };
    if (video.readyState >= 1) skipToMusic();
    else video.addEventListener('loadedmetadata', skipToMusic, { once: true });
    video.play().catch(err => console.info('Reproducción bloqueada:', err));
    showSite();
  });
  $('#replayButton').addEventListener('click', () => {
    finished = false;
    opening = false;
    window.scrollTo({top: 0, behavior: 'instant'});
    video.pause();
    video.currentTime = 0;
    video.muted = false;
    intro.style.display = '';
    intro.setAttribute('aria-hidden', 'false');
    intro.classList.remove('is-hidden','finishing','playing');
    welcome.setAttribute('aria-hidden','false');
    site.classList.remove('is-visible');
    site.setAttribute('aria-hidden','true');
    $('#playbackUi').setAttribute('aria-hidden','true');
    progressFill.style.width = '0%';
    progressNumber.textContent = '0%';
    document.body.classList.add('locked');
    openButton.focus({ preventScroll: true });
  });

  // Mobile navigation, keyboard and closing on outside navigation.
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    mainNav.classList.toggle('is-open', open);
  });
  for (const link of mainNav.querySelectorAll('a')) {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded','false');
      menuToggle.setAttribute('aria-label','Abrir menú');
      mainNav.classList.remove('is-open');
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
      menuToggle.setAttribute('aria-expanded','false');
      mainNav.classList.remove('is-open');
      menuToggle.focus();
    }
  });

  // Real photo gallery: swipe on mobile, or use the accessible arrows.
  const momentsGallery = $('#momentsGallery');
  const momentCards = Array.from(momentsGallery.querySelectorAll('.moment-card'));
  const momentsPrev = $('#momentsPrev');
  const momentsNext = $('#momentsNext');
  const momentsStatus = $('#momentsStatus');
  let activeMoment = 0;
  let momentsScrollQueued = false;

  function updateMomentsControls() {
    momentsStatus.innerHTML = `${String(activeMoment + 1).padStart(2, '0')} <span>/</span> 03`;
    momentsPrev.disabled = activeMoment === 0;
    momentsNext.disabled = activeMoment === momentCards.length - 1;
  }

  function showMoment(index) {
    activeMoment = Math.max(0, Math.min(index, momentCards.length - 1));
    const card = momentCards[activeMoment];
    momentsGallery.scrollTo({
      left: card.offsetLeft - (momentsGallery.clientWidth - card.clientWidth) / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
    updateMomentsControls();
  }

  momentsPrev.addEventListener('click', () => showMoment(activeMoment - 1));
  momentsNext.addEventListener('click', () => showMoment(activeMoment + 1));

  momentsGallery.addEventListener('scroll', () => {
    if (momentsScrollQueued || window.innerWidth > 680) return;
    momentsScrollQueued = true;
    window.requestAnimationFrame(() => {
      const center = momentsGallery.scrollLeft + momentsGallery.clientWidth / 2;
      let closest = 0;
      let distance = Infinity;
      momentCards.forEach((card, index) => {
        const d = Math.abs(card.offsetLeft + card.clientWidth / 2 - center);
        if (d < distance) { distance = d; closest = index; }
      });
      activeMoment = closest;
      updateMomentsControls();
      momentsScrollQueued = false;
    });
  }, { passive: true });

  momentsGallery.addEventListener('keydown', (event) => {
    if (window.innerWidth > 680) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); showMoment(activeMoment + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showMoment(activeMoment - 1); }
  });
  updateMomentsControls();

  const siteHeader = $('#siteHeader');
  window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive:true });

  function initReveals() {
    const targets = document.querySelectorAll('.reveal, .fade-in');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('in-view'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      }
    }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(el => obs.observe(el));
  }

  // Date is fixed in Peru time zone (-05:00, Peru has no daylight saving time).
  const weddingDate = new Date(`${CONFIG.fecha}T10:00:00-05:00`);
  function updateCountdown() {
    const delta = Math.max(0, weddingDate.getTime() - Date.now());
    const parts = {
      days: Math.floor(delta / 86400000),
      hours: Math.floor(delta / 3600000) % 24,
      minutes: Math.floor(delta / 60000) % 60,
      seconds: Math.floor(delta / 1000) % 60
    };
    for (const [key,val] of Object.entries(parts)) {
      const node = document.getElementById(key);
      if (node) node.textContent = String(val).padStart(2,'0');
    }
    if (delta === 0) $('#countdown').setAttribute('aria-label','¡Llegó el gran día!');
  }
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  // .ics all-day date reminder (no fabricated reception time or ceremony end time).
  $('#calendarButton').addEventListener('click', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Santos y Flor//Invitacion de boda//ES',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:santos-flor-20261209@santos-flor.local',
      'DTSTAMP:20261103T000000Z',
      'DTSTART;VALUE=DATE:20261209',
      'DTEND;VALUE=DATE:20261210',
      'SUMMARY:Boda de Santos y Flor',
      'DESCRIPTION:Ceremonia religiosa a las 10:00 a. m. en Iglesia Matriz San Pedro de Sapallanga. Recepción en Wallpa Wasi.',
      'LOCATION:Sapallanga\\, Junín\\, Perú',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Boda-Santos-y-Flor-09-12-2026.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 3000);
    notify('Se descargó el recordatorio para tu calendario.');
  });

  // No external backend is assumed. This prepares a message for sharing.
  const rsvpForm = $('#rsvpForm');
  const rsvpResult = $('#rsvpResult');
  rsvpForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!rsvpForm.reportValidity()) return;
    const name = $('#guestName').value.trim().replace(/\s+/g,' ');
    if (!name) { $('#guestName').focus(); return; }
    const attending = $('#attendance').value === 'si';
    const note = $('#guestMessage').value.trim();
    confirmationText = [
      'Confirmación de asistencia — Boda de Santos & Flor',
      'Fecha: miércoles 9 de diciembre de 2026',
      `Nombre: ${name}`,
      `Asistencia: ${attending ? 'Sí, asistiré' : 'No podré asistir'}`,
      ...(note ? [`Mensaje: ${note}`] : [])
    ].join('\n');
    $('#rsvpSummary').textContent = attending
      ? `${name}, tu respuesta está preparada. Compártela con los organizadores para confirmar tu asistencia.`
      : `${name}, gracias por avisarnos. Puedes compartir tu respuesta con los organizadores.`;
    rsvpForm.hidden = true;
    rsvpResult.hidden = false;
    rsvpResult.scrollIntoView({ behavior:'smooth',block:'center' });
  });

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position='fixed';area.style.opacity='0';
        document.body.appendChild(area);
        area.select();
        if (!document.execCommand('copy')) throw new Error('Copiar no disponible');
        area.remove();
      }
      notify('Confirmación copiada. Envíala a los organizadores.');
    } catch(e) {
      notify('No se pudo copiar automáticamente. Selecciona el mensaje e inténtalo de nuevo.');
    }
  }

  $('#copyButton').addEventListener('click', () => copyText(confirmationText));
  $('#shareButton').addEventListener('click', async () => {
    if (!confirmationText) return;
    if (CONFIG.whatsappOrganizador) {
      const number = CONFIG.whatsappOrganizador.replace(/\D/g,'');
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(confirmationText)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    if (navigator.share) {
      try { await navigator.share({text:confirmationText,title:'Confirmación Santos & Flor'}); }
      catch (e) { if (e.name !== 'AbortError') await copyText(confirmationText); }
    } else {
      await copyText(confirmationText);
    }
  });
  $('#editButton').addEventListener('click', () => {
    rsvpResult.hidden = true;
    rsvpForm.hidden = false;
    $('#guestName').focus({preventScroll:true});
    rsvpForm.scrollIntoView({behavior:'smooth',block:'center'});
  });
  function notify(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // Reveal animation class uses the same IntersectionObserver.
  // Reduced motion is respected by CSS.
  window.addEventListener('load', () => {
    if (window.location.hash && window.location.hash !== '#inicio') {
      // Direct links still start at invitation opening, rather than jumping under the video.
      history.replaceState(null, '', location.pathname + location.search);
    }
  });
})();
