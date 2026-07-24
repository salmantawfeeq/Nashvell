// Renders the Technology Services cards from Supabase, falling back to
// TECH_CARDS_FALLBACK_DATA (tech-cards-data.js) if Supabase is unreachable.
// Shared by index.html (teaser: #techCardsTeaser, only is_featured rows,
// short descriptions) and technology.html (full list: #techCardsFull, all
// active rows, long descriptions) — each page only has one of the two
// containers, so only the matching branch renders anything.
(function () {
  let cachedCards = null;

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function currentLang() {
    return localStorage.getItem('language') || 'en';
  }

  function teaserCardHtml(card, lang, index) {
    const title = lang === 'ar' ? card.title_ar : card.title_en;
    const desc = (lang === 'ar' ? card.description_short_ar : card.description_short_en)
      || (lang === 'ar' ? card.description_long_ar : card.description_long_en);
    return `
      <div class="col-sm-6 col-lg-4 col-xl-2" data-aos="zoom-in" data-aos-delay="${(index % 6) * 80}">
        <div class="tech-card">
          <div class="tech-card-icon"><i class="bi ${escapeHtml(card.icon)}"></i></div>
          <div class="tech-card-title">${escapeHtml(title)}</div>
          <div class="tech-card-desc">${escapeHtml(desc)}</div>
        </div>
      </div>`;
  }

  function fullCardHtml(card, lang, index) {
    const title = lang === 'ar' ? card.title_ar : card.title_en;
    const desc = lang === 'ar' ? card.description_long_ar : card.description_long_en;
    return `
      <div class="col-md-6 col-lg-4" data-aos="zoom-in" data-aos-delay="${(index % 5) * 80}">
        <div class="tech-card" style="text-align:left;padding:36px 28px;">
          <div class="tech-card-icon" style="margin:0 0 20px 0;"><i class="bi ${escapeHtml(card.icon)}"></i></div>
          <div class="tech-card-title" style="font-size:1.15rem;margin-bottom:10px;">${escapeHtml(title)}</div>
          <div class="tech-card-desc" style="font-size:0.85rem;">${escapeHtml(desc)}</div>
        </div>
      </div>`;
  }

  function render() {
    const lang = currentLang();

    const teaser = document.getElementById('techCardsTeaser');
    if (teaser) {
      const featured = cachedCards.filter((c) => c.is_featured);
      teaser.innerHTML = featured.map((c, i) => teaserCardHtml(c, lang, i)).join('');
    }

    const full = document.getElementById('techCardsFull');
    if (full) {
      full.innerHTML = cachedCards.map((c, i) => fullCardHtml(c, lang, i)).join('');
    }

    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchTechCards() {
    const { data, error } = await withTimeout(
      supabaseClient.from('tech_cards').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      5000, 'tech cards request'
    );
    if (error) throw error;
    return data;
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      const cards = await fetchTechCards();
      if (!cards || !cards.length) throw new Error('No tech cards returned');
      cachedCards = cards;
    } catch (err) {
      console.warn('tech-cards-loader: falling back to static data —', err.message);
      cachedCards = TECH_CARDS_FALLBACK_DATA;
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  new MutationObserver(() => {
    if (cachedCards) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
