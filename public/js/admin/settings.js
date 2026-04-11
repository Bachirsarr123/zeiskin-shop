/**
 * ZEISKIN Admin — Settings
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!AdminAuth.init()) return;
  await loadSettings();
  bindSettingsEvents();
  bindPasswordEvents();
});

async function loadSettings() {
  try {
    const settings = await API.Settings.get();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('wa-number', settings.whatsappNumber);
    set('shop-name', settings.shopName);
    set('shop-email', settings.shopEmail);
    set('shop-address', settings.shopAddress);
    set('currency', settings.currency);
    set('instagram', settings.instagramUrl);
    set('facebook', settings.facebookUrl);
    set('tiktok', settings.tiktokUrl);
    set('wa-message', settings.whatsappMessageTemplate);
    set('hero-title', settings.heroTitle);
    set('hero-subtitle', settings.heroSubtitle);
  } catch (e) {
    showToast('Erreur chargement paramètres', 'error');
  }
}

function bindSettingsEvents() {
  document.getElementById('settings-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true; btn.textContent = 'Sauvegarde...';
    try {
      const settings = {
        whatsappNumber: document.getElementById('wa-number')?.value.trim(),
        shopName: document.getElementById('shop-name')?.value.trim(),
        shopEmail: document.getElementById('shop-email')?.value.trim(),
        shopAddress: document.getElementById('shop-address')?.value.trim(),
        currency: document.getElementById('currency')?.value.trim(),
        instagramUrl: document.getElementById('instagram')?.value.trim(),
        facebookUrl: document.getElementById('facebook')?.value.trim(),
        tiktokUrl: document.getElementById('tiktok')?.value.trim(),
        whatsappMessageTemplate: document.getElementById('wa-message')?.value,
        heroTitle: document.getElementById('hero-title')?.value.trim(),
        heroSubtitle: document.getElementById('hero-subtitle')?.value.trim(),
      };
      await API.Settings.update(settings);
      showToast('Paramètres sauvegardés ✓');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Sauvegarder les paramètres';
    }
  });
}

function bindPasswordEvents() {
  document.getElementById('password-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]');
    const current = document.getElementById('current-password')?.value;
    const newPass  = document.getElementById('new-password')?.value;
    const confirm  = document.getElementById('confirm-password')?.value;

    if (newPass !== confirm) { showToast('Les mots de passe ne correspondent pas', 'error'); return; }
    if (newPass.length < 8)  { showToast('Minimum 8 caractères requis', 'error'); return; }

    btn.disabled = true; btn.textContent = 'Modification...';
    try {
      await API.Auth.changePassword({ currentPassword: current, newPassword: newPass });
      showToast('Mot de passe modifié ✓');
      e.target.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Changer le mot de passe';
    }
  });
}
