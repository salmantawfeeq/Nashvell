// Renders about.html's 6 sections (Hero, Our Story, Vision/Mission/Values,
// Stats, Team, Certifications) from Supabase, falling back to the
// ABOUT_*_FALLBACK constants (about-data.js) if Supabase is unreachable.
// Mirrors every other loader this session: withTimeout + try/catch fallback,
// manual EN/AR pick by localStorage (bypassing translate.js/data-i18n-key
// for this DB content, same reasoning as services-loader.js), and a
// MutationObserver on <html lang> to re-render on language switch.
(function () {
  let cached = null; // { page, features, visionCards, stats, team, certifications }

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

  function renderHeroAndStory(page, lang) {
    setText('aboutHeroTag', pick(page, 'hero_tag', lang));
    setText('aboutHeroTitle', pick(page, 'hero_title', lang));
    setText('aboutHeroSubtitle', pick(page, 'hero_subtitle', lang));
    const heroBg = document.getElementById('aboutHeroBg');
    if (heroBg && page.hero_image_url) heroBg.style.backgroundImage = `url('${page.hero_image_url}')`;

    setText('aboutStoryTag', pick(page, 'story_tag', lang));
    setText('aboutStoryTitle', pick(page, 'story_title', lang));
    setText('aboutStoryP1', pick(page, 'story_p1', lang));
    setText('aboutStoryP2', pick(page, 'story_p2', lang));
    const storyImg = document.getElementById('aboutStoryImg');
    if (storyImg && page.story_image_url) storyImg.src = page.story_image_url;
    setText('aboutBadgeNum', page.badge_num || '');
    setText('aboutBadgeLabel', pick(page, 'badge_label', lang));
    setText('aboutBtnContact', pick(page, 'btn_contact', lang));

    setText('aboutVisionTag', pick(page, 'vision_tag', lang));
    setText('aboutVisionTitle', pick(page, 'vision_title', lang));
    setText('aboutTeamTag', pick(page, 'team_tag', lang));
    setText('aboutTeamTitle', pick(page, 'team_title', lang));
    setText('aboutTeamSubtitle', pick(page, 'team_subtitle', lang));
    setText('aboutCertsTag', pick(page, 'certs_tag', lang));
    setText('aboutCertsTitle', pick(page, 'certs_title', lang));
  }

  function renderFeatures(features, lang) {
    const list = document.getElementById('aboutFeaturesList');
    if (!list) return;
    list.innerHTML = features.map((f) => `
      <div class="col-md-6">
        <div class="about-feature">
          <div class="about-feature-dot"></div>
          <div class="about-feature-text">${escapeHtml(lang === 'ar' ? f.text_ar : f.text_en)}</div>
        </div>
      </div>`).join('');
  }

  function renderVisionCards(cards, lang) {
    const row = document.getElementById('aboutVisionRow');
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

  function renderStats(stats, lang) {
    const row = document.getElementById('aboutStatsRow');
    if (!row) return;
    row.innerHTML = stats.map((s, i) => `
      <div class="col-6 col-lg" data-aos="fade-up" data-aos-delay="${i * 80}">
        <div class="stat-number counter-num" data-target="${escapeHtml(s.number)}" data-suffix="${escapeHtml(s.suffix)}">${escapeHtml(s.number)}${escapeHtml(s.suffix)}</div>
        <div class="stat-label">${escapeHtml(lang === 'ar' ? s.label_ar : s.label_en)}</div>
      </div>`).join('');
    if (typeof window.initCounters === 'function') window.initCounters(row);
  }

  function teamCardInner(member, lang) {
    const name = lang === 'ar' ? member.name_ar : member.name_en;
    const role = lang === 'ar' ? member.role_ar : member.role_en;
    return `
      <img src="${escapeHtml(member.photo_url)}" alt="${escapeHtml(name)}" />
      <div class="team-card-body">
        <div class="team-card-name">${escapeHtml(name)}</div>
        <div class="team-card-role">${escapeHtml(role)}</div>
        ${member.link_url ? `
        <div class="mt-2" style="font-size:0.78rem;color:var(--gold);font-weight:600;">
          <i class="bi bi-chat-quote me-1"></i><span>${escapeHtml(lang === 'ar' ? member.link_label_ar : member.link_label_en)}</span>
        </div>` : ''}
      </div>`;
  }

  function renderTeam(team, lang) {
    const row = document.getElementById('aboutTeamRow');
    if (!row) return;
    row.innerHTML = team.map((m, i) => `
      <div class="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay="${i * 100}">
        ${m.link_url
          ? `<a href="${escapeHtml(m.link_url)}" class="team-card d-block">${teamCardInner(m, lang)}</a>`
          : `<div class="team-card">${teamCardInner(m, lang)}</div>`}
      </div>`).join('');
  }

  function renderCertifications(certs, lang) {
    const row = document.getElementById('aboutCertsRow');
    if (!row) return;
    row.innerHTML = certs.map((c, i) => `
      <div class="col-md-6 col-lg-3" data-aos="zoom-in" data-aos-delay="${i * 100}">
        <div class="cert-card">
          <img class="cert-badge" src="${escapeHtml(c.badge_url)}" alt="${escapeHtml(lang === 'ar' ? c.title_ar : c.title_en)}" />
          <div class="cert-title">${escapeHtml(lang === 'ar' ? c.title_ar : c.title_en)}</div>
          <div class="cert-desc">${escapeHtml(lang === 'ar' ? c.desc_ar : c.desc_en)}</div>
        </div>
      </div>`).join('');
  }

  function render() {
    const lang = currentLang();
    renderHeroAndStory(cached.page, lang);
    renderFeatures(cached.features, lang);
    renderVisionCards(cached.visionCards, lang);
    renderStats(cached.stats, lang);
    renderTeam(cached.team, lang);
    renderCertifications(cached.certifications, lang);
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms));
    return Promise.race([promise, timeout]);
  }

  async function fetchAll() {
    const [pageRes, featuresRes, visionRes, statsRes, teamRes, certsRes] = await Promise.all([
      withTimeout(supabaseClient.from('about_page').select('*').limit(1).single(), 5000, 'about_page request'),
      withTimeout(supabaseClient.from('about_features').select('*').order('display_order', { ascending: true }), 5000, 'about_features request'),
      withTimeout(supabaseClient.from('about_vision_cards').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'about_vision_cards request'),
      withTimeout(supabaseClient.from('about_stats').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'about_stats request'),
      withTimeout(supabaseClient.from('about_team').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'about_team request'),
      withTimeout(supabaseClient.from('about_certifications').select('*').eq('is_active', true).order('display_order', { ascending: true }), 5000, 'about_certifications request'),
    ]);

    if (pageRes.error || !pageRes.data) throw new Error('No about_page row returned');
    if (featuresRes.error || visionRes.error || statsRes.error || teamRes.error || certsRes.error) {
      throw new Error('One or more about_* queries failed');
    }

    return {
      page: pageRes.data,
      features: featuresRes.data || [],
      visionCards: visionRes.data || [],
      stats: statsRes.data || [],
      team: teamRes.data || [],
      certifications: certsRes.data || [],
    };
  }

  async function init() {
    try {
      if (!supabaseClient) throw new Error('Supabase not configured');
      cached = await fetchAll();
    } catch (err) {
      console.warn('about-loader: falling back to static data —', err.message);
      cached = {
        page: ABOUT_PAGE_FALLBACK,
        features: ABOUT_FEATURES_FALLBACK,
        visionCards: ABOUT_VISION_CARDS_FALLBACK,
        stats: ABOUT_STATS_FALLBACK,
        team: ABOUT_TEAM_FALLBACK,
        certifications: ABOUT_CERTIFICATIONS_FALLBACK,
      };
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  new MutationObserver(() => {
    if (cached) render();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
