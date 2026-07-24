// Renders contact.html's sections (Hero, Contact Info card, Contact Form
// labels/placeholders, Global Offices) from Supabase, falling back to the
// CONTACT_*_FALLBACK constants (contact-data.js) if Supabase is unreachable.
// Mirrors about-loader.js's singleton+repeatable handling: withTimeout +
// try/catch fallback, manual EN/AR pick by localStorage (bypassing
// translate.js/data-i18n-key for this DB content), and a MutationObserver on
// <html lang> to re-render on language switch. The contact form's submit
// behavior itself (main.js) is untouched — only its visible text is DB-driven.
(function () {
  let cached = null; // { page, infoItems, offices }

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

  function setPlaceholder(id, text) {
    const el = document.getElementById(id);
    if (el) el.placeholder = text;
  }

  function pick(obj, key, lang) {
    return obj[`${key}_${lang}`] ?? obj[`${key}_en`] ?? '';
  }

  function renderPage(page, lang) {
    setText('contactHeroTag', pick(page, 'hero_tag', lang));
    setText('contactHeroTitle', pick(page, 'hero_title', lang));
    setText('contactHeroSub', pick(page, 'hero_sub', lang));
    const heroBg = document.getElementById('contactHeroBg');
    if (heroBg && page.hero_image_url) heroBg.style.backgroundImage = `url('${page.hero_image_url}')`;

    setText('contactInfoTag', pick(page, 'info_tag', lang));
    setText('contactInfoTitle', pick(page, 'info_title', lang));
    setText('contactInfoDesc', pick(page, 'info_desc', lang));

    setText('contactFormTag', pick(page, 'form_tag', lang));
    setText('contactFormTitle', pick(page, 'form_title', lang));
    setText('contactFormDesc', pick(page, 'form_desc', lang));

    setText('contactLabelName', pick(page, 'label_name', lang));
    setPlaceholder('contactInputName', pick(page, 'placeholder_name', lang));
    setText('contactLabelEmail', pick(page, 'label_email', lang));
    setPlaceholder('contactInputEmail', pick(page, 'placeholder_email', lang));
    setText('contactLabelPhone', pick(page, 'label_phone', lang));
    setPlaceholder('contactInputPhone', pick(page, 'placeholder_phone', lang));

    setText('contactLabelSubject', pick(page, 'label_subject', lang));
    setText('contactOptDefault', pick(page, 'subject_default', lang));
    setText('contactOptInquiry', pick(page, 'subject_inquiry', lang));
    setText('contactOptTrade', pick(page, 'subject_trade', lang));
    setText('contactOptTech', pick(page, 'subject_tech', lang));
    setText('contactOptInvestment', pick(page, 'subject_investment', lang));
    setText('contactOptLogistics', pick(page, 'subject_logistics', lang));
    setText('contactOptMedia', pick(page, 'subject_media', lang));

    setText('contactLabelMessage', pick(page, 'label_message', lang));
    setPlaceholder('contactInputMessage', pick(page, 'placeholder_message', lang));
    setText('contactBtnSubmit', pick(page, 'btn_submit', lang));

    setText('contactOfficesTag', pick(page, 'offices_tag', lang));
    setText('contactOfficesTitle', pick(page, 'offices_title', lang));
  }

  function renderInfoItems(items, lang) {
    const list = document.getElementById('contactInfoList');
    if (!list) return;
    list.innerHTML = items.map((item) => `
      <div class="contact-item">
        <div class="contact-icon"><i class="bi ${escapeHtml(item.icon)}"></i></div>
        <div>
          <span class="contact-label">${escapeHtml(lang === 'ar' ? item.label_ar : item.label_en)}</span>
          <span class="contact-value">${escapeHtml(lang === 'ar' ? item.value_ar : item.value_en)}</span>
        </div>
      </div>`).join('');
  }

  function renderOffices(offices, lang) {
    const grid = document.getElementById('contactOfficesGrid');
    if (!grid) return;
    grid.innerHTML = offices.map((o, i) => `
      <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${(i % 3) * 100}">
        <div class="cert-card" style="text-align:left;">
          <div class="cert-icon" style="margin:0 0 16px 0;width:60px;height:60px;"><i class="bi ${escapeHtml(o.icon)}" style="font-size:1.5rem;"></i></div>
          <h3 class="cert-title">${escapeHtml(lang === 'ar' ? o.title_ar : o.title_en)}</h3>
          <p class="cert-desc"><strong>${escapeHtml(lang === 'ar' ? o.office_label_ar : o.office_label_en)}</strong><br>${escapeHtml(lang === 'ar' ? o.address_ar : o.address_en)}<br><i class="bi bi-telephone me-1"></i> ${escapeHtml(o.phone)}</p>
        </div>
      </div>`).join('');
  }

  function render() {
    const lang = currentLang();
    renderPage(cached.page, lang);
    renderInfoItems(cached.infoItems, lang);
    renderOffices(cached.offices, lang);
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchAll() {
    const [pageRes, infoRes, officesRes] = await Promise.all([
      withTimeout(supabaseClient.from('contact_page').select('*').limit(1).single(), 5000, 'contact_page request'),
      withTimeout(supabaseClient.from('contact_info_items').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'contact_info_items request'),
      withTimeout(supabaseClient.from('contact_offices').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'contact_offices request'),
    ]);

    if (pageRes.error || !pageRes.data) throw new Error('No contact_page row returned');
    if (infoRes.error) throw new Error('contact_info_items query failed');
    if (officesRes.error) throw new Error('contact_offices query failed');

    return {
      page: pageRes.data,
      infoItems: infoRes.data || [],
      offices: officesRes.data || [],
    };
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      cached = await fetchAll();
    } catch (err) {
      console.warn('contact-loader: falling back to static data —', err.message);
      cached = {
        page: CONTACT_PAGE_FALLBACK,
        infoItems: CONTACT_INFO_ITEMS_FALLBACK,
        offices: CONTACT_OFFICES_FALLBACK,
      };
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  new MutationObserver(() => {
    if (cached) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
