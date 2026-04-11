/**
 * ZEISKIN — Cart Manager + WhatsApp Checkout
 */

const CART_KEY = 'zeiskin_cart';

const Cart = {
  items: [],
  settings: null,

  async init() {
    this.load();
    this.updateBadge();
    this.bindEvents();
    // Load settings for WhatsApp number
    try {
      this.settings = await API.Settings.get();
    } catch (e) {
      this.settings = { whatsappNumber: '+221703046152', shopName: 'ZEISKIN', currency: 'FCFA' };
    }
  },

  load() {
    try { this.items = JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { this.items = []; }
  },

  save() {
    localStorage.setItem(CART_KEY, JSON.stringify(this.items));
    this.updateBadge();
    this.renderCart();
  },

  add(product, quantity = 1, variant = '') {
    const key = `${product._id}-${variant}`;
    const existing = this.items.find(i => i.key === key);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, 99);
    } else {
      this.items.push({
        key,
        productId: product._id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        imageUrl: product.images?.[0]?.url || '/img/placeholder.svg',
        variant,
        quantity
      });
    }
    this.save();
    showToast(`${product.name} ajouté au panier ✓`);
    this.openCart();
  },

  remove(key) {
    this.items = this.items.filter(i => i.key !== key);
    this.save();
  },

  updateQty(key, delta) {
    const item = this.items.find(i => i.key === key);
    if (!item) return;
    item.quantity = Math.max(1, Math.min(99, item.quantity + delta));
    this.save();
  },

  clear() {
    this.items = [];
    this.save();
  },

  getTotal() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  },

  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.getCount();
    badges.forEach(b => {
      b.textContent = count > 99 ? '99+' : count;
      b.classList.toggle('visible', count > 0);
    });
  },

  openCart() {
    document.getElementById('side-cart')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeCart() {
    document.getElementById('side-cart')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  },

  renderCart() {
    const container = document.getElementById('cart-items');
    const emptyState = document.getElementById('cart-empty');
    const footer = document.getElementById('cart-footer');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = '';
      emptyState?.classList.remove('hidden');
      footer?.classList.add('hidden');
      return;
    }

    emptyState?.classList.add('hidden');
    footer?.classList.remove('hidden');

    const currency = this.settings?.currency || 'FCFA';

    container.innerHTML = this.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <div class="cart-item__img">
          <img src="${item.imageUrl}" alt="${item.name}" onerror="this.src='/img/placeholder.svg'">
        </div>
        <div class="cart-item__info">
          <p class="cart-item__name">${item.name}</p>
          ${item.variant ? `<p class="cart-item__variant">${item.variant}</p>` : ''}
          <div class="cart-item__qty">
            <button class="qty-btn" onclick="Cart.updateQty('${item.key}', -1)">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="Cart.updateQty('${item.key}', +1)">+</button>
          </div>
          <p class="cart-item__price">${formatPrice(item.price * item.quantity, currency)}</p>
        </div>
        <button class="cart-item__remove" onclick="Cart.remove('${item.key}')" title="Retirer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    `).join('');

    // Update totals
    const total = this.getTotal();
    const totalEl  = document.getElementById('cart-total-amount');
    if (totalEl) totalEl.textContent = formatPrice(total, currency);
  },

  generateWhatsAppMessage() {
    const currency = this.settings?.currency || 'FCFA';
    const shopName = this.settings?.shopName || 'ZEISKIN';
    const template = this.settings?.whatsappMessageTemplate || '';

    const itemsList = this.items.map(item =>
      `• ${item.name}${item.variant ? ` (${item.variant})` : ''} x${item.quantity} — ${formatPrice(item.price * item.quantity, currency)}`
    ).join('\n');

    const total = formatPrice(this.getTotal(), currency);

    let message = template
      .replace('{ITEMS}', itemsList)
      .replace('{TOTAL}', total)
      .replace('{SHOP}', shopName);

    // Fallback message
    if (!message) {
      message = `Bonjour ${shopName} 🌿\n\nJe souhaite valider ma commande :\n\n🛒 *Mes articles :*\n${itemsList}\n\n💰 *Total : ${total}*\n\n📦 *Mes coordonnées de livraison :*\nNom : \nAdresse : \nTéléphone : \nVille :`;
    }

    return message;
  },

  async checkout() {
    if (this.items.length === 0) {
      showToast('Votre panier est vide', 'error');
      return;
    }

    const btn = document.getElementById('whatsapp-checkout-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Redirection...`;
    }

    // Track the click
    try {
      await API.Orders.track({
        cartItems: this.items,
        total: this.getTotal(),
        currency: this.settings?.currency || 'FCFA'
      });
    } catch (e) { /* silent fail — don't block checkout */ }

    // Generate WhatsApp link
    const message = this.generateWhatsAppMessage();
    const phone = (this.settings?.whatsappNumber || '+221703046152').replace(/\D/g, '');
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp
    setTimeout(() => {
      window.open(waUrl, '_blank');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Commander via WhatsApp`;
      }
    }, 500);
  },

  bindEvents() {
    // Cart icon toggle
    document.querySelectorAll('[data-cart-open]').forEach(btn => {
      btn.addEventListener('click', () => this.openCart());
    });
    // Close
    document.getElementById('cart-close')?.addEventListener('click', () => this.closeCart());
    document.getElementById('cart-overlay')?.addEventListener('click', () => this.closeCart());
    // Checkout
    document.getElementById('whatsapp-checkout-btn')?.addEventListener('click', () => this.checkout());

    this.renderCart();
  }
};

// Spinner CSS inline
const style = document.createElement('style');
style.textContent = `.spin { animation: spin .8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => Cart.init());
window.Cart = Cart;
