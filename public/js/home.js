/**
 * ZEISKIN — Home Page Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  initScrollAnimations();
  initFAQ();
  initSearch();
  loadFeaturedProducts();
  loadCategories();
  loadFAQ(); // Ajouter ici
  initWaFab();
});

// ── Header scroll effect ──────────────────────────────
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

// ── Scroll animations ─────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ── Load FAQ Dynamically ─────────────────────────────
async function loadFAQ() {
  const container = document.getElementById('faq-list');
  if (!container) return;

  try {
    const faqs = await API.Faq.getAll();
    if (!faqs || faqs.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px">Ancienne FAQ statique : veuillez en ajouter depuis l’admin.</p>';
      return;
    }

    container.innerHTML = faqs.map(faq => `
      <div class="faq-item fade-up">
        <button class="faq-question">
          ${faq.question}
          <span class="faq-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
        </button>
        <div class="faq-answer"><p>${faq.answer}</p></div>
      </div>
    `).join('');

    initScrollAnimations();
  } catch (e) {
    container.innerHTML = '<p style="text-align:center;color:var(--error);padding:40px">Erreur lors du chargement de la FAQ.</p>';
  }
}

// ── FAQ Accordion ─────────────────────────────────────
function initFAQ() {
  // Use event delegation for dynamic items
  document.getElementById('faq-list')?.addEventListener('click', e => {
    const btn = e.target.closest('.faq-question');
    if (!btn) return;
    
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
}



// ── Search ────────────────────────────────────────────
function initSearch() {
  const overlay = document.getElementById('search-overlay');
  const input   = document.getElementById('search-input');
  const closeBtn = document.getElementById('search-close');

  document.querySelectorAll('[data-search-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay?.classList.add('open');
      input?.focus();
    });
  });

  closeBtn?.addEventListener('click', () => overlay?.classList.remove('open'));
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });

  // Live search
  let searchTimer;
  input?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (q.length < 2) {
      document.getElementById('search-results').innerHTML = '';
      return;
    }
    searchTimer = setTimeout(async () => {
      try {
        const data = await API.Products.getAll({ search: q, limit: 5 });
        renderSearchResults(data.products);
      } catch (e) { /* ignore */ }
    }, 300);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') overlay?.classList.remove('open');
  });
}

function renderSearchResults(products) {
  const container = document.getElementById('search-results');
  if (!container) return;
  if (!products?.length) {
    container.innerHTML = '<p style="color:var(--muted);font-size:.875rem">Aucun produit trouvé.</p>';
    return;
  }
  container.innerHTML = products.map(p => `
    <a href="/product.html?slug=${p.slug}" class="search-result-item">
      <div style="width:48px;height:56px;border-radius:6px;overflow:hidden;background:var(--blush);flex-shrink:0">
        <img src="${p.images?.[0]?.url || '/img/placeholder.svg'}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">
      </div>
      <div>
        <p style="font-weight:500;font-size:.9rem;color:var(--charcoal)">${p.name}</p>
        <p style="font-size:.8rem;color:var(--terracotta)">${formatPrice(p.price, 'FCFA')}</p>
      </div>
    </a>
  `).join('');
}

// ── Load Featured Products ────────────────────────────
async function loadFeaturedProducts() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  // Skeleton
  grid.innerHTML = Array(4).fill(`
    <div class="product-card">
      <div class="product-card__img skeleton" style="aspect-ratio:3/4"></div>
      <div class="product-card__body">
        <div class="skeleton" style="height:14px;width:60%;margin-bottom:8px;border-radius:4px"></div>
        <div class="skeleton" style="height:18px;width:80%;margin-bottom:8px;border-radius:4px"></div>
        <div class="skeleton" style="height:14px;width:40%;border-radius:4px"></div>
      </div>
    </div>
  `).join('');

  try {
    const products = await API.Products.getFeatured();
    if (!products?.length) {
      grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center">Aucun produit en vedette.</p>';
      return;
    }
    grid.innerHTML = products.map(p => renderProductCard(p)).join('');
    initScrollAnimations();
  } catch (e) {
    grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center">Impossible de charger les produits.</p>';
  }
}

// ── Load Categories ───────────────────────────────────
async function loadCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  try {
    const categories = await API.Categories.getAll();
    if (!categories?.length) return;

    grid.innerHTML = categories.map(cat => `
      <a href="/shop.html?category=${cat._id}" class="category-card fade-up">
        <div class="category-card__img" style="background:var(--blush-dark);width:100%;height:100%;position:absolute;inset:0">
          ${cat.image?.url ? `<img src="${cat.image.url}" alt="${cat.name}" style="width:100%;height:100%;object-fit:cover">` : ''}
        </div>
        <div class="category-card__overlay">
          <div class="category-card__info">
            <h3>${cat.name}</h3>
            <p>${cat.productCount || 0} produit${cat.productCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </a>
    `).join('');
    initScrollAnimations();
  } catch (e) { /* ignore */ }
}

// ── Product Card Template ─────────────────────────────
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

// ── WhatsApp FAB ──────────────────────────────────────
function initWaFab() {
  const fab = document.getElementById('wa-fab');
  if (!fab) return;
  const number = '221703046152';
  fab.href = `https://wa.me/${number}?text=${encodeURIComponent('Bonjour ZEISKIN 🌿, je souhaite avoir des informations sur vos produits.')}`;
  fab.target = '_blank';
  fab.rel = 'noopener noreferrer';
}

window.renderProductCard = renderProductCard;
window.addToCartFromCard = addToCartFromCard;
