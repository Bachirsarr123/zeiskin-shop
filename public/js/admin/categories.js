/**
 * ZEISKIN Admin — Catégories CRUD
 */

const AdminCategories = {
  categories: [],
  editingId: null,

  async init() {
    if (!AdminAuth.init()) return;
    await this.load();
  },

  async load() {
    try {
      this.categories = await API.Categories.getAllAdmin();
      const el = document.getElementById('categories-count');
      if (el) el.textContent = `${this.categories.length} catégorie(s)`;
      this.render();
    } catch (e) {
      showToast('Erreur chargement', 'error');
    }
  },

  render() {
    const tbody = document.getElementById('categories-tbody');
    if (!tbody) return;

    if (!this.categories.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:32px">Aucune catégorie</td></tr>';
      return;
    }

    tbody.innerHTML = this.categories.map(c => `
      <tr>
        <td>
          <div style="width:40px;height:40px;background:#f5f5f5;border-radius:6px;overflow:hidden">
            ${c.image ? `<img src="${c.image.url}" style="width:100%;height:100%;object-fit:cover">` : ''}
          </div>
        </td>
        <td style="font-weight:500">${c.name}</td>
        <td style="color:var(--muted);font-size:.875rem">${c.description || '-'}</td>
        <td>${c.productCount || 0}</td>
        <td>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="AdminCategories.openEdit('${c._id}')">Editer</button>
            <button class="btn btn-danger btn-sm" onclick="AdminCategories.deleteCategory('${c._id}')">Supprimer</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openAdd() {
    this.editingId = null;
    document.getElementById('modal-title').textContent = 'Ajouter une catégorie';
    document.getElementById('category-form').reset();
    document.getElementById('category-modal').classList.add('open');
  },

  openEdit(id) {
    const cat = this.categories.find(c => String(c._id) === String(id));
    if (!cat) return;
    this.editingId = id;
    document.getElementById('modal-title').textContent = 'Modifier la catégorie';
    document.getElementById('cat-name').value = cat.name;
    document.getElementById('cat-desc').value = cat.description || '';
    document.getElementById('category-modal').classList.add('open');
  },

  closeModal() {
    document.getElementById('category-modal').classList.remove('open');
  },

  async saveCategory() {
    const name = document.getElementById('cat-name').value;
    if (!name) return alert('Nom requis');

    const fd = new FormData();
    fd.append('name', name);
    fd.append('description', document.getElementById('cat-desc').value);
    const file = document.getElementById('cat-image').files[0];
    if (file) fd.append('image', file);

    try {
      if (this.editingId) {
        await API.Categories.update(this.editingId, fd);
        showToast('Modifiée !');
      } else {
        await API.Categories.create(fd);
        showToast('Ajoutée !');
      }
      this.closeModal();
      this.load();
    } catch (e) {
      showToast('Erreur', 'error');
    }
  },

  async deleteCategory(id) {
    if (!confirm('Supprimer cette catégorie ? Les produits perdront cette affiliation.')) return;
    try {
      await API.Categories.delete(id);
      showToast('Supprimée !');
      this.load();
    } catch (e) {
      showToast('Erreur', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => AdminCategories.init());
window.AdminCategories = AdminCategories;
