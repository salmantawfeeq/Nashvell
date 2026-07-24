// Renders gallery.html's photo grid from Supabase, falling back to
// GALLERY_FALLBACK_DATA (gallery-data.js) if Supabase is unreachable, so the
// public page never shows blank. Mirrors products-loader.js's fetch/timeout/
// fallback approach. Lightbox clicks are handled by main.js's delegated
// [data-lightbox] listener, so no click wiring is needed here.
(function () {
  let cachedImages = null;

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function itemHtml(img, index) {
    const delay = (index % 3) * 50;
    return `
      <div class="gallery-item" data-lightbox="${escapeHtml(img.image_url)}" data-aos="zoom-in" data-aos-delay="${delay}">
        <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.image_alt)}" />
        <div class="gallery-overlay"><i class="bi bi-zoom-in"></i></div>
      </div>`;
  }

  function render() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = cachedImages.map(itemHtml).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchImages() {
    const { data, error } = await withTimeout(
      supabaseClient.from('gallery_images').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      5000, 'gallery request'
    );
    if (error) throw error;
    return data;
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      const images = await fetchImages();
      if (!images || !images.length) throw new Error('No images returned');
      cachedImages = images;
    } catch (err) {
      console.warn('gallery-loader: falling back to static data —', err.message);
      cachedImages = GALLERY_FALLBACK_DATA;
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
