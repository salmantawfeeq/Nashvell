// Renders investment.html's sections (Hero, Intro + Features, Sectors,
// Process steps, CTA) from Supabase, falling back to the
// INVESTMENT_*_FALLBACK constants (investment-data.js) if Supabase is
// unreachable. Mirrors about-loader.js's singleton+repeatable handling:
// withTimeout + try/catch fallback, manual EN/AR pick by localStorage
// (bypassing translate.js/data-i18n-key for this DB content), and a
// MutationObserver on <html lang> to re-render on language switch.
(function () {
  let cached = null; // { page, features, sectors, steps }

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
    setText('investmentHeroTag', pick(page, 'hero_tag', lang));
    setText('investmentHeroTitle', pick(page, 'hero_title', lang));
    setText('investmentHeroSub', pick(page, 'hero_sub', lang));

    setText('investmentIntroTag', pick(page, 'intro_tag', lang));
    setText('investmentIntroTitle', pick(page, 'intro_title', lang));
    setText('investmentIntroP1', pick(page, 'intro_p1', lang));
    const introImg = document.getElementById('investmentIntroImg');
    if (introImg && page.intro_image_url) introImg.src = page.intro_image_url;

    setText('investmentSectorsTag', pick(page, 'sectors_tag', lang));
    setText('investmentSectorsTitle', pick(page, 'sectors_title', lang));
    setText('investmentProcessTag', pick(page, 'process_tag', lang));
    setText('investmentProcessTitle', pick(page, 'process_title', lang));

    setText('investmentCtaTitle', pick(page, 'cta_title', lang));
    setText('investmentCtaDesc', pick(page, 'cta_desc', lang));
    setText('investmentCtaBtn', pick(page, 'cta_btn', lang));
  }

  function renderFeatures(features, lang) {
    const list = document.getElementById('investmentFeaturesList');
    if (!list) return;
    list.innerHTML = features.map((f) => `
      <div class="col-md-6">
        <div class="about-feature">
          <div class="about-feature-dot"></div>
          <div class="about-feature-text">${escapeHtml(lang === 'ar' ? f.text_ar : f.text_en)}</div>
        </div>
      </div>`).join('');
  }

  function renderSectors(sectors, lang) {
    const row = document.getElementById('investmentSectorsRow');
    if (!row) return;
    row.innerHTML = sectors.map((s, i) => `
      <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${(i % 3) * 100}">
        <div class="inv-card">
          <div class="inv-card-icon"><i class="bi ${escapeHtml(s.icon)}"></i></div>
          <h3 class="inv-card-title">${escapeHtml(lang === 'ar' ? s.title_ar : s.title_en)}</h3>
          <p class="inv-card-desc">${escapeHtml(lang === 'ar' ? s.desc_ar : s.desc_en)}</p>
        </div>
      </div>`).join('');
  }

  function renderSteps(steps, lang) {
    const row = document.getElementById('investmentStepsRow');
    if (!row) return;
    row.innerHTML = steps.map((s, i) => `
      <div class="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="${i * 100}">
        <div class="vision-card" style="text-align:center;">
          <div style="width:60px;height:60px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <span style="color:var(--gold);font-size:1.4rem;font-weight:900;">${escapeHtml(s.step_number)}</span>
          </div>
          <h3 class="vision-card-title">${escapeHtml(lang === 'ar' ? s.title_ar : s.title_en)}</h3>
          <p class="vision-card-text">${escapeHtml(lang === 'ar' ? s.desc_ar : s.desc_en)}</p>
        </div>
      </div>`).join('');
  }

  function render() {
    const lang = currentLang();
    renderPage(cached.page, lang);
    renderFeatures(cached.features, lang);
    renderSectors(cached.sectors, lang);
    renderSteps(cached.steps, lang);
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchAll() {
    const [pageRes, featuresRes, sectorsRes, stepsRes] = await Promise.all([
      withTimeout(supabaseClient.from('investment_page').select('*').limit(1).single(), 5000, 'investment_page request'),
      withTimeout(supabaseClient.from('investment_features').select('*').order('display_order', { ascending: true }), 5000, 'investment_features request'),
      withTimeout(supabaseClient.from('investment_sectors').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'investment_sectors request'),
      withTimeout(supabaseClient.from('investment_steps').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'investment_steps request'),
    ]);

    if (pageRes.error || !pageRes.data) throw new Error('No investment_page row returned');
    if (featuresRes.error || sectorsRes.error || stepsRes.error) {
      throw new Error('One or more investment_* queries failed');
    }

    return {
      page: pageRes.data,
      features: featuresRes.data || [],
      sectors: sectorsRes.data || [],
      steps: stepsRes.data || [],
    };
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      cached = await fetchAll();
    } catch (err) {
      console.warn('investment-loader: falling back to static data —', err.message);
      cached = {
        page: INVESTMENT_PAGE_FALLBACK,
        features: INVESTMENT_FEATURES_FALLBACK,
        sectors: INVESTMENT_SECTORS_FALLBACK,
        steps: INVESTMENT_STEPS_FALLBACK,
      };
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  new MutationObserver(() => {
    if (cached) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
