// Renders aviation.html's sections (Hero, Vision/Overview/Commitment cards,
// Business Activities list, Facilities gallery captions) from Supabase,
// falling back to the AVIATION_*_FALLBACK constants (aviation-data.js) if
// Supabase is unreachable. Mirrors logistics-loader.js / about-loader.js:
// withTimeout + try/catch fallback, manual EN/AR pick by localStorage
// (bypassing translate.js/data-i18n-key for this DB content), and a
// MutationObserver on <html lang> to re-render on language switch.
(function () {
  let cached = null; // { page, visionCards, activities }

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
    setText('aviationHeroTag', pick(page, 'hero_tag', lang));
    setText('aviationHeroTitle', pick(page, 'hero_title', lang));
    setText('aviationHeroSub', pick(page, 'hero_sub', lang));
    const heroBg = document.getElementById('aviationHeroBg');
    if (heroBg && page.hero_image_url) heroBg.style.backgroundImage = `url('${page.hero_image_url}')`;

    setText('aviationIntroTag', pick(page, 'intro_tag', lang));
    setText('aviationIntroTitle', pick(page, 'intro_title', lang));

    setText('aviationActivitiesTag', pick(page, 'activities_tag', lang));
    setText('aviationActivitiesTitle', pick(page, 'activities_title', lang));

    setText('aviationGalleryTag', pick(page, 'gallery_tag', lang));
    setText('aviationGalleryTitle', pick(page, 'gallery_title', lang));
  }

  function renderVisionCards(cards, lang) {
    const row = document.getElementById('aviationVisionRow');
    if (!row) return;
    row.innerHTML = cards.map((c, i) => `
      <div class="col-md-4" data-aos="zoom-in" data-aos-delay="${i * 100}">
        <div class="vision-card">
          <div class="vision-card-icon"><i class="bi ${escapeHtml(c.icon)}"></i></div>
          <h3 class="vision-card-title">${escapeHtml(lang === 'ar' ? c.title_ar : c.title_en)}</h3>
          <p class="vision-card-text">${escapeHtml(lang === 'ar' ? c.desc_ar : c.desc_en)}</p>
        </div>
      </div>`).join('');
  }

  function renderActivities(activities, lang) {
    const list = document.getElementById('aviationActivitiesList');
    if (!list) return;
    list.innerHTML = activities.map((a) => `
      <div class="col-md-6">
        <div class="about-feature">
          <div class="about-feature-dot"></div>
          <div class="about-feature-text">${escapeHtml(lang === 'ar' ? a.text_ar : a.text_en)}</div>
        </div>
      </div>`).join('');
  }

  function render() {
    const lang = currentLang();
    renderPage(cached.page, lang);
    renderVisionCards(cached.visionCards, lang);
    renderActivities(cached.activities, lang);
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchAll() {
    const [pageRes, visionRes, activitiesRes] = await Promise.all([
      withTimeout(supabaseClient.from('aviation_page').select('*').limit(1).single(), 5000, 'aviation_page request'),
      withTimeout(supabaseClient.from('aviation_vision_cards').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'aviation_vision_cards request'),
      withTimeout(supabaseClient.from('aviation_activities').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'aviation_activities request'),
    ]);

    if (pageRes.error || !pageRes.data) throw new Error('No aviation_page row returned');
    if (visionRes.error || activitiesRes.error) {
      throw new Error('One or more aviation_* queries failed');
    }

    return {
      page: pageRes.data,
      visionCards: visionRes.data || [],
      activities: activitiesRes.data || [],
    };
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      cached = await fetchAll();
    } catch (err) {
      console.warn('aviation-loader: falling back to static data —', err.message);
      cached = {
        page: AVIATION_PAGE_FALLBACK,
        visionCards: AVIATION_VISION_CARDS_FALLBACK,
        activities: AVIATION_ACTIVITIES_FALLBACK,
      };
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  new MutationObserver(() => {
    if (cached) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
