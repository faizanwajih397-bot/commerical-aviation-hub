/* ==========================================================================
   Commercial Aviation Hub — script.js
   Vanilla JS only. Handles: nav, theme, search, filters, slider, counters,
   gallery lightbox, back-to-top, contact/feedback form validation, AOS init.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------- AOS INIT -------------------- */
  if (window.AOS) {
    AOS.init({ duration: 800, once: true, offset: 80, easing: 'ease-out-cubic' });
  }

  /* -------------------- MOBILE NAV -------------------- */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  /* -------------------- NAV SEARCH TOGGLE -------------------- */
  const searchToggle = document.getElementById('searchToggle');
  const navSearchInput = document.getElementById('navSearchInput');
  if (searchToggle && navSearchInput) {
    searchToggle.addEventListener('click', () => {
      navSearchInput.classList.toggle('active');
      if (navSearchInput.classList.contains('active')) navSearchInput.focus();
    });
    navSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = navSearchInput.value.trim().toLowerCase();
        if (!query) return;
        // Jump to aircraft page with query param behavior emulated client-side
        window.location.href = 'cases.html?q=' + encodeURIComponent(query);
      }
    });
  }

  /* -------------------- DARK / LIGHT MODE -------------------- */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('cah-theme') || 'light';
  if (savedTheme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    if (themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      if (isDark) {
        root.removeAttribute('data-theme');
        localStorage.setItem('cah-theme', 'light');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
      } else {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('cah-theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
      }
    });
  }

  /* -------------------- STICKY NAV SHADOW ON SCROLL -------------------- */
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 40;
    if (navbar) navbar.style.boxShadow = scrolled ? '0 8px 24px rgba(0,0,0,0.25)' : 'none';
    if (backToTop) backToTop.classList.toggle('show', window.scrollY > 500);
  });

  /* -------------------- BACK TO TOP -------------------- */
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* -------------------- SMOOTH SCROLL FOR ANCHOR LINKS -------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* -------------------- ANIMATED STATISTICS COUNTER -------------------- */
  const counters = document.querySelectorAll('.stat-number[data-count]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted');
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString() + suffix;
    }
    requestAnimationFrame(tick);
  }

  /* -------------------- IMAGE / HERO SLIDER -------------------- */
  const slides = document.querySelectorAll('.slide');
  const dotsWrap = document.getElementById('sliderDots');
  let currentSlide = 0;
  let sliderInterval;

  if (slides.length) {
    slides.forEach((_, i) => {
      const dot = document.createElement('span');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      dotsWrap.appendChild(dot);
    });

    function showSlide(index) {
      slides.forEach(s => s.classList.remove('active'));
      dotsWrap.querySelectorAll('span').forEach(d => d.classList.remove('active'));
      slides[index].classList.add('active');
      dotsWrap.children[index].classList.add('active');
      currentSlide = index;
    }
    function goToSlide(index) {
      showSlide(index);
      resetInterval();
    }
    function nextSlide() { showSlide((currentSlide + 1) % slides.length); }
    function prevSlide() { showSlide((currentSlide - 1 + slides.length) % slides.length); }
    function resetInterval() {
      clearInterval(sliderInterval);
      sliderInterval = setInterval(nextSlide, 5000);
    }

    document.getElementById('sliderNext')?.addEventListener('click', () => { nextSlide(); resetInterval(); });
    document.getElementById('sliderPrev')?.addEventListener('click', () => { prevSlide(); resetInterval(); });
    resetInterval();
  }

  /* -------------------- AIRCRAFT SEARCH + MANUFACTURER FILTER (cases.html) -------------------- */
  const aircraftSearch = document.getElementById('aircraftSearch');
  const manufacturerChips = document.querySelectorAll('[data-manufacturer]');
  const aircraftCards = document.querySelectorAll('.aircraft-card');
  const noAircraftResults = document.getElementById('noAircraftResults');
  let activeManufacturer = 'all';

  function filterAircraft() {
    if (!aircraftCards.length) return;
    const query = (aircraftSearch?.value || '').trim().toLowerCase();
    let visibleCount = 0;
    aircraftCards.forEach(card => {
      const name = card.getAttribute('data-name').toLowerCase();
      const manu = card.getAttribute('data-manufacturer');
      const matchesQuery = name.includes(query);
      const matchesManu = activeManufacturer === 'all' || manu === activeManufacturer;
      const show = matchesQuery && matchesManu;
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    if (noAircraftResults) noAircraftResults.classList.toggle('show', visibleCount === 0);
  }

  if (aircraftSearch) aircraftSearch.addEventListener('input', filterAircraft);
  manufacturerChips.forEach(chip => {
    chip.addEventListener('click', () => {
      manufacturerChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeManufacturer = chip.getAttribute('data-manufacturer');
      filterAircraft();
    });
  });

  // Pre-fill search from URL query param (?q=...)
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get('q');
  if (qParam && aircraftSearch) {
    aircraftSearch.value = qParam;
    filterAircraft();
  }
  if (aircraftCards.length) filterAircraft();

  /* -------------------- AIRLINE SEARCH + COUNTRY FILTER (case.html) -------------------- */
  const airlineSearch = document.getElementById('airlineSearch');
  const countryChips = document.querySelectorAll('[data-country]');
  const airlineItems = document.querySelectorAll('.airline-item');
  const noAirlineResults = document.getElementById('noAirlineResults');
  let activeCountry = 'all';

  function filterAirlines() {
    if (!airlineItems.length) return;
    const query = (airlineSearch?.value || '').trim().toLowerCase();
    let visibleCount = 0;
    airlineItems.forEach(item => {
      const name = item.getAttribute('data-name').toLowerCase();
      const country = item.getAttribute('data-country-value');
      const matchesQuery = name.includes(query);
      const matchesCountry = activeCountry === 'all' || country === activeCountry;
      const show = matchesQuery && matchesCountry;
      item.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    if (noAirlineResults) noAirlineResults.classList.toggle('show', visibleCount === 0);
  }

  if (airlineSearch) airlineSearch.addEventListener('input', filterAirlines);
  countryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      countryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCountry = chip.getAttribute('data-country');
      filterAirlines();
    });
  });
  if (airlineItems.length) filterAirlines();

  /* -------------------- GALLERY LIGHTBOX -------------------- */
  const galleryItems = document.querySelectorAll('.gallery-item img');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  let currentGalleryIndex = 0;
  const galleryImages = Array.from(galleryItems);

  function openLightbox(index) {
    currentGalleryIndex = index;
    lightboxImg.src = galleryImages[index].src;
    lightboxImg.alt = galleryImages[index].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  function showGalleryImage(step) {
    currentGalleryIndex = (currentGalleryIndex + step + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[currentGalleryIndex].src;
    lightboxImg.alt = galleryImages[currentGalleryIndex].alt;
  }

  if (galleryImages.length && lightbox) {
    galleryImages.forEach((img, i) => {
      img.parentElement.addEventListener('click', () => openLightbox(i));
    });
    document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
    document.getElementById('lightboxNext')?.addEventListener('click', () => showGalleryImage(1));
    document.getElementById('lightboxPrev')?.addEventListener('click', () => showGalleryImage(-1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showGalleryImage(1);
      if (e.key === 'ArrowLeft') showGalleryImage(-1);
    });
  }

  /* -------------------- CONTACT FORM VALIDATION -------------------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const name = document.getElementById('contactName');
      const email = document.getElementById('contactEmail');
      const subject = document.getElementById('contactSubject');
      const message = document.getElementById('contactMessage');

      valid = validateField(name, v => v.trim().length >= 2, 'Please enter your full name.') && valid;
      valid = validateField(email, v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Please enter a valid email address.') && valid;
      valid = validateField(subject, v => v.trim().length >= 3, 'Subject must be at least 3 characters.') && valid;
      valid = validateField(message, v => v.trim().length >= 10, 'Message must be at least 10 characters.') && valid;

      const successBox = document.getElementById('contactSuccess');
      if (valid) {
        contactForm.reset();
        successBox.classList.add('show');
        setTimeout(() => successBox.classList.remove('show'), 5000);
      } else if (successBox) {
        successBox.classList.remove('show');
      }
    });
  }

  function validateField(field, testFn, message) {
    if (!field) return true;
    const group = field.closest('.form-group');
    const errorEl = group.querySelector('.error-msg');
    const isValid = testFn(field.value);
    group.classList.toggle('error', !isValid);
    if (errorEl) errorEl.textContent = message;
    return isValid;
  }

  /* -------------------- FEEDBACK FORM (star rating + validation) -------------------- */
  const ratingStars = document.querySelectorAll('#ratingSelect i');
  let selectedRating = 0;
  ratingStars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.getAttribute('data-value'), 10);
      ratingStars.forEach(s => {
        s.classList.toggle('selected', parseInt(s.getAttribute('data-value'), 10) <= selectedRating);
      });
    });
  });

  const feedbackForm = document.getElementById('feedbackForm');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fname = document.getElementById('feedbackName');
      const fcomment = document.getElementById('feedbackComment');
      let valid = true;
      valid = validateField(fname, v => v.trim().length >= 2, 'Please enter your name.') && valid;
      valid = validateField(fcomment, v => v.trim().length >= 5, 'Please share a bit more feedback.') && valid;

      const successBox = document.getElementById('feedbackSuccess');
      if (valid) {
        feedbackForm.reset();
        ratingStars.forEach(s => s.classList.remove('selected'));
        selectedRating = 0;
        successBox.classList.add('show');
        setTimeout(() => successBox.classList.remove('show'), 5000);
      } else if (successBox) {
        successBox.classList.remove('show');
      }
    });
  }

  /* -------------------- ACTIVE NAV LINK HIGHLIGHT -------------------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

});