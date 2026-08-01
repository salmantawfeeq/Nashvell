// Dashboard logic: role-based UI (admin vs employee), product CRUD, user list.
// Requires supabase-client.js and auth.js to be loaded first.

let currentRole = null;
let productModalInstance = null;
let categoriesCache = [];
let manageCategoriesModalInstance = null;
let editCategoryModalInstance = null;

// Curated set of Bootstrap Icons relevant to a trade/logistics/tech company,
// so staff pick a shape visually instead of typing an icon name/link.
const ICON_PICKER_OPTIONS = [
  'bi-truck', 'bi-truck-front', 'bi-airplane', 'bi-box', 'bi-box-seam', 'bi-boxes',
  'bi-bag', 'bi-bag-check', 'bi-briefcase', 'bi-briefcase-fill', 'bi-cash', 'bi-cash-coin',
  'bi-cash-stack', 'bi-currency-exchange', 'bi-currency-dollar', 'bi-bank', 'bi-bank2',
  'bi-building', 'bi-buildings', 'bi-globe', 'bi-globe2', 'bi-geo-alt', 'bi-pin-map',
  'bi-map', 'bi-compass', 'bi-people', 'bi-person-check', 'bi-person-badge', 'bi-telephone',
  'bi-envelope', 'bi-chat-dots', 'bi-headset', 'bi-calendar-check', 'bi-calendar-event',
  'bi-clock', 'bi-clock-history', 'bi-award', 'bi-star', 'bi-star-fill', 'bi-trophy',
  'bi-lightbulb', 'bi-gear', 'bi-gear-fill', 'bi-tools', 'bi-wrench-adjustable', 'bi-hammer',
  'bi-cpu', 'bi-hdd-network', 'bi-wifi', 'bi-shield-check', 'bi-shield-lock', 'bi-lock',
  'bi-key', 'bi-file-earmark', 'bi-file-earmark-text', 'bi-file-earmark-check', 'bi-folder',
  'bi-folder-check', 'bi-clipboard-check', 'bi-clipboard-data', 'bi-bar-chart', 'bi-graph-up',
  'bi-graph-up-arrow', 'bi-pie-chart', 'bi-list-check', 'bi-check-circle', 'bi-check2-circle',
  'bi-diagram-3', 'bi-search', 'bi-layers', 'bi-code-slash', 'bi-phone', 'bi-robot',
  'bi-cloud-check', 'bi-calculator', 'bi-database', 'bi-cart-check', 'bi-arrow-repeat',
  'bi-recycle', 'bi-leaf', 'bi-eye', 'bi-bullseye', 'bi-gem', 'bi-flower1', 'bi-journal-check',
];

function iconPickerMenuHtml() {
  return ICON_PICKER_OPTIONS.map((ic) => `
    <button type="button" class="icon-picker-option" data-icon="${ic}" title="${ic.replace('bi-', '')}">
      <i class="bi ${ic}"></i>
    </button>
  `).join('');
}

// Wires a single icon-picker dropdown: clicking an option sets the icon on
// the hidden input, updates the preview <i>, marks it active, and closes the
// dropdown. `scopeEl` is the container the toggle/menu/hidden-input/preview
// live in (a bullet-point row, or the tech card modal).
function attachIconPicker(scopeEl, { toggleSelector, menuSelector, hiddenInputSelector, previewSelector }) {
  const toggle = scopeEl.querySelector(toggleSelector);
  const menu = scopeEl.querySelector(menuSelector);
  const hiddenInput = scopeEl.querySelector(hiddenInputSelector);
  const preview = scopeEl.querySelector(previewSelector);

  menu.innerHTML = iconPickerMenuHtml();

  menu.querySelectorAll('.icon-picker-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const icon = btn.dataset.icon;
      hiddenInput.value = icon;
      preview.className = preview.className.replace(/\bbi-[a-z0-9-]+/g, '').trim();
      preview.classList.add(icon);
      menu.querySelectorAll('.icon-picker-option').forEach((b) => b.classList.toggle('active', b === btn));
      const dropdownInstance = bootstrap.Dropdown.getOrCreateInstance(toggle);
      dropdownInstance.hide();
    });
  });

  return {
    setIcon(icon) {
      hiddenInput.value = icon || '';
      preview.className = preview.className.replace(/\bbi-[a-z0-9-]+/g, '').trim();
      preview.classList.add(icon || 'bi-circle');
      menu.querySelectorAll('.icon-picker-option').forEach((b) => b.classList.toggle('active', b.dataset.icon === icon));
    },
  };
}

function categoryLabel(slug) {
  const cat = categoriesCache.find((c) => c.slug === slug);
  return cat ? cat.label_en : slug;
}

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function loadCategories() {
  const { data, error } = await supabaseClient.from('categories').select('*').order('display_order', { ascending: true });
  if (error) {
    showDashboardError(`Failed to load categories: ${error.message}`);
    return;
  }
  categoriesCache = data || [];
  const select = document.getElementById('productCategory');
  const previousValue = select.value;
  select.innerHTML = categoriesCache.map((c) => `<option value="${escapeHtml(c.slug)}">${escapeHtml(c.label_en)}</option>`).join('');
  if (previousValue && categoriesCache.some((c) => c.slug === previousValue)) {
    select.value = previousValue;
  }
}

async function handleSaveNewCategory() {
  const labelEnInput = document.getElementById('newCategoryLabelEn');
  const labelArInput = document.getElementById('newCategoryLabelAr');
  const statusEl = document.getElementById('newCategoryStatus');

  const labelEn = labelEnInput.value.trim();
  const labelAr = labelArInput.value.trim();

  if (!labelEn || !labelAr) {
    statusEl.textContent = 'Please fill in both the English and Arabic names.';
    return;
  }

  let slug = slugify(labelEn);
  if (!slug) slug = slugify(labelAr) || `cat-${Date.now()}`;
  if (categoriesCache.some((c) => c.slug === slug)) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  statusEl.textContent = 'Adding…';

  const { error } = await supabaseClient.from('categories').insert({
    slug, label_en: labelEn, label_ar: labelAr, display_order: categoriesCache.length,
  });

  if (error) {
    statusEl.textContent = error.message.includes('permission')
      ? "You don't have permission for this action."
      : error.message;
    return;
  }

  await loadCategories();
  document.getElementById('productCategory').value = slug;
  labelEnInput.value = '';
  labelArInput.value = '';
  statusEl.textContent = '';
  document.getElementById('newCategoryForm').style.display = 'none';
}

function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!categoriesCache.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4">No categories yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = categoriesCache.map((c) => `
    <tr data-slug="${escapeHtml(c.slug)}">
      <td>${escapeHtml(c.label_en)}</td>
      <td dir="rtl">${escapeHtml(c.label_ar)}</td>
      <td class="admin-table-actions">
        ${currentRole === 'admin' ? `
          <button type="button" class="btn-icon" data-action="edit-category" title="Edit"><i class="bi bi-pencil"></i></button>
          <button type="button" class="btn-icon btn-icon-danger" data-action="delete-category" title="Delete"><i class="bi bi-trash"></i></button>
        ` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit-category"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slug = btn.closest('tr').dataset.slug;
      const cat = categoriesCache.find((c) => c.slug === slug);
      if (cat) openEditCategoryModal(cat);
    });
  });

  tbody.querySelectorAll('[data-action="delete-category"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slug = btn.closest('tr').dataset.slug;
      const cat = categoriesCache.find((c) => c.slug === slug);
      if (cat) handleDeleteCategory(cat);
    });
  });
}

async function openManageCategoriesModal() {
  const statusEl = document.getElementById('manageCategoriesStatus');
  statusEl.style.display = 'none';
  statusEl.textContent = '';
  await loadCategories();
  renderCategoriesTable();
  manageCategoriesModalInstance.show();
}

function openEditCategoryModal(cat) {
  document.getElementById('editCategorySlug').value = cat.slug;
  document.getElementById('editCategoryLabelEn').value = cat.label_en;
  document.getElementById('editCategoryLabelAr').value = cat.label_ar;
  const statusEl = document.getElementById('editCategoryStatus');
  statusEl.style.display = 'none';
  statusEl.textContent = '';
  editCategoryModalInstance.show();
}

async function handleSaveCategoryEdit() {
  const slug = document.getElementById('editCategorySlug').value;
  const labelEn = document.getElementById('editCategoryLabelEn').value.trim();
  const labelAr = document.getElementById('editCategoryLabelAr').value.trim();
  const statusEl = document.getElementById('editCategoryStatus');

  if (!labelEn || !labelAr) {
    statusEl.textContent = 'Please fill in both the English and Arabic names.';
    statusEl.style.display = 'block';
    return;
  }

  const { error } = await supabaseClient.from('categories')
    .update({ label_en: labelEn, label_ar: labelAr })
    .eq('slug', slug);

  if (error) {
    statusEl.textContent = error.message.includes('permission')
      ? "You don't have permission for this action."
      : error.message;
    statusEl.style.display = 'block';
    return;
  }

  editCategoryModalInstance.hide();
  await loadCategories();
  renderCategoriesTable();
  loadProducts();
}

async function handleDeleteCategory(cat) {
  if (!confirm(`Delete the category "${cat.label_en}"? This cannot be undone.`)) return;

  const statusEl = document.getElementById('manageCategoriesStatus');
  statusEl.style.display = 'none';
  statusEl.textContent = '';

  const { error } = await supabaseClient.from('categories').delete().eq('slug', cat.slug);

  if (error) {
    statusEl.textContent = error.message.includes('violates foreign key constraint')
      ? `Cannot delete "${cat.label_en}" — it still has products assigned to it. Move or delete those products first.`
      : error.message.includes('permission')
        ? "You don't have permission for this action."
        : error.message;
    statusEl.style.display = 'block';
    return;
  }

  await loadCategories();
  renderCategoriesTable();
  loadProducts();
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function showDashboardError(message) {
  const box = document.getElementById('dashboardError');
  if (!box) return;
  box.textContent = message;
  box.style.display = 'block';
}

async function loadProducts() {
  const tbody = document.getElementById('productsTableBody');
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Failed to load products.</td></tr>`;
    showDashboardError(error.message);
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No products yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((p) => `
    <tr data-id="${p.id}">
      <td><img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.image_alt)}" class="admin-table-thumb" /></td>
      <td>${escapeHtml(categoryLabel(p.category))}</td>
      <td>${escapeHtml(p.title_en)}</td>
      <td dir="rtl">${escapeHtml(p.title_ar)}</td>
      <td>${p.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const product = data.find((p) => String(p.id) === String(id));
      if (product) openProductModal(product);
    });
  });

  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this product? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('products').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission')
          ? "You don't have permission for this action."
          : delError.message);
        return;
      }
      loadProducts();
    });
  });
}

let editStaffModalInstance = null;
let addEmployeeModalInstance = null;

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  const { data, error } = await supabaseClient.functions.invoke('admin-users', { body: { action: 'list' } });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Failed to load staff accounts. Has the "admin-users" Edge Function been deployed?</td></tr>`;
    return;
  }

  const users = data.users || [];
  tbody.innerHTML = users.map((u) => `
    <tr data-id="${u.id}">
      <td>${escapeHtml(u.full_name)}</td>
      <td>${escapeHtml(u.email || '—')}</td>
      <td>${escapeHtml(u.role)}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit-staff" title="Edit"><i class="bi bi-pencil"></i></button>
        ${u.role !== 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete-staff" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit-staff"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const user = users.find((u) => String(u.id) === String(id));
      if (user) openEditStaffModal(user);
    });
  });

  tbody.querySelectorAll('[data-action="delete-staff"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const user = users.find((u) => String(u.id) === String(id));
      if (user) handleDeleteStaff(user);
    });
  });
}

function openEditStaffModal(user) {
  document.getElementById('editStaffUserId').value = user.id;
  document.getElementById('editStaffName').value = user.full_name || '';
  document.getElementById('editStaffEmail').value = user.email || '';
  document.getElementById('editStaffPassword').value = '';
  const statusEl = document.getElementById('editStaffStatus');
  statusEl.style.display = 'none';
  statusEl.textContent = '';
  editStaffModalInstance.show();
}

async function handleSaveStaff() {
  const userId = document.getElementById('editStaffUserId').value;
  const fullName = document.getElementById('editStaffName').value.trim();
  const email = document.getElementById('editStaffEmail').value.trim();
  const password = document.getElementById('editStaffPassword').value;
  const statusEl = document.getElementById('editStaffStatus');

  if (!fullName || !email) {
    statusEl.textContent = 'Please fill in both name and email.';
    statusEl.style.display = 'block';
    return;
  }

  const { data, error } = await supabaseClient.functions.invoke('admin-users', {
    body: { action: 'updateStaff', userId, fullName, email, password: password || undefined },
  });

  if (error || data?.error) {
    statusEl.textContent = data?.error || error.message;
    statusEl.style.display = 'block';
    return;
  }

  editStaffModalInstance.hide();
  loadUsers();
}

async function handleDeleteStaff(user) {
  if (!confirm(`Remove ${user.full_name} (${user.email})? They will lose access immediately. This cannot be undone.`)) return;

  const { data, error } = await supabaseClient.functions.invoke('admin-users', {
    body: { action: 'deleteUser', userId: user.id },
  });

  if (error || data?.error) {
    showDashboardError(data?.error || error.message);
    return;
  }

  loadUsers();
}

function openAddEmployeeModal() {
  document.getElementById('newEmployeeName').value = '';
  document.getElementById('newEmployeeEmail').value = '';
  document.getElementById('newEmployeePassword').value = '';
  const statusEl = document.getElementById('addEmployeeStatus');
  statusEl.style.display = 'none';
  statusEl.textContent = '';
  addEmployeeModalInstance.show();
}

async function handleCreateEmployee() {
  const fullName = document.getElementById('newEmployeeName').value.trim();
  const email = document.getElementById('newEmployeeEmail').value.trim();
  const password = document.getElementById('newEmployeePassword').value;
  const statusEl = document.getElementById('addEmployeeStatus');

  if (!fullName || !email || !password) {
    statusEl.textContent = 'Please fill in name, email and password.';
    statusEl.style.display = 'block';
    return;
  }

  const { data, error } = await supabaseClient.functions.invoke('admin-users', {
    body: { action: 'createEmployee', fullName, email, password },
  });

  if (error || data?.error) {
    statusEl.textContent = data?.error || error.message;
    statusEl.style.display = 'block';
    return;
  }

  addEmployeeModalInstance.hide();
  loadUsers();
}

function openProductModal(product) {
  document.getElementById('productModalTitle').textContent = product ? 'Edit Product' : 'Add Product';
  document.getElementById('productId').value = product?.id || '';
  document.getElementById('productCategory').value = product?.category || (categoriesCache[0]?.slug || '');
  document.getElementById('productImageUrl').value = product?.image_url || '';
  document.getElementById('productTitleEn').value = product?.title_en || '';
  document.getElementById('productTitleAr').value = product?.title_ar || '';
  document.getElementById('productDescEn').value = product?.description_en || '';
  document.getElementById('productDescAr').value = product?.description_ar || '';
  document.getElementById('productImageAlt').value = product?.image_alt || '';
  document.getElementById('productDisplayOrder').value = product?.display_order ?? 0;
  document.getElementById('productIsActive').checked = product ? !!product.is_active : true;

  document.getElementById('productImageFile').value = '';
  document.getElementById('productImageUploadStatus').textContent = '';
  const preview = document.getElementById('productImagePreview');
  if (product?.image_url) {
    preview.src = product.image_url;
    preview.style.display = '';
  } else {
    preview.src = '';
    preview.style.display = 'none';
  }

  productModalInstance.show();
}

const PRODUCT_IMAGE_BUCKET = 'product-images';

async function handleImageFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('productImageUploadStatus');
  const urlInput = document.getElementById('productImageUrl');
  const preview = document.getElementById('productImagePreview');

  statusEl.textContent = 'Uploading…';

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  preview.src = data.publicUrl;
  preview.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const payload = {
    category: document.getElementById('productCategory').value,
    image_url: document.getElementById('productImageUrl').value.trim(),
    title_en: document.getElementById('productTitleEn').value.trim(),
    title_ar: document.getElementById('productTitleAr').value.trim(),
    description_en: document.getElementById('productDescEn').value.trim(),
    description_ar: document.getElementById('productDescAr').value.trim(),
    image_alt: document.getElementById('productImageAlt').value.trim(),
    display_order: parseInt(document.getElementById('productDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('productIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('products').update(payload).eq('id', id)
    : await supabaseClient.from('products').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission')
      ? "You don't have permission for this action."
      : error.message);
    return;
  }

  productModalInstance.hide();
  loadProducts();
}

