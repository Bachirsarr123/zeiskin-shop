/**
 * ZEISKIN — API Client
 * Gère tous les appels HTTP vers le backend
 */

const API_BASE = '/api';

// Get JWT token from sessionStorage
function getToken() {
  return sessionStorage.getItem('zeiskin_token');
}

// Generic fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    if (options.body && typeof options.body !== 'string') {
      options.body = JSON.stringify(options.body);
    }
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err.message.includes('Failed to fetch')) {
      throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion.');
    }
    throw err;
  }
}

// ── Products ─────────────────────────────────────────
const ProductsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/products?${qs}`);
  },
  getFeatured: () => apiFetch('/products/featured'),
  getBySlug: (slug) => apiFetch(`/products/${slug}`),
  getAllAdmin: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/products/all/admin?${qs}`);
  },
  create: (formData) => apiFetch('/products', { method: 'POST', body: formData }),
  update: (id, formData) => apiFetch(`/products/${id}`, { method: 'PUT', body: formData }),
  delete: (id) => apiFetch(`/products/${id}`, { method: 'DELETE' }),
};

// ── Categories ───────────────────────────────────────
const CategoriesAPI = {
  getAll: () => apiFetch('/categories'),
  getAllAdmin: () => apiFetch('/categories/all'),
  create: (formData) => apiFetch('/categories', { method: 'POST', body: formData }),
  update: (id, formData) => apiFetch(`/categories/${id}`, { method: 'PUT', body: formData }),
  delete: (id) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),
};

// ── Orders / Stats ───────────────────────────────────
const OrdersAPI = {
  track: (data) => apiFetch('/orders/track', { method: 'POST', body: data }),
  getStats: (period = '30') => apiFetch(`/orders/stats?period=${period}`),
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/orders/all?${qs}`);
  }
};

// ── Settings ─────────────────────────────────────────
const SettingsAPI = {
  get: () => apiFetch('/settings'),
  update: (data) => apiFetch('/settings', { method: 'PUT', body: data }),
};

// ── FAQs ─────────────────────────────────────────────
const FaqAPI = {
  getAll: () => apiFetch('/faqs'),
  getAllAdmin: () => apiFetch('/faqs/all'),
  create: (data) => apiFetch('/faqs', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/faqs/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/faqs/${id}`, { method: 'DELETE' }),
};

// ── Auth ─────────────────────────────────────────────
const AuthAPI = {
  login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: credentials }),
  verify: () => apiFetch('/auth/verify'),
  changePassword: (data) => apiFetch('/auth/password', { method: 'PUT', body: data }),
};

// ── Utilities ────────────────────────────────────────
function formatPrice(amount, currency = 'FCFA') {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + currency;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  const icon = type === 'success'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
    : type === 'error'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Expose globally
window.API = { Products: ProductsAPI, Categories: CategoriesAPI, Orders: OrdersAPI, Settings: SettingsAPI, Auth: AuthAPI, Faq: FaqAPI };
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.showToast = showToast;

// ── Shared UI Components ─────────────────────────────
function renderProductCard(p) {
  const hasPromo = p.comparePrice && p.comparePrice > p.price;
  const imgUrl = p.images?.[0]?.url || '/img/placeholder.svg';

  return `
    <div class="product-card fade-up">
      <div class="product-card__img">
        <img src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.src='/img/placeholder.svg'">
        <div class="product-card__badges">
          ${p.isNew ? '<span class="badge badge-new">Nouveau</span>' : ''}
          ${hasPromo ? '<span class="badge badge-promo">Promo</span>' : ''}
          ${p.stock === 0 ? '<span class="badge badge-soldout">Rupture</span>' : ''}
        </div>
        <div class="product-card__overlay">
          <button class="btn btn-wa btn-sm" style="border-radius:4px;padding:12px" onclick="event.stopPropagation();addToCartFromCard(${JSON.stringify(p).replace(/"/g, '&quot;')})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Ajouter
          </button>
        </div>
      </div>
      <a href="/product.html?slug=${p.slug}" class="product-card__body">
        <p class="product-card__category">${p.category?.name || ''}</p>
        <h3 class="product-card__name">${p.name}</h3>
        <div class="product-card__price">
          <span class="price-current">${formatPrice(p.price, 'FCFA')}</span>
          ${hasPromo ? `<span class="price-original">${formatPrice(p.comparePrice, 'FCFA')}</span>` : ''}
        </div>
      </a>
    </div>
  `;
}

function addToCartFromCard(product) {
  if (window.Cart) Cart.add(product, 1, '');
}

window.renderProductCard = renderProductCard;
window.addToCartFromCard = addToCartFromCard;
