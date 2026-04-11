const fs = require('fs');
const files = ['dashboard.html', 'products.html', 'categories.html', 'settings.html', 'orders.html'];
const link = '<a href="/admin/faq.html" class="nav-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>FAQ</a>';

files.forEach(f => {
  const p = 'public/admin/' + f;
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  if(!content.includes('faq.html')) {
    // Insert before "Configuration" section title
    content = content.replace(/<p class=\"nav-section-title\">Configuration<\/p>/, link + '\n      <p class="nav-section-title">Configuration</p>');
    fs.writeFileSync(p, content);
  }
});
