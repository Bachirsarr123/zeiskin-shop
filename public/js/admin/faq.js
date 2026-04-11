/**
 * ZEISKIN Admin — FAQ Management
 */

const AdminFaq = {
  faqs: [],
  currentId: null,

  async init() {
    if (!AdminAuth.init()) return;
    await this.load();
  },

  async load() {
    const tbody = document.getElementById('faq-tbody');
    try {
      this.faqs = await API.Faq.getAllAdmin();
      document.getElementById('faq-count').textContent = this.faqs.length;

      if (!this.faqs.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted)">Aucune question enregistrée.</td></tr>';
        return;
      }

      tbody.innerHTML = this.faqs.map(faq => `
        <tr>
          <td><span class="badge badge-promo" style="background:var(--blush-dark);color:var(--charcoal)">${faq.order}</span></td>
          <td style="font-weight:500">${faq.question}</td>
          <td style="font-size:.85rem;color:var(--muted);max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${faq.answer}
          </td>
          <td>
            <span class="status-badge ${faq.isActive ? 'status-active' : 'status-inactive'}">
              ${faq.isActive ? 'Actif' : 'Inactif'}
            </span>
          </td>
          <td>
            <div style="display:flex;gap:8px">
              <button class="btn btn-secondary btn-sm" onclick="AdminFaq.openEdit('${faq.id}')">Modifier</button>
              <button class="btn btn-secondary btn-sm" style="color:var(--error)" onclick="AdminFaq.delete('${faq.id}')">Suppr.</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      showToast('Erreur chargement FAQ', 'error');
    }
  },

  openAdd() {
    this.currentId = null;
    document.getElementById('modal-title').textContent = 'Ajouter une question';
    document.getElementById('faq-form').reset();
    document.getElementById('faq-modal').classList.add('open');
  },

  openEdit(id) {
    const faq = this.faqs.find(f => String(f.id) === String(id));
    if (!faq) return;

    this.currentId = id;
    document.getElementById('modal-title').textContent = 'Modifier la question';
    document.getElementById('faq-question').value = faq.question;
    document.getElementById('faq-answer').value = faq.answer;
    document.getElementById('faq-order').value = faq.order;
    document.getElementById('faq-active').value = String(faq.isActive);
    document.getElementById('faq-modal').classList.add('open');
  },

  closeModal() {
    document.getElementById('faq-modal').classList.remove('open');
  },

  async save() {
    const data = {
      question: document.getElementById('faq-question').value,
      answer: document.getElementById('faq-answer').value,
      order: parseInt(document.getElementById('faq-order').value) || 0,
      isActive: document.getElementById('faq-active').value === 'true'
    };

    if (!data.question || !data.answer) {
      return showToast('Veuillez remplir tous les champs requis', 'error');
    }

    try {
      if (this.currentId) {
        await API.Faq.update(this.currentId, data);
        showToast('Question mise à jour ✓');
      } else {
        await API.Faq.create(data);
        showToast('Question ajoutée ✓');
      }
      this.closeModal();
      this.load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  },

  async delete(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette question ?')) return;
    try {
      await API.Faq.delete(id);
      showToast('Question supprimée ✓');
      this.load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => AdminFaq.init());
