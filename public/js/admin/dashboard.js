/**
 * ZEISKIN Admin — Dashboard (Stats)
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!AdminAuth.init()) return;
  await loadStats();
  await loadLowStock();
  await loadRecentOrders();
});

let chart = null;

async function loadStats(period = '30') {
  try {
    const data = await API.Orders.getStats(period);

    // KPIs
    setText('kpi-total-clicks',  data.totalClicks);
    setText('kpi-period-clicks', data.periodClicks);
    setText('kpi-total-revenue', formatPrice(data.totalRevenue, 'FCFA'));

    // Load product/category counts
    const [products, categories] = await Promise.all([
      API.Products.getAllAdmin({ limit: 1 }),
      API.Categories.getAllAdmin()
    ]);
    setText('kpi-products', products.total || 0);
    setText('kpi-categories', categories.length || 0);

    // Chart
    renderChart(data.chartData, period);

    // Recent orders
    renderRecentOrders(data.recentOrders);
  } catch (e) {
    console.error('Stats error:', e);
    showToast('Erreur chargement stats', 'error');
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderChart(chartData, period) {
  const ctx = document.getElementById('clicks-chart');
  if (!ctx) return;

  // Fill missing days with 0
  const labels = [];
  const counts = [];
  const revenues = [];
  const days = Number(period);
  const dataMap = {};
  chartData.forEach(d => { dataMap[d.date] = d; });

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
    counts.push(dataMap[key]?.count || 0);
    revenues.push(dataMap[key]?.revenue || 0);
  }

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Commandes WhatsApp',
          data: counts,
          borderColor: '#C27B5A',
          backgroundColor: 'rgba(194,123,90,.12)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#C27B5A',
          pointRadius: 4,
          borderWidth: 2.5
        },
        {
          label: 'Revenus estimés (FCFA)',
          data: revenues,
          borderColor: '#6BAE75',
          backgroundColor: 'rgba(107,174,117,.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6BAE75',
          pointRadius: 4,
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, pointStyleWidth: 10, font: { family: 'DM Sans', size: 12 } } },
        tooltip: {
          backgroundColor: '#2C2220',
          titleFont: { family: 'DM Sans', size: 12 },
          bodyFont: { family: 'DM Sans', size: 12 },
          padding: 12, cornerRadius: 8,
          callbacks: {
            label: ctx => ctx.datasetIndex === 1
              ? ` ${new Intl.NumberFormat('fr-FR').format(ctx.raw)} FCFA`
              : ` ${ctx.raw} commande${ctx.raw !== 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#9A8F8A' } },
        y: { beginAtZero: true, min: 0, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#9A8F8A', stepSize: 1 } },
        y1: { display: false, beginAtZero: true }
      }
    }
  });
}

async function loadLowStock() {
  try {
    const data = await API.Products.getAllAdmin({ limit: 50 });
    const lowStock = data.products.filter(p => p.stock <= 5 && p.isActive);
    const container = document.getElementById('low-stock-list');
    if (!container) return;
    if (!lowStock.length) {
      container.innerHTML = '<p style="color:var(--muted);font-size:.875rem;text-align:center;padding:20px">Aucun produit en rupture ✓</p>';
      return;
    }
    container.innerHTML = lowStock.map(p => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:40px;height:48px;border-radius:6px;overflow:hidden;background:var(--blush);flex-shrink:0">
          <img src="${p.images?.[0]?.url || ''}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">
        </div>
        <div style="flex:1;min-width:0">
          <p style="font-size:.84rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</p>
          <p style="font-size:.75rem;color:${p.stock === 0 ? 'var(--error)' : 'var(--warning)'}">
            ${p.stock === 0 ? '⚠ Rupture' : `⚠ Stock bas : ${p.stock}`}
          </p>
        </div>
        <a href="/admin/products.html" style="font-size:.75rem;color:var(--terracotta);white-space:nowrap">Modifier →</a>
      </div>
    `).join('');
  } catch (e) { /* ignore */ }
}

async function renderRecentOrders(orders) {
  const body = document.getElementById('recent-orders-body');
  if (!body) return;
  if (!orders?.length) {
    body.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--muted)">Aucune commande encore</td></tr>';
    return;
  }
  body.innerHTML = orders.map(o => `
    <tr>
      <td style="font-size:.8rem;color:var(--muted)">${formatDate(o.clickedAt)}</td>
      <td>
        <div style="font-size:.8rem">${o.cartItems.map(i => `${i.name} ×${i.quantity}`).join(', ')}</div>
      </td>
      <td><strong style="color:var(--terracotta)">${formatPrice(o.total, 'FCFA')}</strong></td>
      <td><span class="status-badge status-active">Envoyé</span></td>
    </tr>
  `).join('');
}

// Period selector
document.querySelectorAll('[data-period]').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    loadStats(this.dataset.period);
  });
});
