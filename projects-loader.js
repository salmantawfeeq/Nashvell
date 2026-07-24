// Renders projects.html's "Featured Projects" grid from Supabase, falling
// back to PROJECTS_FALLBACK_DATA (projects-data.js) if Supabase is
// unreachable, so the public page never shows blank. Mirrors
// products-loader.js's fetch/timeout/fallback/lang-switch approach.
(function () {
  let cachedProjects = null;

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function currentLang() {
    return localStorage.getItem('language') || 'en';
  }

  function cardHtml(p, lang, index) {
    const title = lang === 'ar' ? p.title_ar : p.title_en;
    const category = lang === 'ar' ? p.category_ar : p.category_en;
    const location = lang === 'ar' ? p.location_ar : p.location_en;
    const delay = (index % 3) * 80;
    return `
      <div class="col-md-4" data-aos="fade-up" data-aos-delay="${delay}">
        <div class="project-card">
          <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.image_alt || title)}" />
          <div class="project-overlay">
            <div class="project-cat">${escapeHtml(category)}</div>
            <div class="project-title">${escapeHtml(title)}</div>
            <div class="project-location"><i class="bi bi-geo-alt"></i> <span>${escapeHtml(location)}</span></div>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    const lang = currentLang();

    grid.innerHTML = cachedProjects.map((p, i) => cardHtml(p, lang, i)).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchProjects() {
    const { data, error } = await withTimeout(
      supabaseClient.from('projects').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      5000, 'projects request'
    );
    if (error) throw error;
    return data;
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      const projects = await fetchProjects();
      if (!projects || !projects.length) throw new Error('No projects returned');
      cachedProjects = projects;
    } catch (err) {
      console.warn('projects-loader: falling back to static data —', err.message);
      cachedProjects = PROJECTS_FALLBACK_DATA;
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  new MutationObserver(() => {
    if (cachedProjects) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
