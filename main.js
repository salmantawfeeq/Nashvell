
document.addEventListener('DOMContentLoaded', function () {

  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => preloader.classList.add('hidden'), 400);
    });
    setTimeout(() => preloader.classList.add('hidden'), 2500);
  }

  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
    });
  }

  const mainNav = document.getElementById('mainNav');
  if (mainNav) {
    const onScroll = () => {
      if (window.scrollY > 60) {
        mainNav.classList.add('scrolled');
      } else {
        mainNav.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#mainNav .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || href.endsWith(currentPath))) {
      link.classList.add('active');
    }
  });

  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    const closeNavMenu = () => {
      if (navMenu.classList.contains('show') && typeof bootstrap !== 'undefined') {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(navMenu, { toggle: false });
        bsCollapse.hide();
      }
    };
    navMenu.querySelectorAll('.nav-link, .lang-btn').forEach(item => {
      item.addEventListener('click', closeNavMenu);
    });
  }

  const scrollTop = document.getElementById('scrollTop');
  if (scrollTop) {
    window.addEventListener('scroll', () => {
      scrollTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    scrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

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

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const videoPlayBtn = document.getElementById('videoPlayBtn');
  if (videoPlayBtn) {
    const VIDEO_CLIP_SECONDS = 18;
    videoPlayBtn.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="position:relative;width:90%;max-width:900px;">
          <button onclick="this.closest('div').parentElement.remove()" style="position:absolute;top:-40px;right:0;background:none;border:none;color:#D4AF37;font-size:1.8rem;cursor:pointer;">&times;</button>
          <div style="position:relative;padding-bottom:56.25%;background:#000;border-radius:8px;overflow:hidden;">
            <video style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" src="./video/nashvell-intro.mp4" autoplay muted loop playsinline controls></video>
          </div>
        </div>`;
      document.body.appendChild(modal);
      const videoEl = modal.querySelector('video');
      videoEl.addEventListener('timeupdate', () => {
        if (videoEl.currentTime >= VIDEO_CLIP_SECONDS) videoEl.currentTime = 0;
      });
      modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    });
  }

  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const filter = this.getAttribute('data-filter');
      document.querySelectorAll('[data-category]').forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = '';
          card.classList.add('aos-animate');
        } else {
          card.style.display = 'none';
        }
      });
      if (typeof AOS !== 'undefined') AOS.refresh();
    });
  });

});