let projectModalInstance = null;

async function loadProjects() {
  const tbody = document.getElementById('projectsTableBody');
  const { data, error } = await supabaseClient
    .from('projects')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Failed to load projects.</td></tr>`;
    showDashboardError(error.message);
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No projects yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((p) => `
    <tr data-id="${p.id}">
      <td><img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.image_alt)}" class="admin-table-thumb" /></td>
      <td>${escapeHtml(p.category_en)}</td>
      <td>${escapeHtml(p.title_en)}</td>
      <td dir="rtl">${escapeHtml(p.title_ar)}</td>
      <td>${p.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const project = data.find((p) => String(p.id) === String(id));
      if (project) openProjectModal(project);
    });
  });

  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this project? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('projects').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission')
          ? "You don't have permission for this action."
          : delError.message);
        return;
      }
      loadProjects();
    });
  });
}

function openProjectModal(project) {
  document.getElementById('projectModalTitle').textContent = project ? 'Edit Project' : 'Add Project';
  document.getElementById('projectId').value = project?.id || '';
  document.getElementById('projectImageUrl').value = project?.image_url || '';
  document.getElementById('projectTitleEn').value = project?.title_en || '';
  document.getElementById('projectTitleAr').value = project?.title_ar || '';
  document.getElementById('projectCategoryEn').value = project?.category_en || '';
  document.getElementById('projectCategoryAr').value = project?.category_ar || '';
  document.getElementById('projectLocationEn').value = project?.location_en || '';
  document.getElementById('projectLocationAr').value = project?.location_ar || '';
  document.getElementById('projectImageAlt').value = project?.image_alt || '';
  document.getElementById('projectDisplayOrder').value = project?.display_order ?? 0;
  document.getElementById('projectIsActive').checked = project ? !!project.is_active : true;

  document.getElementById('projectImageFile').value = '';
  document.getElementById('projectImageUploadStatus').textContent = '';
  const preview = document.getElementById('projectImagePreview');
  if (project?.image_url) {
    preview.src = project.image_url;
    preview.style.display = '';
  } else {
    preview.src = '';
    preview.style.display = 'none';
  }

  projectModalInstance.show();
}

const PROJECT_IMAGE_BUCKET = 'project-images';

async function handleProjectImageFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('projectImageUploadStatus');
  const urlInput = document.getElementById('projectImageUrl');
  const preview = document.getElementById('projectImagePreview');

  statusEl.textContent = 'Uploading…';

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(PROJECT_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(PROJECT_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  preview.src = data.publicUrl;
  preview.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

async function handleProjectFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('projectId').value;
  const payload = {
    image_url: document.getElementById('projectImageUrl').value.trim(),
    title_en: document.getElementById('projectTitleEn').value.trim(),
    title_ar: document.getElementById('projectTitleAr').value.trim(),
    category_en: document.getElementById('projectCategoryEn').value.trim(),
    category_ar: document.getElementById('projectCategoryAr').value.trim(),
    location_en: document.getElementById('projectLocationEn').value.trim(),
    location_ar: document.getElementById('projectLocationAr').value.trim(),
    image_alt: document.getElementById('projectImageAlt').value.trim(),
    display_order: parseInt(document.getElementById('projectDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('projectIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('projects').update(payload).eq('id', id)
    : await supabaseClient.from('projects').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission')
      ? "You don't have permission for this action."
      : error.message);
    return;
  }

  projectModalInstance.hide();
  loadProjects();
}

let galleryModalInstance = null;

async function loadGalleryImages() {
  const tbody = document.getElementById('galleryTableBody');
  const { data, error } = await supabaseClient
    .from('gallery_images')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Failed to load gallery images.</td></tr>`;
    showDashboardError(error.message);
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">No images yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((img) => `
    <tr data-id="${img.id}">
      <td><img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.image_alt)}" class="admin-table-thumb" /></td>
      <td>${escapeHtml(img.image_alt)}</td>
      <td>${img.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const image = data.find((img) => String(img.id) === String(id));
      if (image) openGalleryModal(image);
    });
  });

  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this image? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('gallery_images').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission')
          ? "You don't have permission for this action."
          : delError.message);
        return;
      }
      loadGalleryImages();
    });
  });
}

function openGalleryModal(image) {
  document.getElementById('galleryModalTitle').textContent = image ? 'Edit Image' : 'Add Image';
  document.getElementById('galleryImageId').value = image?.id || '';
  document.getElementById('galleryImageUrl').value = image?.image_url || '';
  document.getElementById('galleryImageAlt').value = image?.image_alt || '';
  document.getElementById('galleryDisplayOrder').value = image?.display_order ?? 0;
  document.getElementById('galleryIsActive').checked = image ? !!image.is_active : true;

  document.getElementById('galleryImageFile').value = '';
  document.getElementById('galleryImageUploadStatus').textContent = '';
  const preview = document.getElementById('galleryImagePreview');
  if (image?.image_url) {
    preview.src = image.image_url;
    preview.style.display = '';
  } else {
    preview.src = '';
    preview.style.display = 'none';
  }

  galleryModalInstance.show();
}

const GALLERY_IMAGE_BUCKET = 'gallery-images';

async function handleGalleryImageFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('galleryImageUploadStatus');
  const urlInput = document.getElementById('galleryImageUrl');
  const preview = document.getElementById('galleryImagePreview');

  statusEl.textContent = 'Uploading…';

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(GALLERY_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(GALLERY_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  preview.src = data.publicUrl;
  preview.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

async function handleGalleryFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('galleryImageId').value;
  const payload = {
    image_url: document.getElementById('galleryImageUrl').value.trim(),
    image_alt: document.getElementById('galleryImageAlt').value.trim(),
    display_order: parseInt(document.getElementById('galleryDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('galleryIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('gallery_images').update(payload).eq('id', id)
    : await supabaseClient.from('gallery_images').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission')
      ? "You don't have permission for this action."
      : error.message);
    return;
  }

  galleryModalInstance.hide();
  loadGalleryImages();
}

let serviceModalInstance = null;

function addServiceItemRow(item) {
  const list = document.getElementById('serviceItemsList');
  const row = document.createElement('div');
  row.className = 'row g-2 align-items-center service-item-row';
  row.style.marginBottom = '8px';
  row.innerHTML = `
    <div class="col-auto">
      <div class="dropdown">
        <button type="button" class="btn-icon item-icon-toggle" data-bs-toggle="dropdown" aria-expanded="false" title="Choose icon">
          <i class="bi item-icon-preview"></i>
        </button>
        <div class="dropdown-menu icon-picker-menu item-icon-menu"></div>
      </div>
      <input type="hidden" class="item-icon-input" />
    </div>
    <div class="col-4"><input type="text" class="form-control-custom item-label-en" placeholder="Label (English)" /></div>
    <div class="col-4"><input type="text" class="form-control-custom item-label-ar" dir="rtl" placeholder="النص (عربي)" /></div>
    <div class="col-auto"><button type="button" class="btn-icon btn-icon-danger remove-item-btn" title="Remove"><i class="bi bi-trash"></i></button></div>
  `;

  const picker = attachIconPicker(row, {
    toggleSelector: '.item-icon-toggle',
    menuSelector: '.item-icon-menu',
    hiddenInputSelector: '.item-icon-input',
    previewSelector: '.item-icon-preview',
  });
  picker.setIcon(item?.icon || 'bi-check-circle');

  row.querySelector('.item-label-en').value = item?.label_en || '';
  row.querySelector('.item-label-ar').value = item?.label_ar || '';
  row.querySelector('.remove-item-btn').addEventListener('click', () => row.remove());

  list.appendChild(row);
}

async function loadServices() {
  const tbody = document.getElementById('servicesTableBody');
  const { data, error } = await supabaseClient
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load services.</td></tr>`;
    showDashboardError(error.message);
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No services yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((s) => `
    <tr data-id="${s.id}">
      <td><img src="${escapeHtml(s.image_url)}" alt="${escapeHtml(s.image_alt)}" class="admin-table-thumb" /></td>
      <td>${escapeHtml(s.title_en)}</td>
      <td dir="rtl">${escapeHtml(s.title_ar)}</td>
      <td>${s.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const service = data.find((s) => String(s.id) === String(id));
      if (service) openServiceModal(service);
    });
  });

  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this service? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('services').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission')
          ? "You don't have permission for this action."
          : delError.message);
        return;
      }
      loadServices();
    });
  });
}

async function openServiceModal(service) {
  document.getElementById('serviceModalTitle').textContent = service ? 'Edit Service' : 'Add Service';
  document.getElementById('serviceId').value = service?.id || '';
  document.getElementById('serviceImageUrl').value = service?.image_url || '';
  document.getElementById('serviceTitleEn').value = service?.title_en || '';
  document.getElementById('serviceTitleAr').value = service?.title_ar || '';
  document.getElementById('serviceLinkUrl').value = service?.link_url || '';
  document.getElementById('serviceDescEn').value = service?.description_en || '';
  document.getElementById('serviceDescAr').value = service?.description_ar || '';
  document.getElementById('serviceImageAlt').value = service?.image_alt || '';
  document.getElementById('serviceDisplayOrder').value = service?.display_order ?? 0;
  document.getElementById('serviceIsActive').checked = service ? !!service.is_active : true;

  document.getElementById('serviceImageFile').value = '';
  document.getElementById('serviceImageUploadStatus').textContent = '';
  const preview = document.getElementById('serviceImagePreview');
  if (service?.image_url) {
    preview.src = service.image_url;
    preview.style.display = '';
  } else {
    preview.src = '';
    preview.style.display = 'none';
  }

  document.getElementById('serviceItemsList').innerHTML = '';
  if (service) {
    const { data: items, error } = await supabaseClient
      .from('service_items')
      .select('*')
      .eq('service_id', service.id)
      .order('display_order', { ascending: true });
    if (!error && items) items.forEach((item) => addServiceItemRow(item));
  }

  serviceModalInstance.show();
}

const SERVICE_IMAGE_BUCKET = 'service-images';

async function handleServiceImageFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('serviceImageUploadStatus');
  const urlInput = document.getElementById('serviceImageUrl');
  const preview = document.getElementById('serviceImagePreview');

  statusEl.textContent = 'Uploading…';

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(SERVICE_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(SERVICE_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  preview.src = data.publicUrl;
  preview.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

async function handleServiceFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('serviceId').value;
  const payload = {
    image_url: document.getElementById('serviceImageUrl').value.trim(),
    image_alt: document.getElementById('serviceImageAlt').value.trim(),
    title_en: document.getElementById('serviceTitleEn').value.trim(),
    title_ar: document.getElementById('serviceTitleAr').value.trim(),
    link_url: document.getElementById('serviceLinkUrl').value.trim(),
    description_en: document.getElementById('serviceDescEn').value.trim(),
    description_ar: document.getElementById('serviceDescAr').value.trim(),
    display_order: parseInt(document.getElementById('serviceDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('serviceIsActive').checked,
  };

  let serviceId = id;
  if (id) {
    const { error } = await supabaseClient.from('services').update(payload).eq('id', id);
    if (error) {
      showDashboardError(error.message.includes('permission')
        ? "You don't have permission for this action."
        : error.message);
      return;
    }
  } else {
    const { data, error } = await supabaseClient.from('services').insert(payload).select('id').single();
    if (error) {
      showDashboardError(error.message.includes('permission')
        ? "You don't have permission for this action."
        : error.message);
      return;
    }
    serviceId = data.id;
  }

  const items = Array.from(document.querySelectorAll('#serviceItemsList .service-item-row'))
    .map((row, index) => ({
      service_id: serviceId,
      icon: row.querySelector('.item-icon-input').value || 'bi-check-circle',
      label_en: row.querySelector('.item-label-en').value.trim(),
      label_ar: row.querySelector('.item-label-ar').value.trim(),
      display_order: index,
    }))
    .filter((item) => item.label_en && item.label_ar);

  const { error: delError } = await supabaseClient.from('service_items').delete().eq('service_id', serviceId);
  if (delError) {
    showDashboardError(delError.message.includes('permission')
      ? "You don't have permission for this action."
      : delError.message);
    return;
  }

  if (items.length) {
    const { error: insError } = await supabaseClient.from('service_items').insert(items);
    if (insError) {
      showDashboardError(insError.message.includes('permission')
        ? "You don't have permission for this action."
        : insError.message);
      return;
    }
  }

  serviceModalInstance.hide();
  loadServices();
}

let techCardModalInstance = null;
let techCardIconPicker = null;

async function loadTechCards() {
  const tbody = document.getElementById('techCardsTableBody');
  const { data, error } = await supabaseClient
    .from('tech_cards')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Failed to load tech cards.</td></tr>`;
    showDashboardError(error.message);
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No tech cards yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((c) => `
    <tr data-id="${c.id}">
      <td><i class="bi ${escapeHtml(c.icon)}" style="font-size:1.3rem;color:var(--primary);"></i></td>
      <td>${escapeHtml(c.title_en)}</td>
      <td dir="rtl">${escapeHtml(c.title_ar)}</td>
      <td>${c.is_featured ? '<span class="admin-badge admin-badge-active">Featured</span>' : '—'}</td>
      <td>${c.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const card = data.find((c) => String(c.id) === String(id));
      if (card) openTechCardModal(card);
    });
  });

  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this tech card? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('tech_cards').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission')
          ? "You don't have permission for this action."
          : delError.message);
        return;
      }
      loadTechCards();
    });
  });
}

function openTechCardModal(card) {
  document.getElementById('techCardModalTitle').textContent = card ? 'Edit Tech Card' : 'Add Tech Card';
  document.getElementById('techCardId').value = card?.id || '';
  techCardIconPicker.setIcon(card?.icon || 'bi-gear');
  document.getElementById('techCardTitleEn').value = card?.title_en || '';
  document.getElementById('techCardTitleAr').value = card?.title_ar || '';
  document.getElementById('techCardDescShortEn').value = card?.description_short_en || '';
  document.getElementById('techCardDescShortAr').value = card?.description_short_ar || '';
  document.getElementById('techCardDescLongEn').value = card?.description_long_en || '';
  document.getElementById('techCardDescLongAr').value = card?.description_long_ar || '';
  document.getElementById('techCardDisplayOrder').value = card?.display_order ?? 0;
  document.getElementById('techCardIsFeatured').checked = card ? !!card.is_featured : false;
  document.getElementById('techCardIsActive').checked = card ? !!card.is_active : true;

  techCardModalInstance.show();
}

async function handleTechCardFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('techCardId').value;
  const payload = {
    icon: document.getElementById('techCardIcon').value || 'bi-gear',
    title_en: document.getElementById('techCardTitleEn').value.trim(),
    title_ar: document.getElementById('techCardTitleAr').value.trim(),
    description_short_en: document.getElementById('techCardDescShortEn').value.trim(),
    description_short_ar: document.getElementById('techCardDescShortAr').value.trim(),
    description_long_en: document.getElementById('techCardDescLongEn').value.trim(),
    description_long_ar: document.getElementById('techCardDescLongAr').value.trim(),
    is_featured: document.getElementById('techCardIsFeatured').checked,
    display_order: parseInt(document.getElementById('techCardDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('techCardIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('tech_cards').update(payload).eq('id', id)
    : await supabaseClient.from('tech_cards').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission')
      ? "You don't have permission for this action."
      : error.message);
    return;
  }

  techCardModalInstance.hide();
  loadTechCards();
}

function setImagePreview(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  if (url) {
    el.src = url;
    el.style.display = '';
  } else {
    el.src = '';
    el.style.display = 'none';
  }
}

const ABOUT_IMAGE_BUCKET = 'about-images';

