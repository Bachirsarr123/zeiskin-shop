/**
 * ZEISKIN — Admin Orders Manager
 */

const AdminOrders = {
  currentPage: 1,
  limit: 20,

  async init() {
    this.bindEvents();
    this.loadOrders();
  },

  async loadOrders(page = 1) {
    this.currentPage = page;
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    try {
      const data = await API.Orders.getAll({ page: this.currentPage, limit: this.limit });
      
      document.getElementById('orders-count').textContent = `${data.total} commande${data.total !== 1 ? 's' : ''}`;

      if (data.orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted)">Aucune commande pour le moment.</td></tr>';
        return;
      }

      const currency = 'FCFA'; // Default or from settings

      tbody.innerHTML = data.orders.map(order => {
        const date = new Date(order.clickedAt).toLocaleString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        const itemsHtml = order.cartItems.map(item => 
          `<div class="order-items"><strong>${item.name}</strong>${item.variant ? ` (${item.variant})` : ''} x${item.quantity}</div>`
        ).join('');

        const totalQty = order.cartItems.reduce((sum, item) => sum + item.quantity, 0);

        return `
          <tr>
            <td style="white-space:nowrap">${date}</td>
            <td>${itemsHtml}</td>
            <td>${totalQty}</td>
            <td class="order-total">${formatPrice(order.total, currency)}</td>
            <td>
               <span class="status-pill status-success">WhatsApp</span>
            </td>
          </tr>
        `;
      }).join('');

    } catch (error) {
      console.error('Error loading orders:', error);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--error)">Erreur lors du chargement des commandes.</td></tr>';
    }
  },

  bindEvents() {
    // Add pagination event listeners if needed
  }
};

// Override API.Orders.getAll if it doesn't exist yet in api.js
if (!API.Orders.getAll) {
  API.Orders.getAll = async function(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/orders/all?${query}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('zeiskin_token')}` }
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  };
}

document.addEventListener('DOMContentLoaded', () => AdminOrders.init());
