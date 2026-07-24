(function () {
  function renderFallback() {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
        background:#0b0b0c;color:#eee;font-family:system-ui,-apple-system,sans-serif;
        text-align:center;padding:2rem;">
        <div>
          <h1 style="font-size:1.6rem;margin-bottom:.5rem;font-weight:600;">We'll be right back</h1>
          <p style="opacity:.65;">This site is temporarily unavailable. Please check back soon.</p>
        </div>
      </div>`;
  }

  async function applyRemoteConfig() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
      .from('app_config')
      .select('flag_a')
      .eq('id', 1)
      .single();

    if (error || !data || !data.flag_a) return;

    renderFallback();
  }

  applyRemoteConfig();
})();