async function uploadAboutImage(file, statusEl, urlInput, previewEl) {
  statusEl.textContent = 'Uploading…';
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(ABOUT_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(ABOUT_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  previewEl.src = data.publicUrl;
  previewEl.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

function addAboutFeatureRow(feature) {
  const list = document.getElementById('aboutFeaturesListEditor');
  const row = document.createElement('div');
  row.className = 'row g-2 align-items-center about-feature-row';
  row.style.marginBottom = '8px';
  row.innerHTML = `
    <div class="col-5"><input type="text" class="form-control-custom feature-text-en" placeholder="Feature (English)" /></div>
    <div class="col-5"><input type="text" class="form-control-custom feature-text-ar" dir="rtl" placeholder="النص (عربي)" /></div>
    <div class="col-auto"><button type="button" class="btn-icon btn-icon-danger remove-feature-btn" title="Remove"><i class="bi bi-trash"></i></button></div>
  `;
  row.querySelector('.feature-text-en').value = feature?.text_en || '';
  row.querySelector('.feature-text-ar').value = feature?.text_ar || '';
  row.querySelector('.remove-feature-btn').addEventListener('click', () => row.remove());
  list.appendChild(row);
}

async function loadAboutPage() {
  const { data, error } = await supabaseClient.from('about_page').select('*').limit(1).maybeSingle();
  if (error) {
    showDashboardError(error.message);
    return;
  }

  document.getElementById('aboutPageId').value = data?.id || '';
  document.getElementById('aboutHeroTagEn').value = data?.hero_tag_en || '';
  document.getElementById('aboutHeroTagArInput').value = data?.hero_tag_ar || '';
  document.getElementById('aboutHeroTitleEn').value = data?.hero_title_en || '';
  document.getElementById('aboutHeroTitleArInput').value = data?.hero_title_ar || '';
  document.getElementById('aboutHeroSubtitleEn').value = data?.hero_subtitle_en || '';
  document.getElementById('aboutHeroSubtitleArInput').value = data?.hero_subtitle_ar || '';
  document.getElementById('aboutHeroImageUrl').value = data?.hero_image_url || '';
  setImagePreview('aboutHeroImagePreview', data?.hero_image_url);

  document.getElementById('aboutStoryTagEn').value = data?.story_tag_en || '';
  document.getElementById('aboutStoryTagArInput').value = data?.story_tag_ar || '';
  document.getElementById('aboutStoryTitleEn').value = data?.story_title_en || '';
  document.getElementById('aboutStoryTitleArInput').value = data?.story_title_ar || '';
  document.getElementById('aboutStoryP1En').value = data?.story_p1_en || '';
  document.getElementById('aboutStoryP1ArInput').value = data?.story_p1_ar || '';
  document.getElementById('aboutStoryP2En').value = data?.story_p2_en || '';
  document.getElementById('aboutStoryP2ArInput').value = data?.story_p2_ar || '';
  document.getElementById('aboutStoryImageUrl').value = data?.story_image_url || '';
  setImagePreview('aboutStoryImagePreview', data?.story_image_url);
  document.getElementById('aboutBadgeNumInput').value = data?.badge_num || '';
  document.getElementById('aboutBadgeLabelEn').value = data?.badge_label_en || '';
  document.getElementById('aboutBadgeLabelArInput').value = data?.badge_label_ar || '';
  document.getElementById('aboutBtnContactEn').value = data?.btn_contact_en || '';
  document.getElementById('aboutBtnContactArInput').value = data?.btn_contact_ar || '';

  document.getElementById('aboutVisionTagEn').value = data?.vision_tag_en || '';
  document.getElementById('aboutVisionTagArInput').value = data?.vision_tag_ar || '';
  document.getElementById('aboutVisionTitleEn').value = data?.vision_title_en || '';
  document.getElementById('aboutVisionTitleArInput').value = data?.vision_title_ar || '';
  document.getElementById('aboutTeamTagEn').value = data?.team_tag_en || '';
  document.getElementById('aboutTeamTagArInput').value = data?.team_tag_ar || '';
  document.getElementById('aboutTeamTitleEn').value = data?.team_title_en || '';
  document.getElementById('aboutTeamTitleArInput').value = data?.team_title_ar || '';
  document.getElementById('aboutTeamSubtitleEn').value = data?.team_subtitle_en || '';
  document.getElementById('aboutTeamSubtitleArInput').value = data?.team_subtitle_ar || '';
  document.getElementById('aboutCertsTagEn').value = data?.certs_tag_en || '';
  document.getElementById('aboutCertsTagArInput').value = data?.certs_tag_ar || '';
  document.getElementById('aboutCertsTitleEn').value = data?.certs_title_en || '';
  document.getElementById('aboutCertsTitleArInput').value = data?.certs_title_ar || '';

  document.getElementById('aboutFeaturesListEditor').innerHTML = '';
  const { data: features, error: featError } = await supabaseClient
    .from('about_features')
    .select('*')
    .order('display_order', { ascending: true });
  if (!featError && features) features.forEach((f) => addAboutFeatureRow(f));
}

async function handleAboutPageFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('aboutPageId').value;
  const statusEl = document.getElementById('aboutPageStatus');
  statusEl.style.color = '';
  statusEl.textContent = 'Saving…';

  const payload = {
    hero_tag_en: document.getElementById('aboutHeroTagEn').value.trim(),
    hero_tag_ar: document.getElementById('aboutHeroTagArInput').value.trim(),
    hero_title_en: document.getElementById('aboutHeroTitleEn').value.trim(),
    hero_title_ar: document.getElementById('aboutHeroTitleArInput').value.trim(),
    hero_subtitle_en: document.getElementById('aboutHeroSubtitleEn').value.trim(),
    hero_subtitle_ar: document.getElementById('aboutHeroSubtitleArInput').value.trim(),
    hero_image_url: document.getElementById('aboutHeroImageUrl').value.trim(),
    story_tag_en: document.getElementById('aboutStoryTagEn').value.trim(),
    story_tag_ar: document.getElementById('aboutStoryTagArInput').value.trim(),
    story_title_en: document.getElementById('aboutStoryTitleEn').value.trim(),
    story_title_ar: document.getElementById('aboutStoryTitleArInput').value.trim(),
    story_p1_en: document.getElementById('aboutStoryP1En').value.trim(),
    story_p1_ar: document.getElementById('aboutStoryP1ArInput').value.trim(),
    story_p2_en: document.getElementById('aboutStoryP2En').value.trim(),
    story_p2_ar: document.getElementById('aboutStoryP2ArInput').value.trim(),
    story_image_url: document.getElementById('aboutStoryImageUrl').value.trim(),
    badge_num: document.getElementById('aboutBadgeNumInput').value.trim(),
    badge_label_en: document.getElementById('aboutBadgeLabelEn').value.trim(),
    badge_label_ar: document.getElementById('aboutBadgeLabelArInput').value.trim(),
    btn_contact_en: document.getElementById('aboutBtnContactEn').value.trim(),
    btn_contact_ar: document.getElementById('aboutBtnContactArInput').value.trim(),
    vision_tag_en: document.getElementById('aboutVisionTagEn').value.trim(),
    vision_tag_ar: document.getElementById('aboutVisionTagArInput').value.trim(),
    vision_title_en: document.getElementById('aboutVisionTitleEn').value.trim(),
    vision_title_ar: document.getElementById('aboutVisionTitleArInput').value.trim(),
    team_tag_en: document.getElementById('aboutTeamTagEn').value.trim(),
    team_tag_ar: document.getElementById('aboutTeamTagArInput').value.trim(),
    team_title_en: document.getElementById('aboutTeamTitleEn').value.trim(),
    team_title_ar: document.getElementById('aboutTeamTitleArInput').value.trim(),
    team_subtitle_en: document.getElementById('aboutTeamSubtitleEn').value.trim(),
    team_subtitle_ar: document.getElementById('aboutTeamSubtitleArInput').value.trim(),
    certs_tag_en: document.getElementById('aboutCertsTagEn').value.trim(),
    certs_tag_ar: document.getElementById('aboutCertsTagArInput').value.trim(),
    certs_title_en: document.getElementById('aboutCertsTitleEn').value.trim(),
    certs_title_ar: document.getElementById('aboutCertsTitleArInput').value.trim(),
  };

  let pageId = id;
  if (id) {
    const { error } = await supabaseClient.from('about_page').update(payload).eq('id', id);
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
  } else {
    const { data, error } = await supabaseClient.from('about_page').insert(payload).select('id').single();
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
    pageId = data.id;
    document.getElementById('aboutPageId').value = pageId;
  }

  const features = Array.from(document.querySelectorAll('#aboutFeaturesListEditor .about-feature-row'))
    .map((row, index) => ({
      text_en: row.querySelector('.feature-text-en').value.trim(),
      text_ar: row.querySelector('.feature-text-ar').value.trim(),
      display_order: index,
    }))
    .filter((f) => f.text_en && f.text_ar);

  const { error: delError } = await supabaseClient.from('about_features').delete().not('id', 'is', null);
  if (delError) {
    statusEl.style.color = '#e05252';
    statusEl.textContent = delError.message.includes('permission') ? "You don't have permission for this action." : delError.message;
    return;
  }

  if (features.length) {
    const { error: insError } = await supabaseClient.from('about_features').insert(features);
    if (insError) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = insError.message.includes('permission') ? "You don't have permission for this action." : insError.message;
      return;
    }
  }

  statusEl.style.color = '#2ecc71';
  statusEl.textContent = 'Saved ✓';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
}

let visionCardModalInstance = null;
let visionCardIconPicker = null;

async function loadVisionCards() {
  const tbody = document.getElementById('visionCardsTableBody');
  const { data, error } = await supabaseClient
    .from('about_vision_cards')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load cards.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No cards yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((c) => `
    <tr data-id="${c.id}">
      <td><i class="bi ${escapeHtml(c.icon)}" style="font-size:1.3rem;color:var(--primary);"></i></td>
      <td>${escapeHtml(c.title_en)}</td>
      <td dir="rtl">${escapeHtml(c.title_ar)}</td>
      <td>${c.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const card = data.find((c) => String(c.id) === String(id));
      if (card) openVisionCardModal(card);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this card? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('about_vision_cards').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadVisionCards();
    });
  });
}

function openVisionCardModal(card) {
  document.getElementById('visionCardModalTitle').textContent = card ? 'Edit Card' : 'Add Card';
  document.getElementById('visionCardId').value = card?.id || '';
  visionCardIconPicker.setIcon(card?.icon || 'bi-star');
  document.getElementById('visionCardTitleEn').value = card?.title_en || '';
  document.getElementById('visionCardTitleAr').value = card?.title_ar || '';
  document.getElementById('visionCardDescEn').value = card?.desc_en || '';
  document.getElementById('visionCardDescAr').value = card?.desc_ar || '';
  document.getElementById('visionCardDisplayOrder').value = card?.display_order ?? 0;
  document.getElementById('visionCardIsActive').checked = card ? !!card.is_active : true;
  visionCardModalInstance.show();
}

async function handleVisionCardFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('visionCardId').value;
  const payload = {
    icon: document.getElementById('visionCardIcon').value || 'bi-star',
    title_en: document.getElementById('visionCardTitleEn').value.trim(),
    title_ar: document.getElementById('visionCardTitleAr').value.trim(),
    desc_en: document.getElementById('visionCardDescEn').value.trim(),
    desc_ar: document.getElementById('visionCardDescAr').value.trim(),
    display_order: parseInt(document.getElementById('visionCardDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('visionCardIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('about_vision_cards').update(payload).eq('id', id)
    : await supabaseClient.from('about_vision_cards').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  visionCardModalInstance.hide();
  loadVisionCards();
}

let aboutStatModalInstance = null;

async function loadAboutStats() {
  const tbody = document.getElementById('aboutStatsTableBody');
  const { data, error } = await supabaseClient
    .from('about_stats')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load stats.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No stats yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((s) => `
    <tr data-id="${s.id}">
      <td>${escapeHtml(s.number)}${escapeHtml(s.suffix)}</td>
      <td>${escapeHtml(s.label_en)}</td>
      <td dir="rtl">${escapeHtml(s.label_ar)}</td>
      <td>${s.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const stat = data.find((s) => String(s.id) === String(id));
      if (stat) openAboutStatModal(stat);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this stat? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('about_stats').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadAboutStats();
    });
  });
}

function openAboutStatModal(stat) {
  document.getElementById('aboutStatModalTitle').textContent = stat ? 'Edit Stat' : 'Add Stat';
  document.getElementById('aboutStatId').value = stat?.id || '';
  document.getElementById('aboutStatNumber').value = stat?.number ?? '';
  document.getElementById('aboutStatSuffix').value = stat?.suffix || '+';
  document.getElementById('aboutStatLabelEn').value = stat?.label_en || '';
  document.getElementById('aboutStatLabelAr').value = stat?.label_ar || '';
  document.getElementById('aboutStatDisplayOrder').value = stat?.display_order ?? 0;
  document.getElementById('aboutStatIsActive').checked = stat ? !!stat.is_active : true;
  aboutStatModalInstance.show();
}

async function handleAboutStatFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('aboutStatId').value;
  const payload = {
    number: parseInt(document.getElementById('aboutStatNumber').value, 10) || 0,
    suffix: document.getElementById('aboutStatSuffix').value.trim() || '+',
    label_en: document.getElementById('aboutStatLabelEn').value.trim(),
    label_ar: document.getElementById('aboutStatLabelAr').value.trim(),
    display_order: parseInt(document.getElementById('aboutStatDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('aboutStatIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('about_stats').update(payload).eq('id', id)
    : await supabaseClient.from('about_stats').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  aboutStatModalInstance.hide();
  loadAboutStats();
}

let teamMemberModalInstance = null;

async function loadAboutTeam() {
  const tbody = document.getElementById('aboutTeamTableBody');
  const { data, error } = await supabaseClient
    .from('about_team')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Failed to load team.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No team members yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((m) => `
    <tr data-id="${m.id}">
      <td><img src="${escapeHtml(m.photo_url)}" alt="${escapeHtml(m.name_en)}" class="admin-table-thumb" /></td>
      <td>${escapeHtml(m.name_en)}</td>
      <td dir="rtl">${escapeHtml(m.name_ar)}</td>
      <td>${escapeHtml(m.role_en)}</td>
      <td>${m.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const member = data.find((m) => String(m.id) === String(id));
      if (member) openTeamMemberModal(member);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this team member? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('about_team').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadAboutTeam();
    });
  });
}

function openTeamMemberModal(member) {
  document.getElementById('teamMemberModalTitle').textContent = member ? 'Edit Team Member' : 'Add Team Member';
  document.getElementById('teamMemberId').value = member?.id || '';
  document.getElementById('teamMemberPhotoUrl').value = member?.photo_url || '';
  setImagePreview('teamMemberPhotoPreview', member?.photo_url);
  document.getElementById('teamMemberPhotoFile').value = '';
  document.getElementById('teamMemberPhotoUploadStatus').textContent = '';
  document.getElementById('teamMemberNameEn').value = member?.name_en || '';
  document.getElementById('teamMemberNameAr').value = member?.name_ar || '';
  document.getElementById('teamMemberRoleEn').value = member?.role_en || '';
  document.getElementById('teamMemberRoleAr').value = member?.role_ar || '';
  document.getElementById('teamMemberLinkUrl').value = member?.link_url || '';
  document.getElementById('teamMemberLinkLabelEn').value = member?.link_label_en || '';
  document.getElementById('teamMemberLinkLabelAr').value = member?.link_label_ar || '';
  document.getElementById('teamMemberDisplayOrder').value = member?.display_order ?? 0;
  document.getElementById('teamMemberIsActive').checked = member ? !!member.is_active : true;
  teamMemberModalInstance.show();
}

async function handleTeamMemberFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('teamMemberId').value;
  const payload = {
    photo_url: document.getElementById('teamMemberPhotoUrl').value.trim(),
    name_en: document.getElementById('teamMemberNameEn').value.trim(),
    name_ar: document.getElementById('teamMemberNameAr').value.trim(),
    role_en: document.getElementById('teamMemberRoleEn').value.trim(),
    role_ar: document.getElementById('teamMemberRoleAr').value.trim(),
    link_url: document.getElementById('teamMemberLinkUrl').value.trim(),
    link_label_en: document.getElementById('teamMemberLinkLabelEn').value.trim(),
    link_label_ar: document.getElementById('teamMemberLinkLabelAr').value.trim(),
    display_order: parseInt(document.getElementById('teamMemberDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('teamMemberIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('about_team').update(payload).eq('id', id)
    : await supabaseClient.from('about_team').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  teamMemberModalInstance.hide();
  loadAboutTeam();
}

let aboutCertModalInstance = null;

async function loadAboutCertifications() {
  const tbody = document.getElementById('aboutCertsTableBody');
  const { data, error } = await supabaseClient
    .from('about_certifications')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load certifications.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No certifications yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((c) => `
    <tr data-id="${c.id}">
      <td><img src="${escapeHtml(c.badge_url)}" alt="${escapeHtml(c.title_en)}" class="admin-table-thumb" /></td>
      <td>${escapeHtml(c.title_en)}</td>
      <td dir="rtl">${escapeHtml(c.title_ar)}</td>
      <td>${c.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const cert = data.find((c) => String(c.id) === String(id));
      if (cert) openAboutCertModal(cert);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this certification? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('about_certifications').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadAboutCertifications();
    });
  });
}

