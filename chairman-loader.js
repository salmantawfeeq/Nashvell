// Renders chairman-message.html from Supabase, falling back to
// CHAIRMAN_PAGE_FALLBACK (chairman-data.js) if Supabase is unreachable.
// Mirrors about-loader.js's singleton-row handling: withTimeout + try/catch
// fallback, manual EN/AR pick by localStorage (bypassing translate.js/
// data-i18n-key for this DB content), and a MutationObserver on <html lang>
// to re-render on language switch.
(function () {
  let cached = null;

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

  function render() {
    const lang = currentLang();
    const page = cached;

    setText('chairmanHeroTag', pick(page, 'hero_tag', lang));
    setText('chairmanHeroTitle', pick(page, 'hero_title', lang));
    setText('chairmanHeroSubtitle', pick(page, 'hero_subtitle', lang));
    const heroBg = document.getElementById('chairmanHeroBg');
    if (heroBg && page.hero_image_url) heroBg.style.backgroundImage = `url('${page.hero_image_url}')`;

    const photo = document.getElementById('chairmanPhoto');
    if (photo && page.photo_url) photo.src = page.photo_url;
    setText('chairmanBadgeNum', page.badge_num || '');
    setText('chairmanBadgeLabel', pick(page, 'badge_label', lang));

    setText('chairmanRole', pick(page, 'role', lang));
    setText('chairmanName', pick(page, 'name', lang));
    setText('chairmanP1', pick(page, 'p1', lang));
    setText('chairmanBtnContact', pick(page, 'btn_contact', lang));
    setText('chairmanBtnAbout', pick(page, 'btn_about', lang));

    setText('chairmanP2', pick(page, 'p2', lang));
    setText('chairmanP3', pick(page, 'p3', lang));
    setText('chairmanP4', pick(page, 'p4', lang));

    setText('chairmanQuote', `"${pick(page, 'quote', lang)}"`);
    setText('chairmanQuoteAttribution', pick(page, 'quote_attribution', lang));

    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      const { data, error } = await withTimeout(
        supabaseClient.from('chairman_page').select('*').limit(1).single(),
        5000, 'chairman_page request'
      );
      if (error || !data) throw new Error('No chairman_page row returned');
      cached = data;
    } catch (err) {
      console.warn('chairman-loader: falling back to static data —', err.message);
      cached = CHAIRMAN_PAGE_FALLBACK;
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  new MutationObserver(() => {
    if (cached) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
