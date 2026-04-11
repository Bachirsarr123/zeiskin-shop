/**
 * ZEISKIN Admin — Products Management
 */

const AdminProducts = {
  products: [],
  categories: [],
  currentPage: 1,
  editingId: null,
  deleteId: null,
  newImages: [],

  async init() {
    if (!AdminAuth.init()) return;
    await Promise.all([this.loadCategories(), this.loadProducts()]);
    this.bindEvents();
  },

  async loadCategories() {
    try {
      this.categories = await API.Categories.getAllAdmin();
      const select = document.getElementById('product-category');
      if (select) {
        select.innerHTML = '<option value="">Sélectionner une catégorie</option>' +
          this.categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
      }
    } catch (e) {}
  },

  async loadProducts(page = 1) {
    this.currentPage = page;
    const search = document.getElementById('search-input')?.value || '';
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">Chargement...</td></tr>`;
    try {
      const data = await API.Products.getAllAdmin({ page, limit: 15, search });
      this.products = data.products;
      this.renderTable();
      this.renderPagination(data);
      const count = document.getElementById('products-count');
      if (count) count.textContent = `${data.total} produit${data.total !== 1 ? 's' : ''}`;
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--error)">${e.message}</td></tr>`;
    }
  },

  renderTable() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    if (!this.products.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:48px;color:var(--muted)"><svg style="width:48px;margin:0 auto 12px;display:block;opacity:.3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg><p>Aucun produit trouvé</p></td></tr>';
      return;
    }
    tbody.innerHTML = this.products.map(p => `
      <tr>
        <td>
          <div class="table-product-info">
            <img class="product-thumb" src="${p.images?.[0]?.url || ''}" alt="${p.name}" onerror="this.style.background='var(--blush)'">
            <div>
              <p class="table-product-name">${p.name}</p>
              <p class="table-product-id">${p.category?.name || '—'}</p>
            </div>
          </div>
        </td>
        <td><strong>${formatPrice(p.price, 'FCFA')}</strong>${p.comparePrice ? `<br><span style="font-size:.75rem;color:var(--muted);text-decoration:line-through">${formatPrice(p.comparePrice, 'FCFA')}</span>` : ''}</td>
        <td>
          <span style="font-weight:${p.stock <= 5 ? '600' : '400'};color:${p.stock === 0 ? 'var(--error)' : p.stock <= 5 ? 'var(--warning)' : 'var(--charcoal)'}">
            ${p.stock}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:6px">
            ${p.isFeatured ? '<span class="status-badge" style="background:rgba(194,123,90,.12);color:var(--terracotta)">⭐ Vedette</span>' : ''}
            ${p.isNew ? '<span class="status-badge status-active">Nouveau</span>' : ''}
          </div>
        </td>
        <td><span class="status-badge ${p.isActive ? 'status-active' : 'status-inactive'}">${p.isActive ? 'Actif' : 'Inactif'}</span></td>
        <td style="font-size:.8rem;color:var(--muted)">${formatDate(p.createdAt)}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn" title="Modifier" onclick="AdminProducts.openEdit('${p._id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn delete" title="Supprimer" onclick="AdminProducts.confirmDelete('${p._id}', '${p.name.replace(/'/g, "\\'")}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderPagination(data) {
    const el = document.getElementById('pagination');
    if (!el || data.pages <= 1) { el && (el.innerHTML = ''); return; }
    el.innerHTML = `
      <button class="page-btn" onclick="AdminProducts.loadProducts(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
      ${Array.from({ length: data.pages }, (_, i) => i + 1)
        .map(i => `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="AdminProducts.loadProducts(${i})">${i}</button>`)
        .join('')}
      <button class="page-btn" onclick="AdminProducts.loadProducts(${this.currentPage + 1})" ${this.currentPage === data.pages ? 'disabled' : ''}>›</button>
    `;
  },

  openAdd() {
    this.editingId = null;
    this.newImages = [];
    document.getElementById('modal-title').textContent = 'Ajouter un produit';
    document.getElementById('product-form').reset();
    document.getElementById('img-previews').innerHTML = '';
    document.getElementById('variants-container').innerHTML = '';
    document.getElementById('product-modal').classList.add('open');
  },

  openEdit(id) {
    this.editingId = id;
    this.newImages = [];
    const product = this.products.find(p => String(p._id) === String(id));
    if (!product) return;
    document.getElementById('modal-title').textContent = 'Modifier le produit';

    // Fill form
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('product-name', product.name);
    set('product-description', product.description);
    set('product-ingredients', product.ingredients);
    set('product-price', product.price);
    set('product-compare-price', product.comparePrice || '');
    set('product-stock', product.stock);
    set('product-category', product.category?._id || '');
    set('product-tags', product.tags?.join(', ') || '');

    const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
    setCheck('product-featured', product.isFeatured);
    setCheck('product-new', product.isNew);
    setCheck('product-active', product.isActive !== false);

    // Show existing images
    const previews = document.getElementById('img-previews');
    previews.innerHTML = (product.images || []).map((img, i) => `
      <div class="img-preview-item" data-existing="${i}">
        <img src="${img.url}" alt="">
        <span class="img-preview-remove" onclick="AdminProducts.removeExistingImage(${i})">×</span>
      </div>
    `).join('');
    this._existingImages = [...product.images];

    // Render variants
    const varContainer = document.getElementById('variants-container');
    varContainer.innerHTML = '';
    product.variants?.forEach(v => this.addVariantGroup(v));

    document.getElementById('product-modal').classList.add('open');
  },

  removeExistingImage(index) {
    this._existingImages.splice(index, 1);
    document.querySelectorAll('.img-preview-item[data-existing]').forEach((el, i) => {
      if (Number(el.dataset.existing) === index) el.remove();
    });
  },

  closeModal() {
    document.getElementById('product-modal').classList.remove('open');
    this.newImages = [];
  },

  addVariantGroup(existing = null) {
    const container = document.getElementById('variants-container');
    const id = Date.now();
    const div = document.createElement('div');
    div.className = 'variant-group';
    div.dataset.variantId = id;
    div.innerHTML = `
      <div class="variant-header">
        <div style="display:flex;align-items:center;gap:8px">
          <input type="text" class="form-input" style="width:140px" placeholder="Type (ex: Taille)" value="${existing?.type || ''}">
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.variant-group').remove()">Retirer</button>
      </div>
      <div class="variant-options" id="variant-opts-${id}">
        ${(existing?.options || []).map(o => this.variantOptionHTML(o.value, o.stock)).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <input type="text" class="form-input" style="flex:1" placeholder="Option (ex: 100ml)" id="new-opt-val-${id}">
        <input type="number" class="form-input" style="width:100px" placeholder="Stock" id="new-opt-stock-${id}" value="0">
        <button type="button" class="btn btn-secondary btn-sm" onclick="AdminProducts.addVariantOption(${id})">+ Ajouter</button>
      </div>
    `;
    container.appendChild(div);
  },

  variantOptionHTML(value, stock) {
    return `<div class="variant-option-chip">${value} (${stock}) <button type="button" onclick="this.closest('.variant-option-chip').remove()">×</button></div>`;
  },

  addVariantOption(id) {
    const valInput   = document.getElementById(`new-opt-val-${id}`);
    const stockInput = document.getElementById(`new-opt-stock-${id}`);
    const opts = document.getElementById(`variant-opts-${id}`);
    if (!valInput?.value.trim()) return;
    opts.insertAdjacentHTML('beforeend', this.variantOptionHTML(valInput.value.trim(), stockInput?.value || '0'));
    valInput.value = '';
    if (stockInput) stockInput.value = '0';
  },

  getVariantsData() {
    return Array.from(document.querySelectorAll('.variant-group')).map(g => {
      const type = g.querySelector('input[type="text"]')?.value.trim();
      const options = Array.from(g.querySelectorAll('.variant-option-chip')).map(chip => {
        const text = chip.textContent.trim();
        const match = text.match(/^(.+?)\s*\((\d+)\)/);
        return match ? { value: match[1].trim(), stock: Number(match[2]) } : null;
      }).filter(Boolean);
      return type ? { type, options } : null;
    }).filter(Boolean);
  },

  async handleImageUpload(input) {
    const files = Array.from(input.files);
    const previews = document.getElementById('img-previews');
    files.forEach(file => {
      this.newImages.push(file);
      const reader = new FileReader();
      reader.onload = e => {
        const div = document.createElement('div');
        div.className = 'img-preview-item';
        div.innerHTML = `<img src="${e.target.result}" alt=""><span class="img-preview-remove" onclick="this.parentElement.remove()">×</span>`;
        previews.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  },

  async saveProduct() {
    const btn = document.getElementById('save-product-btn');
    btn.disabled = true;
    btn.textContent = 'Sauvegarde...';

    try {
      const formData = new FormData();
      const fields = {
        name: 'product-name', description: 'product-description',
        ingredients: 'product-ingredients', price: 'product-price',
        comparePrice: 'product-compare-price', stock: 'product-stock',
        categoryId: 'product-category', tags: 'product-tags'
      };
      Object.entries(fields).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) formData.append(key, el.value);
      });
      formData.append('isFeatured', document.getElementById('product-featured')?.checked ? 'true' : 'false');
      formData.append('isNew',      document.getElementById('product-new')?.checked ? 'true' : 'false');
      formData.append('isActive',   document.getElementById('product-active')?.checked ? 'true' : 'false');
      formData.append('variants',   JSON.stringify(this.getVariantsData()));

      this.newImages.forEach(file => formData.append('images', file));

      if (this.editingId) {
        formData.append('keepImages', 'true');
        await API.Products.update(this.editingId, formData);
        showToast('Produit modifié ✓');
      } else {
        await API.Products.create(formData);
        showToast('Produit créé ✓');
      }

      this.closeModal();
      await this.loadProducts(this.currentPage);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sauvegarder';
    }
  },

  confirmDelete(id, name) {
    this.deleteId = id;
    const nameEl = document.getElementById('delete-product-name');
    if (nameEl) nameEl.textContent = name;
    document.getElementById('delete-modal').classList.add('open');
  },

  async executeDelete() {
    if (!this.deleteId) return;
    try {
      await API.Products.delete(this.deleteId);
      document.getElementById('delete-modal').classList.remove('open');
      showToast('Produit supprimé');
      await this.loadProducts(this.currentPage);
    } catch (e) {
      showToast(e.message, 'error');
    }
    this.deleteId = null;
  },

  bindEvents() {
    // Search
    let timer;
    document.getElementById('search-input')?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => this.loadProducts(1), 400);
    });

    // Image upload
    const imgInput = document.getElementById('product-images');
    imgInput?.addEventListener('change', e => this.handleImageUpload(e.target));

    // Drag & drop
    const dropArea = document.getElementById('img-upload-area');
    dropArea?.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('drag-over'); });
    dropArea?.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
    dropArea?.addEventListener('drop', e => {
      e.preventDefault();
      dropArea.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (!files.length) return;
      files.forEach(file => {
        this.newImages.push(file);
        const reader = new FileReader();
        reader.onload = ev => {
          const div = document.createElement('div');
          div.className = 'img-preview-item';
          div.innerHTML = `<img src="${ev.target.result}" alt=""><span class="img-preview-remove" onclick="this.parentElement.remove()">×</span>`;
          document.getElementById('img-previews').appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    });

    // Close modals on overlay click
    document.getElementById('product-modal')?.addEventListener('click', e => {
      if (e.target.id === 'product-modal') this.closeModal();
    });
    document.getElementById('delete-modal')?.addEventListener('click', e => {
      if (e.target.id === 'delete-modal') document.getElementById('delete-modal').classList.remove('open');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => AdminProducts.init());
window.AdminProducts = AdminProducts;
