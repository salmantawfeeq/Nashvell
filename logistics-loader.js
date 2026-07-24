// Renders logistics.html's sections (Hero, Intro + Services list, Stats,
// Tracking) from Supabase, falling back to the LOGISTICS_*_FALLBACK
// constants (logistics-data.js) if Supabase is unreachable. Mirrors
// about-loader.js's singleton+repeatable handling: withTimeout + try/catch
// fallback, manual EN/AR pick by localStorage (bypassing translate.js/
// data-i18n-key for this DB content), and a MutationObserver on <html lang>
// to re-render on language switch.
(function () {
  let cached = null; // { page, services, stats }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function currentLang() {
    return localStorage.getItem('language') || 'en';
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function pick(obj, key, lang) {
    return obj[`${key}_${lang}`] ?? obj[`${key}_en`] ?? '';
  }

  function renderPage(page, lang) {
    setText('logisticsHeroTag', pick(page, 'hero_tag', lang));
    setText('logisticsHeroTitle', pick(page, 'hero_title', lang));
    setText('logisticsHeroSub', pick(page, 'hero_sub', lang));
    const heroBg = document.getElementById('logisticsHeroBg');
    if (heroBg && page.hero_image_url) heroBg.style.backgroundImage = `url('${page.hero_image_url}')`;

    setText('logisticsBadge', pick(page, 'badge', lang));
    setText('logisticsIntroTag', pick(page, 'intro_tag', lang));
    setText('logisticsIntroTitle', pick(page, 'intro_title', lang));
    setText('logisticsIntroDesc', pick(page, 'intro_desc', lang));
    const introImg = document.getElementById('logisticsIntroImg');
    if (introImg && page.intro_image_url) introImg.src = page.intro_image_url;

    setText('logisticsTrackTag', pick(page, 'track_tag', lang));
    setText('logisticsTrackTitle', pick(page, 'track_title', lang));
    setText('logisticsTrackSub', pick(page, 'track_sub', lang));
    setText('logisticsTrackBtn', pick(page, 'track_btn', lang));
    const trackInput = document.getElementById('logisticsTrackInput');
    if (trackInput) trackInput.placeholder = pick(page, 'track_placeholder', lang);
  }

  function renderServices(services, lang) {
    const list = document.getElementById('logisticsServicesList');
    if (!list) return;
    list.innerHTML = services.map((s) => `
      <div class="logistics-feature">
        <div class="logistics-feature-icon"><i class="bi ${escapeHtml(s.icon)}"></i></div>
        <div>
          <div class="logistics-feature-title">${escapeHtml(lang === 'ar' ? s.title_ar : s.title_en)}</div>
          <div class="logistics-feature-desc">${escapeHtml(lang === 'ar' ? s.desc_ar : s.desc_en)}</div>
        </div>
      </div>`).join('');
  }

  function renderStats(stats, lang) {
    const row = document.getElementById('logisticsStatsRow');
    if (!row) return;
    row.innerHTML = stats.map((s, i) => `
      <div class="col-6 col-lg-3" data-aos="fade-up" data-aos-delay="${i * 100}">
        <div class="stat-number counter-num" data-target="${escapeHtml(s.number)}" data-suffix="${escapeHtml(s.suffix)}">${escapeHtml(s.number)}${escapeHtml(s.suffix)}</div>
        <div class="stat-label">${escapeHtml(lang === 'ar' ? s.label_ar : s.label_en)}</div>
      </div>`).join('');
    if (typeof window.initCounters === 'function') window.initCounters(row);
  }

  function render() {
    const lang = currentLang();
    renderPage(cached.page, lang);
    renderServices(cached.services, lang);
    renderStats(cached.stats, lang);
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchAll() {
    const [pageRes, servicesRes, statsRes] = await Promise.all([
      withTimeout(supabaseClient.from('logistics_page').select('*').limit(1).single(), 5000, 'logistics_page request'),
      withTimeout(supabaseClient.from('logistics_services').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'logistics_services request'),
      withTimeout(supabaseClient.from('logistics_stats').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'logistics_stats request'),
    ]);

    if (pageRes.error || !pageRes.data) throw new Error('No logistics_page row returned');
    if (servicesRes.error || statsRes.error) {
      throw new Error('One or more logistics_* queries failed');
    }

    return {
      page: pageRes.data,
      services: servicesRes.data || [],
      stats: statsRes.data || [],
    };
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      cached = await fetchAll();
    } catch (err) {
      console.warn('logistics-loader: falling back to static data —', err.message);
      cached = {
        page: LOGISTICS_PAGE_FALLBACK,
        services: LOGISTICS_SERVICES_FALLBACK,
        stats: LOGISTICS_STATS_FALLBACK,
      };
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  new MutationObserver(() => {
    if (cached) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