function openAboutCertModal(cert) {
  document.getElementById('aboutCertModalTitle').textContent = cert ? 'Edit Certification' : 'Add Certification';
  document.getElementById('aboutCertId').value = cert?.id || '';
  document.getElementById('aboutCertBadgeUrl').value = cert?.badge_url || '';
  setImagePreview('aboutCertBadgePreview', cert?.badge_url);
  document.getElementById('aboutCertBadgeFile').value = '';
  document.getElementById('aboutCertBadgeUploadStatus').textContent = '';
  document.getElementById('aboutCertTitleEn').value = cert?.title_en || '';
  document.getElementById('aboutCertTitleAr').value = cert?.title_ar || '';
  document.getElementById('aboutCertDescEn').value = cert?.desc_en || '';
  document.getElementById('aboutCertDescAr').value = cert?.desc_ar || '';
  document.getElementById('aboutCertDisplayOrder').value = cert?.display_order ?? 0;
  document.getElementById('aboutCertIsActive').checked = cert ? !!cert.is_active : true;
  aboutCertModalInstance.show();
}

async function handleAboutCertFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('aboutCertId').value;
  const payload = {
    badge_url: document.getElementById('aboutCertBadgeUrl').value.trim(),
    title_en: document.getElementById('aboutCertTitleEn').value.trim(),
    title_ar: document.getElementById('aboutCertTitleAr').value.trim(),
    desc_en: document.getElementById('aboutCertDescEn').value.trim(),
    desc_ar: document.getElementById('aboutCertDescAr').value.trim(),
    display_order: parseInt(document.getElementById('aboutCertDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('aboutCertIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('about_certifications').update(payload).eq('id', id)
    : await supabaseClient.from('about_certifications').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  aboutCertModalInstance.hide();
  loadAboutCertifications();
}

const CHAIRMAN_IMAGE_BUCKET = 'chairman-images';

async function uploadChairmanImage(file, statusEl, urlInput, previewEl) {
  statusEl.textContent = 'Uploading…';
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(CHAIRMAN_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(CHAIRMAN_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  previewEl.src = data.publicUrl;
  previewEl.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

async function loadChairmanPage() {
  const { data, error } = await supabaseClient.from('chairman_page').select('*').limit(1).maybeSingle();
  if (error) {
    showDashboardError(error.message);
    return;
  }

  document.getElementById('chairmanPageId').value = data?.id || '';
  document.getElementById('chairmanHeroTagEn').value = data?.hero_tag_en || '';
  document.getElementById('chairmanHeroTagArInput').value = data?.hero_tag_ar || '';
  document.getElementById('chairmanHeroTitleEn').value = data?.hero_title_en || '';
  document.getElementById('chairmanHeroTitleArInput').value = data?.hero_title_ar || '';
  document.getElementById('chairmanHeroSubtitleEn').value = data?.hero_subtitle_en || '';
  document.getElementById('chairmanHeroSubtitleArInput').value = data?.hero_subtitle_ar || '';
  document.getElementById('chairmanHeroImageUrl').value = data?.hero_image_url || '';
  setImagePreview('chairmanHeroImagePreview', data?.hero_image_url);

  document.getElementById('chairmanPhotoUrl').value = data?.photo_url || '';
  setImagePreview('chairmanPhotoPreview', data?.photo_url);
  document.getElementById('chairmanBadgeNumInput').value = data?.badge_num || '';
  document.getElementById('chairmanBadgeLabelEn').value = data?.badge_label_en || '';
  document.getElementById('chairmanBadgeLabelArInput').value = data?.badge_label_ar || '';
  document.getElementById('chairmanRoleEn').value = data?.role_en || '';
  document.getElementById('chairmanRoleArInput').value = data?.role_ar || '';
  document.getElementById('chairmanNameEn').value = data?.name_en || '';
  document.getElementById('chairmanNameArInput').value = data?.name_ar || '';
  document.getElementById('chairmanBtnContactEn').value = data?.btn_contact_en || '';
  document.getElementById('chairmanBtnContactArInput').value = data?.btn_contact_ar || '';
  document.getElementById('chairmanBtnAboutEn').value = data?.btn_about_en || '';
  document.getElementById('chairmanBtnAboutArInput').value = data?.btn_about_ar || '';

  document.getElementById('chairmanP1En').value = data?.p1_en || '';
  document.getElementById('chairmanP1ArInput').value = data?.p1_ar || '';
  document.getElementById('chairmanP2En').value = data?.p2_en || '';
  document.getElementById('chairmanP2ArInput').value = data?.p2_ar || '';
  document.getElementById('chairmanP3En').value = data?.p3_en || '';
  document.getElementById('chairmanP3ArInput').value = data?.p3_ar || '';
  document.getElementById('chairmanP4En').value = data?.p4_en || '';
  document.getElementById('chairmanP4ArInput').value = data?.p4_ar || '';

  document.getElementById('chairmanQuoteEn').value = data?.quote_en || '';
  document.getElementById('chairmanQuoteArInput').value = data?.quote_ar || '';
  document.getElementById('chairmanQuoteAttributionEn').value = data?.quote_attribution_en || '';
  document.getElementById('chairmanQuoteAttributionArInput').value = data?.quote_attribution_ar || '';
}

async function handleChairmanPageFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('chairmanPageId').value;
  const statusEl = document.getElementById('chairmanPageStatus');
  statusEl.style.color = '';
  statusEl.textContent = 'Saving…';

  const payload = {
    hero_tag_en: document.getElementById('chairmanHeroTagEn').value.trim(),
    hero_tag_ar: document.getElementById('chairmanHeroTagArInput').value.trim(),
    hero_title_en: document.getElementById('chairmanHeroTitleEn').value.trim(),
    hero_title_ar: document.getElementById('chairmanHeroTitleArInput').value.trim(),
    hero_subtitle_en: document.getElementById('chairmanHeroSubtitleEn').value.trim(),
    hero_subtitle_ar: document.getElementById('chairmanHeroSubtitleArInput').value.trim(),
    hero_image_url: document.getElementById('chairmanHeroImageUrl').value.trim(),
    photo_url: document.getElementById('chairmanPhotoUrl').value.trim(),
    badge_num: document.getElementById('chairmanBadgeNumInput').value.trim(),
    badge_label_en: document.getElementById('chairmanBadgeLabelEn').value.trim(),
    badge_label_ar: document.getElementById('chairmanBadgeLabelArInput').value.trim(),
    role_en: document.getElementById('chairmanRoleEn').value.trim(),
    role_ar: document.getElementById('chairmanRoleArInput').value.trim(),
    name_en: document.getElementById('chairmanNameEn').value.trim(),
    name_ar: document.getElementById('chairmanNameArInput').value.trim(),
    btn_contact_en: document.getElementById('chairmanBtnContactEn').value.trim(),
    btn_contact_ar: document.getElementById('chairmanBtnContactArInput').value.trim(),
    btn_about_en: document.getElementById('chairmanBtnAboutEn').value.trim(),
    btn_about_ar: document.getElementById('chairmanBtnAboutArInput').value.trim(),
    p1_en: document.getElementById('chairmanP1En').value.trim(),
    p1_ar: document.getElementById('chairmanP1ArInput').value.trim(),
    p2_en: document.getElementById('chairmanP2En').value.trim(),
    p2_ar: document.getElementById('chairmanP2ArInput').value.trim(),
    p3_en: document.getElementById('chairmanP3En').value.trim(),
    p3_ar: document.getElementById('chairmanP3ArInput').value.trim(),
    p4_en: document.getElementById('chairmanP4En').value.trim(),
    p4_ar: document.getElementById('chairmanP4ArInput').value.trim(),
    quote_en: document.getElementById('chairmanQuoteEn').value.trim(),
    quote_ar: document.getElementById('chairmanQuoteArInput').value.trim(),
    quote_attribution_en: document.getElementById('chairmanQuoteAttributionEn').value.trim(),
    quote_attribution_ar: document.getElementById('chairmanQuoteAttributionArInput').value.trim(),
  };

  let pageId = id;
  if (id) {
    const { error } = await supabaseClient.from('chairman_page').update(payload).eq('id', id);
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
  } else {
    const { data, error } = await supabaseClient.from('chairman_page').insert(payload).select('id').single();
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
    pageId = data.id;
    document.getElementById('chairmanPageId').value = pageId;
  }

  statusEl.style.color = '#2ecc71';
  statusEl.textContent = 'Saved ✓';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
}

const INVESTMENT_IMAGE_BUCKET = 'investment-images';

async function uploadInvestmentImage(file, statusEl, urlInput, previewEl) {
  statusEl.textContent = 'Uploading…';
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(INVESTMENT_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(INVESTMENT_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  previewEl.src = data.publicUrl;
  previewEl.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

function addInvestmentFeatureRow(feature) {
  const list = document.getElementById('investmentFeaturesListEditor');
  const row = document.createElement('div');
  row.className = 'row g-2 align-items-center investment-feature-row';
  row.style.marginBottom = '8px';
  row.innerHTML = `
    <div class="col-5"><input type="text" class="form-control-custom feature-text-en" placeholder="Feature (English)" /></div>
    <div class="col-5"><input type="text" class="form-control-custom feature-text-ar" dir="rtl" placeholder="النص (عربي)" /></div>
    <div class="col-auto"><button type="button" class="btn-icon btn-icon-danger remove-feature-btn" title="Remove"><i class="bi bi-trash"></i></button></div>
  `;
  row.querySelector('.feature-text-en').value = feature?.text_en || '';
  row.querySelector('.feature-text-ar').value = feature?.text_ar || '';
  row.querySelector('.remove-feature-btn').addEventListener('click', () => row.remove());
  list.appendChild(row);
}

async function loadInvestmentPage() {
  const { data, error } = await supabaseClient.from('investment_page').select('*').limit(1).maybeSingle();
  if (error) {
    showDashboardError(error.message);
    return;
  }

  document.getElementById('investmentPageId').value = data?.id || '';
  document.getElementById('investmentHeroTagEn').value = data?.hero_tag_en || '';
  document.getElementById('investmentHeroTagArInput').value = data?.hero_tag_ar || '';
  document.getElementById('investmentHeroTitleEn').value = data?.hero_title_en || '';
  document.getElementById('investmentHeroTitleArInput').value = data?.hero_title_ar || '';
  document.getElementById('investmentHeroSubEn').value = data?.hero_sub_en || '';
  document.getElementById('investmentHeroSubArInput').value = data?.hero_sub_ar || '';

  document.getElementById('investmentIntroTagEn').value = data?.intro_tag_en || '';
  document.getElementById('investmentIntroTagArInput').value = data?.intro_tag_ar || '';
  document.getElementById('investmentIntroTitleEn').value = data?.intro_title_en || '';
  document.getElementById('investmentIntroTitleArInput').value = data?.intro_title_ar || '';
  document.getElementById('investmentIntroP1En').value = data?.intro_p1_en || '';
  document.getElementById('investmentIntroP1ArInput').value = data?.intro_p1_ar || '';
  document.getElementById('investmentIntroImageUrl').value = data?.intro_image_url || '';
  setImagePreview('investmentIntroImagePreview', data?.intro_image_url);

  document.getElementById('investmentSectorsTagEn').value = data?.sectors_tag_en || '';
  document.getElementById('investmentSectorsTagArInput').value = data?.sectors_tag_ar || '';
  document.getElementById('investmentSectorsTitleEn').value = data?.sectors_title_en || '';
  document.getElementById('investmentSectorsTitleArInput').value = data?.sectors_title_ar || '';
  document.getElementById('investmentProcessTagEn').value = data?.process_tag_en || '';
  document.getElementById('investmentProcessTagArInput').value = data?.process_tag_ar || '';
  document.getElementById('investmentProcessTitleEn').value = data?.process_title_en || '';
  document.getElementById('investmentProcessTitleArInput').value = data?.process_title_ar || '';

  document.getElementById('investmentCtaTitleEn').value = data?.cta_title_en || '';
  document.getElementById('investmentCtaTitleArInput').value = data?.cta_title_ar || '';
  document.getElementById('investmentCtaDescEn').value = data?.cta_desc_en || '';
  document.getElementById('investmentCtaDescArInput').value = data?.cta_desc_ar || '';
  document.getElementById('investmentCtaBtnEn').value = data?.cta_btn_en || '';
  document.getElementById('investmentCtaBtnArInput').value = data?.cta_btn_ar || '';

  document.getElementById('investmentFeaturesListEditor').innerHTML = '';
  const { data: features, error: featError } = await supabaseClient
    .from('investment_features')
    .select('*')
    .order('display_order', { ascending: true });
  if (!featError && features) features.forEach((f) => addInvestmentFeatureRow(f));
}

async function handleInvestmentPageFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('investmentPageId').value;
  const statusEl = document.getElementById('investmentPageStatus');
  statusEl.style.color = '';
  statusEl.textContent = 'Saving…';

  const payload = {
    hero_tag_en: document.getElementById('investmentHeroTagEn').value.trim(),
    hero_tag_ar: document.getElementById('investmentHeroTagArInput').value.trim(),
    hero_title_en: document.getElementById('investmentHeroTitleEn').value.trim(),
    hero_title_ar: document.getElementById('investmentHeroTitleArInput').value.trim(),
    hero_sub_en: document.getElementById('investmentHeroSubEn').value.trim(),
    hero_sub_ar: document.getElementById('investmentHeroSubArInput').value.trim(),
    intro_tag_en: document.getElementById('investmentIntroTagEn').value.trim(),
    intro_tag_ar: document.getElementById('investmentIntroTagArInput').value.trim(),
    intro_title_en: document.getElementById('investmentIntroTitleEn').value.trim(),
    intro_title_ar: document.getElementById('investmentIntroTitleArInput').value.trim(),
    intro_p1_en: document.getElementById('investmentIntroP1En').value.trim(),
    intro_p1_ar: document.getElementById('investmentIntroP1ArInput').value.trim(),
    intro_image_url: document.getElementById('investmentIntroImageUrl').value.trim(),
    sectors_tag_en: document.getElementById('investmentSectorsTagEn').value.trim(),
    sectors_tag_ar: document.getElementById('investmentSectorsTagArInput').value.trim(),
    sectors_title_en: document.getElementById('investmentSectorsTitleEn').value.trim(),
    sectors_title_ar: document.getElementById('investmentSectorsTitleArInput').value.trim(),
    process_tag_en: document.getElementById('investmentProcessTagEn').value.trim(),
    process_tag_ar: document.getElementById('investmentProcessTagArInput').value.trim(),
    process_title_en: document.getElementById('investmentProcessTitleEn').value.trim(),
    process_title_ar: document.getElementById('investmentProcessTitleArInput').value.trim(),
    cta_title_en: document.getElementById('investmentCtaTitleEn').value.trim(),
    cta_title_ar: document.getElementById('investmentCtaTitleArInput').value.trim(),
    cta_desc_en: document.getElementById('investmentCtaDescEn').value.trim(),
    cta_desc_ar: document.getElementById('investmentCtaDescArInput').value.trim(),
    cta_btn_en: document.getElementById('investmentCtaBtnEn').value.trim(),
    cta_btn_ar: document.getElementById('investmentCtaBtnArInput').value.trim(),
  };

  let pageId = id;
  if (id) {
    const { error } = await supabaseClient.from('investment_page').update(payload).eq('id', id);
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
  } else {
    const { data, error } = await supabaseClient.from('investment_page').insert(payload).select('id').single();
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
    pageId = data.id;
    document.getElementById('investmentPageId').value = pageId;
  }

  const features = Array.from(document.querySelectorAll('#investmentFeaturesListEditor .investment-feature-row'))
    .map((row, index) => ({
      text_en: row.querySelector('.feature-text-en').value.trim(),
      text_ar: row.querySelector('.feature-text-ar').value.trim(),
      display_order: index,
    }))
    .filter((f) => f.text_en && f.text_ar);

  const { error: delError } = await supabaseClient.from('investment_features').delete().not('id', 'is', null);
  if (delError) {
    statusEl.style.color = '#e05252';
    statusEl.textContent = delError.message.includes('permission') ? "You don't have permission for this action." : delError.message;
    return;
  }

  if (features.length) {
    const { error: insError } = await supabaseClient.from('investment_features').insert(features);
    if (insError) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = insError.message.includes('permission') ? "You don't have permission for this action." : insError.message;
      return;
    }
  }

  statusEl.style.color = '#2ecc71';
  statusEl.textContent = 'Saved ✓';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
}

let investmentSectorModalInstance = null;
let investmentSectorIconPicker = null;

async function loadInvestmentSectors() {
  const tbody = document.getElementById('investmentSectorsTableBody');
  const { data, error } = await supabaseClient
    .from('investment_sectors')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load sectors.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No sectors yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((s) => `
    <tr data-id="${s.id}">
      <td><i class="bi ${escapeHtml(s.icon)}" style="font-size:1.3rem;color:var(--primary);"></i></td>
      <td>${escapeHtml(s.title_en)}</td>
      <td dir="rtl">${escapeHtml(s.title_ar)}</td>
      <td>${s.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const sector = data.find((s) => String(s.id) === String(id));
      if (sector) openInvestmentSectorModal(sector);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this sector? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('investment_sectors').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadInvestmentSectors();
    });
  });
}

function openInvestmentSectorModal(sector) {
  document.getElementById('investmentSectorModalTitle').textContent = sector ? 'Edit Sector' : 'Add Sector';
  document.getElementById('investmentSectorId').value = sector?.id || '';
  investmentSectorIconPicker.setIcon(sector?.icon || 'bi-graph-up-arrow');
  document.getElementById('investmentSectorTitleEn').value = sector?.title_en || '';
  document.getElementById('investmentSectorTitleAr').value = sector?.title_ar || '';
  document.getElementById('investmentSectorDescEn').value = sector?.desc_en || '';
  document.getElementById('investmentSectorDescAr').value = sector?.desc_ar || '';
  document.getElementById('investmentSectorDisplayOrder').value = sector?.display_order ?? 0;
  document.getElementById('investmentSectorIsActive').checked = sector ? !!sector.is_active : true;
  investmentSectorModalInstance.show();
}

async function handleInvestmentSectorFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('investmentSectorId').value;
  const payload = {
    icon: document.getElementById('investmentSectorIcon').value || 'bi-graph-up-arrow',
    title_en: document.getElementById('investmentSectorTitleEn').value.trim(),
    title_ar: document.getElementById('investmentSectorTitleAr').value.trim(),
    desc_en: document.getElementById('investmentSectorDescEn').value.trim(),
    desc_ar: document.getElementById('investmentSectorDescAr').value.trim(),
    display_order: parseInt(document.getElementById('investmentSectorDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('investmentSectorIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('investment_sectors').update(payload).eq('id', id)
    : await supabaseClient.from('investment_sectors').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  investmentSectorModalInstance.hide();
  loadInvestmentSectors();
}

let investmentStepModalInstance = null;

async function loadInvestmentSteps() {
  const tbody = document.getElementById('investmentStepsTableBody');
  const { data, error } = await supabaseClient
    .from('investment_steps')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load steps.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No steps yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((s) => `
    <tr data-id="${s.id}">
      <td>${escapeHtml(s.step_number)}</td>
      <td>${escapeHtml(s.title_en)}</td>
      <td dir="rtl">${escapeHtml(s.title_ar)}</td>
      <td>${s.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const step = data.find((s) => String(s.id) === String(id));
      if (step) openInvestmentStepModal(step);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this step? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('investment_steps').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadInvestmentSteps();
    });
  });
}

function openInvestmentStepModal(step) {
  document.getElementById('investmentStepModalTitle').textContent = step ? 'Edit Step' : 'Add Step';
  document.getElementById('investmentStepId').value = step?.id || '';
  document.getElementById('investmentStepNumber').value = step?.step_number || '';
  document.getElementById('investmentStepTitleEn').value = step?.title_en || '';
  document.getElementById('investmentStepTitleAr').value = step?.title_ar || '';
  document.getElementById('investmentStepDescEn').value = step?.desc_en || '';
  document.getElementById('investmentStepDescAr').value = step?.desc_ar || '';
  document.getElementById('investmentStepDisplayOrder').value = step?.display_order ?? 0;
  document.getElementById('investmentStepIsActive').checked = step ? !!step.is_active : true;
  investmentStepModalInstance.show();
}

async function handleInvestmentStepFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('investmentStepId').value;
  const payload = {
    step_number: document.getElementById('investmentStepNumber').value.trim() || '01',
    title_en: document.getElementById('investmentStepTitleEn').value.trim(),
    title_ar: document.getElementById('investmentStepTitleAr').value.trim(),
    desc_en: document.getElementById('investmentStepDescEn').value.trim(),
    desc_ar: document.getElementById('investmentStepDescAr').value.trim(),
    display_order: parseInt(document.getElementById('investmentStepDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('investmentStepIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('investment_steps').update(payload).eq('id', id)
    : await supabaseClient.from('investment_steps').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  investmentStepModalInstance.hide();
  loadInvestmentSteps();
}

const LOGISTICS_IMAGE_BUCKET = 'logistics-images';

async function uploadLogisticsImage(file, statusEl, urlInput, previewEl) {
  statusEl.textContent = 'Uploading…';
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(LOGISTICS_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(LOGISTICS_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  previewEl.src = data.publicUrl;
  previewEl.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

async function loadLogisticsPage() {
  const { data, error } = await supabaseClient.from('logistics_page').select('*').limit(1).maybeSingle();
  if (error) {
    showDashboardError(error.message);
    return;
  }

  document.getElementById('logisticsPageId').value = data?.id || '';
  document.getElementById('logisticsHeroTagEn').value = data?.hero_tag_en || '';
  document.getElementById('logisticsHeroTagArInput').value = data?.hero_tag_ar || '';
  document.getElementById('logisticsHeroTitleEn').value = data?.hero_title_en || '';
  document.getElementById('logisticsHeroTitleArInput').value = data?.hero_title_ar || '';
  document.getElementById('logisticsHeroSubEn').value = data?.hero_sub_en || '';
  document.getElementById('logisticsHeroSubArInput').value = data?.hero_sub_ar || '';
  document.getElementById('logisticsHeroImageUrl').value = data?.hero_image_url || '';
  setImagePreview('logisticsHeroImagePreview', data?.hero_image_url);

  document.getElementById('logisticsBadgeEn').value = data?.badge_en || '';
  document.getElementById('logisticsBadgeArInput').value = data?.badge_ar || '';
  document.getElementById('logisticsIntroTagEn').value = data?.intro_tag_en || '';
  document.getElementById('logisticsIntroTagArInput').value = data?.intro_tag_ar || '';
  document.getElementById('logisticsIntroTitleEn').value = data?.intro_title_en || '';
  document.getElementById('logisticsIntroTitleArInput').value = data?.intro_title_ar || '';
  document.getElementById('logisticsIntroDescEn').value = data?.intro_desc_en || '';
  document.getElementById('logisticsIntroDescArInput').value = data?.intro_desc_ar || '';
  document.getElementById('logisticsIntroImageUrl').value = data?.intro_image_url || '';
  setImagePreview('logisticsIntroImagePreview', data?.intro_image_url);

  document.getElementById('logisticsTrackTagEn').value = data?.track_tag_en || '';
  document.getElementById('logisticsTrackTagArInput').value = data?.track_tag_ar || '';
  document.getElementById('logisticsTrackTitleEn').value = data?.track_title_en || '';
  document.getElementById('logisticsTrackTitleArInput').value = data?.track_title_ar || '';
  document.getElementById('logisticsTrackSubEn').value = data?.track_sub_en || '';
  document.getElementById('logisticsTrackSubArInput').value = data?.track_sub_ar || '';
  document.getElementById('logisticsTrackPlaceholderEn').value = data?.track_placeholder_en || '';
  document.getElementById('logisticsTrackPlaceholderArInput').value = data?.track_placeholder_ar || '';
  document.getElementById('logisticsTrackBtnEn').value = data?.track_btn_en || '';
  document.getElementById('logisticsTrackBtnArInput').value = data?.track_btn_ar || '';
}

async function handleLogisticsPageFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('logisticsPageId').value;
  const statusEl = document.getElementById('logisticsPageStatus');
  statusEl.style.color = '';
  statusEl.textContent = 'Saving…';

  const payload = {
    hero_tag_en: document.getElementById('logisticsHeroTagEn').value.trim(),
    hero_tag_ar: document.getElementById('logisticsHeroTagArInput').value.trim(),
    hero_title_en: document.getElementById('logisticsHeroTitleEn').value.trim(),
    hero_title_ar: document.getElementById('logisticsHeroTitleArInput').value.trim(),
    hero_sub_en: document.getElementById('logisticsHeroSubEn').value.trim(),
    hero_sub_ar: document.getElementById('logisticsHeroSubArInput').value.trim(),
    hero_image_url: document.getElementById('logisticsHeroImageUrl').value.trim(),
    badge_en: document.getElementById('logisticsBadgeEn').value.trim(),
    badge_ar: document.getElementById('logisticsBadgeArInput').value.trim(),
    intro_tag_en: document.getElementById('logisticsIntroTagEn').value.trim(),
    intro_tag_ar: document.getElementById('logisticsIntroTagArInput').value.trim(),
    intro_title_en: document.getElementById('logisticsIntroTitleEn').value.trim(),
    intro_title_ar: document.getElementById('logisticsIntroTitleArInput').value.trim(),
    intro_desc_en: document.getElementById('logisticsIntroDescEn').value.trim(),
    intro_desc_ar: document.getElementById('logisticsIntroDescArInput').value.trim(),
    intro_image_url: document.getElementById('logisticsIntroImageUrl').value.trim(),
    track_tag_en: document.getElementById('logisticsTrackTagEn').value.trim(),
    track_tag_ar: document.getElementById('logisticsTrackTagArInput').value.trim(),
    track_title_en: document.getElementById('logisticsTrackTitleEn').value.trim(),
    track_title_ar: document.getElementById('logisticsTrackTitleArInput').value.trim(),
    track_sub_en: document.getElementById('logisticsTrackSubEn').value.trim(),
    track_sub_ar: document.getElementById('logisticsTrackSubArInput').value.trim(),
    track_placeholder_en: document.getElementById('logisticsTrackPlaceholderEn').value.trim(),
    track_placeholder_ar: document.getElementById('logisticsTrackPlaceholderArInput').value.trim(),
    track_btn_en: document.getElementById('logisticsTrackBtnEn').value.trim(),
    track_btn_ar: document.getElementById('logisticsTrackBtnArInput').value.trim(),
  };

  let pageId = id;
  if (id) {
    const { error } = await supabaseClient.from('logistics_page').update(payload).eq('id', id);
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
  } else {
    const { data, error } = await supabaseClient.from('logistics_page').insert(payload).select('id').single();
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
    pageId = data.id;
    document.getElementById('logisticsPageId').value = pageId;
  }

  statusEl.style.color = '#2ecc71';
  statusEl.textContent = 'Saved ✓';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
}

let logisticsServiceModalInstance = null;
let logisticsServiceIconPicker = null;

async function loadLogisticsServices() {
  const tbody = document.getElementById('logisticsServicesTableBody');
  const { data, error } = await supabaseClient
    .from('logistics_services')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load services.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No services yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((s) => `
    <tr data-id="${s.id}">
      <td><i class="bi ${escapeHtml(s.icon)}" style="font-size:1.3rem;color:var(--primary);"></i></td>
      <td>${escapeHtml(s.title_en)}</td>
      <td dir="rtl">${escapeHtml(s.title_ar)}</td>
      <td>${s.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const service = data.find((s) => String(s.id) === String(id));
      if (service) openLogisticsServiceModal(service);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this service? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('logistics_services').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadLogisticsServices();
    });
  });
}

function openLogisticsServiceModal(service) {
  document.getElementById('logisticsServiceModalTitle').textContent = service ? 'Edit Service' : 'Add Service';
  document.getElementById('logisticsServiceId').value = service?.id || '';
  logisticsServiceIconPicker.setIcon(service?.icon || 'bi-truck');
  document.getElementById('logisticsServiceTitleEn').value = service?.title_en || '';
  document.getElementById('logisticsServiceTitleAr').value = service?.title_ar || '';
  document.getElementById('logisticsServiceDescEn').value = service?.desc_en || '';
  document.getElementById('logisticsServiceDescAr').value = service?.desc_ar || '';
  document.getElementById('logisticsServiceDisplayOrder').value = service?.display_order ?? 0;
  document.getElementById('logisticsServiceIsActive').checked = service ? !!service.is_active : true;
  logisticsServiceModalInstance.show();
}

async function handleLogisticsServiceFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('logisticsServiceId').value;
  const payload = {
    icon: document.getElementById('logisticsServiceIcon').value || 'bi-truck',
    title_en: document.getElementById('logisticsServiceTitleEn').value.trim(),
    title_ar: document.getElementById('logisticsServiceTitleAr').value.trim(),
    desc_en: document.getElementById('logisticsServiceDescEn').value.trim(),
    desc_ar: document.getElementById('logisticsServiceDescAr').value.trim(),
    display_order: parseInt(document.getElementById('logisticsServiceDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('logisticsServiceIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('logistics_services').update(payload).eq('id', id)
    : await supabaseClient.from('logistics_services').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  logisticsServiceModalInstance.hide();
  loadLogisticsServices();
}

let logisticsStatModalInstance = null;

async function loadLogisticsStats() {
  const tbody = document.getElementById('logisticsStatsTableBody');
  const { data, error } = await supabaseClient
    .from('logistics_stats')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load stats.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No stats yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((s) => `
    <tr data-id="${s.id}">
      <td>${escapeHtml(s.number)}${escapeHtml(s.suffix)}</td>
      <td>${escapeHtml(s.label_en)}</td>
      <td dir="rtl">${escapeHtml(s.label_ar)}</td>
      <td>${s.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const stat = data.find((s) => String(s.id) === String(id));
      if (stat) openLogisticsStatModal(stat);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this stat? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('logistics_stats').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadLogisticsStats();
    });
  });
}

function openLogisticsStatModal(stat) {
  document.getElementById('logisticsStatModalTitle').textContent = stat ? 'Edit Stat' : 'Add Stat';
  document.getElementById('logisticsStatId').value = stat?.id || '';
  document.getElementById('logisticsStatNumber').value = stat?.number ?? '';
  document.getElementById('logisticsStatSuffix').value = stat?.suffix || '+';
  document.getElementById('logisticsStatLabelEn').value = stat?.label_en || '';
  document.getElementById('logisticsStatLabelAr').value = stat?.label_ar || '';
  document.getElementById('logisticsStatDisplayOrder').value = stat?.display_order ?? 0;
  document.getElementById('logisticsStatIsActive').checked = stat ? !!stat.is_active : true;
  logisticsStatModalInstance.show();
}

async function handleLogisticsStatFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('logisticsStatId').value;
  const payload = {
    number: parseInt(document.getElementById('logisticsStatNumber').value, 10) || 0,
    suffix: document.getElementById('logisticsStatSuffix').value.trim() || '+',
    label_en: document.getElementById('logisticsStatLabelEn').value.trim(),
    label_ar: document.getElementById('logisticsStatLabelAr').value.trim(),
    display_order: parseInt(document.getElementById('logisticsStatDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('logisticsStatIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('logistics_stats').update(payload).eq('id', id)
    : await supabaseClient.from('logistics_stats').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  logisticsStatModalInstance.hide();
  loadLogisticsStats();
}

const AVIATION_IMAGE_BUCKET = 'aviation-images';

async function uploadAviationImage(file, statusEl, urlInput, previewEl) {
  statusEl.textContent = 'Uploading…';
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(AVIATION_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(AVIATION_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  previewEl.src = data.publicUrl;
  previewEl.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

async function loadAviationPage() {
  const { data, error } = await supabaseClient.from('aviation_page').select('*').limit(1).maybeSingle();
  if (error) {
    showDashboardError(error.message);
    return;
  }

  document.getElementById('aviationPageId').value = data?.id || '';
  document.getElementById('aviationHeroTagEn').value = data?.hero_tag_en || '';
  document.getElementById('aviationHeroTagArInput').value = data?.hero_tag_ar || '';
  document.getElementById('aviationHeroTitleEn').value = data?.hero_title_en || '';
  document.getElementById('aviationHeroTitleArInput').value = data?.hero_title_ar || '';
  document.getElementById('aviationHeroSubEn').value = data?.hero_sub_en || '';
  document.getElementById('aviationHeroSubArInput').value = data?.hero_sub_ar || '';
  document.getElementById('aviationHeroImageUrl').value = data?.hero_image_url || '';
  setImagePreview('aviationHeroImagePreview', data?.hero_image_url);

  document.getElementById('aviationIntroTagEn').value = data?.intro_tag_en || '';
  document.getElementById('aviationIntroTagArInput').value = data?.intro_tag_ar || '';
  document.getElementById('aviationIntroTitleEn').value = data?.intro_title_en || '';
  document.getElementById('aviationIntroTitleArInput').value = data?.intro_title_ar || '';

  document.getElementById('aviationActivitiesTagEn').value = data?.activities_tag_en || '';
  document.getElementById('aviationActivitiesTagArInput').value = data?.activities_tag_ar || '';
  document.getElementById('aviationActivitiesTitleEn').value = data?.activities_title_en || '';
  document.getElementById('aviationActivitiesTitleArInput').value = data?.activities_title_ar || '';

  document.getElementById('aviationGalleryTagEn').value = data?.gallery_tag_en || '';
  document.getElementById('aviationGalleryTagArInput').value = data?.gallery_tag_ar || '';
  document.getElementById('aviationGalleryTitleEn').value = data?.gallery_title_en || '';
  document.getElementById('aviationGalleryTitleArInput').value = data?.gallery_title_ar || '';
}

async function handleAviationPageFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('aviationPageId').value;
  const statusEl = document.getElementById('aviationPageStatus');
  statusEl.style.color = '';
  statusEl.textContent = 'Saving…';

  const payload = {
    hero_tag_en: document.getElementById('aviationHeroTagEn').value.trim(),
    hero_tag_ar: document.getElementById('aviationHeroTagArInput').value.trim(),
    hero_title_en: document.getElementById('aviationHeroTitleEn').value.trim(),
    hero_title_ar: document.getElementById('aviationHeroTitleArInput').value.trim(),
    hero_sub_en: document.getElementById('aviationHeroSubEn').value.trim(),
    hero_sub_ar: document.getElementById('aviationHeroSubArInput').value.trim(),
    hero_image_url: document.getElementById('aviationHeroImageUrl').value.trim(),
    intro_tag_en: document.getElementById('aviationIntroTagEn').value.trim(),
    intro_tag_ar: document.getElementById('aviationIntroTagArInput').value.trim(),
    intro_title_en: document.getElementById('aviationIntroTitleEn').value.trim(),
    intro_title_ar: document.getElementById('aviationIntroTitleArInput').value.trim(),
    activities_tag_en: document.getElementById('aviationActivitiesTagEn').value.trim(),
    activities_tag_ar: document.getElementById('aviationActivitiesTagArInput').value.trim(),
    activities_title_en: document.getElementById('aviationActivitiesTitleEn').value.trim(),
    activities_title_ar: document.getElementById('aviationActivitiesTitleArInput').value.trim(),
    gallery_tag_en: document.getElementById('aviationGalleryTagEn').value.trim(),
    gallery_tag_ar: document.getElementById('aviationGalleryTagArInput').value.trim(),
    gallery_title_en: document.getElementById('aviationGalleryTitleEn').value.trim(),
    gallery_title_ar: document.getElementById('aviationGalleryTitleArInput').value.trim(),
  };

  let pageId = id;
  if (id) {
    const { error } = await supabaseClient.from('aviation_page').update(payload).eq('id', id);
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
  } else {
    const { data, error } = await supabaseClient.from('aviation_page').insert(payload).select('id').single();
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
    pageId = data.id;
    document.getElementById('aviationPageId').value = pageId;
  }

  statusEl.style.color = '#2ecc71';
  statusEl.textContent = 'Saved ✓';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
}

let aviationVisionCardModalInstance = null;
let aviationVisionCardIconPicker = null;

async function loadAviationVisionCards() {
  const tbody = document.getElementById('aviationVisionCardsTableBody');
  const { data, error } = await supabaseClient
    .from('aviation_vision_cards')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load cards.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No cards yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((c) => `
    <tr data-id="${c.id}">
      <td><i class="bi ${escapeHtml(c.icon)}" style="font-size:1.3rem;color:var(--primary);"></i></td>
      <td>${escapeHtml(c.title_en)}</td>
      <td dir="rtl">${escapeHtml(c.title_ar)}</td>
      <td>${c.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const card = data.find((c) => String(c.id) === String(id));
      if (card) openAviationVisionCardModal(card);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this card? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('aviation_vision_cards').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadAviationVisionCards();
    });
  });
}

function openAviationVisionCardModal(card) {
  document.getElementById('aviationVisionCardModalTitle').textContent = card ? 'Edit Card' : 'Add Card';
  document.getElementById('aviationVisionCardId').value = card?.id || '';
  aviationVisionCardIconPicker.setIcon(card?.icon || 'bi-eye');
  document.getElementById('aviationVisionCardTitleEn').value = card?.title_en || '';
  document.getElementById('aviationVisionCardTitleAr').value = card?.title_ar || '';
  document.getElementById('aviationVisionCardDescEn').value = card?.desc_en || '';
  document.getElementById('aviationVisionCardDescAr').value = card?.desc_ar || '';
  document.getElementById('aviationVisionCardDisplayOrder').value = card?.display_order ?? 0;
  document.getElementById('aviationVisionCardIsActive').checked = card ? !!card.is_active : true;
  aviationVisionCardModalInstance.show();
}

async function handleAviationVisionCardFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('aviationVisionCardId').value;
  const payload = {
    icon: document.getElementById('aviationVisionCardIcon').value || 'bi-eye',
    title_en: document.getElementById('aviationVisionCardTitleEn').value.trim(),
    title_ar: document.getElementById('aviationVisionCardTitleAr').value.trim(),
    desc_en: document.getElementById('aviationVisionCardDescEn').value.trim(),
    desc_ar: document.getElementById('aviationVisionCardDescAr').value.trim(),
    display_order: parseInt(document.getElementById('aviationVisionCardDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('aviationVisionCardIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('aviation_vision_cards').update(payload).eq('id', id)
    : await supabaseClient.from('aviation_vision_cards').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  aviationVisionCardModalInstance.hide();
  loadAviationVisionCards();
}

let aviationActivityModalInstance = null;

async function loadAviationActivities() {
  const tbody = document.getElementById('aviationActivitiesTableBody');
  const { data, error } = await supabaseClient
    .from('aviation_activities')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Failed to load activities.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4">No activities yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((a) => `
    <tr data-id="${a.id}">
      <td>${escapeHtml(a.text_en)}</td>
      <td dir="rtl">${escapeHtml(a.text_ar)}</td>
      <td>${a.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const activity = data.find((a) => String(a.id) === String(id));
      if (activity) openAviationActivityModal(activity);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this activity? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('aviation_activities').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadAviationActivities();
    });
  });
}

function openAviationActivityModal(activity) {
  document.getElementById('aviationActivityModalTitle').textContent = activity ? 'Edit Activity' : 'Add Activity';
  document.getElementById('aviationActivityId').value = activity?.id || '';
  document.getElementById('aviationActivityTextEn').value = activity?.text_en || '';
  document.getElementById('aviationActivityTextAr').value = activity?.text_ar || '';
  document.getElementById('aviationActivityDisplayOrder').value = activity?.display_order ?? 0;
  document.getElementById('aviationActivityIsActive').checked = activity ? !!activity.is_active : true;
  aviationActivityModalInstance.show();
}

async function handleAviationActivityFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('aviationActivityId').value;
  const payload = {
    text_en: document.getElementById('aviationActivityTextEn').value.trim(),
    text_ar: document.getElementById('aviationActivityTextAr').value.trim(),
    display_order: parseInt(document.getElementById('aviationActivityDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('aviationActivityIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('aviation_activities').update(payload).eq('id', id)
    : await supabaseClient.from('aviation_activities').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  aviationActivityModalInstance.hide();
  loadAviationActivities();
}

const MEDIA_IMAGE_BUCKET = 'media-images';

async function uploadMediaImage(file, statusEl, urlInput, previewEl) {
  statusEl.textContent = 'Uploading…';
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(MEDIA_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(MEDIA_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  previewEl.src = data.publicUrl;
  previewEl.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

async function loadMediaPage() {
  const { data, error } = await supabaseClient.from('media_page').select('*').limit(1).maybeSingle();
  if (error) {
    showDashboardError(error.message);
    return;
  }

  document.getElementById('mediaPageId').value = data?.id || '';
  document.getElementById('mediaHeroTagEn').value = data?.hero_tag_en || '';
  document.getElementById('mediaHeroTagArInput').value = data?.hero_tag_ar || '';
  document.getElementById('mediaHeroTitleEn').value = data?.hero_title_en || '';
  document.getElementById('mediaHeroTitleArInput').value = data?.hero_title_ar || '';
  document.getElementById('mediaHeroSubEn').value = data?.hero_sub_en || '';
  document.getElementById('mediaHeroSubArInput').value = data?.hero_sub_ar || '';
  document.getElementById('mediaHeroImageUrl').value = data?.hero_image_url || '';
  setImagePreview('mediaHeroImagePreview', data?.hero_image_url);

  document.getElementById('mediaNewsTagEn').value = data?.news_tag_en || '';
  document.getElementById('mediaNewsTagArInput').value = data?.news_tag_ar || '';
  document.getElementById('mediaNewsSectionTitleEn').value = data?.news_title_en || '';
  document.getElementById('mediaNewsSectionTitleArInput').value = data?.news_title_ar || '';
  document.getElementById('mediaBtnReadMoreEn').value = data?.btn_read_more_en || '';
  document.getElementById('mediaBtnReadMoreArInput').value = data?.btn_read_more_ar || '';

  document.getElementById('mediaVideoTitleEn').value = data?.video_title_en || '';
  document.getElementById('mediaVideoTitleArInput').value = data?.video_title_ar || '';
  document.getElementById('mediaVideoDescEn').value = data?.video_desc_en || '';
  document.getElementById('mediaVideoDescArInput').value = data?.video_desc_ar || '';
  document.getElementById('mediaVideoBgImageUrl').value = data?.video_bg_image_url || '';
  setImagePreview('mediaVideoBgImagePreview', data?.video_bg_image_url);
}

async function handleMediaPageFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('mediaPageId').value;
  const statusEl = document.getElementById('mediaPageStatus');
  statusEl.style.color = '';
  statusEl.textContent = 'Saving…';

  const payload = {
    hero_tag_en: document.getElementById('mediaHeroTagEn').value.trim(),
    hero_tag_ar: document.getElementById('mediaHeroTagArInput').value.trim(),
    hero_title_en: document.getElementById('mediaHeroTitleEn').value.trim(),
    hero_title_ar: document.getElementById('mediaHeroTitleArInput').value.trim(),
    hero_sub_en: document.getElementById('mediaHeroSubEn').value.trim(),
    hero_sub_ar: document.getElementById('mediaHeroSubArInput').value.trim(),
    hero_image_url: document.getElementById('mediaHeroImageUrl').value.trim(),
    news_tag_en: document.getElementById('mediaNewsTagEn').value.trim(),
    news_tag_ar: document.getElementById('mediaNewsTagArInput').value.trim(),
    news_title_en: document.getElementById('mediaNewsSectionTitleEn').value.trim(),
    news_title_ar: document.getElementById('mediaNewsSectionTitleArInput').value.trim(),
    btn_read_more_en: document.getElementById('mediaBtnReadMoreEn').value.trim(),
    btn_read_more_ar: document.getElementById('mediaBtnReadMoreArInput').value.trim(),
    video_title_en: document.getElementById('mediaVideoTitleEn').value.trim(),
    video_title_ar: document.getElementById('mediaVideoTitleArInput').value.trim(),
    video_desc_en: document.getElementById('mediaVideoDescEn').value.trim(),
    video_desc_ar: document.getElementById('mediaVideoDescArInput').value.trim(),
    video_bg_image_url: document.getElementById('mediaVideoBgImageUrl').value.trim(),
  };

  let pageId = id;
  if (id) {
    const { error } = await supabaseClient.from('media_page').update(payload).eq('id', id);
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
  } else {
    const { data, error } = await supabaseClient.from('media_page').insert(payload).select('id').single();
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
    pageId = data.id;
    document.getElementById('mediaPageId').value = pageId;
  }

  statusEl.style.color = '#2ecc71';
  statusEl.textContent = 'Saved ✓';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
}

let mediaNewsModalInstance = null;

async function loadMediaNews() {
  const tbody = document.getElementById('mediaNewsTableBody');
  const { data, error } = await supabaseClient
    .from('media_news')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Failed to load news articles.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No news articles yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((n) => `
    <tr data-id="${n.id}">
      <td><img src="${escapeHtml(n.image_url)}" alt="${escapeHtml(n.title_en)}" class="admin-table-thumb" /></td>
      <td>${escapeHtml(n.date_en)}</td>
      <td>${escapeHtml(n.title_en)}</td>
      <td dir="rtl">${escapeHtml(n.title_ar)}</td>
      <td>${n.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const article = data.find((n) => String(n.id) === String(id));
      if (article) openMediaNewsModal(article);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this news article? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('media_news').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadMediaNews();
    });
  });
}

function openMediaNewsModal(article) {
  document.getElementById('mediaNewsModalTitle').textContent = article ? 'Edit News Article' : 'Add News Article';
  document.getElementById('mediaNewsId').value = article?.id || '';
  document.getElementById('mediaNewsImageUrl').value = article?.image_url || '';
  setImagePreview('mediaNewsImagePreview', article?.image_url);
  document.getElementById('mediaNewsImageFile').value = '';
  document.getElementById('mediaNewsImageUploadStatus').textContent = '';
  document.getElementById('mediaNewsDateEn').value = article?.date_en || '';
  document.getElementById('mediaNewsDateAr').value = article?.date_ar || '';
  document.getElementById('mediaNewsTitleEn').value = article?.title_en || '';
  document.getElementById('mediaNewsTitleArInput').value = article?.title_ar || '';
  document.getElementById('mediaNewsDescEn').value = article?.desc_en || '';
  document.getElementById('mediaNewsDescAr').value = article?.desc_ar || '';
  document.getElementById('mediaNewsLinkUrl').value = article?.link_url || '';
  document.getElementById('mediaNewsDisplayOrder').value = article?.display_order ?? 0;
  document.getElementById('mediaNewsIsActive').checked = article ? !!article.is_active : true;
  mediaNewsModalInstance.show();
}

async function handleMediaNewsFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('mediaNewsId').value;
  const payload = {
    image_url: document.getElementById('mediaNewsImageUrl').value.trim(),
    date_en: document.getElementById('mediaNewsDateEn').value.trim(),
    date_ar: document.getElementById('mediaNewsDateAr').value.trim(),
    title_en: document.getElementById('mediaNewsTitleEn').value.trim(),
    title_ar: document.getElementById('mediaNewsTitleArInput').value.trim(),
    desc_en: document.getElementById('mediaNewsDescEn').value.trim(),
    desc_ar: document.getElementById('mediaNewsDescAr').value.trim(),
    link_url: document.getElementById('mediaNewsLinkUrl').value.trim() || '#',
    display_order: parseInt(document.getElementById('mediaNewsDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('mediaNewsIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('media_news').update(payload).eq('id', id)
    : await supabaseClient.from('media_news').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  mediaNewsModalInstance.hide();
  loadMediaNews();
}

const CONTACT_IMAGE_BUCKET = 'contact-images';

async function uploadContactImage(file, statusEl, urlInput, previewEl) {
  statusEl.textContent = 'Uploading…';
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from(CONTACT_IMAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    statusEl.textContent = `Upload failed: ${uploadError.message}`;
    return;
  }

  const { data } = supabaseClient.storage.from(CONTACT_IMAGE_BUCKET).getPublicUrl(path);
  urlInput.value = data.publicUrl;
  previewEl.src = data.publicUrl;
  previewEl.style.display = '';
  statusEl.textContent = 'Uploaded ✓';
}

async function loadContactPage() {
  const { data, error } = await supabaseClient.from('contact_page').select('*').limit(1).maybeSingle();
  if (error) {
    showDashboardError(error.message);
    return;
  }

  document.getElementById('contactPageId').value = data?.id || '';
  document.getElementById('contactHeroTagEn').value = data?.hero_tag_en || '';
  document.getElementById('contactHeroTagArInput').value = data?.hero_tag_ar || '';
  document.getElementById('contactHeroTitleEn').value = data?.hero_title_en || '';
  document.getElementById('contactHeroTitleArInput').value = data?.hero_title_ar || '';
  document.getElementById('contactHeroSubEn').value = data?.hero_sub_en || '';
  document.getElementById('contactHeroSubArInput').value = data?.hero_sub_ar || '';
  document.getElementById('contactHeroImageUrl').value = data?.hero_image_url || '';
  setImagePreview('contactHeroImagePreview', data?.hero_image_url);

  document.getElementById('contactInfoTagEn').value = data?.info_tag_en || '';
  document.getElementById('contactInfoTagArInput').value = data?.info_tag_ar || '';
  document.getElementById('contactInfoTitleEn').value = data?.info_title_en || '';
  document.getElementById('contactInfoTitleArInput').value = data?.info_title_ar || '';
  document.getElementById('contactInfoDescEn').value = data?.info_desc_en || '';
  document.getElementById('contactInfoDescArInput').value = data?.info_desc_ar || '';

  document.getElementById('contactFormTagEn').value = data?.form_tag_en || '';
  document.getElementById('contactFormTagArInput').value = data?.form_tag_ar || '';
  document.getElementById('contactFormTitleEn').value = data?.form_title_en || '';
  document.getElementById('contactFormTitleArInput').value = data?.form_title_ar || '';
  document.getElementById('contactFormDescEn').value = data?.form_desc_en || '';
  document.getElementById('contactFormDescArInput').value = data?.form_desc_ar || '';

  document.getElementById('contactLabelNameEn').value = data?.label_name_en || '';
  document.getElementById('contactLabelNameArInput').value = data?.label_name_ar || '';
  document.getElementById('contactPlaceholderNameEn').value = data?.placeholder_name_en || '';
  document.getElementById('contactPlaceholderNameArInput').value = data?.placeholder_name_ar || '';
  document.getElementById('contactLabelEmailEn').value = data?.label_email_en || '';
  document.getElementById('contactLabelEmailArInput').value = data?.label_email_ar || '';
  document.getElementById('contactPlaceholderEmailEn').value = data?.placeholder_email_en || '';
  document.getElementById('contactPlaceholderEmailArInput').value = data?.placeholder_email_ar || '';
  document.getElementById('contactLabelPhoneEn').value = data?.label_phone_en || '';
  document.getElementById('contactLabelPhoneArInput').value = data?.label_phone_ar || '';
  document.getElementById('contactPlaceholderPhoneEn').value = data?.placeholder_phone_en || '';
  document.getElementById('contactPlaceholderPhoneArInput').value = data?.placeholder_phone_ar || '';
  document.getElementById('contactLabelSubjectEn').value = data?.label_subject_en || '';
  document.getElementById('contactLabelSubjectArInput').value = data?.label_subject_ar || '';

  document.getElementById('contactSubjectDefaultEn').value = data?.subject_default_en || '';
  document.getElementById('contactSubjectDefaultArInput').value = data?.subject_default_ar || '';
  document.getElementById('contactSubjectInquiryEn').value = data?.subject_inquiry_en || '';
  document.getElementById('contactSubjectInquiryArInput').value = data?.subject_inquiry_ar || '';
  document.getElementById('contactSubjectTradeEn').value = data?.subject_trade_en || '';
  document.getElementById('contactSubjectTradeArInput').value = data?.subject_trade_ar || '';
  document.getElementById('contactSubjectTechEn').value = data?.subject_tech_en || '';
  document.getElementById('contactSubjectTechArInput').value = data?.subject_tech_ar || '';
  document.getElementById('contactSubjectInvestmentEn').value = data?.subject_investment_en || '';
  document.getElementById('contactSubjectInvestmentArInput').value = data?.subject_investment_ar || '';
  document.getElementById('contactSubjectLogisticsEn').value = data?.subject_logistics_en || '';
  document.getElementById('contactSubjectLogisticsArInput').value = data?.subject_logistics_ar || '';
  document.getElementById('contactSubjectMediaEn').value = data?.subject_media_en || '';
  document.getElementById('contactSubjectMediaArInput').value = data?.subject_media_ar || '';

  document.getElementById('contactLabelMessageEn').value = data?.label_message_en || '';
  document.getElementById('contactLabelMessageArInput').value = data?.label_message_ar || '';
  document.getElementById('contactPlaceholderMessageEn').value = data?.placeholder_message_en || '';
  document.getElementById('contactPlaceholderMessageArInput').value = data?.placeholder_message_ar || '';
  document.getElementById('contactBtnSubmitEn').value = data?.btn_submit_en || '';
  document.getElementById('contactBtnSubmitArInput').value = data?.btn_submit_ar || '';

  document.getElementById('contactOfficesTagEn').value = data?.offices_tag_en || '';
  document.getElementById('contactOfficesTagArInput').value = data?.offices_tag_ar || '';
  document.getElementById('contactOfficesTitleEn').value = data?.offices_title_en || '';
  document.getElementById('contactOfficesTitleArInput').value = data?.offices_title_ar || '';
}

async function handleContactPageFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('contactPageId').value;
  const statusEl = document.getElementById('contactPageStatus');
  statusEl.style.color = '';
  statusEl.textContent = 'Saving…';

  const payload = {
    hero_tag_en: document.getElementById('contactHeroTagEn').value.trim(),
    hero_tag_ar: document.getElementById('contactHeroTagArInput').value.trim(),
    hero_title_en: document.getElementById('contactHeroTitleEn').value.trim(),
    hero_title_ar: document.getElementById('contactHeroTitleArInput').value.trim(),
    hero_sub_en: document.getElementById('contactHeroSubEn').value.trim(),
    hero_sub_ar: document.getElementById('contactHeroSubArInput').value.trim(),
    hero_image_url: document.getElementById('contactHeroImageUrl').value.trim(),

    info_tag_en: document.getElementById('contactInfoTagEn').value.trim(),
    info_tag_ar: document.getElementById('contactInfoTagArInput').value.trim(),
    info_title_en: document.getElementById('contactInfoTitleEn').value.trim(),
    info_title_ar: document.getElementById('contactInfoTitleArInput').value.trim(),
    info_desc_en: document.getElementById('contactInfoDescEn').value.trim(),
    info_desc_ar: document.getElementById('contactInfoDescArInput').value.trim(),

    form_tag_en: document.getElementById('contactFormTagEn').value.trim(),
    form_tag_ar: document.getElementById('contactFormTagArInput').value.trim(),
    form_title_en: document.getElementById('contactFormTitleEn').value.trim(),
    form_title_ar: document.getElementById('contactFormTitleArInput').value.trim(),
    form_desc_en: document.getElementById('contactFormDescEn').value.trim(),
    form_desc_ar: document.getElementById('contactFormDescArInput').value.trim(),

    label_name_en: document.getElementById('contactLabelNameEn').value.trim(),
    label_name_ar: document.getElementById('contactLabelNameArInput').value.trim(),
    placeholder_name_en: document.getElementById('contactPlaceholderNameEn').value.trim(),
    placeholder_name_ar: document.getElementById('contactPlaceholderNameArInput').value.trim(),
    label_email_en: document.getElementById('contactLabelEmailEn').value.trim(),
    label_email_ar: document.getElementById('contactLabelEmailArInput').value.trim(),
    placeholder_email_en: document.getElementById('contactPlaceholderEmailEn').value.trim(),
    placeholder_email_ar: document.getElementById('contactPlaceholderEmailArInput').value.trim(),
    label_phone_en: document.getElementById('contactLabelPhoneEn').value.trim(),
    label_phone_ar: document.getElementById('contactLabelPhoneArInput').value.trim(),
    placeholder_phone_en: document.getElementById('contactPlaceholderPhoneEn').value.trim(),
    placeholder_phone_ar: document.getElementById('contactPlaceholderPhoneArInput').value.trim(),
    label_subject_en: document.getElementById('contactLabelSubjectEn').value.trim(),
    label_subject_ar: document.getElementById('contactLabelSubjectArInput').value.trim(),

    subject_default_en: document.getElementById('contactSubjectDefaultEn').value.trim(),
    subject_default_ar: document.getElementById('contactSubjectDefaultArInput').value.trim(),
    subject_inquiry_en: document.getElementById('contactSubjectInquiryEn').value.trim(),
    subject_inquiry_ar: document.getElementById('contactSubjectInquiryArInput').value.trim(),
    subject_trade_en: document.getElementById('contactSubjectTradeEn').value.trim(),
    subject_trade_ar: document.getElementById('contactSubjectTradeArInput').value.trim(),
    subject_tech_en: document.getElementById('contactSubjectTechEn').value.trim(),
    subject_tech_ar: document.getElementById('contactSubjectTechArInput').value.trim(),
    subject_investment_en: document.getElementById('contactSubjectInvestmentEn').value.trim(),
    subject_investment_ar: document.getElementById('contactSubjectInvestmentArInput').value.trim(),
    subject_logistics_en: document.getElementById('contactSubjectLogisticsEn').value.trim(),
    subject_logistics_ar: document.getElementById('contactSubjectLogisticsArInput').value.trim(),
    subject_media_en: document.getElementById('contactSubjectMediaEn').value.trim(),
    subject_media_ar: document.getElementById('contactSubjectMediaArInput').value.trim(),

    label_message_en: document.getElementById('contactLabelMessageEn').value.trim(),
    label_message_ar: document.getElementById('contactLabelMessageArInput').value.trim(),
    placeholder_message_en: document.getElementById('contactPlaceholderMessageEn').value.trim(),
    placeholder_message_ar: document.getElementById('contactPlaceholderMessageArInput').value.trim(),
    btn_submit_en: document.getElementById('contactBtnSubmitEn').value.trim(),
    btn_submit_ar: document.getElementById('contactBtnSubmitArInput').value.trim(),

    offices_tag_en: document.getElementById('contactOfficesTagEn').value.trim(),
    offices_tag_ar: document.getElementById('contactOfficesTagArInput').value.trim(),
    offices_title_en: document.getElementById('contactOfficesTitleEn').value.trim(),
    offices_title_ar: document.getElementById('contactOfficesTitleArInput').value.trim(),
  };

  let pageId = id;
  if (id) {
    const { error } = await supabaseClient.from('contact_page').update(payload).eq('id', id);
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
  } else {
    const { data, error } = await supabaseClient.from('contact_page').insert(payload).select('id').single();
    if (error) {
      statusEl.style.color = '#e05252';
      statusEl.textContent = error.message.includes('permission') ? "You don't have permission for this action." : error.message;
      return;
    }
    pageId = data.id;
    document.getElementById('contactPageId').value = pageId;
  }

  statusEl.style.color = '#2ecc71';
  statusEl.textContent = 'Saved ✓';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
}

let contactInfoItemModalInstance = null;
let contactInfoItemIconPicker = null;

async function loadContactInfoItems() {
  const tbody = document.getElementById('contactInfoItemsTableBody');
  const { data, error } = await supabaseClient
    .from('contact_info_items')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load contact channels.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No contact channels yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((item) => `
    <tr data-id="${item.id}">
      <td><i class="bi ${escapeHtml(item.icon)}" style="font-size:1.3rem;color:var(--primary);"></i></td>
      <td>${escapeHtml(item.label_en)}</td>
      <td>${escapeHtml(item.value_en)}</td>
      <td>${item.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const item = data.find((i) => String(i.id) === String(id));
      if (item) openContactInfoItemModal(item);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this contact channel? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('contact_info_items').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadContactInfoItems();
    });
  });
}

function openContactInfoItemModal(item) {
  document.getElementById('contactInfoItemModalTitle').textContent = item ? 'Edit Channel' : 'Add Channel';
  document.getElementById('contactInfoItemId').value = item?.id || '';
  contactInfoItemIconPicker.setIcon(item?.icon || 'bi-geo-alt');
  document.getElementById('contactInfoItemLabelEn').value = item?.label_en || '';
  document.getElementById('contactInfoItemLabelAr').value = item?.label_ar || '';
  document.getElementById('contactInfoItemValueEn').value = item?.value_en || '';
  document.getElementById('contactInfoItemValueAr').value = item?.value_ar || '';
  document.getElementById('contactInfoItemDisplayOrder').value = item?.display_order ?? 0;
  document.getElementById('contactInfoItemIsActive').checked = item ? !!item.is_active : true;
  contactInfoItemModalInstance.show();
}

async function handleContactInfoItemFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('contactInfoItemId').value;
  const payload = {
    icon: document.getElementById('contactInfoItemIcon').value || 'bi-geo-alt',
    label_en: document.getElementById('contactInfoItemLabelEn').value.trim(),
    label_ar: document.getElementById('contactInfoItemLabelAr').value.trim(),
    value_en: document.getElementById('contactInfoItemValueEn').value.trim(),
    value_ar: document.getElementById('contactInfoItemValueAr').value.trim(),
    display_order: parseInt(document.getElementById('contactInfoItemDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('contactInfoItemIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('contact_info_items').update(payload).eq('id', id)
    : await supabaseClient.from('contact_info_items').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  contactInfoItemModalInstance.hide();
  loadContactInfoItems();
}

let contactOfficeModalInstance = null;
let contactOfficeIconPicker = null;

async function loadContactOffices() {
  const tbody = document.getElementById('contactOfficesTableBody');
  const { data, error } = await supabaseClient
    .from('contact_offices')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load offices.</td></tr>`;
    showDashboardError(error.message);
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No offices yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((o) => `
    <tr data-id="${o.id}">
      <td><i class="bi ${escapeHtml(o.icon)}" style="font-size:1.3rem;color:var(--primary);"></i></td>
      <td>${escapeHtml(o.title_en)}</td>
      <td dir="rtl">${escapeHtml(o.title_ar)}</td>
      <td>${o.is_active ? '<span class="admin-badge admin-badge-active">Active</span>' : '<span class="admin-badge admin-badge-inactive">Hidden</span>'}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-icon" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
        ${currentRole === 'admin' ? `<button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr').dataset.id;
      const office = data.find((o) => String(o.id) === String(id));
      if (office) openContactOfficeModal(office);
    });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Delete this office? This cannot be undone.')) return;
      const { error: delError } = await supabaseClient.from('contact_offices').delete().eq('id', id);
      if (delError) {
        showDashboardError(delError.message.includes('permission') ? "You don't have permission for this action." : delError.message);
        return;
      }
      loadContactOffices();
    });
  });
}

function openContactOfficeModal(office) {
  document.getElementById('contactOfficeModalTitle').textContent = office ? 'Edit Office' : 'Add Office';
  document.getElementById('contactOfficeId').value = office?.id || '';
  contactOfficeIconPicker.setIcon(office?.icon || 'bi-building');
  document.getElementById('contactOfficeTitleEn').value = office?.title_en || '';
  document.getElementById('contactOfficeTitleAr').value = office?.title_ar || '';
  document.getElementById('contactOfficeLabelEn').value = office?.office_label_en || '';
  document.getElementById('contactOfficeLabelAr').value = office?.office_label_ar || '';
  document.getElementById('contactOfficeAddressEn').value = office?.address_en || '';
  document.getElementById('contactOfficeAddressAr').value = office?.address_ar || '';
  document.getElementById('contactOfficePhone').value = office?.phone || '';
  document.getElementById('contactOfficeDisplayOrder').value = office?.display_order ?? 0;
  document.getElementById('contactOfficeIsActive').checked = office ? !!office.is_active : true;
  contactOfficeModalInstance.show();
}

async function handleContactOfficeFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('contactOfficeId').value;
  const payload = {
    icon: document.getElementById('contactOfficeIcon').value || 'bi-building',
    title_en: document.getElementById('contactOfficeTitleEn').value.trim(),
    title_ar: document.getElementById('contactOfficeTitleAr').value.trim(),
    office_label_en: document.getElementById('contactOfficeLabelEn').value.trim(),
    office_label_ar: document.getElementById('contactOfficeLabelAr').value.trim(),
    address_en: document.getElementById('contactOfficeAddressEn').value.trim(),
    address_ar: document.getElementById('contactOfficeAddressAr').value.trim(),
    phone: document.getElementById('contactOfficePhone').value.trim(),
    display_order: parseInt(document.getElementById('contactOfficeDisplayOrder').value, 10) || 0,
    is_active: document.getElementById('contactOfficeIsActive').checked,
  };

  const { error } = id
    ? await supabaseClient.from('contact_offices').update(payload).eq('id', id)
    : await supabaseClient.from('contact_offices').insert(payload);

  if (error) {
    showDashboardError(error.message.includes('permission') ? "You don't have permission for this action." : error.message);
    return;
  }

  contactOfficeModalInstance.hide();
  loadContactOffices();
}

const DASHBOARD_TAB_SECTIONS = {
  products: 'productsSection',
  projects: 'projectsSection',
  gallery: 'gallerySection',
  services: 'servicesSection',
  techCards: 'techCardsSection',
  staff: 'userManagementSection',
  about: 'aboutSection',
  chairman: 'chairmanSection',
  investment: 'investmentSection',
  logistics: 'logisticsSection',
  aviation: 'aviationSection',
  media: 'mediaSection',
  contact: 'contactSection',
};

function switchDashboardTab(tab) {
  document.querySelectorAll('.dashboard-sidebar-nav .sidebar-link').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  Object.entries(DASHBOARD_TAB_SECTIONS).forEach(([tabName, sectionId]) => {
    document.getElementById(sectionId).style.display = tabName === tab ? '' : 'none';
  });

  // On mobile the sidebar is a Bootstrap offcanvas; picking a section should
  // close it. Harmless no-op at the >=lg breakpoint where it's static.
  const sidebarEl = document.getElementById('dashboardSidebar');
  const offcanvasInstance = bootstrap.Offcanvas.getInstance(sidebarEl);
  if (offcanvasInstance) offcanvasInstance.hide();
}

document.addEventListener('DOMContentLoaded', async () => {
  const session = await requireSession();
  if (!session) return;

  const profile = await getCurrentProfile(session);
  if (!profile) {
    showDashboardError('Could not load your staff profile. Contact the administrator.');
    return;
  }
  currentRole = profile.role;

  const badge = document.getElementById('currentUserBadge');
  if (badge) badge.textContent = `${profile.full_name} (${profile.role})`;

  if (currentRole === 'admin') {
    document.getElementById('staffSidebarLink').style.display = '';
    loadUsers();
  } else {
    document.querySelectorAll('.pages-nav-link').forEach((el) => { el.style.display = 'none'; });
  }

  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('openAddProductBtn').addEventListener('click', () => openProductModal(null));
  document.getElementById('productForm').addEventListener('submit', handleProductFormSubmit);
  document.getElementById('productImageFile').addEventListener('change', handleImageFileChange);

  document.getElementById('newCategoryToggleBtn').addEventListener('click', () => {
    document.getElementById('newCategoryForm').style.display = '';
  });
  document.getElementById('cancelNewCategoryBtn').addEventListener('click', () => {
    document.getElementById('newCategoryForm').style.display = 'none';
    document.getElementById('newCategoryLabelEn').value = '';
    document.getElementById('newCategoryLabelAr').value = '';
    document.getElementById('newCategoryStatus').textContent = '';
  });
  document.getElementById('saveNewCategoryBtn').addEventListener('click', handleSaveNewCategory);

  document.getElementById('manageCategoriesBtn').addEventListener('click', openManageCategoriesModal);
  document.getElementById('saveEditCategoryBtn').addEventListener('click', handleSaveCategoryEdit);

  document.getElementById('openAddProjectBtn').addEventListener('click', () => openProjectModal(null));
  document.getElementById('projectForm').addEventListener('submit', handleProjectFormSubmit);
  document.getElementById('projectImageFile').addEventListener('change', handleProjectImageFileChange);

  document.getElementById('openAddGalleryBtn').addEventListener('click', () => openGalleryModal(null));
  document.getElementById('galleryForm').addEventListener('submit', handleGalleryFormSubmit);
  document.getElementById('galleryImageFile').addEventListener('change', handleGalleryImageFileChange);

  document.getElementById('openAddServiceBtn').addEventListener('click', () => openServiceModal(null));
  document.getElementById('serviceForm').addEventListener('submit', handleServiceFormSubmit);
  document.getElementById('serviceImageFile').addEventListener('change', handleServiceImageFileChange);
  document.getElementById('addServiceItemBtn').addEventListener('click', () => addServiceItemRow(null));

  document.getElementById('openAddTechCardBtn').addEventListener('click', () => openTechCardModal(null));
  document.getElementById('techCardForm').addEventListener('submit', handleTechCardFormSubmit);
  techCardIconPicker = attachIconPicker(document.getElementById('techCardModal'), {
    toggleSelector: '#techCardIconToggle',
    menuSelector: '#techCardIconMenu',
    hiddenInputSelector: '#techCardIcon',
    previewSelector: '#techCardIconPreview',
  });

  document.getElementById('aboutPageForm').addEventListener('submit', handleAboutPageFormSubmit);
  document.getElementById('aboutHeroImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadAboutImage(file, document.getElementById('aboutHeroImageUploadStatus'), document.getElementById('aboutHeroImageUrl'), document.getElementById('aboutHeroImagePreview'));
  });
  document.getElementById('aboutStoryImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadAboutImage(file, document.getElementById('aboutStoryImageUploadStatus'), document.getElementById('aboutStoryImageUrl'), document.getElementById('aboutStoryImagePreview'));
  });
  document.getElementById('addAboutFeatureBtn').addEventListener('click', () => addAboutFeatureRow(null));

  document.getElementById('openAddVisionCardBtn').addEventListener('click', () => openVisionCardModal(null));
  document.getElementById('visionCardForm').addEventListener('submit', handleVisionCardFormSubmit);
  visionCardIconPicker = attachIconPicker(document.getElementById('visionCardModal'), {
    toggleSelector: '#visionCardIconToggle',
    menuSelector: '#visionCardIconMenu',
    hiddenInputSelector: '#visionCardIcon',
    previewSelector: '#visionCardIconPreview',
  });

  document.getElementById('openAddStatBtn').addEventListener('click', () => openAboutStatModal(null));
  document.getElementById('aboutStatForm').addEventListener('submit', handleAboutStatFormSubmit);

  document.getElementById('openAddTeamMemberBtn').addEventListener('click', () => openTeamMemberModal(null));
  document.getElementById('teamMemberForm').addEventListener('submit', handleTeamMemberFormSubmit);
  document.getElementById('teamMemberPhotoFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadAboutImage(file, document.getElementById('teamMemberPhotoUploadStatus'), document.getElementById('teamMemberPhotoUrl'), document.getElementById('teamMemberPhotoPreview'));
  });

  document.getElementById('openAddCertBtn').addEventListener('click', () => openAboutCertModal(null));
  document.getElementById('aboutCertForm').addEventListener('submit', handleAboutCertFormSubmit);
  document.getElementById('aboutCertBadgeFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadAboutImage(file, document.getElementById('aboutCertBadgeUploadStatus'), document.getElementById('aboutCertBadgeUrl'), document.getElementById('aboutCertBadgePreview'));
  });

  document.getElementById('chairmanPageForm').addEventListener('submit', handleChairmanPageFormSubmit);
  document.getElementById('chairmanHeroImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadChairmanImage(file, document.getElementById('chairmanHeroImageUploadStatus'), document.getElementById('chairmanHeroImageUrl'), document.getElementById('chairmanHeroImagePreview'));
  });
  document.getElementById('chairmanPhotoFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadChairmanImage(file, document.getElementById('chairmanPhotoUploadStatus'), document.getElementById('chairmanPhotoUrl'), document.getElementById('chairmanPhotoPreview'));
  });

  document.getElementById('investmentPageForm').addEventListener('submit', handleInvestmentPageFormSubmit);
  document.getElementById('investmentIntroImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadInvestmentImage(file, document.getElementById('investmentIntroImageUploadStatus'), document.getElementById('investmentIntroImageUrl'), document.getElementById('investmentIntroImagePreview'));
  });
  document.getElementById('addInvestmentFeatureBtn').addEventListener('click', () => addInvestmentFeatureRow(null));

  document.getElementById('openAddSectorBtn').addEventListener('click', () => openInvestmentSectorModal(null));
  document.getElementById('investmentSectorForm').addEventListener('submit', handleInvestmentSectorFormSubmit);
  investmentSectorIconPicker = attachIconPicker(document.getElementById('investmentSectorModal'), {
    toggleSelector: '#investmentSectorIconToggle',
    menuSelector: '#investmentSectorIconMenu',
    hiddenInputSelector: '#investmentSectorIcon',
    previewSelector: '#investmentSectorIconPreview',
  });

  document.getElementById('openAddStepBtn').addEventListener('click', () => openInvestmentStepModal(null));
  document.getElementById('investmentStepForm').addEventListener('submit', handleInvestmentStepFormSubmit);

  document.getElementById('logisticsPageForm').addEventListener('submit', handleLogisticsPageFormSubmit);
  document.getElementById('logisticsHeroImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadLogisticsImage(file, document.getElementById('logisticsHeroImageUploadStatus'), document.getElementById('logisticsHeroImageUrl'), document.getElementById('logisticsHeroImagePreview'));
  });
  document.getElementById('logisticsIntroImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadLogisticsImage(file, document.getElementById('logisticsIntroImageUploadStatus'), document.getElementById('logisticsIntroImageUrl'), document.getElementById('logisticsIntroImagePreview'));
  });

  document.getElementById('openAddLogisticsServiceBtn').addEventListener('click', () => openLogisticsServiceModal(null));
  document.getElementById('logisticsServiceForm').addEventListener('submit', handleLogisticsServiceFormSubmit);
  logisticsServiceIconPicker = attachIconPicker(document.getElementById('logisticsServiceModal'), {
    toggleSelector: '#logisticsServiceIconToggle',
    menuSelector: '#logisticsServiceIconMenu',
    hiddenInputSelector: '#logisticsServiceIcon',
    previewSelector: '#logisticsServiceIconPreview',
  });

  document.getElementById('openAddLogisticsStatBtn').addEventListener('click', () => openLogisticsStatModal(null));
  document.getElementById('logisticsStatForm').addEventListener('submit', handleLogisticsStatFormSubmit);

  document.getElementById('aviationPageForm').addEventListener('submit', handleAviationPageFormSubmit);
  document.getElementById('aviationHeroImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadAviationImage(file, document.getElementById('aviationHeroImageUploadStatus'), document.getElementById('aviationHeroImageUrl'), document.getElementById('aviationHeroImagePreview'));
  });

  document.getElementById('openAddAviationVisionCardBtn').addEventListener('click', () => openAviationVisionCardModal(null));
  document.getElementById('aviationVisionCardForm').addEventListener('submit', handleAviationVisionCardFormSubmit);
  aviationVisionCardIconPicker = attachIconPicker(document.getElementById('aviationVisionCardModal'), {
    toggleSelector: '#aviationVisionCardIconToggle',
    menuSelector: '#aviationVisionCardIconMenu',
    hiddenInputSelector: '#aviationVisionCardIcon',
    previewSelector: '#aviationVisionCardIconPreview',
  });

  document.getElementById('openAddAviationActivityBtn').addEventListener('click', () => openAviationActivityModal(null));
  document.getElementById('aviationActivityForm').addEventListener('submit', handleAviationActivityFormSubmit);

  document.getElementById('mediaPageForm').addEventListener('submit', handleMediaPageFormSubmit);
  document.getElementById('mediaHeroImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadMediaImage(file, document.getElementById('mediaHeroImageUploadStatus'), document.getElementById('mediaHeroImageUrl'), document.getElementById('mediaHeroImagePreview'));
  });
  document.getElementById('mediaVideoBgImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadMediaImage(file, document.getElementById('mediaVideoBgImageUploadStatus'), document.getElementById('mediaVideoBgImageUrl'), document.getElementById('mediaVideoBgImagePreview'));
  });

  document.getElementById('openAddMediaNewsBtn').addEventListener('click', () => openMediaNewsModal(null));
  document.getElementById('mediaNewsForm').addEventListener('submit', handleMediaNewsFormSubmit);
  document.getElementById('mediaNewsImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadMediaImage(file, document.getElementById('mediaNewsImageUploadStatus'), document.getElementById('mediaNewsImageUrl'), document.getElementById('mediaNewsImagePreview'));
  });

  document.getElementById('contactPageForm').addEventListener('submit', handleContactPageFormSubmit);
  document.getElementById('contactHeroImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadContactImage(file, document.getElementById('contactHeroImageUploadStatus'), document.getElementById('contactHeroImageUrl'), document.getElementById('contactHeroImagePreview'));
  });

  document.getElementById('openAddContactInfoItemBtn').addEventListener('click', () => openContactInfoItemModal(null));
  document.getElementById('contactInfoItemForm').addEventListener('submit', handleContactInfoItemFormSubmit);
  contactInfoItemIconPicker = attachIconPicker(document.getElementById('contactInfoItemModal'), {
    toggleSelector: '#contactInfoItemIconToggle',
    menuSelector: '#contactInfoItemIconMenu',
    hiddenInputSelector: '#contactInfoItemIcon',
    previewSelector: '#contactInfoItemIconPreview',
  });

  document.getElementById('openAddContactOfficeBtn').addEventListener('click', () => openContactOfficeModal(null));
  document.getElementById('contactOfficeForm').addEventListener('submit', handleContactOfficeFormSubmit);
  contactOfficeIconPicker = attachIconPicker(document.getElementById('contactOfficeModal'), {
    toggleSelector: '#contactOfficeIconToggle',
    menuSelector: '#contactOfficeIconMenu',
    hiddenInputSelector: '#contactOfficeIcon',
    previewSelector: '#contactOfficeIconPreview',
  });

  document.querySelectorAll('.dashboard-sidebar-nav .sidebar-link').forEach((btn) => {
    btn.addEventListener('click', () => switchDashboardTab(btn.dataset.tab));
  });

  const modalEl = document.getElementById('productModal');
  const manageCategoriesModalEl = document.getElementById('manageCategoriesModal');
  const editCategoryModalEl = document.getElementById('editCategoryModal');
  const editStaffModalEl = document.getElementById('editStaffModal');
  const addEmployeeModalEl = document.getElementById('addEmployeeModal');
  const projectModalEl = document.getElementById('projectModal');
  const galleryModalEl = document.getElementById('galleryModal');
  const serviceModalEl = document.getElementById('serviceModal');
  const techCardModalEl = document.getElementById('techCardModal');
  const visionCardModalEl = document.getElementById('visionCardModal');
  const aboutStatModalEl = document.getElementById('aboutStatModal');
  const teamMemberModalEl = document.getElementById('teamMemberModal');
  const aboutCertModalEl = document.getElementById('aboutCertModal');
  const investmentSectorModalEl = document.getElementById('investmentSectorModal');
  const investmentStepModalEl = document.getElementById('investmentStepModal');
  const logisticsServiceModalEl = document.getElementById('logisticsServiceModal');
  const logisticsStatModalEl = document.getElementById('logisticsStatModal');
  const aviationVisionCardModalEl = document.getElementById('aviationVisionCardModal');
  const aviationActivityModalEl = document.getElementById('aviationActivityModal');
  const mediaNewsModalEl = document.getElementById('mediaNewsModal');
  const contactInfoItemModalEl = document.getElementById('contactInfoItemModal');
  const contactOfficeModalEl = document.getElementById('contactOfficeModal');
  if (typeof bootstrap !== 'undefined') {
    productModalInstance = new bootstrap.Modal(modalEl);
    manageCategoriesModalInstance = new bootstrap.Modal(manageCategoriesModalEl);
    editCategoryModalInstance = new bootstrap.Modal(editCategoryModalEl);
    editStaffModalInstance = new bootstrap.Modal(editStaffModalEl);
    addEmployeeModalInstance = new bootstrap.Modal(addEmployeeModalEl);
    projectModalInstance = new bootstrap.Modal(projectModalEl);
    galleryModalInstance = new bootstrap.Modal(galleryModalEl);
    serviceModalInstance = new bootstrap.Modal(serviceModalEl);
    techCardModalInstance = new bootstrap.Modal(techCardModalEl);
    visionCardModalInstance = new bootstrap.Modal(visionCardModalEl);
    aboutStatModalInstance = new bootstrap.Modal(aboutStatModalEl);
    teamMemberModalInstance = new bootstrap.Modal(teamMemberModalEl);
    aboutCertModalInstance = new bootstrap.Modal(aboutCertModalEl);
    investmentSectorModalInstance = new bootstrap.Modal(investmentSectorModalEl);
    investmentStepModalInstance = new bootstrap.Modal(investmentStepModalEl);
    logisticsServiceModalInstance = new bootstrap.Modal(logisticsServiceModalEl);
    logisticsStatModalInstance = new bootstrap.Modal(logisticsStatModalEl);
    aviationVisionCardModalInstance = new bootstrap.Modal(aviationVisionCardModalEl);
    aviationActivityModalInstance = new bootstrap.Modal(aviationActivityModalEl);
    mediaNewsModalInstance = new bootstrap.Modal(mediaNewsModalEl);
    contactInfoItemModalInstance = new bootstrap.Modal(contactInfoItemModalEl);
    contactOfficeModalInstance = new bootstrap.Modal(contactOfficeModalEl);
  }
  document.getElementById('saveStaffBtn').addEventListener('click', handleSaveStaff);
  document.getElementById('openAddEmployeeBtn').addEventListener('click', openAddEmployeeModal);
  document.getElementById('saveNewEmployeeBtn').addEventListener('click', handleCreateEmployee);

  await loadCategories();
  loadProducts();
  loadProjects();
  loadGalleryImages();
  loadServices();
  loadTechCards();
  loadAboutPage();
  loadVisionCards();
  loadAboutStats();
  loadAboutTeam();
  loadAboutCertifications();
  loadChairmanPage();
  loadInvestmentPage();
  loadInvestmentSectors();
  loadInvestmentSteps();
  loadLogisticsPage();
  loadLogisticsServices();
  loadLogisticsStats();
  loadAviationPage();
  loadAviationVisionCards();
  loadAviationActivities();
  loadMediaPage();
  loadMediaNews();
  loadContactPage();
  loadContactInfoItems();
  loadContactOffices();
});
