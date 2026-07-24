
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

// Wires the count-up animation for any `.counter-num` elements under `root`.
// Exposed on window so loaders that inject stat elements after page load
// (e.g. about-loader.js, fetching from Supabase asynchronously) can call it
// again — the initial DOMContentLoaded query below only sees elements that
// already exist in the static HTML at that moment.
function initCounters(root = document) {
  const counters = root.querySelectorAll('.counter-num:not([data-counted])');
  if (!counters.length) return;
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
window.initCounters = initCounters;

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

  initCounters(document);

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
    // Delegated so gallery items rendered later (e.g. gallery-loader.js
    // fetching from Supabase after this listener is attached) still work.
    document.addEventListener('click', (e) => {
      const item = e.target.closest('[data-lightbox]');
      if (!item) return;
      const src = item.getAttribute('data-lightbox') || item.querySelector('img')?.src;
      if (src) {
        lightboxImg.src = src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
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
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      const btnLabel = btn.querySelector('span') || btn;
      const original = btnLabel.textContent;
      btn.disabled = true;
      btnLabel.textContent = 'Sending...';
      btn.style.background = '';

      const name = document.getElementById('contactInputName')?.value || '';
      const email = document.getElementById('contactInputEmail')?.value || '';
      const phone = document.getElementById('contactInputPhone')?.value || '';
      const subject = document.getElementById('contactSubject')?.value || '';
      const message = document.getElementById('contactInputMessage')?.value || '';

      try {
        if (typeof emailjs === 'undefined' || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') throw new Error('EmailJS is not configured yet');
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          name,
          email,
          title: subject,
          message: `${phone ? `Phone: ${phone}\n\n` : ''}${message}`,
        });

        btnLabel.textContent = 'Message Sent!';
        btn.style.background = '#28a745';
        setTimeout(() => {
          btnLabel.textContent = original;
          btn.style.background = '';
          btn.disabled = false;
          contactForm.reset();
        }, 3000);
      } catch (err) {
        console.error('Contact form send failed:', err?.text || err?.message || err);
        btnLabel.textContent = 'Failed — Try Again';
        btn.style.background = '#e05252';
        setTimeout(() => {
          btnLabel.textContent = original;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }
    });
  }

  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const input = form.querySelector('.newsletter-input');
      if (!input || !input.value) return;
      const email = input.value;
      const originalPlaceholder = input.placeholder;
      input.disabled = true;

      try {
        if (typeof emailjs === 'undefined' || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') throw new Error('EmailJS is not configured yet');
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          name: 'Newsletter Signup',
          email,
          title: 'New Newsletter Subscriber',
          message: `New newsletter subscriber: ${email}`,
        });

        input.value = '';
        input.placeholder = 'Subscribed! Thank you.';
      } catch (err) {
        console.error('Newsletter signup failed:', err?.text || err?.message || err);
        input.placeholder = 'Something went wrong — try again.';
      } finally {
        input.disabled = false;
        setTimeout(() => { input.placeholder = originalPlaceholder; }, 3000);
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

  // Delegated on the container (not each .filter-tab) so tabs rendered later
  // by products-loader.js (categories added from the dashboard) still filter
  // correctly without needing their own listener wired up.
  const filterTabsContainer = document.querySelector('.filter-tabs');
  if (filterTabsContainer) {
    filterTabsContainer.addEventListener('click', function (e) {
      const tab = e.target.closest('.filter-tab');
      if (!tab || !filterTabsContainer.contains(tab)) return;
      filterTabsContainer.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-filter');
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
  }

});
