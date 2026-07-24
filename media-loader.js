// Renders media.html's sections (Hero, News grid, Video section) from
// Supabase, falling back to the MEDIA_*_FALLBACK constants (media-data.js)
// if Supabase is unreachable. Mirrors about-loader.js's singleton+repeatable
// handling: withTimeout + try/catch fallback, manual EN/AR pick by
// localStorage (bypassing translate.js/data-i18n-key for this DB content),
// and a MutationObserver on <html lang> to re-render on language switch.
(function () {
  let cached = null; // { page, news }

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
    setText('mediaHeroTag', pick(page, 'hero_tag', lang));
    setText('mediaHeroTitle', pick(page, 'hero_title', lang));
    setText('mediaHeroSub', pick(page, 'hero_sub', lang));
    const heroBg = document.getElementById('mediaHeroBg');
    if (heroBg && page.hero_image_url) heroBg.style.backgroundImage = `url('${page.hero_image_url}')`;

    setText('mediaNewsTag', pick(page, 'news_tag', lang));
    setText('mediaNewsTitle', pick(page, 'news_title', lang));

    setText('mediaVideoTitle', pick(page, 'video_title', lang));
    setText('mediaVideoDesc', pick(page, 'video_desc', lang));
    const videoBg = document.getElementById('mediaVideoBg');
    if (videoBg && page.video_bg_image_url) videoBg.style.backgroundImage = `url('${page.video_bg_image_url}')`;
  }

  function renderNews(news, page, lang) {
    const grid = document.getElementById('mediaNewsGrid');
    if (!grid) return;
    const readMore = pick(page, 'btn_read_more', lang);
    grid.innerHTML = news.map((n, i) => `
      <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${(i % 3) * 100}">
        <div class="product-page-card">
          <div class="product-page-card-img" style="height:200px;">
            <img src="${escapeHtml(n.image_url)}" alt="${escapeHtml(lang === 'ar' ? n.title_ar : n.title_en)}" />
          </div>
          <div class="product-page-card-body">
            <div class="product-page-card-cat"><i class="bi bi-calendar3 me-1"></i> <span>${escapeHtml(lang === 'ar' ? n.date_ar : n.date_en)}</span></div>
            <h3 class="product-page-card-title">${escapeHtml(lang === 'ar' ? n.title_ar : n.title_en)}</h3>
            <p class="product-page-card-desc">${escapeHtml(lang === 'ar' ? n.desc_ar : n.desc_en)}</p>
            <a href="${escapeHtml(n.link_url || '#')}" class="product-btn" style="opacity:1;transform:none;"><span>${escapeHtml(readMore)}</span> <i class="bi bi-arrow-right"></i></a>
          </div>
        </div>
      </div>`).join('');
  }

  function render() {
    const lang = currentLang();
    renderPage(cached.page, lang);
    renderNews(cached.news, cached.page, lang);
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchAll() {
    const [pageRes, newsRes] = await Promise.all([
      withTimeout(supabaseClient.from('media_page').select('*').limit(1).single(), 5000, 'media_page request'),
      withTimeout(supabaseClient.from('media_news').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'media_news request'),
    ]);

    if (pageRes.error || !pageRes.data) throw new Error('No media_page row returned');
    if (newsRes.error) throw new Error('media_news query failed');

    return {
      page: pageRes.data,
      news: newsRes.data || [],
    };
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      cached = await fetchAll();
    } catch (err) {
      console.warn('media-loader: falling back to static data —', err.message);
      cached = {
        page: MEDIA_PAGE_FALLBACK,
        news: MEDIA_NEWS_FALLBACK,
      };
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  new MutationObserver(() => {
    if (cached) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
