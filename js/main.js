/* ============================================
   KAMALA SUPERMARKET — Main JavaScript
   Navigation, Animations, Shared Logic
   ============================================ */

// ============================================
// Configuration
// ============================================
const CONFIG = {
  storeName: 'Kamala Supermarket',
  whatsappNumber: '919876543210', // Replace with actual number
  phone: '+91 98765 43210',
  address: 'Main Road, Villupuram, Tamil Nadu 605602',
  workingHours: 'Mon–Sat: 7:00 AM – 10:00 PM | Sun: 8:00 AM – 9:00 PM',
  minOrder: 200,
  freeDeliveryAbove: 500,
  currency: '₹'
};

// ============================================
// DOM Ready
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  initBackToTop();
  initAccordion();
  initMarquee();
  initCounters();
  initSearchModal();
});

// ============================================
// Navbar — Scroll Effect
// ============================================
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

// ============================================
// Mobile Menu
// ============================================
function initMobileMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  });

  // Close menu when clicking a link
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target) && menu.classList.contains('active')) {
      toggle.classList.remove('active');
      menu.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Handle dropdowns on mobile
  const dropdowns = menu.querySelectorAll('.nav-dropdown > a');
  dropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        dropdown.parentElement.classList.toggle('active');
      }
    });
  });
}

// ============================================
// Scroll Reveal Animations
// ============================================
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal:not(.visible)');
  
  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

// ============================================
// Back to Top Button
// ============================================
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ============================================
// Accordion
// ============================================
function initAccordion() {
  const items = document.querySelectorAll('.accordion-item');
  
  items.forEach(item => {
    const header = item.querySelector('.accordion-header');
    const body = item.querySelector('.accordion-body');
    
    if (!header || !body) return;

    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all
      items.forEach(i => {
        i.classList.remove('active');
        const b = i.querySelector('.accordion-body');
        if (b) b.style.maxHeight = null;
      });

      // Open clicked (if it was closed)
      if (!isActive) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

// ============================================
// Marquee (Offers Ticker)
// ============================================
function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;

  // Clone content for seamless loop
  const clone = track.innerHTML;
  track.innerHTML = clone + clone;
}

// ============================================
// Animated Counters
// ============================================
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  
  if (counters.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-count'));
  const suffix = el.getAttribute('data-suffix') || '';
  const prefix = el.getAttribute('data-prefix') || '';
  const duration = 2000;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    
    el.textContent = prefix + current.toLocaleString() + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ============================================
// Search Modal
// ============================================
function initSearchModal() {
  const searchBtn = document.querySelector('.nav-search-btn');
  const searchModal = document.querySelector('.search-modal');
  
  if (!searchBtn || !searchModal) return;

  searchBtn.addEventListener('click', () => {
    searchModal.classList.add('active');
    const input = searchModal.querySelector('input');
    if (input) {
      setTimeout(() => input.focus(), 200);
    }
  });

  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
      searchModal.classList.remove('active');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchModal.classList.remove('active');
    }
    // Ctrl/Cmd + K to open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchModal.classList.toggle('active');
      if (searchModal.classList.contains('active')) {
        const input = searchModal.querySelector('input');
        if (input) setTimeout(() => input.focus(), 200);
      }
    }
  });
}

// ============================================
// Gallery Lightbox
// ============================================
function initLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.querySelector('.lightbox');
  
  if (!galleryItems.length || !lightbox) return;

  const lightboxImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img && lightboxImg) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ============================================
// Flash Deal Countdown Timer
// ============================================
function initFlashTimer() {
  const timerEl = document.querySelector('.flash-timer-digits');
  if (!timerEl) return;

  // Set end time to midnight tonight
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

  function updateTimer() {
    const now = new Date();
    const diff = endOfDay - now;

    if (diff <= 0) {
      timerEl.innerHTML = '<span class="flash-timer-digit">00</span><span class="flash-timer-digit">00</span><span class="flash-timer-digit">00</span>';
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    timerEl.innerHTML = `
      <span class="flash-timer-digit">${String(hours).padStart(2, '0')}</span>
      <span class="flash-timer-digit">${String(minutes).padStart(2, '0')}</span>
      <span class="flash-timer-digit">${String(seconds).padStart(2, '0')}</span>
    `;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// ============================================
// Utility Functions
// ============================================
function formatPrice(price) {
  return CONFIG.currency + price.toLocaleString('en-IN');
}

function generateWhatsAppLink(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encoded}`;
}

// Smooth scroll to section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="toast-message">${message}</span>
  `;
  
  // Toast styles
  Object.assign(toast.style, {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 24px',
    background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    transform: 'translateX(120%)',
    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    fontFamily: "'Inter', sans-serif"
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ============================================
// Export config for other scripts
// ============================================
window.KS = {
  CONFIG,
  formatPrice,
  generateWhatsAppLink,
  scrollToSection,
  showToast,
  initScrollAnimations
};
