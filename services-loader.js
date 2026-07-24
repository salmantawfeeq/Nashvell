// Renders index.html's Services panels (services-row) from Supabase, falling
// back to SERVICES_FALLBACK_DATA (services-data.js) if Supabase is
// unreachable. Mirrors products-loader.js's fetch/timeout/fallback/lang-switch
// approach. "Learn More" is hardcoded per language (matching translate.js's
// btn_learn_more strings) rather than relying on data-i18n-key, since that
// system only wires up elements present at initial page load.
(function () {
  let cachedServices = null;

  const LEARN_MORE = { en: 'Learn More', ar: 'اعرف المزيد' };
  const AOS_BY_INDEX = [
    { effect: 'fade-right', delay: 0 },
    { effect: 'fade-up', delay: 80 },
    { effect: 'fade-left', delay: 160 },
  ];

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function currentLang() {
    return localStorage.getItem('language') || 'en';
  }

  function panelHtml(service, lang, index) {
    const title = lang === 'ar' ? service.title_ar : service.title_en;
    const description = lang === 'ar' ? service.description_ar : service.description_en;
    const aos = AOS_BY_INDEX[index % AOS_BY_INDEX.length];

    const body = service.items && service.items.length
      ? `<ul class="service-list">${service.items.map((item) => `
          <li><i class="bi ${escapeHtml(item.icon)}"></i> <span>${escapeHtml(lang === 'ar' ? item.label_ar : item.label_en)}</span></li>
        `).join('')}</ul>`
      : `<p style="color:rgba(255,255,255,0.75);font-size:0.88rem;line-height:1.8;">${escapeHtml(description)}</p>`;

    return `
      <div class="col-lg-4" data-aos="${aos.effect}" data-aos-delay="${aos.delay}">
        <div class="service-panel">
          <img src="${escapeHtml(service.image_url)}" alt="${escapeHtml(service.image_alt || title)}" />
          <div class="service-panel-overlay"></div>
          <div class="service-panel-content">
            <h3 class="service-panel-title">${escapeHtml(title)}</h3>
            ${body}
            <a href="${escapeHtml(service.link_url)}" class="btn-outline-gold mt-3 d-inline-block" style="font-size:0.82rem;padding:6px 16px;">
              <span>${escapeHtml(LEARN_MORE[lang] || LEARN_MORE.en)}</span> <i class="bi bi-arrow-right ms-1"></i>
            </a>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const container = document.getElementById('servicesRow');
    if (!container) return;
    const lang = currentLang();
    container.innerHTML = cachedServices.map((s, i) => panelHtml(s, lang, i)).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchServices() {
    const { data: services, error: servicesError } = await withTimeout(
      supabaseClient.from('services').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      5000, 'services request'
    );
    if (servicesError) throw servicesError;
    if (!services || !services.length) throw new Error('No services returned');

    const { data: items, error: itemsError } = await withTimeout(
      supabaseClient.from('service_items').select('*').order('display_order', { ascending: true }),
      5000, 'service items request'
    );
    if (itemsError) throw itemsError;

    return services.map((s) => ({
      ...s,
      items: (items || []).filter((item) => item.service_id === s.id),
    }));
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      cachedServices = await fetchServices();
    } catch (err) {
      console.warn('services-loader: falling back to static data —', err.message);
      cachedServices = SERVICES_FALLBACK_DATA;
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  new MutationObserver(() => {
    if (cachedServices) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
