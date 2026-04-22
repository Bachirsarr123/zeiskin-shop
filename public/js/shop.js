/**
 * ZEISKIN — Shop Page (Catalogue)
 */

const ShopPage = {
  products: [],
  categories: [],
  currentPage: 1,
  totalPages: 1,
  filters: { category: '', sort: 'newest', minPrice: '', maxPrice: '', search: '' },

  async init() {
    // Read URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('category')) this.filters.category = params.get('category');
    if (params.get('search'))   this.filters.search   = params.get('search');

    await this.loadCategories();
    await this.loadProducts();
    this.bindEvents();
    initHeader();
    initScrollAnimations();
  },

  async loadCategories() {
    try {
      this.categories = await API.Categories.getAll();
      this.renderCategoryFilters();
    } catch (e) { /* ignore */ }
  },

  renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;
    container.innerHTML = `
      <button class="filter-chip ${!this.filters.category ? 'active' : ''}" data-cat="">Tout</button>
      ${this.categories.map(c => `
        <button class="filter-chip ${this.filters.category === c._id ? 'active' : ''}" data-cat="${c._id}">
          ${c.name} <span class="chip-count">${c.productCount || 0}</span>
        </button>
      `).join('')}
    `;
  },

  async loadProducts(page = 1) {
    this.currentPage = page;
    const grid = document.getElementById('products-grid');
    const countEl = document.getElementById('products-count');
    if (!grid) return;

    // Show skeletons
    grid.innerHTML = Array(8).fill(`
      <div class="product-card">
        <div class="product-card__img skeleton" style="aspect-ratio:1/1"></div>
        <div class="product-card__body">
          <div class="skeleton" style="height:12px;width:50%;margin-bottom:8px;border-radius:3px"></div>
          <div class="skeleton" style="height:18px;width:85%;margin-bottom:8px;border-radius:3px"></div>
          <div class="skeleton" style="height:14px;width:35%;border-radius:3px"></div>
        </div>
      </div>
    `).join('');

    try {
      const params = { page, limit: 12, sort: this.filters.sort };
      if (this.filters.category) params.category = this.filters.category;
      if (this.filters.search)   params.search   = this.filters.search;
      if (this.filters.minPrice) params.minPrice  = this.filters.minPrice;
      if (this.filters.maxPrice) params.maxPrice  = this.filters.maxPrice;

      const data = await API.Products.getAll(params);
      this.products   = data.products;
      this.totalPages = data.pages;

      if (countEl) countEl.textContent = `${data.total} produit${data.total !== 1 ? 's' : ''}`;

      if (!this.products.length) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--muted)">
            <svg style="width:64px;margin:0 auto 16px;opacity:.3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>Aucun produit trouvé.</p>
          </div>`;
        return;
      }

      grid.innerHTML = this.products.map(p => renderProductCard(p)).join('');
      this.renderPagination();
      initScrollAnimations();
    } catch (e) {
      console.error('Erreur loadProducts:', e);
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted)">Erreur de chargement.</p>';
    }
  },

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container || this.totalPages <= 1) { container && (container.innerHTML = ''); return; }

    let html = `<button class="page-btn" onclick="ShopPage.loadProducts(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px"><polyline points="15 18 9 12 15 6"/></svg>
    </button>`;

    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="ShopPage.loadProducts(${i})">${i}</button>`;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        html += `<span style="color:var(--muted);padding:0 4px">…</span>`;
      }
    }

    html += `<button class="page-btn" onclick="ShopPage.loadProducts(${this.currentPage + 1})" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;

    container.innerHTML = html;
  },

  bindEvents() {
    // Category filters
    document.getElementById('category-filters')?.addEventListener('click', e => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      this.filters.category = chip.dataset.cat;
      this.loadProducts(1);
    });

    // Sort select
    document.getElementById('sort-select')?.addEventListener('change', e => {
      this.filters.sort = e.target.value;
      this.loadProducts(1);
    });

    // Search
    let timer;
    document.getElementById('shop-search')?.addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.filters.search = e.target.value.trim();
        this.loadProducts(1);
      }, 400);
    });

    // Price filter
    document.getElementById('apply-price')?.addEventListener('click', () => {
      this.filters.minPrice = document.getElementById('min-price')?.value || '';
      this.filters.maxPrice = document.getElementById('max-price')?.value || '';
      this.loadProducts(1);
    });
    document.getElementById('reset-price')?.addEventListener('click', () => {
      this.filters.minPrice = '';
      this.filters.maxPrice = '';
      if (document.getElementById('min-price')) document.getElementById('min-price').value = '';
      if (document.getElementById('max-price')) document.getElementById('max-price').value = '';
      this.loadProducts(1);
    });

    // Mobile filters toggle
    document.getElementById('filters-toggle')?.addEventListener('click', () => {
      document.getElementById('filters-sidebar')?.classList.toggle('open');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => ShopPage.init());
window.ShopPage = ShopPage;

// Inherit from home.js
function initHeader() {
  const header = document.querySelector('.site-header');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  let overlay = document.getElementById('mobile-overlay');
  if (!overlay && mobileNav) {
    overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.id = 'mobile-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => {
      if (hamburger?.classList.contains('open')) hamburger.click();
    });
  }

  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
  
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav?.classList.toggle('open');
    overlay?.classList.toggle('open');
    document.body.style.overflow = mobileNav?.classList.contains('open') ? 'hidden' : '';
  });
  mobileNav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      mobileNav.classList.remove('open');
      overlay?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}
function initScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}
