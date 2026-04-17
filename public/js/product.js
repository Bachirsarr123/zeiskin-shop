/**
 * ZEISKIN — Product Detail Page
 */

const ProductPage = {
  product: null,
  selectedImage: 0,
  selectedVariants: {},
  quantity: 1,

  async init() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (!slug) { window.location.href = '/shop.html'; return; }
    await this.loadProduct(slug);
    initHeader();
  },

  async loadProduct(slug) {
    const main = document.getElementById('product-main');
    if (!main) return;
    main.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 0"><div class="skeleton" style="height:400px;border-radius:12px"></div></div>`;

    try {
      const data = await API.Products.getBySlug(slug);
      this.product = data.product;
      this.render();
      this.renderRelated(data.related);
    } catch (e) {
      main.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px;color:var(--muted)">
        <p>Produit introuvable.</p>
        <a href="/shop.html" class="btn btn-outline" style="margin-top:16px;display:inline-flex">← Retour boutique</a>
      </div>`;
    }
  },

  render() {
    const p = this.product;
    const currency = 'FCFA';

    // SEO
    document.title = `${p.name} — ZEISKIN`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', p.description.slice(0, 160));

    // Breadcrumb
    const bc = document.getElementById('breadcrumb');
    if (bc) bc.innerHTML = `
      <a href="/">Accueil</a> <span>/</span>
      <a href="/shop.html">Boutique</a> <span>/</span>
      <a href="/shop.html?category=${p.category?._id}">${p.category?.name || ''}</a> <span>/</span>
      <span>${p.name}</span>`;

    // Main layout
    const main = document.getElementById('product-main');
    const hasPromo = p.comparePrice && p.comparePrice > p.price;
    const discount = hasPromo ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;

    main.innerHTML = `
      <!-- Gallery -->
      <div class="product-gallery">
        <div class="gallery-main" id="gallery-main">
          <img id="main-img" src="${p.images?.[0]?.url || '/img/placeholder.svg'}" alt="${p.name}" onerror="this.src='/img/placeholder.svg'">
          ${p.images?.length > 1 ? `
            <button class="gallery-nav gallery-prev" onclick="ProductPage.prevImage()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button class="gallery-nav gallery-next" onclick="ProductPage.nextImage()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ` : ''}
        </div>
        ${p.images?.length > 1 ? `
          <div class="gallery-thumbs" id="gallery-thumbs">
            ${p.images.map((img, i) => `
              <div class="thumb ${i === 0 ? 'active' : ''}" onclick="ProductPage.setImage(${i})">
                <img src="${img.url}" alt="${p.name} ${i+1}" onerror="this.src='/img/placeholder.svg'">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Info -->
      <div class="product-info">
        <p class="product-category-label">${p.category?.name || ''}</p>
        <h1 class="product-title">${p.name}</h1>

        <div class="product-price-row">
          <span class="product-price-current">${formatPrice(p.price, currency)}</span>
          ${hasPromo ? `
            <span class="product-price-original">${formatPrice(p.comparePrice, currency)}</span>
            <span class="product-discount-badge">-${discount}%</span>
          ` : ''}
        </div>

        <div class="product-stock-status ${p.stock > 0 ? 'in-stock' : 'out-stock'}">
          <span class="dot"></span>
          ${p.stock > 0 ? `En stock (${p.stock} disponibles)` : 'Rupture de stock'}
        </div>

        <!-- Variants -->
        ${p.variants?.length ? p.variants.map(v => `
          <div class="variant-group" id="variant-${v.type}">
            <p class="variant-label">${v.type} :
              <strong id="selected-${v.type}">${v.options?.[0]?.value || ''}</strong>
            </p>
            <div class="variant-options">
              ${v.options.map((opt, i) => `
                <button class="variant-opt ${i === 0 ? 'selected' : ''} ${opt.stock === 0 ? 'sold-out' : ''}"
                  onclick="ProductPage.selectVariant('${v.type}', '${opt.value}', this)"
                  ${opt.stock === 0 ? 'disabled' : ''}>
                  ${opt.value}${opt.stock === 0 ? '<span class="opt-soldout">×</span>' : ''}
                </button>
              `).join('')}
            </div>
          </div>
        `).join('') : ''}

        <!-- Quantity -->
        <div class="qty-row">
          <p class="qty-label">Quantité</p>
          <div class="qty-control">
            <button class="qty-btn-lg" onclick="ProductPage.changeQty(-1)">−</button>
            <span id="qty-display" class="qty-display">1</span>
            <button class="qty-btn-lg" onclick="ProductPage.changeQty(+1)">+</button>
          </div>
        </div>

        <!-- CTA -->
        <div class="product-ctas">
          <button class="btn btn-primary btn-full" onclick="ProductPage.addToCart()" ${p.stock === 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            ${p.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </button>
        </div>

        <!-- Shipping info -->
        <div class="product-perks">
          <div class="perk-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;color:var(--terracotta)">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span>Livraison partout au Sénégal</span>
          </div>
          <div class="perk-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;color:var(--terracotta)">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Produits 100% naturels</span>
          </div>
          <div class="perk-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;color:var(--terracotta)">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>Formulé avec soin pour votre peau</span>
          </div>
        </div>

        <!-- Accordion -->
        <div class="product-accordion">
          <div class="acc-item">
            <button class="acc-btn" onclick="toggleAcc(this)">
              Description <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="acc-body"><p>${p.description}</p></div>
          </div>
          ${p.ingredients ? `
            <div class="acc-item">
              <button class="acc-btn" onclick="toggleAcc(this)">
                Ingrédients <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="acc-body"><p>${p.ingredients}</p></div>
            </div>
          ` : ''}
          <div class="acc-item">
            <button class="acc-btn" onclick="toggleAcc(this)">
              Livraison & Retours <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="acc-body">
              <p>Livraison disponible partout au Sénégal. Délai : 24 à 72h selon votre localisation. Retours acceptés dans les 7 jours suivant réception si le produit n'a pas été ouvert.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize first variant selection
    if (p.variants?.length) {
      p.variants.forEach(v => {
        if (v.options?.[0]) this.selectedVariants[v.type] = v.options[0].value;
      });
    }

    // Inject product styles
    this.injectStyles();
  },

  injectStyles() {
    if (document.getElementById('product-styles')) return;
    const style = document.createElement('style');
    style.id = 'product-styles';
    style.textContent = `
      .product-gallery { display: flex; flex-direction: column; gap: 12px; }
      .gallery-main { position: relative; border-radius: 16px; overflow: hidden; background: var(--blush); aspect-ratio: 4/5; }
      .gallery-main img { width: 100%; height: 100%; object-fit: contain; background: var(--blush); }
      .gallery-nav {
        position: absolute; top: 50%; transform: translateY(-50%);
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(253,250,247,.9); border: 1px solid var(--border);
        display: flex; align-items: center; justify-content: center;
        transition: all .2s; color: var(--charcoal);
      }
      .gallery-nav:hover { background: white; box-shadow: var(--shadow-md); }
      .gallery-prev { left: 12px; } .gallery-next { right: 12px; }
      .gallery-thumbs { display: flex; gap: 8px; overflow-x: auto; }
      .thumb { width: 72px; height: 84px; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid transparent; flex-shrink: 0; transition: border-color .2s; }
      .thumb.active { border-color: var(--terracotta); }
      .thumb img { width: 100%; height: 100%; object-fit: contain; background: var(--blush); }
      .product-category-label { font-size: .72rem; letter-spacing: .15em; text-transform: uppercase; color: var(--terracotta); margin-bottom: 8px; }
      .product-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 300; color: var(--charcoal); margin-bottom: 16px; line-height: 1.2; }
      .product-price-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .product-price-current { font-size: 1.5rem; font-weight: 700; color: var(--charcoal); }
      .product-price-original { font-size: 1rem; color: var(--muted); text-decoration: line-through; }
      .product-discount-badge { background: var(--terracotta); color: white; font-size: .72rem; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
      .product-stock-status { display: flex; align-items: center; gap: 8px; font-size: .82rem; margin-bottom: 20px; }
      .product-stock-status .dot { width: 8px; height: 8px; border-radius: 50%; }
      .in-stock { color: var(--success); } .in-stock .dot { background: var(--success); }
      .out-stock { color: var(--error); } .out-stock .dot { background: var(--error); }
      .variant-label { font-size: .82rem; font-weight: 500; color: var(--charcoal); margin-bottom: 10px; }
      .variant-options { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
      .variant-opt {
        padding: 8px 18px; border: 1.5px solid var(--border); border-radius: 4px;
        font-size: .82rem; font-weight: 500; transition: all .2s; background: var(--white); cursor: pointer; position: relative;
      }
      .variant-opt:hover { border-color: var(--charcoal); }
      .variant-opt.selected { border-color: var(--charcoal); background: var(--charcoal); color: white; }
      .variant-opt.sold-out { opacity: .4; cursor: not-allowed; }
      .qty-row { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
      .qty-label { font-size: .82rem; font-weight: 500; }
      .qty-control { display: flex; align-items: center; gap: 12px; background: var(--blush); border-radius: 50px; padding: 4px; }
      .qty-btn-lg { width: 36px; height: 36px; border-radius: 50%; border: none; background: var(--white); font-size: 1.2rem; font-weight: 300; display: flex; align-items: center; justify-content: center; transition: all .2s; cursor: pointer; }
      .qty-btn-lg:hover { background: var(--terracotta); color: white; }
      .qty-display { min-width: 24px; text-align: center; font-weight: 600; }
      .product-ctas { margin-bottom: 24px; }
      .product-perks { display: flex; flex-direction: column; gap: 10px; padding: 20px; background: var(--blush); border-radius: 12px; margin-bottom: 24px; }
      .perk-item { display: flex; align-items: center; gap: 10px; font-size: .84rem; color: var(--charcoal); }
      .product-accordion { border-top: 1px solid var(--border); }
      .acc-item { border-bottom: 1px solid var(--border); }
      .acc-btn { width: 100%; text-align: left; padding: 16px 0; display: flex; justify-content: space-between; align-items: center; font-size: .9rem; font-weight: 500; color: var(--charcoal); background: none; border: none; cursor: pointer; }
      .acc-body { overflow: hidden; max-height: 0; transition: max-height .35s ease, padding .35s; }
      .acc-body.open { max-height: 400px; padding-bottom: 16px; }
      .acc-body p { font-size: .875rem; color: var(--muted); line-height: 1.8; }
    `;
    document.head.appendChild(style);
  },

  setImage(index) {
    const imgs = this.product.images;
    if (!imgs?.[index]) return;
    this.selectedImage = index;
    document.getElementById('main-img').src = imgs[index].url;
    document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('active', i === index));
  },
  prevImage() { this.setImage(Math.max(0, this.selectedImage - 1)); },
  nextImage() { this.setImage(Math.min((this.product.images?.length || 1) - 1, this.selectedImage + 1)); },

  selectVariant(type, value, btn) {
    document.querySelectorAll(`#variant-${type} .variant-opt`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.selectedVariants[type] = value;
    const label = document.getElementById(`selected-${type}`);
    if (label) label.textContent = value;
  },

  changeQty(delta) {
    this.quantity = Math.max(1, Math.min(99, this.quantity + delta));
    const el = document.getElementById('qty-display');
    if (el) el.textContent = this.quantity;
  },

  addToCart() {
    if (!this.product) return;
    const variantStr = Object.entries(this.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ');
    Cart.add(this.product, this.quantity, variantStr);
  },

  renderRelated(related) {
    const section = document.getElementById('related-section');
    const grid = document.getElementById('related-grid');
    if (!section || !grid || !related?.length) { section && (section.style.display = 'none'); return; }
    grid.innerHTML = related.map(p => renderProductCard(p)).join('');
  }
};

function toggleAcc(btn) {
  const body = btn.nextElementSibling;
  body.classList.toggle('open');
}

function initHeader() {
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => header?.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav?.classList.toggle('open');
  });
}

document.addEventListener('DOMContentLoaded', () => ProductPage.init());
window.ProductPage = ProductPage;
window.toggleAcc = toggleAcc;
