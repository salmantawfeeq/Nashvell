/* ============================================================
   NASHVELL INTERNATIONAL TRADING CO. LTD.
   Main JavaScript — Premium Corporate Website
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Preloader ── */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => preloader.classList.add('hidden'), 400);
    });
    setTimeout(() => preloader.classList.add('hidden'), 2500);
  }

  /* ── AOS Init ── */
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
    });
  }

  /* ── Navbar scroll behavior ── */
  const mainNav = document.getElementById('mainNav');
  if (mainNav) {
    const onScroll = () => {
      if (window.scrollY > 60) {
        mainNav.classList.add('scrolled', 'sticky-top');
      } else {
        mainNav.classList.remove('scrolled', 'sticky-top');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Active nav link ── */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#mainNav .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || href.endsWith(currentPath))) {
      link.classList.add('active');
    }
  });

  /* ── Scroll-to-top button ── */
  const scrollTop = document.getElementById('scrollTop');
  if (scrollTop) {
    window.addEventListener('scroll', () => {
      scrollTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    scrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Counter animation ── */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current) + suffix;
    }, 16);
  }

  const counters = document.querySelectorAll('.counter-num');
  if (counters.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
  }

  /* ── Ripple effect ── */
  document.querySelectorAll('.btn-ripple').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      ripple.style.cssText = `left:${x}px;top:${y}px;width:${Math.max(rect.width, rect.height) * 2}px;height:${Math.max(rect.width, rect.height) * 2}px;margin-left:-${Math.max(rect.width, rect.height)}px;margin-top:-${Math.max(rect.width, rect.height)}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });

  /* ── Lightbox ── */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  if (lightbox && lightboxImg) {
    document.querySelectorAll('[data-lightbox]').forEach(item => {
      item.addEventListener('click', function () {
        const src = this.getAttribute('data-lightbox') || this.querySelector('img')?.src;
        if (src) {
          lightboxImg.src = src;
          lightbox.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
  }

  /* ── Language toggle (placeholder) ── */
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const isAr = document.documentElement.lang === 'ar';
      document.documentElement.lang = isAr ? 'en' : 'ar';
      document.documentElement.dir = isAr ? 'ltr' : 'rtl';
      langBtn.textContent = isAr ? 'AR' : 'EN';
    });
  }

  /* ── Contact form ── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Message Sent!';
        btn.style.background = '#28a745';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = '';
          btn.disabled = false;
          contactForm.reset();
        }, 3000);
      }, 1500);
    });
  }

  /* ── Newsletter form ── */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('.newsletter-input');
      if (input && input.value) {
        input.value = '';
        input.placeholder = 'Subscribed! Thank you.';
        setTimeout(() => { input.placeholder = 'Your email address'; }, 3000);
      }
    });
  });

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Video modal ── */
  const videoPlayBtn = document.getElementById('videoPlayBtn');
  if (videoPlayBtn) {
    videoPlayBtn.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="position:relative;width:90%;max-width:900px;">
          <button onclick="this.closest('div').parentElement.remove()" style="position:absolute;top:-40px;right:0;background:none;border:none;color:#D4AF37;font-size:1.8rem;cursor:pointer;">&times;</button>
          <div style="position:relative;padding-bottom:56.25%;background:#000;border-radius:8px;overflow:hidden;">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.4);font-size:1rem;">Video Placeholder — Replace with actual video</div>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    });
  }

  /* ── Product filter tabs ── */
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const filter = this.getAttribute('data-filter');
      document.querySelectorAll('[data-category]').forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

});
