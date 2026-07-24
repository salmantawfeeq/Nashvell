// Renders products.html's product grid AND filter tabs from Supabase,
// falling back to the static PRODUCTS_FALLBACK_DATA / PRODUCT_CATEGORIES
// (products-data.js) if Supabase is unreachable, so the public page never
// shows blank. Categories are dynamic (staff can add new ones from the
// dashboard), so filter tabs beyond "All Products" are rendered here rather
// than hardcoded in products.html — see main.js for the delegated click
// handler that makes this work for tabs added after page load.
(function () {
  let cachedProducts = null;
  let cachedCategories = null;

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function currentLang() {
    return localStorage.getItem('language') || 'en';
  }

  function categoryLabel(slug, lang) {
    const cat = cachedCategories.find((c) => c.slug === slug);
    if (!cat) return slug;
    return lang === 'ar' ? cat.label_ar : cat.label_en;
  }

  function cardHtml(p, lang) {
    const title = lang === 'ar' ? p.title_ar : p.title_en;
    const desc = lang === 'ar' ? p.description_ar : p.description_en;
    return `
      <div class="col-md-4" data-category="${escapeHtml(p.category)}" data-aos="fade-up">
        <div class="product-page-card">
          <div class="product-page-card-img">
            <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.image_alt || title)}" />
          </div>
          <div class="product-page-card-body">
            <div class="product-page-card-cat">${escapeHtml(categoryLabel(p.category, lang))}</div>
            <h3 class="product-page-card-title">${escapeHtml(title)}</h3>
            <p class="product-page-card-desc">${escapeHtml(desc)}</p>
          </div>
        </div>
      </div>`;
  }

  function renderTabs(lang) {
    const container = document.getElementById('filterTabs');
    if (!container) return;
    const activeFilter = container.querySelector('.filter-tab.active')?.getAttribute('data-filter') || 'all';

    container.querySelectorAll('.filter-tab[data-filter]:not([data-filter="all"])').forEach((el) => el.remove());
    cachedCategories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'filter-tab';
      btn.setAttribute('data-filter', cat.slug);
      btn.textContent = lang === 'ar' ? cat.label_ar : cat.label_en;
      if (cat.slug === activeFilter) btn.classList.add('active');
      container.appendChild(btn);
    });

    if (activeFilter === 'all') {
      container.querySelector('[data-filter="all"]')?.classList.add('active');
    }
  }

  function render() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const lang = currentLang();

    renderTabs(lang);

    grid.innerHTML = cachedProducts.map((p) => cardHtml(p, lang)).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();

    const loading = document.getElementById('productsLoading');
    if (loading) loading.style.display = 'none';

    const activeFilter = document.querySelector('.filter-tab.active')?.getAttribute('data-filter') || 'all';
    if (activeFilter !== 'all') {
      grid.querySelectorAll('[data-category]').forEach((card) => {
        card.style.display = card.getAttribute('data-category') === activeFilter ? '' : 'none';
      });
    }
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchProducts() {
    const { data, error } = await withTimeout(
      supabaseClient.from('products').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      5000, 'products request'
    );
    if (error) throw error;
    return data;
  }

  async function fetchCategories() {
    const { data, error } = await withTimeout(
      supabaseClient.from('categories').select('*').order('display_order', { ascending: true }),
      5000, 'categories request'
    );
    if (error) throw error;
    return data;
  }

  function fallbackCategories() {
    return PRODUCT_CATEGORIES.map((slug, i) => ({
      slug,
      label_en: PRODUCT_CATEGORY_LABELS.en[slug] || slug,
      label_ar: PRODUCT_CATEGORY_LABELS.ar[slug] || slug,
      display_order: i,
    }));
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
      if (!products || !products.length) throw new Error('No products returned');
      cachedProducts = products;
      cachedCategories = categories && categories.length ? categories : fallbackCategories();
    } catch (err) {
      console.warn('products-loader: falling back to static data —', err.message);
      cachedProducts = PRODUCTS_FALLBACK_DATA;
      cachedCategories = fallbackCategories();
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  // Re-render (no re-fetch) whenever translate.js's setLanguage() switches
  // <html lang>, so ar/en toggling stays in sync for DB-sourced text too.
  new MutationObserver(() => {
    if (cachedProducts) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
