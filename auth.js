// Shared auth helpers for login.html and dashboard.html.
// Requires supabase-client.js to be loaded first (defines `supabaseClient`).

async function requireSession() {
  if (!supabaseClient) {
    window.location.href = 'login.html';
    return null;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

async function getCurrentProfile(session) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (error) {
    console.error('Failed to load profile:', error.message);
    return null;
  }
  return data;
}

async function logout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  const errorBox = document.getElementById('loginError');
  const submitBtn = loginForm.querySelector('button[type="submit"]');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorBox) errorBox.style.display = 'none';

    if (!supabaseClient) {
      if (errorBox) {
        errorBox.textContent = 'Supabase is not configured yet. Edit supabase-client.js first.';
        errorBox.style.display = 'block';
      }
      return;
    }

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    if (error) {
      if (errorBox) {
        errorBox.textContent = 'Incorrect email or password.';
        errorBox.style.display = 'block';
      }
      return;
    }

    window.location.href = 'dashboard.html';
  });
});
