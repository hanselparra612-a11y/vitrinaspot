
function getTelegramLink(telegram, message) {
  if (!telegram) return null;
  const cleanUser = String(telegram).trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '').replace(/\/$/, '');
  if (!cleanUser) return null;
  const msgParam = message ? '?text=' + encodeURIComponent(message) : '';
  return 'https://t.me/' + cleanUser + msgParam;
}
window.getTelegramLink = getTelegramLink;
function triggerOpenUploadModal() {
  document.getElementById('user-dropdown-menu')?.classList.remove('show');
  const uploadModal = document.getElementById('modal-upload');
  if (!uploadModal) return;
  const nameInput = document.getElementById('upload-store-name');
  const waInput = document.getElementById('upload-whatsapp');
  if (state.currentStore) {
    if (nameInput) nameInput.value = state.currentStore.name;
    if (waInput) waInput.value = (state.currentStore.whatsapp || '').replace('+57', '').replace(/[^0-9]/g, '');
  } else {
    if (nameInput) nameInput.value = '';
    if (waInput) waInput.value = '';
  }
  refreshUploadMembershipUI();
  renderDynamicPlansUI();
  uploadModal.style.display = 'flex';
}
window.triggerOpenUploadModal = triggerOpenUploadModal;

/**
 * =========================================================
 * VITRINASPOT - OFFICIAL JAVASCRIPT ENGINE
 * "Tu vitrina digital, directo a WhatsApp"
 * =========================================================
 */

// Estado global de la aplicación
const state = {
  videos: [],
  stores: [],
  currentIndex: 0,
  currentCity: 'Toda Colombia',
  currentCategory: 'Todas',
  currentStoreFilter: null, // Filtro de tienda activa en el feed
  searchQuery: '',
  feedViewMode: 'immersive', // 'immersive' (1x1) o 'grid' (2x2)
  currentAppMode: 'vitrina', // 'vitrina' (Catálogo comercial limpio de fotos)
  spotPlayMuted: true, // Silenciado por defecto para compatibilidad móvil con autoplay
  isSoundEnabled: false,
  currentPhotoIndex: 0, // Índice de la foto activa del producto (1 a 5)
  savedVideoIds: new Set(JSON.parse((() => { try { return localStorage.getItem('vitrina_saved'); } catch(e) { return '[]'; } })() || '[]')),
  likedVideoIds: new Set(JSON.parse((() => { try { return localStorage.getItem('vitrina_likes'); } catch(e) { return '[]'; } })() || '[]')),
  reportedVideoIds: new Set(JSON.parse((() => { try { return localStorage.getItem('vitrina_reported_spots'); } catch(e) { return '[]'; } })() || '[]')),
  currentStore: null, // Tienda activa en sesión
  adminToken: (() => { try { return localStorage.getItem('vitrina_admin_token'); } catch(e) { return null; } })(),
  pricing: {
    free_spots_quota: 100,
    spot_permanent_price: 0,
    boost_standard_standalone_price: 0,
    photos_5_price: 0,
    boost_standard_price: 5000,
    boost_standard_days: 2,
    boost_platino_price: 10000,
    boost_platino_days: 5,
    boost_diamante_price: 15000,
    boost_diamante_days: 8,
    boost_extreme_price: 15000,
    boost_extreme_days: 8,
    membership_pro_price: 29000,
    membership_pro_days: 30,
    membership_product_limit: 100,
    currency: "COP"
  },
  launchCampaign: {
    welcome_pack_enabled: false,
    free_welcome_products_quota: 999999,
    pioneers_target: 1000,
    lock_boosts_until_target: false,
    current_pioneers_count: 0,
    remaining_pioneers_slots: 0,
    boosts_locked: false
  }
};
window.state = state;

// Alternador global de visualización de contraseña (ojito ver/ocultar)
window.setupPasswordEye = function(btnId, inputId, iconId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!btn || !input) return;

  if (btn._hasEyeListener) return;
  btn._hasEyeListener = true;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (icon) {
      if (isPass) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        btn.style.color = 'var(--spot-gold, #ffb800)';
      } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        btn.style.color = 'var(--text-muted, #94a3b8)';
      }
    }
  });
};

// ==========================================
// 1. INICIALIZACIÓN
// ==========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    initApp();
  });
} else {
  initApp();
}

async function initApp() {
  setupEventListeners();
  setupAdminSecretTriggers();
  await loadPricing();
  await loadStores();
  await loadVideos();
  updateSavedBadge();
  handleSharedUrlParams();
  handleSpotPlaySSO();

  // Detección de ruta secreta /admin (soporta /admin, ?admin=1 y #admin)
  if (window.location.pathname.includes('/admin') || window.location.search.includes('admin') || window.location.hash.includes('admin')) {
    openAdminPortal();
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('admin')) openAdminPortal();
  });

  // Calibración anti-hundimiento de pantalla en móviles
  adjustFeedContainerHeight();
  window.addEventListener('resize', adjustFeedContainerHeight);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', adjustFeedContainerHeight);
  }
  window.addEventListener('orientationchange', () => setTimeout(adjustFeedContainerHeight, 150));
}

// 🛡️ ACCESO SECRETO AL PANEL MAESTRO (DISCRETO Y EXCLUSIVO PARA EL DUEÑO)
// Tocar 4 veces seguidas el logo de VitrinaSpot o mantener presionado 2.5s activa el login maestro
function setupAdminSecretTriggers() {
  const brandLogo = document.getElementById('brand-logo-display');
  if (!brandLogo || brandLogo._secretBound) return;
  brandLogo._secretBound = true;

  let tapCount = 0;
  let tapTimer = null;
  let pressTimer = null;

  brandLogo.addEventListener('click', () => {
    if (typeof window.expandVitrinaHeader === 'function') {
      window.expandVitrinaHeader();
    }
    tapCount++;
    if (tapTimer) clearTimeout(tapTimer);
    if (tapCount >= 4) {
      tapCount = 0;
      openAdminPortal();
      showToast('🛡️ Portal de Administrador Maestro activado');
      return;
    }
    tapTimer = setTimeout(() => {
      tapCount = 0;
    }, 1400);
  });

  brandLogo.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => {
      openAdminPortal();
      showToast('🛡️ Portal de Administrador Maestro activado');
    }, 2400);
  }, { passive: true });

  brandLogo.addEventListener('touchend', () => {
    if (pressTimer) clearTimeout(pressTimer);
  }, { passive: true });

  brandLogo.addEventListener('touchmove', () => {
    if (pressTimer) clearTimeout(pressTimer);
  }, { passive: true });

  // Disparador secreto también en el botón de perfil / foto de usuario (5 toques rápidos)
  const profileBtn = document.getElementById('btn-user-profile-menu');
  if (profileBtn && !profileBtn._secretBound) {
    profileBtn._secretBound = true;
    let pTapCount = 0;
    let pTapTimer = null;
    profileBtn.addEventListener('click', (e) => {
      pTapCount++;
      if (pTapTimer) clearTimeout(pTapTimer);
      if (pTapCount >= 5) {
        e.stopPropagation();
        pTapCount = 0;
        openAdminPortal();
        showToast('🛡️ Portal de Administrador Maestro activado');
        return;
      }
      pTapTimer = setTimeout(() => { pTapCount = 0; }, 1500);
    });
  }
}

// Generador de enlaces públicos universales (Funciona en PC Local, LAN y Celulares en todo el país)
function getPublicShareUrl(path = '') {
  const configuredPublic = state.publicUrl || (state.pricing && state.pricing.public_url);
  const isLocalHost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' || 
                      window.location.hostname.startsWith('192.168.') ||
                      window.location.hostname.startsWith('10.');

  let base = window.location.origin;
  if (isLocalHost) {
    base = configuredPublic || 'https://eco-dock-chart-locking.trycloudflare.com';
  }

  base = base.replace(/\/+$/, '');
  if (!path) return base;
  if (path.startsWith('?')) return `${base}/${path}`;
  if (path.startsWith('/')) return `${base}${path}`;
  return `${base}/${path}`;
}
window.getPublicShareUrl = getPublicShareUrl;

// Manejador de Enlaces Compartidos Directos (Deep Linking para Productos y Tiendas)
function handleSharedUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedVideoId = urlParams.get('v');
  const sharedStoreId = urlParams.get('store');

  if (sharedVideoId && state.videos && state.videos.length > 0) {
    const targetIdx = state.videos.findIndex(v => v.id === sharedVideoId);
    if (targetIdx > -1) {
      // Reordenar para que el producto compartido esté de primero absoluto
      const [targetVideo] = state.videos.splice(targetIdx, 1);
      state.videos.unshift(targetVideo);
      state._sharedTargetVideoId = sharedVideoId;
      
      renderContinuousFeed();

      setTimeout(() => {
        const cardEl = document.getElementById(`card-${sharedVideoId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        showToast(`✨ Viendo producto compartido: ${targetVideo.title}`);
      }, 350);
    }
  } else if (sharedStoreId) {
    setTimeout(() => {
      openStoreCatalog(sharedStoreId);
    }, 400);
  }
}
window.handleSharedUrlParams = handleSharedUrlParams;

// Manejador de Single Sign-On (SSO) y Vinculación desde Spot Play
async function handleSpotPlaySSO() {
  const urlParams = new URLSearchParams(window.location.search);
  const isSSO = urlParams.get('sso') === '1';
  const spotPlayUid = urlParams.get('uid');
  if (!isSSO || !spotPlayUid || spotPlayUid === 'guest') return;

  const creatorName = urlParams.get('name') || '';
  const creatorAvatar = urlParams.get('avatar') || '';
  const creatorEmail = urlParams.get('email') || '';

  try {
    const res = await fetch('/api/auth/sso-spotplay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spotPlayUid,
        name: creatorName,
        avatar: creatorAvatar,
        email: creatorEmail
      })
    });
    const data = await res.json();
    if (res.ok && data.exists && data.store) {
      state.currentStore = data.store;
      localStorage.setItem('vitrina_current_store_id', data.store.id);
      updateNavStoreUI();
      showToast(`✨ ¡Bienvenido de nuevo, ${data.store.name}! Tu Vitrina está sincronizada.`);
      if (urlParams.get('open_store') === '1' && typeof openStoreCatalog === 'function') {
        openStoreCatalog(data.store.id);
      }
      const cleanUrl = window.location.pathname + (urlParams.get('v') ? `?v=${urlParams.get('v')}` : '');
      window.history.replaceState({}, document.title, cleanUrl);
    } else if (data.needsRegistration) {
      const modal = document.getElementById('modal-sso-activate-store');
      if (modal) {
        const uidInput = document.getElementById('sso-user-uid');
        if (uidInput) uidInput.value = spotPlayUid;
        const avatarInput = document.getElementById('sso-user-avatar');
        if (avatarInput) avatarInput.value = creatorAvatar;
        const emailInput = document.getElementById('sso-user-email');
        if (emailInput) emailInput.value = creatorEmail;

        const previewAvatar = document.getElementById('sso-user-preview-avatar');
        if (previewAvatar) {
          previewAvatar.src = creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
        }
        const previewName = document.getElementById('sso-user-preview-name');
        if (previewName) previewName.textContent = creatorName || 'Creador Spot Play';

        const storeNameInput = document.getElementById('sso-store-name');
        if (storeNameInput && !storeNameInput.value) {
          storeNameInput.value = creatorName || '';
        }
        modal.style.display = 'flex';
      }
    }
  } catch (err) {
    console.error('Error procesando SSO Spot Play:', err);
  }
}
window.handleSpotPlaySSO = handleSpotPlaySSO;

// 🔐 Sincronización Automática SSO en Tiempo Real desde Spot Play (postMessage)
window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SPOTPLAY_AUTH_SYNC' && event.data.user) {
    const u = event.data.user;
    if (!u.id || u.id === 'guest') return;
    try {
      const res = await fetch('/api/auth/sso-spotplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotPlayUid: u.id,
          name: u.name || '',
          avatar: u.avatar || '',
          email: u.email || ''
        })
      });
      const data = await res.json();
      if (res.ok && data.exists && data.store) {
        state.currentStore = data.store;
        localStorage.setItem('vitrina_current_store_id', data.store.id);
        updateNavStoreUI();
        if (typeof showToast === 'function') {
          showToast(`✨ ¡Bienvenido, ${data.store.name}! Sincronizado con Spot Play.`);
        }
      }
    } catch (e) {
      console.warn('Sync auth postMessage error:', e);
    }
  }
});

// Carga de tarifas dinámicas oficiales desde el servidor
async function loadPricing() {
  try {
    const res = await fetch('/api/pricing');
    const data = await res.json();
    if (data.success && data.pricing) {
      state.pricing = Object.assign(state.pricing, data.pricing);
      if (data.public_url) {
        state.publicUrl = data.public_url;
      }
      if (data.launch_campaign) {
        state.launchCampaign = Object.assign(state.launchCampaign, data.launch_campaign);
      }
      renderLaunchCampaignUI();
      renderDynamicPlansUI();
    }
  } catch (err) {
    console.warn('Usando tarifas locales por defecto:', err);
  }
}

function renderLaunchCampaignUI() {
  const camp = state.launchCampaign || {};
  const banner = document.getElementById('launch-pioneer-banner');
  if (banner) banner.style.display = 'none';
}

function renderDynamicPlansUI() {
  const p = state.pricing;

  // Card 1: Publicación Gratuita (Hasta 100 Spots Gratis de 7 fotos)
  const c1 = document.querySelector('.video-plan-card[data-plan="photos_7"], .video-plan-card[data-plan="photos_5"]');
  const freeQuota = Number(p.free_spots_quota) || 5;
  const storeCount = state.currentStore && state.videos 
    ? state.videos.filter(v => v.storeId === state.currentStore.id).length 
    : 0;
  const isMemActive = Boolean(
    state.currentStore &&
    state.currentStore.hasMembership &&
    (!state.currentStore.membershipExpiresAt || new Date(state.currentStore.membershipExpiresAt) > new Date())
  );
  const isLocked = !isMemActive && storeCount >= freeQuota;
  const freeRem = Math.max(0, freeQuota - storeCount);

  // Mostrar u ocultar banner de cupo completado
  const lockedBanner = document.getElementById('upload-free-quota-locked-banner');
  if (lockedBanner) {
    lockedBanner.style.display = isLocked ? 'flex' : 'none';
    if (isLocked) {
      const lockStrong = lockedBanner.querySelector('strong');
      if (lockStrong) lockStrong.textContent = `🔒 Cupo Gratuito Alcanzado (${storeCount} de ${freeQuota} Spots Usados)`;
      const lockP = lockedBanner.querySelector('p');
      if (lockP) lockP.innerHTML = `Has utilizado todos tus ${freeQuota} spots gratuitos con carrusel de fotos. Si deseas ampliar el cupo de tu vitrina, contacta a soporte.`;
    }
  }

  // Actualizar dinámicamente el botón de registro de invitados
  const guestRegBtn = document.getElementById('btn-guest-register-trigger');
  if (guestRegBtn) {
    guestRegBtn.innerHTML = `<i class="fa-solid fa-store"></i> Crear Mi Tienda Gratis (${freeQuota} SPOTS GRATIS)`;
  }

  if (c1) {
    c1.setAttribute('data-price', '0');
    c1.classList.remove('plan-free-locked');
    const prEl = c1.querySelector('.plan-price');
    const bEl = c1.querySelector('.plan-badge-pill');
    const dEl = c1.querySelector('.plan-desc');
    const iconEl = c1.querySelector('.plan-icon');

    if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-gift text-gold"></i>';
    if (prEl) prEl.innerHTML = '<span style="color:#00ff88; font-weight:800;">100% GRATIS</span> <small style="font-size:0.75rem; color:#00ff88;">(HASTA 7 FOTOS)</small>';
    if (bEl) {
      bEl.className = 'plan-badge-pill';
      bEl.textContent = 'PUBLICACIONES ILIMITADAS · $0 COP';
      bEl.style.background = 'linear-gradient(135deg, var(--wa-green), #00c853)';
      bEl.style.color = '#000';
    }
    if (dEl) {
      dEl.textContent = 'Publica tus productos con hasta 7 fotos en alta definición y contacto directo a WhatsApp sin costo.';
    }
  }

  // Sincronizar el motor de beneficios en el modal de subida
  refreshUploadMembershipUI();
}

function refreshUploadMembershipUI() {
  const memBanner = document.getElementById('upload-membership-banner');
  const welcomeBanner = document.getElementById('upload-welcome-banner');
  const usedEl = document.getElementById('upload-membership-used');
  const totalEl = document.getElementById('upload-membership-total');
  const welcomeRemEl = document.getElementById('upload-welcome-remaining');
  const welcomeTotEl = document.getElementById('upload-welcome-total');

  const c1 = document.querySelector('.video-plan-card[data-plan="photos_7"], .video-plan-card[data-plan="photos_5"]');
  const c4 = document.querySelector('.video-plan-card[data-plan="membership_pro"]');
  const p = state.pricing || {};
  const camp = state.launchCampaign || {};

  const isMemActive = Boolean(
    state.currentStore &&
    state.currentStore.hasMembership &&
    (!state.currentStore.membershipExpiresAt || new Date(state.currentStore.membershipExpiresAt) > new Date())
  );

  const memLimit = Number(state.currentStore?.membershipProductLimit) || Number(p.membership_product_limit) || 100;
  const storeCount = Number(state.currentStore?.productsCount) || (state.videos ? state.videos.filter(v => v.storeId === state.currentStore?.id).length : 0);
  const hasMemQuota = storeCount < memLimit;

  if (welcomeBanner) welcomeBanner.style.display = 'none';
  if (memBanner) memBanner.style.display = 'none';

  const freeQuota = Number(p.free_spots_quota) || 5;
  const isLocked = !isMemActive && storeCount >= freeQuota;
  const freeRem = Math.max(0, freeQuota - storeCount);

  const lockedBanner = document.getElementById('upload-free-quota-locked-banner');
  if (lockedBanner) {
    lockedBanner.style.display = isLocked ? 'flex' : 'none';
  }

  if (c1) {
    c1.classList.remove('plan-free-locked');
    const prEl = c1.querySelector('.plan-price');
    const bgPill = c1.querySelector('.plan-badge-pill');
    const dEl = c1.querySelector('.plan-desc');
    const iconEl = c1.querySelector('.plan-icon');

    if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-gift text-gold"></i>';
    if (prEl) prEl.innerHTML = '<span style="color:#00ff88; font-weight:800;">100% GRATIS</span> <small style="font-size:0.75rem; color:#00ff88;">(HASTA 7 FOTOS)</small>';
    if (bgPill) {
      bgPill.className = 'plan-badge-pill';
      bgPill.textContent = 'PUBLICACIONES ILIMITADAS · $0 COP';
      bgPill.style.background = 'linear-gradient(135deg, var(--wa-green), #00c853)';
      bgPill.style.color = '#000';
    }
    if (dEl) {
      dEl.textContent = 'Publica tus productos con hasta 7 fotos en alta definición y contacto directo a WhatsApp sin costo.';
    }
  }
}

// ==========================================
// 2. CARGA DE TIENDAS Y HISTORIAS VIP (SPOTS)
// ==========================================
async function loadStores() {
  try {
    const res = await fetch('/api/stores');
    if (res.ok) {
      state.stores = await res.json();
      
      // Restaurar tienda previamente iniciada en este navegador específico (si existe)
      const savedStoreId = localStorage.getItem('vitrina_current_store_id');
      if (savedStoreId) {
        const found = state.stores.find(s => s.id === savedStoreId);
        if (found) {
          state.currentStore = found;
        } else {
          state.currentStore = null;
          localStorage.removeItem('vitrina_current_store_id');
        }
      } else {
        // Usuario nuevo o invitado: NO forzar ninguna tienda ajena
        state.currentStore = null;
      }
      updateNavStoreUI();
      renderStoriesBar();
    }
  } catch (err) {
    console.error('Error cargando tiendas:', err);
  }
}

function updateNavStoreUI() {
  window.updateUserDropdownUI = updateNavStoreUI;
  const navAvatar = document.getElementById('nav-store-avatar');
  const navGuestIcon = document.getElementById('nav-guest-icon');
  const navName = document.getElementById('nav-store-name');
  const dropTitle = document.getElementById('dropdown-store-title');
  const dropCity = document.getElementById('dropdown-store-city');
  const menuLogged = document.getElementById('user-menu-logged');
  const menuGuest = document.getElementById('user-menu-guest');
  const btnNavStore = document.getElementById('btn-nav-store-menu');

  if (state.currentStore) {
    if (navAvatar) {
      navAvatar.src = state.currentStore.avatar || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100&auto=format&fit=crop&q=80';
      navAvatar.style.display = 'block';
    }
    if (navGuestIcon) navGuestIcon.style.display = 'none';
    if (navName) navName.textContent = state.currentStore.name.split(' ')[0];
    if (dropTitle) dropTitle.textContent = state.currentStore.name;
    if (dropCity) dropCity.textContent = `${state.currentStore.city} • Verificado ☑️`;
    if (menuLogged) menuLogged.style.display = 'block';
    if (menuGuest) menuGuest.style.display = 'none';
    if (btnNavStore) {
      btnNavStore.style.borderColor = 'rgba(255, 184, 0, 0.4)';
      btnNavStore.style.background = 'var(--bg-card)';
    }
  } else {
    if (navAvatar) navAvatar.style.display = 'none';
    if (navGuestIcon) navGuestIcon.style.display = 'inline-block';
    if (navName) navName.textContent = 'Crear Tienda / Ingresar';
    if (menuLogged) menuLogged.style.display = 'none';
    if (menuGuest) menuGuest.style.display = 'block';
    if (btnNavStore) {
      btnNavStore.style.borderColor = 'rgba(255, 184, 0, 0.45)';
      btnNavStore.style.background = 'rgba(255, 184, 0, 0.08)';
    }
  }

  // Actualizar Botón Flotante "Mi Tienda" en Móviles (Debajo del botón +)
  const floatingMyStoreBtn = document.getElementById('btn-floating-my-store');
  if (floatingMyStoreBtn) {
    if (state.currentStore) {
      floatingMyStoreBtn.innerHTML = `
        <img src="${state.currentStore.avatar || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100&auto=format&fit=crop&q=80'}" alt="Mi Tienda" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100&auto=format&fit=crop&q=80';">
        <span class="my-store-fab-badge" style="position: absolute; bottom: -2px; right: -2px; width: 16px; height: 16px; background: #ffb800; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #000; border: 1.5px solid #0b0f19; font-weight: 900;">⭐</span>
      `;
      floatingMyStoreBtn.title = `Mi Negocio: ${state.currentStore.name}`;
      floatingMyStoreBtn.style.borderColor = 'rgba(255, 184, 0, 0.9)';
    } else {
      floatingMyStoreBtn.innerHTML = `
        <i class="fa-solid fa-store" style="font-size: 1.25rem; color: #ffb800;"></i>
      `;
      floatingMyStoreBtn.title = 'Crear Mi Tienda / Ingresar';
      floatingMyStoreBtn.style.borderColor = 'rgba(255, 184, 0, 0.6)';
    }
  }

  // Acceso al Panel Maestro: PRIVADO Y CONFIDENCIAL (SOLO VISIBLE PARA EL DUEÑO)
  // El público general y tiendas normales nunca ven este botón.
  const isOwner = Boolean(state.adminToken) || (state.currentStore && state.currentStore.email === 'admin@vitrinaspot.com');
  document.querySelectorAll('.btn-shortcut-admin-panel').forEach(btn => {
    if (isOwner) {
      btn.style.setProperty('display', 'flex', 'important');
      const labelSpan = btn.querySelector('.admin-btn-label');
      const tagSpan = btn.querySelector('.admin-btn-tag');
      if (labelSpan) {
        labelSpan.textContent = '🛡️ Panel Maestro';
      }
      if (tagSpan) {
        tagSpan.textContent = 'ACTIVO';
        tagSpan.style.background = 'rgba(46, 213, 115, 0.2)';
        tagSpan.style.color = '#2ed573';
      }
      btn.onclick = (e) => {
        e.stopPropagation();
        document.getElementById('user-dropdown-menu')?.classList.remove('show');
        openAdminPortal();
      };
    } else {
      btn.style.setProperty('display', 'none', 'important');
    }
  });

  refreshUploadMembershipUI();
}

function renderStoriesBar() {
  const pinnedSlot = document.getElementById('my-profile-pinned-slot');
  const scrollContainer = document.getElementById('stories-container');
  if (!scrollContainer) return;

  // 1. Círculo FIJO del Usuario / Mi Negocio (NUNCA se desplaza al deslizar las demás tiendas)
  if (pinnedSlot) {
    if (state.currentStore) {
      pinnedSlot.innerHTML = `
        <div class="story-item story-my-business-entry" id="story-my-business-btn" title="Mi Negocio: ${escapeHtml(state.currentStore.name)} (Toca para administrar)">
          <div class="story-ring my-store-ring-vip has-spot">
            <img class="story-avatar" src="${state.currentStore.avatar || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120&auto=format&fit=crop&q=80'}" alt="Mi Negocio" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120&auto=format&fit=crop&q=80';" loading="lazy">
            <span class="story-my-badge" title="Mi Negocio">⭐</span>
          </div>
          <span class="story-name my-story-name">⭐ Mi Negocio</span>
        </div>
      `;
    } else {
      pinnedSlot.innerHTML = `
        <div class="story-item story-my-business-entry" id="story-my-business-btn" title="Crear Mi Tienda / Ingresar">
          <div class="story-ring my-store-ring-vip guest-story-ring">
            <div class="story-guest-avatar">
              <i class="fa-solid fa-store"></i>
            </div>
            <span class="story-my-badge story-add-badge"><i class="fa-solid fa-plus"></i></span>
          </div>
          <span class="story-name my-story-name">Mi Tienda</span>
        </div>
      `;
    }

    // Escuchar clic y toque táctil en el Círculo Fijo #1 (Mi Negocio) -> Abre el menú de Mi Negocio
    const myBizBtn = document.getElementById('story-my-business-btn');
    if (myBizBtn) {
      myBizBtn.style.cursor = 'pointer';
      myBizBtn.setAttribute('role', 'button');
      myBizBtn.setAttribute('tabindex', '0');

      let touchMoved = false;
      myBizBtn.addEventListener('touchstart', () => { touchMoved = false; }, { passive: true });
      myBizBtn.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });
      myBizBtn.addEventListener('touchend', (e) => {
        if (!touchMoved) {
          e.preventDefault();
          e.stopPropagation();
          const userDropdown = document.getElementById('user-dropdown-menu');
          userDropdown?.classList.toggle('show');
        }
      });

      myBizBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const userDropdown = document.getElementById('user-dropdown-menu');
        userDropdown?.classList.toggle('show');
      });
    }
  }

  // 2. Tiendas de la plataforma (las que sí se deslizan horizontalmente)
  const otherStores = (state.stores || []).filter(s => !state.currentStore || s.id !== state.currentStore.id);

  scrollContainer.innerHTML = otherStores.map(store => {
    const isSelected = state.currentStoreFilter === store.id;
    return `
      <div class="story-item ${isSelected ? 'active-store-filter' : ''}" data-store-id="${store.id}" title="Ver publicaciones de ${escapeHtml(store.name)}">
        <div class="story-ring ${store.hasSpot ? 'has-spot' : ''} ${isSelected ? 'active-filter-ring' : ''}">
          <img class="story-avatar" src="${store.avatar || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120&auto=format&fit=crop&q=80'}" alt="${escapeHtml(store.name)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120&auto=format&fit=crop&q=80';" loading="lazy">
        </div>
        <span class="story-name">${escapeHtml(store.name)}</span>
      </div>
    `;
  }).join('');

  // Clic en las demás tiendas: filtra y muestra las publicaciones de esa tienda
  scrollContainer.querySelectorAll('.story-item[data-store-id]').forEach(el => {
    el.addEventListener('click', () => {
      const storeId = el.getAttribute('data-store-id');
      if (storeId) selectStoreFeed(storeId);
    });
  });
}
window.renderStoriesBar = renderStoriesBar;
window.renderStories = renderStoriesBar;

// ==========================================
// 🛍️ FILTRADO DE FEED POR TIENDA (DESLIZAR PUBLICACIONES Y FOTOS)
// Al tocar el perfil redondo de una tienda, abre el feed con sus publicaciones
// ==========================================
async function selectStoreFeed(storeId) {
  // Si se vuelve a tocar la misma tienda, alternar y volver a mostrar todo el catálogo
  if (state.currentStoreFilter === storeId) {
    clearStoreFilter();
    return;
  }

  const store = state.stores.find(s => s.id === storeId);
  if (!store) return;

  state.currentStoreFilter = storeId;

  try {
    const res = await fetch(`/api/videos?storeId=${storeId}&_t=${Date.now()}`);
    if (!res.ok) throw new Error('Error al consultar videos');
    const vids = await res.json();

    if (!vids || vids.length === 0) {
      showToast(`🏪 ${store.name} no tiene reels aún. Abriendo su catálogo...`);
      openStoreCatalog(storeId);
      return;
    }

    state.videos = vids;
    state.currentIndex = 0;

    // Activar vista de feed vertical (deslizable 9:16)
    showView('feed-view');

    // Actualizar anillo activo en la barra de historias
    renderStoriesBar();

    // Renderizar publicaciones para deslizar
    renderContinuousFeed();

    // Inyectar banner informativo flotante de la tienda
    renderActiveStoreBanner(store, vids.length);

    // Scroll al primer video
    const feedScroll = document.getElementById('feed-scroll-container');
    if (feedScroll) feedScroll.scrollTop = 0;

    showToast(`🛍️ Mostrando ${vids.length} publicación${vids.length === 1 ? '' : 'es'} de ${store.name}. ¡Desliza para verlas!`);
  } catch (err) {
    console.error('Error cargando feed de la tienda:', err);
    openStoreCatalog(storeId);
  }
}
window.selectStoreFeed = selectStoreFeed;

function clearStoreFilter() {
  state.currentStoreFilter = null;
  const banner = document.getElementById('active-store-filter-bar');
  if (banner) banner.remove();
  renderStoriesBar();
  loadVideos();
  showToast('✨ Mostrando todas las publicaciones');
}
window.clearStoreFilter = clearStoreFilter;

function renderActiveStoreBanner(store, count) {
  const oldBanner = document.getElementById('active-store-filter-bar');
  if (oldBanner) oldBanner.remove();

  const stage = document.querySelector('.feed-stage');
  if (!stage) return;

  const banner = document.createElement('div');
  banner.className = 'active-store-filter-bar';
  banner.id = 'active-store-filter-bar';
  banner.innerHTML = `
    <div class="store-filter-left" onclick="openStoreCatalog('${store.id}')" title="Ver ficha completa y ubicación">
      <img src="${store.avatar || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120'}" class="store-filter-avatar" alt="${escapeHtml(store.name)}" onerror="this.src='https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120';">
      <div class="store-filter-texts">
        <span class="store-filter-label">Viendo tienda:</span>
        <strong class="store-filter-title">${escapeHtml(store.name)} (${count})</strong>
      </div>
    </div>
    <div class="store-filter-actions">
      <button type="button" class="btn-store-filter-info" onclick="openStoreCatalog('${store.id}')" title="Ver información de la tienda">
        <i class="fa-solid fa-circle-info"></i> Info
      </button>
      <button type="button" class="btn-store-filter-close" onclick="clearStoreFilter()" title="Volver a todas las tiendas">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `;

  stage.appendChild(banner);
}
window.renderActiveStoreBanner = renderActiveStoreBanner;

// 3. CARGA Y REPRODUCCIÓN DEL FEED VERTICAL
// ==========================================
async function loadVideos() {
  try {
    const params = new URLSearchParams();
    if (state.searchQuery && state.searchQuery.trim() !== '') {
      // Búsqueda libre global por palabra clave o producto
      params.append('q', state.searchQuery.trim());
    } else {
      if (state.currentCity && state.currentCity !== 'Toda Colombia') {
        params.append('city', state.currentCity);
      }
      if (state.currentCategory && state.currentCategory !== 'Todas' && state.currentCategory !== 'Solo Ofertas') {
        params.append('category', state.currentCategory);
      }
    }

    params.append('_t', Date.now());
    const res = await fetch(`/api/videos?${params.toString()}`);
    if (res.ok) {
      let vids = await res.json();
      if (!state.searchQuery && state.currentCategory === 'Solo Ofertas') {
        vids = vids.filter(v => v.promoBadge && v.promoBadge.includes('OFERTA'));
      }
      state.videos = vids;
      state.currentIndex = 0;
      renderCurrentReelVideo();
      if (state.currentAppMode === 'spotplay' && typeof renderSpotPlayFeed === 'function') {
        renderSpotPlayFeed();
      }
    }
  } catch (err) {
    console.error('Error cargando videos:', err);
  }
}

// ==========================================
// FOTOS DE PRODUCTOS (HASTA 7 FOTOS GRATIS POR ANUNCIO)
// ==========================================
function preloadAdjacentPhotos(video) {
  if (!video || !video._allPhotos || video._allPhotos.length <= 1) return;
  const current = video._currentPhotoIdx || 0;
  const nextIdx = (current + 1) % video._allPhotos.length;
  const prevIdx = (current - 1 + video._allPhotos.length) % video._allPhotos.length;
  [nextIdx, prevIdx].forEach(i => {
    if (video._allPhotos[i]) {
      const img = new Image();
      img.src = video._allPhotos[i];
    }
  });
}

function updateCardPhotoDisplay(video, direction = 'next') {
  if (!video || !video._allPhotos || video._allPhotos.length === 0) return;
  const idx = video._currentPhotoIdx || 0;
  
  // Actualizar todas las tarjetas asociadas a este video en el feed
  const cards = document.querySelectorAll(`.reel-player-card[data-id="${video.id}"]`);
  cards.forEach(card => {
    const badgeText = card.querySelector('.photo-counter-badge .counter-text');
    if (badgeText) badgeText.textContent = `${idx + 1}/${video._allPhotos.length}`;

    const dots = card.querySelectorAll('.photo-dots-row .photo-dot');
    dots.forEach((dot, dIdx) => {
      dot.classList.toggle('active', dIdx === idx);
    });

    const slider = card.querySelector('.reel-photos-slider');
    if (slider) {
      const slideW = slider.clientWidth || 360;
      slider.scrollTo({ left: idx * slideW, behavior: 'smooth' });
    }
  });

  // Micro-vibración háptica táctil en smartphones
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(10); } catch (_) {}
  }
}

function scrollCardPhoto(idOrUid, direction = 'next', e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const slider = document.getElementById(`slider-${idOrUid}`) 
    || document.querySelector(`.reel-photos-slider[data-id="${idOrUid}"]`)
    || document.querySelector(`#card-${idOrUid} .reel-photos-slider`)
    || (e && e.target ? e.target.closest('.reel-player-card')?.querySelector('.reel-photos-slider') : null);

  const card = slider ? slider.closest('.reel-player-card') : (e && e.target ? e.target.closest('.reel-player-card') : null);
  const videoId = card ? card.dataset.id : (idOrUid ? idOrUid.split('_')[0] : null);
  const video = state.videos.find(v => v.id === videoId);

  if (slider) {
    const slideW = slider.clientWidth || 360;
    const slides = card ? card.querySelectorAll('.reel-photo-slide') : slider.querySelectorAll('.reel-photo-slide');
    const totalPhotos = slides.length || (video?._allPhotos?.length || 1);
    const currentScroll = slider.scrollLeft;
    const currentIdx = Math.min(Math.max(Math.round(currentScroll / (slideW || 1)), 0), totalPhotos - 1);

    let targetIdx;
    if (direction === 'next') {
      targetIdx = (currentIdx >= totalPhotos - 1) ? 0 : currentIdx + 1;
    } else {
      targetIdx = (currentIdx <= 0) ? totalPhotos - 1 : currentIdx - 1;
    }

    slider.scrollTo({ left: targetIdx * slideW, behavior: 'smooth' });

    if (card) {
      const badgeText = card.querySelector('.photo-counter-badge .counter-text');
      const dots = card.querySelectorAll('.photo-dots-row .photo-dot');
      if (badgeText) badgeText.textContent = `${targetIdx + 1}/${totalPhotos}`;
      dots.forEach((dot, dIdx) => {
        dot.classList.toggle('active', dIdx === targetIdx);
      });
    }

    if (video) {
      video._currentPhotoIdx = targetIdx;
      preloadAdjacentPhotos(video);
    }
    return;
  }

  if (!video || !video._allPhotos || video._allPhotos.length <= 1) return;
  if (direction === 'next') {
    video._currentPhotoIdx = ((video._currentPhotoIdx || 0) + 1) % video._allPhotos.length;
  } else {
    video._currentPhotoIdx = ((video._currentPhotoIdx || 0) - 1 + video._allPhotos.length) % video._allPhotos.length;
  }
  updateCardPhotoDisplay(video, direction);
  preloadAdjacentPhotos(video);
}
window.scrollCardPhoto = scrollCardPhoto;

function nextCardPhoto(idOrUid, e) {
  scrollCardPhoto(idOrUid, 'next', e);
}
window.nextCardPhoto = nextCardPhoto;

function prevCardPhoto(idOrUid, e) {
  scrollCardPhoto(idOrUid, 'prev', e);
}
window.prevCardPhoto = prevCardPhoto;

function selectCardPhoto(idOrUid, pIdx, e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const slider = document.getElementById(`slider-${idOrUid}`) 
    || document.querySelector(`.reel-photos-slider[data-id="${idOrUid}"]`)
    || document.querySelector(`#card-${idOrUid} .reel-photos-slider`)
    || (e && e.target ? e.target.closest('.reel-player-card')?.querySelector('.reel-photos-slider') : null);

  const card = slider ? slider.closest('.reel-player-card') : (e && e.target ? e.target.closest('.reel-player-card') : null);
  const videoId = card ? card.dataset.id : (idOrUid ? idOrUid.split('_')[0] : null);
  const video = state.videos.find(v => v.id === videoId);

  if (slider) {
    const slideW = slider.clientWidth || 360;
    slider.scrollTo({ left: pIdx * slideW, behavior: 'smooth' });

    if (card) {
      const slides = card.querySelectorAll('.reel-photo-slide');
      const totalPhotos = slides.length || (video?._allPhotos?.length || 1);
      const badgeText = card.querySelector('.photo-counter-badge .counter-text');
      const dots = card.querySelectorAll('.photo-dots-row .photo-dot');
      if (badgeText) badgeText.textContent = `${pIdx + 1}/${totalPhotos}`;
      dots.forEach((dot, dIdx) => {
        dot.classList.toggle('active', dIdx === pIdx);
      });
    }

    if (video) {
      video._currentPhotoIdx = pIdx;
      preloadAdjacentPhotos(video);
    }
    return;
  }

  if (!video || !video._allPhotos || pIdx >= video._allPhotos.length) return;
  const oldIdx = video._currentPhotoIdx || 0;
  video._currentPhotoIdx = pIdx;
  updateCardPhotoDisplay(video, pIdx >= oldIdx ? 'next' : 'prev');
  preloadAdjacentPhotos(video);
}
window.selectCardPhoto = selectCardPhoto;

function openCardPhotoGallery(videoId, e) {
  if (e) e.stopPropagation();
  const video = state.videos.find(v => v.id === videoId);
  if (!video) return;
  const list = (video._allPhotos && video._allPhotos.length > 0)
    ? video._allPhotos
    : (video.detailPhotos && video.detailPhotos.length > 0 ? video.detailPhotos : (video.thumbnailUrl ? [video.thumbnailUrl] : []));
  if (list.length === 0) return;
  const currentIdx = video._currentPhotoIdx || 0;
  openPhotoViewer(list[currentIdx] || list[0], video.title, list);
}
window.openCardPhotoGallery = openCardPhotoGallery;

// Navegación por teclado flechas izquierda/derecha para producto activo
function nextProductPhoto() {
  const currentVideo = state.videos[state.currentIndex];
  if (currentVideo) nextCardPhoto(currentVideo.id);
}
function prevProductPhoto() {
  const currentVideo = state.videos[state.currentIndex];
  if (currentVideo) prevCardPhoto(currentVideo.id);
}
window.nextProductPhoto = nextProductPhoto;
window.prevProductPhoto = prevProductPhoto;

// ==========================================
// SCROLL CONTINUO NATIVO TIKTOK/REELS (CSS SCROLL SNAP)
// ==========================================
let feedObserver = null;


// ==========================================================================
// MOTOR DE DESCUBRIMIENTO CONTINUO: BUCLE INFINITO ALEATORIO (ENDLESS FEED)
// ==========================================================================
function buildSingleProductCardHTML(video, idx) {
  let photos = [];
  if (Array.isArray(video.photos) && video.photos.length > 0) {
    photos = video.photos.filter(p => typeof p === 'string' && p.trim().length > 0);
  } else if (Array.isArray(video.detailPhotos) && video.detailPhotos.length > 0) {
    photos = video.detailPhotos.filter(p => typeof p === 'string' && p.trim().length > 0);
  } else if (video.thumbnailUrl) {
    photos = [video.thumbnailUrl];
  }
  if (photos.length === 0) {
    photos.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80');
  }
  video._allPhotos = photos;
  video._currentPhotoIdx = 0;

  const isLiked = state.likedVideoIds.has(video.id);
  const isSaved = state.savedVideoIds.has(video.id);
  const isReported = state.reportedVideoIds.has(video.id);
  const isMyVideo = state.currentStore && state.currentStore.id === video.storeId;

  const store = state.stores.find(s => s.id === video.storeId) || { name: video.storeName, whatsapp: video.storeWhatsapp || '+573128525929' };
  const rawWa = store.whatsapp || video.storeWhatsapp || '+573128525929';
  let waClean = rawWa.replace(/[^0-9]/g, '');
  if (waClean.length === 10 && !waClean.startsWith('57')) {
    waClean = '57' + waClean;
  }
  const videoDirectUrl = getPublicShareUrl('?v=' + video.id);
  const formattedPrice = (video.priceFormatted && video.priceFormatted !== '$0 COP') 
    ? video.priceFormatted 
    : (Number(video.price) > 0 ? ('$' + Number(video.price).toLocaleString('es-CO') + ' COP') : 'Precio a Convenir');
  const rawWaMsg = `¡Hola ${store.name || ''}! Me interesa este producto visto en la Vitrina:\n\n🛍️ *${video.title}*\n💰 *${formattedPrice}*\n📍 *${video.city || 'Colombia'}*\n\n👉 Enlace: ${videoDirectUrl}`;
  const msg = encodeURIComponent(rawWaMsg);
  const waLink = 'https://wa.me/' + waClean + '?text=' + msg;
  const tgLink = getTelegramLink(store.telegram || video.storeTelegram, rawWaMsg);
  const primaryChat = store.primaryChat || 'whatsapp';

  const uid = video.id + '_' + idx;

  return `
    <article class="reel-player-card" id="card-${uid}" data-id="${video.id}" data-uid="${uid}" data-index="${idx}">
      <!-- CARRUSEL DE FOTOS NATIVO (HASTA 7 FOTOS DESLIZABLES HORIZONTALMENTE) -->
      <div class="reel-photo-viewport" id="viewport-${uid}">
        <div class="reel-photos-slider" id="slider-${uid}" data-id="${video.id}">
          ${photos.map((pUrl, pIdx) => `
          <div class="reel-photo-slide" data-idx="${pIdx}">
            <img id="photo-${uid}-${pIdx}" class="reel-hero-photo" src="${pUrl}" alt="${escapeHtml(video.title)} - Foto ${pIdx + 1}" loading="${pIdx === 0 ? 'eager' : 'lazy'}" decoding="async" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';">
          </div>
          `).join('')}
        </div>
      </div>

      <!-- INDICADOR ÚNICO MULTIFOTO (SI TIENE MÁS DE 1 FOTO) -->
      ${photos.length > 1 ? `
      <button type="button" class="photo-counter-badge" id="badge-photos-${uid}" onclick="openCardPhotoGallery('${video.id}', event)" title="Ver todas las fotos">
        <i class="fa-solid fa-images"></i>
        <span class="counter-text">1/${photos.length}</span>
      </button>

      <!-- FLECHAS LATERALES Y PUNTOS INDICADORES DE FOTOS -->
      <button type="button" class="photo-nav-arrow photo-nav-prev" onclick="scrollCardPhoto('${uid}', 'prev', event)" title="Foto Anterior" aria-label="Foto Anterior">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      <button type="button" class="photo-nav-arrow photo-nav-next" onclick="scrollCardPhoto('${uid}', 'next', event)" title="Siguiente Foto" aria-label="Siguiente Foto">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
      <div class="photo-dots-row" id="dots-${uid}">
        ${photos.map((_, pIdx) => `<div class="photo-dot ${pIdx === 0 ? 'active' : ''}" onclick="selectCardPhoto('${uid}', ${pIdx}, event)"></div>`).join('')}
      </div>
      ` : ''}

      <!-- COLUMNA DERECHA DE ACCIONES FLOTANTES (ICONOS TIKTOK / INSTAGRAM REELS) -->
      <div class="reel-side-actions">
        <!-- 1. LOGO TIENDA CON ANILLO DE ESTADO -->
        <button type="button" class="side-action-btn store-badge-action" onclick="openStoreCatalog('${video.storeId}')" title="Ver Tienda y Catálogo">
          <div class="store-ring-wrapper ${video.hasSpot ? 'has-spot' : ''}">
            <img src="${video.storeAvatar || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120&auto=format&fit=crop&q=80'}" alt="${escapeHtml(video.storeName)}" class="reel-store-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120&auto=format&fit=crop&q=80';" loading="lazy">
            <div class="verified-mini-check">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>
          <span class="action-label">Tienda</span>
        </button>

        <!-- 2. ME GUSTA (❤️ PURO SIN AROS ROJOS) -->
        <button type="button" class="side-action-btn like-action-btn ${isLiked ? 'liked' : ''}" data-id="${video.id}" onclick="toggleLikeSpot('${video.id}', event)" title="Me Gusta">
          <div class="action-icon-circle side-icon-circle">
            <i class="fa-solid fa-heart"></i>
          </div>
          <span class="action-label like-count-label" id="like-count-${uid}">${formatNumber(video.likes || 0)}</span>
        </button>

        <!-- 3. COMENTARIOS Y PREGUNTAS -->
        <button type="button" class="side-action-btn comments-action-btn" onclick="openCommentsSheet('${video.id}', event)" title="Preguntas y Comentarios">
          <div class="action-icon-circle side-icon-circle">
            <i class="fa-solid fa-comments"></i>
          </div>
          <span class="action-label comments-count-label comments-count-${video.id}" id="comments-count-${uid}">${formatNumber(video.commentsCount || 0)}</span>
        </button>

        <!-- 4. COMPARTIR SPOT -->
        <button type="button" class="side-action-btn share-action-btn" onclick="shareSpot('${video.id}', event)" title="Compartir este producto">
          <div class="action-icon-circle side-icon-circle">
            <i class="fa-solid fa-share-nodes"></i>
          </div>
          <span class="action-label">Compartir</span>
        </button>

        <!-- 5. VER DETALLE COMPLETO -->
        <button type="button" class="side-action-btn detail-action-btn" onclick="openProductDetailSheet('${video.id}', event)" title="Ver detalles y fotos">
          <div class="action-icon-circle side-icon-circle">
            <i class="fa-solid fa-circle-info"></i>
          </div>
          <span class="action-label">Info</span>
        </button>

        <!-- 6. MENÚ DE OPCIONES DEL SPOT -->
        <button type="button" class="side-action-btn more-options-btn" onclick="openSpotOptionsMenu('${video.id}', event)" title="Más opciones">
          <div class="action-icon-circle side-icon-circle">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </div>
        </button>
      </div>

      <!-- INFORMACIÓN INFERIOR DEL PRODUCTO -->
      <div class="reel-bottom-info">
        <div class="store-info-row" onclick="openStoreCatalog('${video.storeId}')">
          <h4 class="store-display-name">${escapeHtml(video.storeName)}</h4>
          <span class="store-stars-badge" onclick="event.stopPropagation(); openRateModal('${video.storeId}', '${escapeHtml(video.storeName)}')">
            <i class="fa-solid fa-star"></i> <span>${video.storeRating || '5.0'}</span>
          </span>
          <span class="city-location-badge">
            <i class="fa-solid fa-location-dot"></i> <span>${escapeHtml(video.city || 'Colombia')}</span>
          </span>
        </div>

        <!-- TÍTULO DEL PRODUCTO Y PRECIO DESTACADO -->
        <h3 class="reel-product-title">${escapeHtml(video.title)}</h3>

        <div class="price-and-desc-row">
          <div class="price-tag-badge">${escapeHtml((video.priceFormatted && video.priceFormatted !== '$0 COP') ? video.priceFormatted : (Number(video.price) > 0 ? ('$' + Number(video.price).toLocaleString('es-CO') + ' COP') : 'Precio a Convenir'))}</div>
          ${video.delivery ? `<div class="delivery-pill-badge">${escapeHtml(cleanDelivery(video.delivery))}</div>` : ''}
        </div>

        ${video.description && !video.description.startsWith('Contáctanos') ? `
        <p class="reel-product-desc" onclick="this.classList.toggle('expanded')" title="Toca para ver u ocultar descripción completa">${escapeHtml(video.description)}</p>` : ''}

        <!-- BOTONES PROTAGONISTAS: CHAT DIRECTO (WHATSAPP / TELEGRAM / AMBOS) -->
        ${(tgLink && primaryChat === 'both' && waLink) ? `
        <div class="reel-action-main-container dual-chat-actions">
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-action-btn" onclick="openDirectChatOrder('${video.id}', event)" title="Pedir por WhatsApp">
            <div class="btn-wa-inner">
              <i class="fa-brands fa-whatsapp wa-logo-bounce"></i>
              <span class="btn-wa-text">WhatsApp</span>
            </div>
          </a>
          <a href="${tgLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-action-btn telegram-action-btn" onclick="trackWaClick('${video.id}')" title="Pedir por Telegram">
            <div class="btn-wa-inner">
              <i class="fa-brands fa-telegram wa-logo-bounce"></i>
              <span class="btn-wa-text">Telegram</span>
            </div>
          </a>
        </div>
        ` : (tgLink && primaryChat === 'telegram') ? `
        <div class="reel-action-main-container">
          <a href="${tgLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-action-btn telegram-action-btn" onclick="trackWaClick('${video.id}')" title="Pedir por Telegram">
            <div class="btn-wa-inner">
              <i class="fa-brands fa-telegram wa-logo-bounce"></i>
              <span class="btn-wa-text">Pedir por Telegram</span>
            </div>
          </a>
        </div>
        ` : `
        <div class="reel-action-main-container">
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-action-btn" onclick="openDirectChatOrder('${video.id}', event)" title="Pedir al Chat Directo">
            <div class="btn-wa-inner">
              <i class="fa-brands fa-whatsapp wa-logo-bounce"></i>
              <span class="btn-wa-text">Pedir al Chat Directo</span>
            </div>
          </a>
        </div>
        `}

        <!-- LEYENDA LEGAL DE SEGURIDAD -->
        <div class="safety-legal-text">
          <i class="fa-solid fa-shield-halved"></i> La Vitrina es una vitrina publicitaria. Acuerdos y envíos directos vía chat.
        </div>
      </div>
    </article>
  `;
}

function appendInfiniteDiscoveryBatch() {
  if (state._isAppendingInfiniteBatch) return;
  if (!Array.isArray(state.videos) || state.videos.length === 0) return;
  const feedContainer = document.getElementById('feed-scroll-container');
  if (!feedContainer || feedContainer.style.display === 'none') return;

  state._isAppendingInfiniteBatch = true;

  // Barajar aleatoriamente una copia de los videos disponibles (Shuffle inteligente)
  const pool = [...state.videos];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }

  // Anti-repetición consecutiva: evitar que el primer elemento sea idéntico al último mostrado
  const lastVideo = state._infiniteFeedList && state._infiniteFeedList.length > 0 ? state._infiniteFeedList[state._infiniteFeedList.length - 1] : null;
  if (lastVideo && pool.length > 1 && pool[0].id === lastVideo.id) {
    const swapIdx = Math.floor(Math.random() * (pool.length - 1)) + 1;
    const temp = pool[0];
    pool[0] = pool[swapIdx];
    pool[swapIdx] = temp;
  }

  // Tomar lote (mínimo 4 o todo el catálogo)
  const batchSize = Math.max(4, Math.min(pool.length, 8));
  const batch = pool.slice(0, batchSize);

  const feedFreq = Math.max(2, Number(state.admobConfig?.feedAdFrequency) || 4);
  let batchHTML = '';

  batch.forEach(video => {
    const newIdx = state._totalRenderedSpotsCount || state.videos.length;
    state._totalRenderedSpotsCount = (state._totalRenderedSpotsCount || state.videos.length) + 1;
    if (!state._infiniteFeedList) state._infiniteFeedList = [...state.videos];
    state._infiniteFeedList.push(video);

    const cardHTML = buildSingleProductCardHTML(video, newIdx);
    let adMobCardHTML = '';
    if ((newIdx + 1) % feedFreq === 0) {
      adMobCardHTML = `
        <article class="reel-player-card reel-admob-card" id="card-admob-${newIdx}" data-id="admob-${newIdx}" data-index="admob-${newIdx}">
          <div class="admob-card-badge"><i class="fa-solid fa-bullhorn text-gold"></i> Publicidad Patrocinada</div>
          <div class="admob-card-viewport">
            <div class="admob-card-inner">
              <div class="admob-icon-circle"><i class="fa-solid fa-store text-gold"></i></div>
              <h3>Espacio Publicitario Google AdMob</h3>
              <p>Promociones y anuncios personalizados para Colombia vía Google AdMob.</p>
              <div class="admob-pill-tag"><i class="fa-brands fa-google"></i> Google AdMob Ready</div>
            </div>
          </div>
          <div class="reel-bottom-sheet">
            <div class="safety-legal-text">
              <i class="fa-brands fa-google text-gold"></i> Anuncios gestionados automáticamente por la red de Google AdMob.
            </div>
          </div>
        </article>
      `;
    }
    batchHTML += (cardHTML + adMobCardHTML);
  });

  feedContainer.insertAdjacentHTML('beforeend', batchHTML);

  // Observar nuevas tarjetas con el IntersectionObserver
  if (feedObserver) {
    feedContainer.querySelectorAll('.reel-player-card:not([data-observed="true"])').forEach(card => {
      card.setAttribute('data-observed', 'true');
      feedObserver.observe(card);
    });
  }

  // Conectar gestos en nuevas tarjetas
  setupHorizontalPhotoGestures();

  // Pre-cargar fotos de las nuevas tarjetas
  batch.slice(0, 3).forEach(v => preloadAdjacentPhotos(v));

  setTimeout(() => {
    state._isAppendingInfiniteBatch = false;
  }, 300);
}
window.appendInfiniteDiscoveryBatch = appendInfiniteDiscoveryBatch;


function renderContinuousFeed() {
  const emptyState = document.getElementById('feed-empty-state');
  const feedContainer = document.getElementById('feed-scroll-container');
  const deskPanel = document.querySelector('.desktop-details-panel');

  // Si el usuario realizó una búsqueda específica y no hay resultados, mostramos el cartel de búsqueda vacía
  if ((!state.videos || state.videos.length === 0) && state.searchQuery && state.searchQuery.trim() !== '') {
    if (emptyState) {
      emptyState.style.display = 'block';
      const emptyH3 = emptyState.querySelector('h3');
      const emptyP = emptyState.querySelector('p');
      const emptyBtn = document.getElementById('btn-empty-register');
      const searchInput = document.getElementById('search-input');
      const clearBtn = document.getElementById('btn-clear-search');
      if (emptyH3) emptyH3.textContent = `No hay resultados para "${state.searchQuery}"`;
      if (emptyP) emptyP.textContent = 'Intenta buscando por otra palabra clave o ciudad.';
      if (emptyBtn) {
        emptyBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Limpiar búsqueda y ver todo';
        emptyBtn.onclick = () => {
          if (searchInput) searchInput.value = '';
          if (clearBtn) clearBtn.style.display = 'none';
          state.searchQuery = '';
          loadVideos();
        };
      }
    }
    if (feedContainer) {
      feedContainer.style.display = 'none';
      feedContainer.innerHTML = '';
    }
    if (deskPanel) deskPanel.style.display = 'none';
    return;
  }

  // Si no hay búsqueda (modo normal o virgen sin productos aún), ocultamos la tarjeta vacía y mostramos el Reel Cero Oficial
  if (emptyState) emptyState.style.display = 'none';
  const gridContainer = document.getElementById('feed-grid-container');
  if (state.feedViewMode === 'grid') {
    if (feedContainer) feedContainer.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'block';
    renderGridFeed();
    if (deskPanel) deskPanel.style.display = 'none';
  } else {
    if (feedContainer) feedContainer.style.display = 'flex';
    if (gridContainer) gridContainer.style.display = 'none';
    if (deskPanel && window.innerWidth > 900) deskPanel.style.display = 'flex';
  }

  // 0. Publicidad de Enganche de Entrada (Desactivada: entrada directa a productos reales)
  const isSearchActive = Boolean(state.searchQuery && state.searchQuery.trim() !== '');
  const hasDirectSharedProduct = Boolean(state._sharedTargetVideoId);
  const showWelcomeHook = false; // Opción 1: Acceso instantáneo al primer producto sin tarjeta intermedia
  const camp = state.launchCampaign || {};

  const welcomeHookCardHTML = showWelcomeHook ? `
    <article class="reel-player-card welcome-hook-card" id="card-welcome-hook" data-id="welcome-hook" data-index="-1">
      <!-- FONDO CINEMATOGRÁFICO DE COMPRAS CON DESENFOQUE ELEGANTE -->
      <div class="welcome-hook-bg-image"></div>
      <div class="welcome-hook-bg-overlay"></div>

      <div class="welcome-hook-content">
        <!-- CABECERA COMPACTA -->
        <div class="welcome-compact-header">
          <div class="welcome-hook-badge-row">
            <span class="welcome-hook-badge">
              <i class="fa-solid fa-store text-gold"></i> VITRINA COMERCIAL 🇨🇴
            </span>
            <span class="welcome-hook-trust-pill">
              <i class="fa-solid fa-shield-halved text-cyan"></i> Trato Directo & Seguro
            </span>
          </div>

          <h2 class="welcome-hook-title">
            Tu Catálogo Digital, <span class="text-neon">Pedidos al Chat Directo</span>
          </h2>
        </div>

        <!-- SHOWCASE VISUAL: SMARTPHONE ULTRA-REALISTA (CHASIS METÁLICO TITANIO, DYNAMIC ISLAND, STATUS BAR Y SPOT EN VIVO) -->
        <div class="welcome-phone-showcase">
          <div class="phone-showcase-caption">
            <i class="fa-solid fa-wand-magic-sparkles text-gold"></i>
            <span>Publica tus productos como SPOTS</span>
          </div>

          <div class="phone-mockup-wrapper">
            <!-- BOTONES FÍSICOS EXTERIORES DEL CELULAR -->
            <div class="phone-physical-btn phone-btn-action"></div>
            <div class="phone-physical-btn phone-btn-vol-up"></div>
            <div class="phone-physical-btn phone-btn-vol-down"></div>
            <div class="phone-physical-btn phone-btn-power"></div>

            <div class="phone-mockup-body">
              <!-- PANTALLA OLED DEL CELULAR -->
              <div class="phone-mockup-screen">
                <!-- FOTO ULTRA-ESTILIZADA SIN MARCAS REGISTRADAS QUE LLENA PERFECTAMENTE EL ENCUADRE SIN ESPACIO VACÍO ARRIBA -->
                <img src="https://images.unsplash.com/photo-1552346154-21d32810aba3?w=700&auto=format&fit=crop&q=80" alt="Spot en Vivo" class="phone-mockup-img" loading="eager">
                
                <div class="phone-mockup-overlay">
                  <!-- BARRA DE ESTADO REALISTA (HORA + DYNAMIC ISLAND + BATERÍA) -->
                  <div class="phone-status-bar">
                    <span class="phone-status-time">9:41</span>
                    <div class="phone-dynamic-island">
                      <span class="dynamic-island-lens"></span>
                    </div>
                    <div class="phone-status-icons">
                      <i class="fa-solid fa-signal"></i>
                      <i class="fa-solid fa-wifi"></i>
                      <i class="fa-solid fa-battery-three-quarters"></i>
                    </div>
                  </div>

                  <!-- HEADER DEL SPOT DENTRO DEL TELÉFONO -->
                  <div class="phone-spot-top">
                    <span class="phone-spot-badge-live">
                      <span class="live-dot-pulse"></span> SPOT EN VIVO
                    </span>
                    <span class="phone-spot-badge-photo">
                      <i class="fa-solid fa-camera"></i> 1/5
                    </span>
                    <span class="phone-spot-badge-quota">
                      ${Number(state.pricing?.free_spots_quota) || 100} SPOTS $0
                    </span>
                  </div>

                  <!-- RIEL LATERAL DE BOTONES ESTILO REELS / TIKTOK -->
                  <div class="phone-mockup-actions-rail">
                    <div class="phone-rail-btn phone-rail-like">
                      <i class="fa-solid fa-heart"></i>
                      <span>142</span>
                    </div>
                    <div class="phone-rail-btn phone-rail-chat">
                      <i class="fa-solid fa-comments"></i>
                      <span>Chat</span>
                    </div>
                    <div class="phone-rail-btn phone-rail-share">
                      <i class="fa-solid fa-share-nodes"></i>
                      <span>Share</span>
                    </div>
                    <div class="phone-rail-btn phone-rail-store">
                      <i class="fa-solid fa-store"></i>
                      <span>Tienda</span>
                    </div>
                  </div>

                  <!-- CONTENIDO INFERIOR DEL SPOT DENTRO DEL TELÉFONO -->
                  <div class="phone-spot-bottom">
                    <div class="phone-spot-store">
                      <span class="phone-store-avatar">🏬</span>
                      <span class="phone-store-name">${escapeHtml(state.currentStore?.name || 'Variedades Leo')}</span>
                      <i class="fa-solid fa-circle-check text-green phone-verified"></i>
                    </div>
                    <div class="phone-spot-title">Zapatillas Streetwear Urban Pro</div>
                    <div class="phone-spot-action-row">
                      <span class="phone-spot-price">$189.900 COP</span>
                      <span class="phone-spot-shipping"><i class="fa-solid fa-motorcycle"></i> Gratis</span>
                    </div>
                  </div>

                  <!-- BARRA DE INICIO INFERIOR TIPO IOS HOME INDICATOR -->
                  <div class="phone-home-indicator"></div>
                </div>

                <!-- EFECTO REFLEJO DE CRISTAL BISELADO -->
                <div class="phone-screen-glare"></div>
              </div>
            </div>

            <!-- SOMBRA Y RESPLANDOR NEÓN AMBIENTAL EXTERIOR -->
            <div class="phone-ambient-glow"></div>
          </div>
        </div>

        <!-- ACCIONES PRINCIPALES: BOTÓN INMEDIATO DEBAJO DE LA IMAGEN PUBLICITARIA -->
        <div class="welcome-hook-actions-group">
          ${state.currentStore ? `
          <button type="button" class="btn-welcome-cta" onclick="handleWelcomeHookCTA()">
            <i class="fa-solid fa-plus-circle"></i>
            <span>Publicar SPOT (${escapeHtml(state.currentStore.name)})</span>
            <i class="fa-solid fa-arrow-right cta-arrow"></i>
          </button>
          <div class="welcome-secondary-actions-row">
            <button type="button" class="btn-welcome-login-link" onclick="openSellerPanel()">
              <i class="fa-solid fa-chart-line text-gold"></i> Panel Mi Tienda
            </button>
            <span class="welcome-sep">•</span>
            <button type="button" class="btn-welcome-explore-link" onclick="scrollToFirstProduct()">
              <i class="fa-solid fa-bag-shopping text-cyan"></i> Explorar Vitrina
            </button>
          </div>
          ` : `
          <button type="button" class="btn-welcome-cta" onclick="handleWelcomeHookCTA()">
            <i class="fa-solid fa-store"></i>
            <span>Crear Mi Tienda Gratis (${Number(state.pricing?.free_spots_quota) || 100} SPOTS $0 COP)</span>
            <i class="fa-solid fa-arrow-right cta-arrow"></i>
          </button>
          <div class="welcome-secondary-actions-row">
            <button type="button" class="btn-welcome-login-link" onclick="openStoreLoginDirectly()">
              <i class="fa-solid fa-right-to-bracket text-gold"></i> Entrar a Mi Negocio
            </button>
            <span class="welcome-sep">•</span>
            <button type="button" class="btn-welcome-explore-link" onclick="scrollToFirstProduct()">
              <i class="fa-solid fa-bag-shopping text-cyan"></i> Explorar Vitrina
            </button>
          </div>
          `}
        </div>
      </div>
    </article>
  ` : '';

  // Renderizar todas las tarjetas de productos con soporte de Bucle Infinito
  state._infiniteFeedList = [...state.videos];
  state._totalRenderedSpotsCount = state.videos.length;
  state._isAppendingInfiniteBatch = false;

  const feedFreq = Math.max(2, Number(state.admobConfig?.feedAdFrequency) || 4);
  const productCardsHTML = state.videos.map((video, idx) => {
    const cardHTML = buildSingleProductCardHTML(video, idx);
    let adMobCardHTML = '';
    if ((idx + 1) % feedFreq === 0 && idx < state.videos.length - 1) {
      adMobCardHTML = `
        <article class="reel-player-card reel-admob-card" id="card-admob-${idx}" data-id="admob-${idx}" data-index="admob-${idx}">
          <div class="admob-card-badge"><i class="fa-solid fa-bullhorn text-gold"></i> Publicidad Patrocinada</div>
          <div class="admob-card-viewport">
            <div class="admob-card-inner">
              <div class="admob-icon-circle"><i class="fa-solid fa-store text-gold"></i></div>
              <h3>Espacio Publicitario Google AdMob</h3>
              <p>Promociones y anuncios personalizados para Colombia vía Google AdMob.</p>
              <div class="admob-pill-tag"><i class="fa-brands fa-google"></i> Google AdMob Ready</div>
            </div>
          </div>
          <div class="reel-bottom-sheet">
            <div class="safety-legal-text">
              <i class="fa-brands fa-google text-gold"></i> Anuncios gestionados automáticamente por la red de Google AdMob.
            </div>
          </div>
        </article>
      `;
    }
    return cardHTML + adMobCardHTML;
  }).join('');

  feedContainer.innerHTML = welcomeHookCardHTML + productCardsHTML;

  // Configurar gestos táctiles horizontales en cada tarjeta para deslizar fotos secundarias
  setupHorizontalPhotoGestures();

  // Pre-cargar fotos adyacentes de los primeros anuncios para navegación ultra-fluida
  state.videos.slice(0, 5).forEach(v => preloadAdjacentPhotos(v));

  // Configurar IntersectionObserver para detectar tarjeta activa en scroll
  setupFeedIntersectionObserver();

  // Configurar desvanecimiento dinámico estilo TikTok del riel derecho al hacer scroll
  setupSideActionsScrollFade();

  // Configurar auto-recogida inteligente de cabeceras en modo Vitrina para dar pantalla completa a las fotos
  setupVitrinaHeaderAutoCollapse();

  // Ajuste milimétrico de altura del feed a pantalla completa sin zonas grises
  adjustFeedContainerHeight();

  // Activar estado del anuncio actual
  const initialIdx = showWelcomeHook ? -1 : Math.min(state.currentIndex || 0, state.videos.length - 1);
  state.currentIndex = initialIdx;
  updateActiveFeedItem(initialIdx);

  // Marcar la tarjeta inicial activa para iluminar riel derecho y pie simultáneamente
  const initialCard = feedContainer.querySelector(`.reel-player-card[data-index="${initialIdx}"]`) || feedContainer.querySelector('.reel-player-card');
  if (initialCard) {
    initialCard.classList.add('active');
  }
}
window.renderContinuousFeed = renderContinuousFeed;
const renderCurrentReelVideo = renderContinuousFeed;
window.renderCurrentReelVideo = renderCurrentReelVideo;

// Interacción del Reel Cero (Welcome Hook)
function handleWelcomeHookCTA() {
  if (state.currentStore) {
    const uploadModal = document.getElementById('modal-upload');
    if (uploadModal) {
      uploadModal.style.display = 'flex';
      refreshUploadMembershipUI();
    }
  } else {
    const authModal = document.getElementById('modal-store-auth');
    if (authModal) {
      authModal.style.display = 'flex';
      const tabRegister = document.getElementById('tab-btn-register') || document.getElementById('tab-auth-register');
      if (tabRegister) tabRegister.click();
    }
  }
}
window.handleWelcomeHookCTA = handleWelcomeHookCTA;

// Abrir directamente la pestaña de "Ya tengo Tienda (Ingresar)"
function openStoreLoginDirectly() {
  const authModal = document.getElementById('modal-store-auth');
  if (authModal) {
    authModal.style.display = 'flex';
    const tabLogin = document.getElementById('tab-btn-login') || document.getElementById('tab-auth-login');
    if (tabLogin) tabLogin.click();
  }
}
window.openStoreLoginDirectly = openStoreLoginDirectly;

function scrollToFirstProduct() {
  const container = document.getElementById('feed-scroll-container');
  if (container) {
    const firstProductCard = container.querySelector('.reel-player-card:not(.welcome-hook-card)');
    if (firstProductCard) {
      firstProductCard.scrollIntoView({ behavior: 'smooth' });
    } else {
      container.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  }
}
window.scrollToFirstProduct = scrollToFirstProduct;

// ==========================================
// MODO CUADRÍCULA 2X2 & ALTERNADOR DE VISTA DE FEED
// ==========================================
function renderGridFeed() {
  const grid = document.getElementById('feed-2col-grid');
  if (!grid) return;

  if (!state.videos || state.videos.length === 0) {
    grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1; text-align:center; padding: 40px;">No hay productos para mostrar en este momento.</p>';
    return;
  }

  grid.innerHTML = state.videos.map(video => {
    const photos = (Array.isArray(video.photos) && video.photos.length > 0)
      ? video.photos
      : ((Array.isArray(video.detailPhotos) && video.detailPhotos.length > 0)
        ? video.detailPhotos 
        : [video.thumbnailUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80']);
    
    const store = state.stores.find(s => s.id === video.storeId) || { name: 'Tienda', whatsapp: video.storeWhatsapp || '+573128525929' };
    const rawWa = store.whatsapp || video.storeWhatsapp || '+573128525929';
    let waClean = rawWa.replace(/[^0-9]/g, '');
    if (waClean.length === 10 && !waClean.startsWith('57')) {
      waClean = `57${waClean}`;
    }
    const videoDirectUrl = getPublicShareUrl(`?v=${video.id}`);
    const rawWaMsg = `¡Hola! Me interesa este producto, ¿sigue disponible?\n\n${videoDirectUrl}`;
    const waLink = `https://wa.me/${waClean}?text=${encodeURIComponent(rawWaMsg)}`;

    return `
      <div class="feed-grid-item ${video.hasSpot ? 'has-spot' : ''}" data-id="${video.id}">
        <div class="feed-grid-thumb-wrapper" onclick="switchToImmersiveVideo('${video.id}')">
          <img src="${photos[0]}" class="feed-grid-thumb" alt="${escapeHtml(video.title)}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';">
          ${video.hasSpot ? '<span class="cat-thumb-spot" style="top:8px; left:8px; font-size:0.65rem; padding:3px 8px;"><i class="fa-solid fa-gem text-gold"></i> SPOT</span>' : ''}
          ${photos.length > 1 ? `<span class="feed-grid-photos-count"><i class="fa-solid fa-images"></i> ${photos.length}</span>` : ''}
        </div>
        <div class="feed-grid-info">
          <div class="feed-grid-store-row">
            <span class="feed-grid-store-name">${escapeHtml(store.name || 'Tienda')}</span>
            <span class="feed-grid-city"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(video.city || 'Colombia')}</span>
          </div>
          <h4 class="feed-grid-title" onclick="switchToImmersiveVideo('${video.id}')" title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</h4>
          <div class="feed-grid-price-row">
            <span class="feed-grid-price">${video.priceFormatted}</span>
            <span class="feed-grid-delivery">${escapeHtml(cleanDelivery(video.delivery || 'Domicilio Gratis'))}</span>
          </div>
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="feed-grid-wa-btn" onclick="openDirectChatOrder('${video.id}', event);">
            <i class="fa-brands fa-whatsapp"></i> Pedir por WhatsApp
          </a>
        </div>
      </div>
    `;
  }).join('');
}

window.switchToImmersiveVideo = function(videoId) {
  state.feedViewMode = 'immersive';
  const feedScrollContainer = document.getElementById('feed-scroll-container');
  const feedGridContainer = document.getElementById('feed-grid-container');
  const toggleBtn = document.getElementById('btn-feed-view-toggle');
  const toggleIcon = document.getElementById('feed-toggle-icon');
  const deskPanel = document.querySelector('.desktop-details-panel');

  if (feedGridContainer) feedGridContainer.style.display = 'none';
  if (feedScrollContainer) feedScrollContainer.style.display = 'flex';
  if (deskPanel && window.innerWidth > 900) deskPanel.style.display = 'flex';

  if (toggleBtn) {
    toggleBtn.classList.remove('active-grid');
    toggleBtn.removeAttribute('title');
  }
  if (toggleIcon) toggleIcon.className = 'fa-solid fa-table-cells-large';

  const card = document.getElementById(`card-${videoId}`);
  if (card) {
    card.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    const cardIdx = Number(card.dataset.index);
    if (!isNaN(cardIdx)) handleCardActive(cardIdx);
    setTimeout(updateSideActionsScrollOpacity, 80);
  }
};

function toggleFeedViewMode() {
  const feedScrollContainer = document.getElementById('feed-scroll-container');
  const feedGridContainer = document.getElementById('feed-grid-container');
  const deskPanel = document.querySelector('.desktop-details-panel');
  const toggleBtn = document.getElementById('btn-feed-view-toggle');
  const toggleIcon = document.getElementById('feed-toggle-icon');

  if (state.feedViewMode === 'immersive') {
    state.feedViewMode = 'grid';
    renderGridFeed();
    if (feedScrollContainer) feedScrollContainer.style.display = 'none';
    if (feedGridContainer) feedGridContainer.style.display = 'block';
    if (deskPanel) deskPanel.style.display = 'none';

    if (toggleBtn) {
      toggleBtn.classList.add('active-grid');
      toggleBtn.removeAttribute('title');
    }
    if (toggleIcon) toggleIcon.className = 'fa-solid fa-mobile-screen';
  } else {
    state.feedViewMode = 'immersive';
    if (feedGridContainer) feedGridContainer.style.display = 'none';
    if (feedScrollContainer) feedScrollContainer.style.display = 'flex';
    if (deskPanel && window.innerWidth > 900) deskPanel.style.display = 'flex';

    if (toggleBtn) {
      toggleBtn.classList.remove('active-grid');
      toggleBtn.removeAttribute('title');
    }
    if (toggleIcon) toggleIcon.className = 'fa-solid fa-table-cells-large';

    const activeCard = document.querySelector('.reel-player-card.active') || document.querySelector('.reel-player-card:not(.welcome-hook-card)');
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
  }
}
window.toggleFeedViewMode = toggleFeedViewMode;

// Configurar detección de tarjeta activa mediante IntersectionObserver
// Telemetría de Impresiones Google AdMob
function trackAdMobImpression(type = 'feed') {
  fetch('/api/admob/impression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  }).catch(() => {});
}
window.trackAdMobImpression = trackAdMobImpression;

function setupFeedIntersectionObserver() {
  const container = document.getElementById('feed-scroll-container');
  if (!container) return;

  if (feedObserver) {
    feedObserver.disconnect();
  }

  if (!container._hasInfiniteScrollAttached) {
    container._hasInfiniteScrollAttached = true;
    container.addEventListener('scroll', () => {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - (container.clientHeight * 1.5)) {
        appendInfiniteDiscoveryBatch();
      }
    }, { passive: true });
  }

  const observerOptions = {
    root: container,
    threshold: 0.25
  };

  feedObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const videoEl = entry.target.querySelector('video.reel-hero-video');
      const indicator = entry.target.querySelector('.spotplay-play-center-indicator');

      if (entry.isIntersecting) {
        // Gestión visual inteligente del botón flotante (+): ocultar en Reel Cero (Hook de bienvenida) y mostrar en catálogo
        const floatingFab = document.getElementById('btn-floating-fab-upload');
        if (floatingFab) {
          const floatingMyStore = document.getElementById('btn-floating-my-store');
          if (entry.target.id === 'card-welcome-hook') {
            floatingFab.style.opacity = '0';
            floatingFab.style.pointerEvents = 'none';
            if (floatingMyStore) {
              floatingMyStore.style.opacity = '0';
              floatingMyStore.style.pointerEvents = 'none';
            }
          } else {
            floatingFab.style.opacity = '1';
            floatingFab.style.pointerEvents = 'auto';
            if (floatingMyStore) {
              floatingMyStore.style.opacity = '1';
              floatingMyStore.style.pointerEvents = 'auto';
            }
          }
        }
        // Telemetría automática de impresiones Google AdMob In-Feed
        if (entry.target.classList.contains('reel-admob-card') && !entry.target.dataset.adTracked) {
          entry.target.dataset.adTracked = 'true';
          trackAdMobImpression('feed');
        }

        const idx = parseInt(entry.target.dataset.index, 10);
        if (!isNaN(idx) && idx !== state.currentIndex) {
          state.currentIndex = idx;
          updateActiveFeedItem(idx);

          // Montar automáticamente rieles según la tarjeta en foco
          if (idx > 0) {
            if (typeof window.collapseVitrinaHeader === 'function') window.collapseVitrinaHeader();
          } else if (idx === 0) {
            const feedScroll = document.getElementById('feed-scroll-container');
            if ((!feedScroll || feedScroll.scrollTop <= 20) && typeof window.expandVitrinaHeader === 'function') {
              window.expandVitrinaHeader();
            }
          }
        }

        // Sincronización perfecta: activar tarjeta actual y sincronizar rieles simultáneamente
        entry.target.classList.add('active');
        const sideActions = entry.target.querySelector('.reel-side-actions');
        const bottomInfo = entry.target.querySelector('.reel-bottom-info');
        if (sideActions) { sideActions.style.opacity = ''; sideActions.style.pointerEvents = ''; }
        if (bottomInfo) { bottomInfo.style.opacity = ''; bottomInfo.style.pointerEvents = ''; }

        // Si estamos en modo Spot Play, asegurar src, conectar scrubber y reproducir video visible
        if (videoEl) {
          const cardVideoId = entry.target.id ? entry.target.id.replace('card-', '') : (state.videos[idx]?.id);
          if (cardVideoId) attachVideoProgressTracker(videoEl, cardVideoId);

          if (state.currentAppMode === 'spotplay') {
            if (!videoEl.src && videoEl.dataset.src) {
              videoEl.src = videoEl.dataset.src;
            }
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                if (indicator) indicator.classList.remove('visible');
              }).catch(err => {
                // Si el usuario deslizó rápido a otra tarjeta (AbortError), no reintentar
                if (err && err.name === 'AbortError') return;
                if (entry.isIntersecting) {
                  videoEl.muted = true;
                  state.spotPlayMuted = true;
                  videoEl.play().catch(() => {});
                }
              });
            }

            // Pre-conectar el src de los videos adyacentes (anterior, siguiente y subsiguiente) para swipe instantáneo a 0ms
            const adjacentCards = [
              entry.target.previousElementSibling,
              entry.target.nextElementSibling,
              entry.target.nextElementSibling ? entry.target.nextElementSibling.nextElementSibling : null
            ].filter(Boolean);

            adjacentCards.forEach(c => {
              const adjVid = c.querySelector('video.reel-hero-video');
              if (adjVid && !adjVid.src && adjVid.dataset.src) {
                adjVid.src = adjVid.dataset.src;
                adjVid.preload = 'metadata';
              }
            });
          }
        }
      } else {
        // Desactivar tarjeta que sale de foco suavemente sin cortes abruptos
        entry.target.classList.remove('active');
        const sideActions = entry.target.querySelector('.reel-side-actions');
        const bottomInfo = entry.target.querySelector('.reel-bottom-info');
        if (sideActions) { sideActions.style.opacity = ''; sideActions.style.pointerEvents = ''; }
        if (bottomInfo) { bottomInfo.style.opacity = ''; bottomInfo.style.pointerEvents = ''; }

        // Pausar video cuando sale de la pantalla
        if (videoEl) {
          try { videoEl.pause(); } catch (_) {}
          if (indicator) indicator.classList.remove('visible');
          // Liberar decodificador sólo si la tarjeta está a más de 3 pasos de distancia
          const cardIdx = parseInt(entry.target.dataset.index, 10);
          if (!isNaN(cardIdx) && Math.abs(cardIdx - state.currentIndex) > 3) {
            videoEl.removeAttribute('src');
            videoEl.load();
          }
        }
      }
    });
  }, observerOptions);

  const cards = container.querySelectorAll('.reel-player-card');
  cards.forEach(card => feedObserver.observe(card));
}

// ==========================================
// DESVANECIMIENTO DINÁMICO DEL RIEL LATERAL Y PIE AL DESLIZAR (ORIGINAL SPOT PLAY)
// ==========================================
function setupSideActionsScrollFade() {
  const container = document.getElementById('feed-scroll-container');
  if (!container) return;

  let scrollTimer = null;
  let isScrollingActive = false;

  const removeScrollFade = () => {
    if (isScrollingActive || container.classList.contains('is-scrolling')) {
      isScrollingActive = false;
      container.classList.remove('is-scrolling');
    }
  };

  const startScrollFade = () => {
    if (!isScrollingActive) {
      isScrollingActive = true;
      container.classList.add('is-scrolling');
    }
    clearTimeout(scrollTimer);
    // Al detenerse el scroll, restaurar de inmediato al 100% de brillo (140ms)
    scrollTimer = setTimeout(removeScrollFade, 140);
  };

  // Eventos de movimiento que activan la atenuación temporal
  container.addEventListener('scroll', startScrollFade, { passive: true });
  container.addEventListener('touchmove', startScrollFade, { passive: true });
  container.addEventListener('wheel', startScrollFade, { passive: true });

  // Eventos de detención: cuando el dedo se levanta o el scroll nativo termina
  container.addEventListener('touchend', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(removeScrollFade, 80);
  }, { passive: true });

  container.addEventListener('touchcancel', removeScrollFade, { passive: true });

  // Evento nativo moderno scrollend para restauración instantánea a 0ms
  if ('onscrollend' in window) {
    container.addEventListener('scrollend', removeScrollFade, { passive: true });
  }

  // Comprobación de seguridad periódica cada 400ms para asegurar que nunca se quede opaco
  setInterval(() => {
    if (container.classList.contains('is-scrolling') && !isScrollingActive) {
      removeScrollFade();
    }
  }, 400);
}
window.setupSideActionsScrollFade = setupSideActionsScrollFade;

function updateSideActionsScrollOpacity() {
  // Manejado fluidamente a 120fps por GPU vía CSS y IntersectionObserver
}
window.updateSideActionsScrollOpacity = updateSideActionsScrollOpacity;

// ==========================================
// BARRA DE PROGRESO INTERACTIVA (SCRUBBER & FAST-FORWARD)
// ==========================================
function attachVideoProgressTracker(videoEl, videoId) {
  if (!videoEl || videoEl._hasProgressTracker) return;
  videoEl._hasProgressTracker = true;

  videoEl.addEventListener('timeupdate', () => {
    if (!videoEl.duration || window._isScrubbingActive) return;
    const pct = (videoEl.currentTime / videoEl.duration) * 100;
    const fillEl = document.getElementById(`scrub-fill-${videoId}`);
    if (fillEl) {
      fillEl.style.width = `${pct}%`;
    }
  });

  videoEl.addEventListener('ended', () => {
    const fillEl = document.getElementById(`scrub-fill-${videoId}`);
    if (fillEl) fillEl.style.width = '0%';
  });
}
window.attachVideoProgressTracker = attachVideoProgressTracker;

window._isScrubbingActive = false;

function handleScrubStart(e, videoId) {
  e.preventDefault();
  e.stopPropagation();

  const card = document.getElementById(`card-${videoId}`);
  if (!card) return;
  const videoEl = card.querySelector('video.reel-hero-video');
  const track = card.querySelector('.spotplay-scrubber-track');
  const fill = document.getElementById(`scrub-fill-${videoId}`);
  const tooltip = document.getElementById(`scrub-tooltip-${videoId}`);
  const currTimeEl = tooltip ? tooltip.querySelector('.scrub-curr-time') : null;
  const totalTimeEl = tooltip ? tooltip.querySelector('.scrub-total-time') : null;

  if (!videoEl || !track) return;

  window._isScrubbingActive = true;
  if (tooltip) tooltip.style.display = 'flex';

  const updateScrub = (clientX) => {
    const rect = track.getBoundingClientRect();
    if (!rect.width) return;
    const clampedX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = clampedX / rect.width;
    const pct = ratio * 100;
    if (fill) fill.style.width = `${pct}%`;

    const dur = videoEl.duration || 15;
    const targetTime = ratio * dur;
    videoEl.currentTime = targetTime;

    if (currTimeEl) currTimeEl.textContent = formatMediaTime(targetTime);
    if (totalTimeEl) totalTimeEl.textContent = formatMediaTime(dur);
    if (tooltip) {
      tooltip.style.left = `${Math.max(16, Math.min(84, pct))}%`;
    }
  };

  updateScrub(e.clientX || (e.touches && e.touches[0]?.clientX) || 0);

  const onPointerMove = (moveEvent) => {
    moveEvent.preventDefault();
    const x = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0]?.clientX) || 0;
    updateScrub(x);
  };

  const onPointerUp = () => {
    window._isScrubbingActive = false;
    if (tooltip) tooltip.style.display = 'none';
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('touchmove', onPointerMove);
    window.removeEventListener('touchend', onPointerUp);
  };

  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp, { passive: false });
}
window.handleScrubStart = handleScrubStart;

function formatMediaTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
window.formatMediaTime = formatMediaTime;

// ==========================================
// AJUSTE DINÁMICO DE ALTURA DEL FEED EN MÓVILES (CERO ZONAS GRISES NI HUNDIMIENTOS)
// ==========================================
function adjustFeedContainerHeight() {
  if (window.innerWidth > 900) {
    const feedMainCol = document.querySelector('.feed-main-col');
    if (feedMainCol) feedMainCol.style.height = '';
    return;
  }
  const feedView = document.getElementById('feed-view');
  if (!feedView || !feedView.classList.contains('active')) return;

  const feedMainCol = document.querySelector('.feed-main-col');
  const feedGrid = document.getElementById('feed-grid-container');

  const winH = (window.visualViewport && window.visualViewport.height) 
    ? window.visualViewport.height 
    : window.innerHeight;

  // En modo Spot Play ocupa el 100% absoluto de la pantalla grande sin barras restando altura
  if (state.currentAppMode === 'spotplay') {
    if (feedMainCol) feedMainCol.style.height = `${winH}px`;
    return;
  }

  const isCollapsed = document.body.classList.contains('vitrina-header-collapsed');
  const navbar = document.querySelector('.navbar');
  const storiesSection = document.getElementById('stories-section');
  const categoriesNav = document.querySelector('.categories-nav');

  let topOffset = 0;
  if (navbar && navbar.offsetHeight > 0) topOffset += navbar.getBoundingClientRect().height;
  if (!isCollapsed && storiesSection && storiesSection.offsetHeight > 0 && getComputedStyle(storiesSection).display !== 'none') {
    topOffset += storiesSection.getBoundingClientRect().height;
  }
  if (categoriesNav && categoriesNav.offsetHeight > 0 && getComputedStyle(categoriesNav).display !== 'none') {
    topOffset += categoriesNav.getBoundingClientRect().height;
  }

  const availableHeight = Math.floor(winH - topOffset);
  if (availableHeight > 200) {
    if (feedMainCol) feedMainCol.style.height = `${availableHeight}px`;
    if (feedGrid) feedGrid.style.height = `${availableHeight}px`;
  }
}
window.adjustFeedContainerHeight = adjustFeedContainerHeight;

// ==========================================
// RECOGIDA INTELIGENTE DE CABECERAS EN MODO VITRINA (SMART AUTO-COLLAPSE)
// Maximiza el espacio de pantalla para que las fotos suban y ocupen toda la vista
// ==========================================
let _vitrinaCollapseInitialized = false;
let _lastVitrinaScrollTop = 0;
let _touchStartFeedY = 0;

function setupVitrinaHeaderAutoCollapse() {
  const feedContainer = document.getElementById('feed-scroll-container');
  if (!feedContainer || _vitrinaCollapseInitialized) return;
  _vitrinaCollapseInitialized = true;

  const collapseHeader = () => {
    if (state.currentAppMode === 'spotplay') return;
    if (!document.body.classList.contains('vitrina-header-collapsed')) {
      document.body.classList.add('vitrina-header-collapsed');
      adjustFeedContainerHeight();
    }
  };

  const expandHeader = () => {
    if (document.body.classList.contains('vitrina-header-collapsed')) {
      document.body.classList.remove('vitrina-header-collapsed');
      adjustFeedContainerHeight();
    }
  };

  window.expandVitrinaHeader = expandHeader;
  window.collapseVitrinaHeader = collapseHeader;

  const handleScrollProgress = (currentScrollTop) => {
    if (state.currentAppMode === 'spotplay') {
      expandHeader();
      return;
    }

    // Si estamos en la primera tarjeta o cerca del tope superior (<= 25px), siempre mostrar cabeceras
    if (currentScrollTop <= 25) {
      expandHeader();
      _lastVitrinaScrollTop = currentScrollTop;
      return;
    }

    const delta = currentScrollTop - _lastVitrinaScrollTop;

    // Desplazamiento hacia abajo (scroll down / avanzar en el feed) -> recoger cabeceras hacia arriba
    if (delta > 15 && currentScrollTop > 40) {
      collapseHeader();
    }
    // Desplazamiento hacia arriba (pull down / ver perfiles de tiendas) -> desplegar cabeceras suavemente en cualquier posición del feed
    else if (delta < -15) {
      expandHeader();
    }

    _lastVitrinaScrollTop = currentScrollTop;
  };

  // 1. Detección por Scroll en el contenedor del Feed
  feedContainer.addEventListener('scroll', () => {
    handleScrollProgress(feedContainer.scrollTop || 0);
  }, { passive: true });

  // 2. Detección por Scroll en la Ventana
  window.addEventListener('scroll', () => {
    handleScrollProgress(window.scrollY || 0);
  }, { passive: true });

  // 3. Detección ultra-rápida por Toques Táctiles en Pantalla Móvil
  feedContainer.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      _touchStartFeedY = e.touches[0].clientY;
    }
  }, { passive: true });

  feedContainer.addEventListener('touchmove', (e) => {
    if (state.currentAppMode === 'spotplay') return;
    if (!e.touches || !e.touches[0]) return;
    const currentY = e.touches[0].clientY;
    const diffY = _touchStartFeedY - currentY; // Positivo = deslizar dedo hacia arriba (avanzar feed)
    const st = feedContainer.scrollTop || 0;

    // Deslizar dedo hacia arriba para avanzar publicaciones -> recoger historias
    if (diffY > 18) {
      collapseHeader();
    } else if (diffY < -18) {
      // Deslizar dedo hacia abajo en cualquier posición del feed -> desplegar historias suavemente sin mover fotos
      expandHeader();
    }
  }, { passive: true });

  // 4. Si el usuario toca la barra selectora de modo mientras está colapsado, desplegar de nuevo
  const switcherBar = document.getElementById('main-mode-switcher-bar');
  if (switcherBar) {
    switcherBar.addEventListener('click', () => {
      if (document.body.classList.contains('vitrina-header-collapsed')) {
        expandHeader();
      }
    });
  }

  // 5. Si el usuario toca la barra superior (navbar o logo) mientras está colapsado, desplegar historias suavemente sin rebobinar
  const navBarEl = document.querySelector('.navbar');
  if (navBarEl && !navBarEl._autoCollapseTapBound) {
    navBarEl._autoCollapseTapBound = true;
    navBarEl.addEventListener('click', (e) => {
      if (!e.target.closest('button, select, input, a, .nav-search-bar, .user-dropdown-menu')) {
        if (document.body.classList.contains('vitrina-header-collapsed')) {
          expandHeader();
          // Cero rebobinado: el usuario permanece exactamente en su producto actual
        }
      }
    });
  }
}
window.setupVitrinaHeaderAutoCollapse = setupVitrinaHeaderAutoCollapse;

// Actualizar panel lateral, ambilight y métricas del anuncio visible
function updateActiveFeedItem(idx) {
  if (idx === -1) {
    const ambilight = document.getElementById('ambilight-backdrop');
    if (ambilight) {
      ambilight.style.background = 'radial-gradient(circle, rgba(0, 210, 255, 0.22) 0%, rgba(12, 15, 20, 0.95) 75%)';
    }
    return;
  }

  const video = (state._infiniteFeedList && state._infiniteFeedList[idx]) || state.videos[idx % (state.videos.length || 1)];
  if (!video) return;

  // 1. Ambilight ambiental
  const ambilight = document.getElementById('ambilight-backdrop');
  if (ambilight) {
    ambilight.style.background = `radial-gradient(circle, ${video.hasSpot ? 'rgba(255, 184, 0, 0.25)' : 'rgba(37, 211, 102, 0.18)'} 0%, rgba(12, 15, 20, 0.95) 75%)`;
  }

  // 2. Actualizar Panel Lateral PC
  updateDesktopDetailsPanel(video);

  // 3. Registrar vista en background
  fetch(`/api/videos/${video.id}`).catch(() => {});
}

// Gestos horizontales para fotos secundarias y doble toque para dar Me Gusta
function setupHorizontalPhotoGestures() {
  const container = document.getElementById('feed-scroll-container');
  if (!container) return;

  container.querySelectorAll('.reel-player-card:not(.welcome-hook-card)').forEach(card => {
    const videoId = card.dataset.id;
    const viewport = card.querySelector('.reel-photo-viewport');
    const slider = card.querySelector('.reel-photos-slider');
    const badgeText = card.querySelector('.photo-counter-badge .counter-text');
    const dots = card.querySelectorAll('.photo-dots-row .photo-dot');
    const slides = card.querySelectorAll('.reel-photo-slide');
    const totalPhotos = slides.length;

    if (!viewport) return;

    // 1. Sincronización del slider horizontal nativo con el badge e indicadores
    if (slider && totalPhotos > 1) {
      let scrollRaf = null;
      slider.addEventListener('scroll', () => {
        if (scrollRaf) cancelAnimationFrame(scrollRaf);
        scrollRaf = requestAnimationFrame(() => {
          const w = slider.clientWidth || 1;
          const idx = Math.min(Math.max(Math.round(slider.scrollLeft / w), 0), totalPhotos - 1);

          if (badgeText) badgeText.textContent = `${idx + 1}/${totalPhotos}`;
          dots.forEach((dot, dIdx) => {
            if (dIdx === idx) dot.classList.add('active');
            else dot.classList.remove('active');
          });

          const vidObj = state.videos.find(v => v.id === videoId);
          if (vidObj) vidObj._currentPhotoIdx = idx;
        });
      }, { passive: true });
    }

    // 2. Doble toque / clic en foto para dar Me Gusta instantáneo con animación
    let lastTap = 0;
    let tapTimeout = null;

    const interactiveArea = slider || viewport;
    interactiveArea.addEventListener('click', (e) => {
      if (e.target.closest('button, a, .side-action-btn, .photo-nav-arrow, .btn-spotplay-feed-sound')) return;
      const now = Date.now();
      if (now - lastTap < 320 && now - lastTap > 40) {
        if (tapTimeout) {
          clearTimeout(tapTimeout);
          tapTimeout = null;
        }
        const likeBtn = card.querySelector('.btn-card-like');
        if (!state.likedVideoIds.has(videoId)) {
          toggleCardLike(videoId, likeBtn);
        } else {
          spawnFloatingHeart(videoId);
        }
        lastTap = 0;
        return;
      }
      lastTap = now;

      // Si es un video en modo Spot Play, alternar reproducción con un solo toque
      if (state.currentAppMode === 'spotplay') {
        const videoEl = viewport.querySelector('video.reel-hero-video');
        if (videoEl) {
          tapTimeout = setTimeout(() => {
            toggleFeedVideoPlayPause(videoId, videoEl);
            tapTimeout = null;
          }, 240);
        }
      }
    });

    // 3. Fallback de arrastre con ratón en PC
    let mouseStartX = 0;
    let isMouseDown = false;
    interactiveArea.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, a, .side-action-btn, .photo-dots-row, .photo-counter-badge')) return;
      isMouseDown = true;
      mouseStartX = e.clientX;
    });

    interactiveArea.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      const diffX = mouseStartX - e.clientX;
      if (Math.abs(diffX) >= 40) {
        if (diffX > 0) scrollCardPhoto(videoId, 'next');
        else scrollCardPhoto(videoId, 'prev');
      }
    });
  });
}

// Corazón gigante flotante animado al dar Me Gusta
function spawnFloatingHeart(videoId) {
  const card = document.getElementById(`card-${videoId}`);
  if (!card) return;
  const viewport = card.querySelector('.reel-photo-viewport');
  if (!viewport) return;

  // Limpiar corazones activos previos para evitar acumulación en ráfaga
  const existingHearts = viewport.querySelectorAll('.floating-like-heart');
  existingHearts.forEach(el => el.remove());

  const heart = document.createElement('div');
  heart.className = 'floating-like-heart';
  heart.innerHTML = '<i class="fa-solid fa-heart"></i>';
  viewport.appendChild(heart);

  // Micro-vibración háptica táctil en celulares soportados
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(25); } catch (_) {}
  }

  setTimeout(() => {
    if (heart && heart.parentNode) heart.remove();
  }, 900);
}
window.spawnFloatingHeart = spawnFloatingHeart;

// ==========================================
// ACCIONES INTERACTIVAS DEL RIEL DERECHO (TIENDA, LIKE, COMENTARIOS, COMPARTIR, INFO, OPCIONES)
// ==========================================
async function toggleLikeSpot(videoId, e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const video = state.videos.find(v => v.id === videoId);
  if (!video) return;

  const isLiked = state.likedVideoIds.has(video.id);
  const action = isLiked ? 'unlike' : 'like';

  if (isLiked) {
    state.likedVideoIds.delete(video.id);
    video.likes = Math.max(0, (video.likes || 1) - 1);
  } else {
    state.likedVideoIds.add(video.id);
    video.likes = (video.likes || 0) + 1;
    spawnFloatingHeart(video.id);
  }

  // Actualizar estado visual de los botones de like de este video
  document.querySelectorAll(`.like-action-btn[data-id="${video.id}"], #card-${video.id} .like-action-btn`).forEach(btn => {
    btn.classList.toggle('liked', !isLiked);
    const icon = btn.querySelector('.fa-heart');
    if (icon && !isLiked) {
      icon.style.animation = 'none';
      icon.offsetHeight;
      icon.style.animation = 'heartPulseAnim 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
  });

  // Actualizar todos los contadores de texto de likes de este video
  document.querySelectorAll(`[id^="like-count-${video.id}"]`).forEach(lbl => {
    lbl.textContent = formatNumber(video.likes);
  });

  localStorage.setItem('vitrina_likes', JSON.stringify(Array.from(state.likedVideoIds)));

  // Sincronizar con el backend
  try {
    const res = await fetch(`/api/videos/${video.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.likes === 'number') {
        video.likes = data.likes;
        document.querySelectorAll(`[id^="like-count-${video.id}"]`).forEach(lbl => {
          lbl.textContent = formatNumber(video.likes);
        });
      }
    }
  } catch (err) {
    console.warn('Sincronización de like pendiente:', err);
  }
}
window.toggleLikeSpot = toggleLikeSpot;
window.toggleCardLike = toggleLikeSpot;

// ==========================================
// GENERADOR DE TARJETA VISUAL DE SPOT PARA COMPARTIR (IMAGEN + MENSAJE)
// ==========================================
function loadShareImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Si falla por CORS de origen externo, pasar por proxy seguro
      if (src.startsWith('http')) {
        const proxyImg = new Image();
        proxyImg.crossOrigin = 'anonymous';
        proxyImg.onload = () => resolve(proxyImg);
        proxyImg.onerror = () => resolve(null);
        proxyImg.src = '/api/image-proxy?url=' + encodeURIComponent(src);
      } else {
        resolve(null);
      }
    };
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y + width, x, y, radius);
  ctx.closePath();
}

async function generateSpotShareCardBlob(video, store, mimeType = 'image/jpeg') {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  // 1. Fondo elegante oscuro estilo VitrinaSpot
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#090d16');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1080);

  // 2. Imagen principal del Spot (Aspect Ratio Cover en contenedor redondeado)
  const primaryImgUrl = (video.photos && video.photos[0]) || video.thumbnailUrl || '';
  const img = await loadShareImage(primaryImgUrl);

  const imgBoxX = 40;
  const imgBoxY = 40;
  const imgBoxW = 1000;
  const imgBoxH = 670;
  const radius = 28;

  ctx.save();
  drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, radius);
  ctx.clip();

  if (img && img.naturalWidth) {
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const imgAspect = nw / nh;
    const boxAspect = imgBoxW / imgBoxH;
    let sx = 0, sy = 0, sw = nw, sh = nh;

    if (imgAspect > boxAspect) {
      sw = nh * boxAspect;
      sx = (nw - sw) / 2;
    } else {
      sh = nw / boxAspect;
      sy = (nh - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, imgBoxX, imgBoxY, imgBoxW, imgBoxH);
  } else {
    // Fallback si no hay foto
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Vitrina Colombia', imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2);
  }

  // Viñeta oscura suave en la base de la foto para contraste
  const shadowGrad = ctx.createLinearGradient(0, imgBoxY + imgBoxH - 180, 0, imgBoxY + imgBoxH);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(imgBoxX, imgBoxY + imgBoxH - 180, imgBoxW, 180);

  ctx.restore();

  // Borde sutil del marco de la foto
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, radius);
  ctx.stroke();
  ctx.restore();

  // Insignia Top-Left: VitrinaSpot Colombia
  ctx.save();
  const badgeX = 64, badgeY = 64, badgeW = 320, badgeH = 52;
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 26);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 184, 0, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffb800';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🛍️ Vitrina Colombia', badgeX + 22, badgeY + 35);
  ctx.restore();

  // Insignia Top-Right: Categoría o Promo
  if (video.category || video.promoBadge) {
    ctx.save();
    const catText = video.promoBadge ? `🔥 ${video.promoBadge}` : video.category;
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const textWidth = ctx.measureText(catText).width;
    const catBadgeW = textWidth + 36;
    const catBadgeH = 48;
    const catBadgeX = imgBoxX + imgBoxW - catBadgeW - 24;
    const catBadgeY = 64;

    drawRoundedRect(ctx, catBadgeX, catBadgeY, catBadgeW, catBadgeH, 24);
    ctx.fillStyle = video.promoBadge ? 'rgba(239, 68, 68, 0.9)' : 'rgba(30, 41, 59, 0.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(catText, catBadgeX + 18, catBadgeY + 32);
    ctx.restore();
  }

  // 3. Panel Inferior de Información Comercial
  const infoBoxX = 40;
  const infoBoxY = 735;
  const infoBoxW = 1000;
  const infoBoxH = 305;
  const infoRadius = 24;

  ctx.save();
  drawRoundedRect(ctx, infoBoxX, infoBoxY, infoBoxW, infoBoxH, infoRadius);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Fila 1: Tienda y Ciudad
  ctx.save();
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  const storeDisplayName = (store?.name || video.storeName || 'Tienda Oficial');
  ctx.fillText(`🏪 ${storeDisplayName}`, infoBoxX + 28, infoBoxY + 48);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const cityText = `📍 ${video.city || 'Colombia'}`;
  ctx.fillText(cityText, infoBoxX + 28 + ctx.measureText(`🏪 ${storeDisplayName}`).width + 24, infoBoxY + 48);
  ctx.restore();

  // Fila 2: Título del Producto (hasta 2 líneas limpias)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';

  const rawTitle = video.title || 'Producto en la Vitrina';
  let titleLine1 = rawTitle;
  let titleLine2 = '';

  if (ctx.measureText(rawTitle).width > (infoBoxW - 60)) {
    const words = rawTitle.split(' ');
    titleLine1 = '';
    titleLine2 = '';
    let isSecondLine = false;
    for (const w of words) {
      if (!isSecondLine) {
        if (ctx.measureText(titleLine1 + ' ' + w).width < (infoBoxW - 80)) {
          titleLine1 += (titleLine1 ? ' ' : '') + w;
        } else {
          isSecondLine = true;
          titleLine2 += w;
        }
      } else {
        if (ctx.measureText(titleLine2 + ' ' + w).width < (infoBoxW - 120)) {
          titleLine2 += ' ' + w;
        } else {
          titleLine2 += '...';
          break;
        }
      }
    }
  }

  ctx.fillText(titleLine1, infoBoxX + 28, infoBoxY + 104);
  if (titleLine2) {
    ctx.fillText(titleLine2, infoBoxX + 28, infoBoxY + 148);
  }
  ctx.restore();

  // Fila 3: Precio Destacado e Información de Envío
  ctx.save();
  const priceY = titleLine2 ? (infoBoxY + 208) : (infoBoxY + 185);
  const priceStr = video.priceFormatted || (video.price ? `$ ${Number(video.price).toLocaleString('es-CO')} COP` : 'Precio a convenir');
  ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const priceTextWidth = ctx.measureText(priceStr).width;
  const pricePillW = priceTextWidth + 44;
  const pricePillH = 54;

  // Pastilla de precio verde esmeralda
  drawRoundedRect(ctx, infoBoxX + 28, priceY - 40, pricePillW, pricePillH, 16);
  ctx.fillStyle = '#10b981';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(priceStr, infoBoxX + 50, priceY);

  // Texto de entrega / pedidos
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const deliveryText = video.delivery ? `📦 ${video.delivery}` : '💬 Pedidos directos sin comisión';
  ctx.fillText(deliveryText, infoBoxX + 28 + pricePillW + 20, priceY - 4);
  ctx.restore();

  // Fila 4: Footer CTA Call To Action
  ctx.save();
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('✨ Vitrina · Catálogo Digital y Conexión Directa al Vendedor', infoBoxX + 28, infoBoxY + 280);
  ctx.restore();

  return new Promise((resolve) => {
    const quality = mimeType === 'image/jpeg' ? 0.92 : undefined;
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

let activeShareSpotBlobUrl = null;

function openShareSpotCardModal(video, blob, file, shareText, videoDirectUrl) {
  const modal = document.getElementById('modal-share-spot-card');
  const previewImg = document.getElementById('share-spot-preview-img');
  if (!modal || !previewImg) return;

  if (activeShareSpotBlobUrl) {
    URL.revokeObjectURL(activeShareSpotBlobUrl);
  }
  activeShareSpotBlobUrl = URL.createObjectURL(blob);
  previewImg.src = activeShareSpotBlobUrl;

  // Botón Descargar Tarjeta JPG
  const btnDownload = document.getElementById('btn-download-spot-card');
  if (btnDownload) {
    btnDownload.onclick = () => {
      const a = document.createElement('a');
      a.href = activeShareSpotBlobUrl;
      a.download = `vitrinaspot-${video.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('📥 ¡Imagen del Spot descargada con éxito!');
    };
  }

  // Botón Compartir en WhatsApp con Texto y Enlace
  const btnWa = document.getElementById('btn-share-spot-wa');
  if (btnWa) {
    btnWa.onclick = () => {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
      showToast('📲 Abriendo WhatsApp con el mensaje...');
    };
  }

  // Botón Copiar Enlace
  const btnCopy = document.getElementById('btn-copy-spot-link');
  if (btnCopy) {
    btnCopy.onclick = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(videoDirectUrl).then(() => {
          showToast('📋 ¡Enlace copiado al portapapeles!');
        }).catch(() => {
          legacyClipboardCopy(videoDirectUrl);
        });
      } else {
        legacyClipboardCopy(videoDirectUrl);
      }
    };
  }

  // Botón Cerrar
  const btnClose = document.getElementById('btn-close-share-spot-card');
  if (btnClose) {
    btnClose.onclick = () => {
      modal.style.display = 'none';
    };
  }
  modal.onclick = (e) => {
    if (e.target.id === 'modal-share-spot-card') {
      modal.style.display = 'none';
    }
  };

  modal.style.display = 'flex';
}

async function shareSpot(videoId, e) {
  if (e) e.stopPropagation();
  const video = state.videos.find(v => String(v.id).trim().toLowerCase() === String(videoId).trim().toLowerCase());
  if (!video) return;

  const store = state.stores.find(s => s.id === video.storeId) || {
    name: video.storeName,
    avatar: video.storeAvatar,
    city: video.city
  };

  const videoDirectUrl = getPublicShareUrl('?v=' + video.id);
  const shareTitle = `${video.title} - ${store?.name || video.storeName || 'VitrinaSpot'}`;
  const shareText = `🛍️ ¡Mira este producto en la Vitrina!\n\n*${video.title}*\n💰 *${video.priceFormatted || (video.price ? '$ ' + Number(video.price).toLocaleString('es-CO') + ' COP' : 'A convenir')}*\n🏪 Tienda: *${store?.name || video.storeName || 'VitrinaSpot'}*\n📍 Ubicación: *${video.city || 'Colombia'}*\n\n👉 Ver fotos completas y contactar directo al vendedor:\n${videoDirectUrl}`;

  showToast('🎨 Generando imagen del spot...', 'info', 1800);

  try {
    const blob = await generateSpotShareCardBlob(video, store);
    if (!blob) throw new Error('No se pudo generar la imagen');

    const file = new File([blob], `vitrinaspot-${video.id}.jpg`, { type: 'image/jpeg' });

    // 1. Intentar Web Share API Level 2 con archivo de imagen adjunto (WhatsApp / Instagram / Móviles)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: shareText
        });
        showToast('🚀 ¡Spot compartido con éxito!');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // Cancelado por el usuario
        console.warn('Share nativo con archivo cancelado o no disponible, abriendo modal:', err);
      }
    }

    // 2. Si no admite envío de archivos directo (PC, navegadores de escritorio o fallback):
    openShareSpotCardModal(video, blob, file, shareText, videoDirectUrl);

  } catch (err) {
    console.error('Error al generar tarjeta del spot:', err);
    fallbackShare(videoDirectUrl, shareText);
  }
}
window.shareSpot = shareSpot;

// ==========================================================================
// PEDIDO DIRECTO AL CHAT (WHATSAPP) CON IMAGEN INTEGRADA Y VISTA PREVIA RICA
// ==========================================================================
async function openDirectChatOrder(videoId, e) {
  const video = state.videos.find(v => v.id === videoId);
  if (!video) return;

  const store = state.stores.find(s => s.id === video.storeId) || {
    name: video.storeName,
    whatsapp: video.storeWhatsapp || '+573128525929'
  };

  // Registrar clic analítico en métricas de WhatsApp
  trackWaClick(video.id);

  // Copiar tarjeta visual con la foto del producto al portapapeles si el navegador lo admite
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      const pngPromise = generateSpotShareCardBlob(video, store, 'image/png');
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngPromise })
      ]).then(() => {
        showToast('📋 ¡Foto del producto copiada! Puedes pegarla en el chat con el vendedor.', 'info', 3000);
      }).catch(err => {
        console.warn('Clipboard write image opcional cancelado:', err);
      });
    } catch (err) {
      console.warn('ClipboardItem error:', err);
    }
  } else {
    showToast('📲 Abriendo WhatsApp con el vendedor...', 'info', 2000);
  }
}
window.openDirectChatOrder = openDirectChatOrder;

function openProductDetailSheet(videoId, e) {
  if (e) e.stopPropagation();
  const video = state.videos.find(v => v.id === videoId);
  if (!video) return;
  const store = state.stores.find(s => s.id === video.storeId) || {
    name: video.storeName,
    avatar: video.storeAvatar,
    city: video.city,
    whatsapp: video.storeWhatsapp
  };
  openCatalogProductSheet(video, store);
}
window.openProductDetailSheet = openProductDetailSheet;

let activeOptionsMenuVideoId = null;

function openSpotOptionsMenu(videoId, e) {
  if (e) e.stopPropagation();
  const video = state.videos.find(v => v.id === videoId);
  if (!video) return;
  activeOptionsMenuVideoId = video.id;

  const titleEl = document.getElementById('spot-options-title');
  if (titleEl) titleEl.textContent = video.title || 'Opciones del SPOT';

  const modal = document.getElementById('modal-spot-options-menu');
  if (modal) {
    modal.style.display = 'flex';
  }
}
window.openSpotOptionsMenu = openSpotOptionsMenu;

function closeSpotOptionsMenu() {
  const modal = document.getElementById('modal-spot-options-menu');
  if (modal) modal.style.display = 'none';
  activeOptionsMenuVideoId = null;
}
window.closeSpotOptionsMenu = closeSpotOptionsMenu;

// Inicialización de eventos para el menú de opciones del SPOT (⋮)
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-opt-share-wa')?.addEventListener('click', () => {
    if (activeOptionsMenuVideoId) {
      const vid = activeOptionsMenuVideoId;
      closeSpotOptionsMenu();
      shareSpot(vid);
    }
  });

  document.getElementById('btn-opt-copy-link')?.addEventListener('click', () => {
    if (activeOptionsMenuVideoId) {
      const directUrl = getPublicShareUrl('?v=' + activeOptionsMenuVideoId);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(directUrl).then(() => {
          showToast('📋 ¡Enlace copiado al portapapeles!');
        }).catch(() => {
          legacyClipboardCopy(directUrl);
        });
      } else {
        legacyClipboardCopy(directUrl);
      }
      closeSpotOptionsMenu();
    }
  });

  document.getElementById('btn-opt-store-catalog')?.addEventListener('click', () => {
    if (activeOptionsMenuVideoId) {
      const video = state.videos.find(v => v.id === activeOptionsMenuVideoId);
      closeSpotOptionsMenu();
      if (video && video.storeId) openStoreCatalog(video.storeId);
    }
  });

  document.getElementById('btn-opt-details')?.addEventListener('click', () => {
    if (activeOptionsMenuVideoId) {
      const vid = activeOptionsMenuVideoId;
      closeSpotOptionsMenu();
      openProductDetailSheet(vid);
    }
  });

  document.getElementById('btn-opt-report')?.addEventListener('click', () => {
    if (activeOptionsMenuVideoId) {
      const video = state.videos.find(v => v.id === activeOptionsMenuVideoId);
      closeSpotOptionsMenu();
      if (video) openReportModal(video.id, video.title);
    }
  });

  document.getElementById('modal-spot-options-menu')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-spot-options-menu') {
      closeSpotOptionsMenu();
    }
  });
});

function toggleCardSave(videoId, btnEl) {
  const video = state.videos.find(v => v.id === videoId);
  if (!video) return;

  if (state.savedVideoIds.has(video.id)) {
    state.savedVideoIds.delete(video.id);
    if (btnEl) btnEl.classList.remove('saved');
    showToast('SPOT eliminado de tu lista de guardados');
  } else {
    state.savedVideoIds.add(video.id);
    if (btnEl) btnEl.classList.add('saved');
    showToast('🔖 ¡Guardado en tu lista de deseos!');
  }

  localStorage.setItem('vitrina_saved', JSON.stringify(Array.from(state.savedVideoIds)));
  updateSavedBadge();
}
window.toggleCardSave = toggleCardSave;

function openCommentsSheetById(videoId) {
  const video = state.videos.find(v => v.id === videoId);
  if (!video) return;
  openCommentsSheet(video);
}
window.openCommentsSheetById = openCommentsSheetById;

function executeShareVideoById(videoId) {
  const video = state.videos.find(v => v.id === videoId);
  if (!video) return;
  executeShareVideo(video);
}
window.executeShareVideoById = executeShareVideoById;

function trackWaClick(videoId) {
  fetch(`/api/videos/${videoId}/whatsapp-click`, { method: 'POST' }).catch(() => {});
}
window.trackWaClick = trackWaClick;


function updateDesktopDetailsPanel(video) {
  const store = state.stores.find(s => s.id === video.storeId);
  if (!store) return;

  const deskAvatar = document.getElementById('desk-store-avatar');
  const deskName = document.getElementById('desk-store-name');
  const deskBio = document.getElementById('desk-store-bio');
  const deskHours = document.getElementById('desk-store-hours');
  const deskStars = document.getElementById('desk-store-stars');

  if (deskAvatar) deskAvatar.src = store.avatar;
  if (deskName) deskName.textContent = store.name;
  if (deskBio) deskBio.textContent = store.description;
  if (deskHours) deskHours.textContent = store.hours || 'Lun - Sáb: 8:00 AM - 7:00 PM';
  if (deskStars) {
    deskStars.textContent = `⭐ ${store.rating || 5.0} (${store.ratingCount || 1})`;
    deskStars.style.cursor = 'pointer';
    deskStars.title = 'Toca para calificar a esta tienda';
    deskStars.onclick = () => openRateModal(store.id, store.name);
  }

  // Comentarios en widget PC
  renderDesktopComments(video.comments || []);

  // Pre-cargar videos adyacentes para reproducción instantánea sin pausas ni pantallas negras
  preloadAdjacentVideos();
}

// Precarga de videos adyacentes para reproducción instantánea en 0ms sin fotos intermedias
function preloadAdjacentVideos() {
  if (state.currentAppMode !== 'spotplay') return;
  const curIdx = state.currentIndex || 0;
  [-1, 1, 2].forEach(offset => {
    const targetIdx = curIdx + offset;
    const targetCard = document.querySelector(`.reel-player-card[data-index="${targetIdx}"]`);
    if (targetCard) {
      const vid = targetCard.querySelector('video.reel-hero-video');
      if (vid && !vid.src && vid.dataset.src) {
        vid.src = vid.dataset.src;
        vid.preload = 'metadata';
      }
    }
  });
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now - date) / 1000));
    if (diffSec < 60) return 'Hace un momento';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `Hace ${diffHour} h`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Ayer';
    if (diffDay < 7) return `Hace ${diffDay} d`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  } catch (e) {
    return '';
  }
}

function renderDesktopComments(comments) {
  const container = document.getElementById('desk-comments-list');
  if (!container) return;

  if (!comments || comments.length === 0) {
    container.innerHTML = '<p class="text-muted" style="font-size:0.85rem; text-align: center; margin: 20px 0;">Sé el primero en dejar una pregunta al vendedor.</p>';
    return;
  }

  container.innerHTML = comments.map(c => `
    <div class="sheet-comment-item">
      <img class="sheet-comment-avatar" src="${c.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}" alt="${escapeHtml(c.author)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';" loading="lazy">
      <div class="sheet-comment-content">
        <div class="sheet-comment-author-row">
          <span class="sheet-comment-author">${escapeHtml(c.author)}</span>
          ${c.isStoreOwner ? '<span class="badge-owner">Vendedor</span>' : (c.isVerifiedBuyer || (c.author && c.author !== 'Comprador Anónimo' && c.author !== 'Usuario VitrinaSpot') ? '<span class="badge-verified-buyer"><i class="fa-solid fa-circle-check"></i> Verificado</span>' : '')}
          <span class="sheet-comment-time">${formatRelativeTime(c.createdAt)}</span>
        </div>
        <p class="sheet-comment-body">${escapeHtml(c.text)}</p>
      </div>
    </div>
  `).join('');
}

// ==========================================
// NAVEGACIÓN EN SCROLL CONTINUO VERTICAL (CSS SCROLL SNAP)
// ==========================================
function scrollToFeedIndex(idx, smooth = true) {
  if (!state.videos || state.videos.length === 0) return;
  const maxLimit = (state._infiniteFeedList && state._infiniteFeedList.length) ? state._infiniteFeedList.length - 1 : (state.videos.length - 1);
  const targetIdx = Math.max(0, Math.min(idx, maxLimit));
  state.currentIndex = targetIdx;
  closeCommentsSheet();

  const container = document.getElementById('feed-scroll-container');
  if (!container) return;

  const targetCard = container.querySelector(`.reel-player-card[data-index="${targetIdx}"]`);
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' });
    updateActiveFeedItem(targetIdx);
  } else {
    const cards = container.querySelectorAll('.reel-player-card');
    if (cards[targetIdx]) {
      cards[targetIdx].scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' });
      updateActiveFeedItem(targetIdx);
    }
  }
}
window.scrollToFeedIndex = scrollToFeedIndex;

function nextVideo() {
  const maxLimit = (state._infiniteFeedList && state._infiniteFeedList.length) ? state._infiniteFeedList.length - 1 : (state.videos.length - 1);
  if (state.currentIndex >= maxLimit - 1) {
    appendInfiniteDiscoveryBatch();
  }
  scrollToFeedIndex(state.currentIndex + 1, true);
}
window.nextVideo = nextVideo;

function prevVideo() {
  if (state.currentIndex > 0) {
    scrollToFeedIndex(state.currentIndex - 1, true);
  }
}
window.prevVideo = prevVideo;

// ==========================================
// 4. VISTA: CATÁLOGO DE LA TIENDA
// ==========================================
async function openStoreCatalog(storeId) {
  document.getElementById('user-dropdown-menu')?.classList.remove('show');
  try {
    const res = await fetch(`/api/stores/${storeId}`);
    if (!res.ok) return;

    const data = await res.json();
    const store = data.store;
    const videos = data.videos;

    // Cambiar vistas
    showView('store-catalog-view');

    // Rellenar cabecera de la tienda
    document.getElementById('cat-store-avatar').src = store.avatar;
    document.getElementById('cat-store-name').textContent = store.name;
    document.getElementById('cat-store-city').textContent = store.city;
    document.getElementById('cat-store-address').textContent = store.address || 'Venta online';
    let cleanDesc = store.description || '¡Bienvenidos a nuestra vitrina oficial en la Vitrina oficial! Escríbenos al chat directo para atenderte.';
    cleanDesc = cleanDesc.replace(/Escríbenos por WhatsApp/gi, 'Escríbenos al chat directo')
                         .replace(/por WhatsApp/gi, 'al chat directo')
                         .replace(/a su WhatsApp/gi, 'a su chat directo');
    document.getElementById('cat-store-desc').textContent = cleanDesc;
    const catRatingPill = document.getElementById('cat-store-rating');
    if (catRatingPill) {
      catRatingPill.innerHTML = `<i class="fa-solid fa-star text-gold"></i> ${store.rating} (${store.ratingCount} opiniones)`;
      catRatingPill.style.cursor = 'pointer';
      catRatingPill.title = 'Toca para calificar a esta tienda';
      catRatingPill.onclick = () => openRateModal(store.id, store.name);
    }
    document.getElementById('cat-videos-count').textContent = `${videos.length} producto${videos.length === 1 ? '' : 's'}`;


    // Horario de atención
    const catHoursPill = document.getElementById('cat-store-hours');
    const catHoursText = document.getElementById('cat-store-hours-text');
    if (catHoursPill && catHoursText) {
      if (store.hours) {
        catHoursText.textContent = store.hours;
        catHoursPill.style.display = 'inline-flex';
      } else {
        catHoursPill.style.display = 'none';
      }
    }

    // Limpieza y estandarización del teléfono colombiano para llamadas y WhatsApp (+57)
    let rawDigits = (store.whatsapp || '').replace(/[^0-9]/g, '');
    let pure10Digits = rawDigits;
    if (rawDigits.startsWith('57') && rawDigits.length >= 12) {
      pure10Digits = rawDigits.substring(2);
    }
    const intlPhone = `+57${pure10Digits}`;
    const cleanWa = `57${pure10Digits}`;

    // Botón de WhatsApp de la tienda completa
    const catWaBtn = document.getElementById('btn-cat-whatsapp');
    if (catWaBtn) {
      const msg = encodeURIComponent(`¡Hola! Vi el catálogo de ${store.name} en la Vitrina y me interesan sus productos.`);
      catWaBtn.href = `https://wa.me/${cleanWa}?text=${msg}`;
    }
    const catTgBtn = document.getElementById('btn-cat-telegram');
    if (catTgBtn) {
      if (store.telegram) {
        const tgLink = getTelegramLink(store.telegram, `¡Hola! Vi el catálogo de ${store.name} en la Vitrina y me interesan sus productos.`);
        catTgBtn.href = tgLink;
        catTgBtn.style.display = 'inline-flex';
      } else {
        catTgBtn.style.display = 'none';
      }
    }

    // Detección precisa de Tienda Física vs Tienda 100% Online
    const addressRaw = (store.address || '').trim();
    const isOnlineVirtual = !addressRaw || 
      /venta online|online|virtual|envios|envíos|domicilios|a convenir|despachos/i.test(addressRaw);

    // Botón Cómo Llegar (Google Maps con Navegación GPS Oficial)
    const catMapsBtn = document.getElementById('btn-cat-maps');
    if (catMapsBtn) {
      if (!isOnlineVirtual && addressRaw.length > 5) {
        // Local físico real a la calle: abre ruta GPS directa desde la ubicación del cliente
        const destQuery = encodeURIComponent(`${store.address}, ${store.city}, Colombia`);
        catMapsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}`;
        catMapsBtn.innerHTML = '<i class="fa-solid fa-location-arrow"></i> Cómo Llegar (Maps)';
        catMapsBtn.style.display = 'inline-flex';
        catMapsBtn.onclick = null;
      } else {
        // Tienda virtual / online: distintivo claro sin abrir errores de mapas
        catMapsBtn.href = "javascript:void(0)";
        catMapsBtn.innerHTML = '<i class="fa-solid fa-truck-fast"></i> Tienda Virtual (Envíos)';
        catMapsBtn.style.display = 'inline-flex';
        catMapsBtn.onclick = (e) => {
          e.preventDefault();
          showToast(`📦 ${store.name} es tienda virtual y despacha pedidos directos a tu dirección.`);
        };
      }
    }

    // Botón Llamar Directo (Calibrado universalmente con +57 para Claro, Movistar, Tigo y Wom)
    const catCallBtn = document.getElementById('btn-cat-call');
    if (catCallBtn) {
      catCallBtn.href = `tel:${intlPhone}`;
      catCallBtn.style.display = 'inline-flex';
      catCallBtn.onclick = (e) => {
        const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
        if (!isMobile) {
          e.preventDefault();
          showToast(`📞 Teléfono de ${store.name}: ${intlPhone} (Llama desde tu móvil)`);
        }
      };
    }

    // Botón Deslizar Publicaciones en Pantalla Completa
    const btnFeed = document.getElementById('btn-cat-view-feed');
    if (btnFeed) {
      btnFeed.onclick = () => selectStoreFeed(store.id);
    }

    // Botón Compartir Catálogo Público (Tarjeta VIP para WhatsApp)
    const catShareBtn = document.getElementById('btn-cat-share');
    if (catShareBtn) {
      catShareBtn.onclick = () => {
        const storeUrl = getPublicShareUrl(`?store=${store.id}`);
        const shareText = `🛍️ *¡Te invito a ver el Catálogo Oficial de ${store.name}!* \n📍 Ciudad: ${store.city}\n⭐ Calificación: ${store.rating} / 5.0 (${store.ratingCount} opiniones)\n📲 Pedidos y WhatsApp: https://wa.me/${cleanWa}\n\n👉 *Mira todas nuestras vitrinas y ofertas aquí:* \n${storeUrl}`;
        if (navigator.share) {
          navigator.share({ title: `${store.name} en VitrinaSpot`, text: shareText, url: storeUrl }).catch(() => {});
        } else {
          fallbackShare(storeUrl, shareText);
        }
      };
    }

    // Medios de pago chips
    const chipsContainer = document.getElementById('cat-payment-chips');
    if (chipsContainer && store.paymentMethods) {
      chipsContainer.innerHTML = store.paymentMethods.map(m => `<span class="pay-chip">${m}</span>`).join('');
    }

    // Cuadrícula de videos
    const grid = document.getElementById('catalog-videos-grid');
    if (grid) {
      if (videos.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="padding:20px;">Esta tienda aún no tiene más productos subidos.</p>';
      } else {
        grid.innerHTML = videos.map(v => `
          <div class="cat-video-card" data-video-id="${v.id}">
            <div class="cat-thumb-box">
              <img class="cat-thumb-img" src="${v.thumbnailUrl}" alt="${escapeHtml(v.title)}">
              <span class="cat-thumb-dur"><i class="fa-solid fa-camera"></i> ${(v.photos && v.photos.length > 1) ? v.photos.length + ' fotos' : '1 foto'}</span>
              ${v.hasSpot ? '<span class="cat-thumb-spot">SPOT</span>' : ''}
            </div>
            <div class="cat-card-body">
              <h4 class="cat-card-title">${escapeHtml(v.title)}</h4>
              <div class="cat-card-price">${v.priceFormatted}</div>
              ${v.delivery ? `<div style="font-size:0.72rem; color:var(--wa-green); font-weight:600; margin-bottom:4px;">${escapeHtml(cleanDelivery(v.delivery))}</div>` : ''}
              <div class="cat-card-stats">
                <span><i class="fa-solid fa-eye"></i> ${formatNumber(v.views)}</span>
                <span><i class="fa-solid fa-heart"></i> ${formatNumber(v.likes)}</span>
              </div>
            </div>
          </div>
        `).join('');

        // Clic en producto del catálogo: Abre directamente en el Feed deslizable en esa publicación
        grid.querySelectorAll('.cat-video-card').forEach(card => {
          card.addEventListener('click', async () => {
            const vidId = card.getAttribute('data-video-id');
            await selectStoreFeed(store.id);
            setTimeout(() => {
              const targetCard = document.getElementById(`card-${vidId}`);
              if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth' });
              }
            }, 80);
          });
        });
      }
    }
  } catch (err) {
    console.error('Error abriendo catálogo:', err);
  }
}

// ==========================================
// 4.1 FICHA DE DETALLE DE PRODUCTO EN TIENDA (IN-STORE PRODUCT SHEET)
// ==========================================
let currentSheetPhotos = [];
let currentSheetPhotoIdx = 0;

function openCatalogProductSheet(video, store) {
  const modal = document.getElementById('modal-catalog-product-detail');
  if (!modal || !video) return;

  // 1. Carrusel de fotos
  const photos = (video.photos && video.photos.length > 0)
    ? video.photos
    : (video.detailPhotos && video.detailPhotos.length > 0 ? video.detailPhotos : (video.thumbnailUrl ? [video.thumbnailUrl] : []));
  
  currentSheetPhotos = photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'];
  currentSheetPhotoIdx = 0;

  // 2. Nombre de la tienda
  const storeNameEl = document.getElementById('sheet-store-name');
  if (storeNameEl) storeNameEl.textContent = store?.name || video.storeName || 'Tienda';

  // 3. Info del producto
  const titleEl = document.getElementById('sheet-product-title');
  if (titleEl) titleEl.textContent = video.title;

  const priceEl = document.getElementById('sheet-product-price');
  if (priceEl) priceEl.textContent = video.priceFormatted || `$${(video.price || 0).toLocaleString('es-CO')} COP`;

  const deliveryEl = document.getElementById('sheet-product-delivery');
  if (deliveryEl) {
    if (video.delivery) {
      deliveryEl.textContent = cleanDelivery(video.delivery);
      deliveryEl.style.display = 'inline-block';
    } else {
      deliveryEl.style.display = 'none';
    }
  }

  const descEl = document.getElementById('sheet-product-desc');
  if (descEl) {
    descEl.textContent = video.description || 'Ponte en contacto con la tienda por WhatsApp para consultar detalles, tallas, colores y disponibilidad inmediata.';
  }

  // 4. Botón WhatsApp directo
  const rawWa = store?.whatsapp || video.storeWhatsapp || '+573128525929';
  let waClean = rawWa.replace(/[^0-9]/g, '');
  if (waClean.length === 10 && !waClean.startsWith('57')) {
    waClean = `57${waClean}`;
  }
  const videoDirectUrl = getPublicShareUrl(`?v=${video.id}`);
  const rawMsg = `¡Hola ${store?.name || 'amigos'}! Vi este producto en su catálogo de la Vitrina y me gustaría comprarlo:\n\n*${video.title}*\nPrecio: ${video.priceFormatted || `$${(video.price||0).toLocaleString('es-CO')}`}\n\n👉 Enlace: ${videoDirectUrl}`;
  const sheetWaBtn = document.getElementById('btn-sheet-whatsapp');
  if (sheetWaBtn) {
    sheetWaBtn.href = `https://wa.me/${waClean}?text=${encodeURIComponent(rawMsg)}`;
    sheetWaBtn.onclick = (e) => openDirectChatOrder(video.id, e);
  }
  const sheetTgBtn = document.getElementById('btn-sheet-telegram');
  if (sheetTgBtn) {
    if (store?.telegram || video.storeTelegram) {
      sheetTgBtn.href = getTelegramLink(store?.telegram || video.storeTelegram, rawMsg);
      sheetTgBtn.style.display = 'inline-flex';
      sheetTgBtn.onclick = () => trackWaClick(video.id);
    } else {
      sheetTgBtn.style.display = 'none';
    }
  }

  // 5. Botón Compartir Producto
  const shareBtn = document.getElementById('btn-sheet-share');
  if (shareBtn) {
    shareBtn.onclick = () => {
      const shareText = `🛍️ ¡Mira este producto de *${store?.name || video.storeName}* en la Vitrina!\n*${video.title}* - ${video.priceFormatted || ''}\n\n${videoDirectUrl}`;
      if (navigator.share) {
        navigator.share({ title: video.title, text: shareText, url: videoDirectUrl }).catch(() => {});
      } else {
        fallbackShare(videoDirectUrl, shareText);
      }
    };
  }

  // 6. Actualizar fotos
  updateSheetPhotoDisplay();

  // 7. Mostrar modal
  modal.style.display = 'flex';
}

function updateSheetPhotoDisplay(direction = 'next') {
  const mainImg = document.getElementById('sheet-product-main-img');
  const counterEl = document.getElementById('sheet-photo-counter');
  const dotsEl = document.getElementById('sheet-carousel-dots');
  const prevBtn = document.getElementById('btn-sheet-prev-photo');
  const nextBtn = document.getElementById('btn-sheet-next-photo');

  if (mainImg && currentSheetPhotos.length > 0) {
    mainImg.src = currentSheetPhotos[currentSheetPhotoIdx];
    mainImg.classList.remove('slide-in-right', 'slide-in-left');
    void mainImg.offsetWidth;
    mainImg.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
    if (navigator.vibrate) try { navigator.vibrate(10); } catch (_) {}
  }

  if (counterEl) {
    counterEl.textContent = `${currentSheetPhotoIdx + 1}/${currentSheetPhotos.length}`;
    counterEl.style.display = currentSheetPhotos.length > 1 ? 'inline-block' : 'none';
  }

  if (prevBtn && nextBtn) {
    prevBtn.style.display = currentSheetPhotos.length > 1 ? 'flex' : 'none';
    nextBtn.style.display = currentSheetPhotos.length > 1 ? 'flex' : 'none';
  }

  if (dotsEl) {
    if (currentSheetPhotos.length > 1) {
      dotsEl.innerHTML = currentSheetPhotos.map((_, i) => `
        <div class="photo-dot ${i === currentSheetPhotoIdx ? 'active' : ''}" style="width: 16px; height: 3px; cursor: pointer;" onclick="setSheetPhotoIdx(${i})"></div>
      `).join('');
      dotsEl.style.display = 'flex';
    } else {
      dotsEl.style.display = 'none';
    }
  }
}

window.setSheetPhotoIdx = function(idx) {
  if (idx < 0 || idx >= currentSheetPhotos.length) return;
  const dir = idx >= currentSheetPhotoIdx ? 'next' : 'prev';
  currentSheetPhotoIdx = idx;
  updateSheetPhotoDisplay(dir);
};

window.nextSheetPhoto = function() {
  if (currentSheetPhotos.length <= 1) return;
  currentSheetPhotoIdx = (currentSheetPhotoIdx + 1) % currentSheetPhotos.length;
  updateSheetPhotoDisplay('next');
};

window.prevSheetPhoto = function() {
  if (currentSheetPhotos.length <= 1) return;
  currentSheetPhotoIdx = (currentSheetPhotoIdx - 1 + currentSheetPhotos.length) % currentSheetPhotos.length;
  updateSheetPhotoDisplay('prev');
};

function closeCatalogProductSheet() {
  const modal = document.getElementById('modal-catalog-product-detail');
  if (modal) modal.style.display = 'none';
}
window.closeCatalogProductSheet = closeCatalogProductSheet;

// ==========================================
// 5. VISTA: MIS GUARDADOS (LISTA DE DESEOS)
// ==========================================
async function openSavedView() {
  showView('saved-view');
  const grid = document.getElementById('saved-videos-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin text-gold" style="font-size:2rem;"></i><p class="text-muted mt-2">Cargando tus productos guardados...</p></div>';

  let allVideos = state.videos;
  try {
    const res = await fetch('/api/videos');
    if (res.ok) {
      allVideos = await res.json();
    }
  } catch (e) {}

  const savedList = allVideos.filter(v => state.savedVideoIds.has(v.id));

  if (savedList.length === 0) {
    grid.className = 'catalog-grid';
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <i class="fa-regular fa-bookmark" style="font-size:3.5rem; color:var(--spot-gold); opacity:0.5;"></i>
        <h3 style="margin-top:16px; color:#fff;">No tienes productos guardados</h3>
        <p class="text-muted" style="max-width: 420px; margin: 8px auto 20px auto; font-size: 0.92rem; line-height: 1.4;">
          Cuando estés explorando la vitrina comercial, toca el icono de guardar (🔖) para armar tu lista de compras y revisarlos aquí cuando quieras.
        </p>
        <button class="btn btn-spot" id="btn-empty-explore-saved">
          <i class="fa-solid fa-store"></i> Explorar Vitrina Ahora
        </button>
      </div>
    `;
    document.getElementById('btn-empty-explore-saved')?.addEventListener('click', () => showView('feed-view'));
    return;
  }

  grid.className = 'saved-grid';
  grid.innerHTML = savedList.map(v => {
    const waPhone = v.whatsapp || (state.stores.find(s => s.id === v.storeId)?.whatsapp) || '+573124567890';
    const savedShareUrl = getPublicShareUrl(`?v=${v.id}`);
    const savedWaMsg = `¡Hola! Me interesa este producto, ¿sigue disponible?\n\n${savedShareUrl}`;
    const waText = encodeURIComponent(savedWaMsg);
    const waLink = `https://api.whatsapp.com/send?phone=${waPhone.replace(/[^0-9]/g, '')}&text=${waText}`;

    return `
      <div class="saved-product-card" data-video-id="${v.id}">
        <div class="saved-card-media" onclick="playSavedVideo('${v.id}')">
          <img src="${v.thumbnailUrl || '/uploads/thumbnails/placeholder.jpg'}" alt="${escapeHtml(v.title)}">
          <div class="saved-card-play-pill"><i class="fa-solid fa-eye"></i></div>
          <span class="saved-card-dur-badge"><i class="fa-solid fa-camera"></i> ${(v.photos && v.photos.length > 1) ? v.photos.length + ' fotos' : '1 foto'}</span>
          <span class="saved-card-city-badge"><i class="fa-solid fa-location-dot"></i> ${v.city}</span>
        </div>
        <div class="saved-card-content">
          <h4 class="saved-card-title">${escapeHtml(v.title)}</h4>
          <div class="saved-card-store">
            <i class="fa-solid fa-store text-gold"></i>
            <span>${escapeHtml(v.storeName)}</span>
          </div>
          <div class="saved-card-price">${v.priceFormatted}</div>
          <div class="saved-card-actions-row">
            <button class="btn-saved-action-play" onclick="playSavedVideo('${v.id}')" title="Ver producto en vitrina">
              <i class="fa-solid fa-eye text-gold"></i> Ver Producto
            </button>
            <a class="btn-saved-action-wa" href="${waLink}" target="_blank" onclick="openDirectChatOrder('${v.id}', event)" title="Contactar y pedir por WhatsApp">
              <i class="fa-brands fa-whatsapp"></i> Pedir
            </a>
            <button class="btn-saved-action-del" onclick="removeSavedItem('${v.id}')" title="Quitar de guardados">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.playSavedVideo = function(vidId) {
  const targetIdx = state.videos.findIndex(v => v.id === vidId);
  showView('feed-view');
  if (targetIdx !== -1) {
    setTimeout(() => scrollToFeedIndex(targetIdx, false), 50);
  } else {
    // Si no estaba en el feed actual filtrado, cargarlo
    state.searchQuery = '';
    state.currentCategory = 'Todas';
    loadVideos().then(() => {
      const idx = state.videos.findIndex(v => v.id === vidId);
      if (idx !== -1) {
        setTimeout(() => scrollToFeedIndex(idx, false), 50);
      }
    });
  }
};

window.removeSavedItem = function(vidId) {
  state.savedVideoIds.delete(vidId);
  localStorage.setItem('vitrina_saved', JSON.stringify(Array.from(state.savedVideoIds)));
  updateSavedBadge();
  showToast('Producto eliminado de guardados');
  openSavedView();
};

function updateSavedBadge() {
  const count = state.savedVideoIds.size;
  const badge = document.getElementById('saved-badge');
  if (badge) badge.textContent = count;
  const badgeLogged = document.getElementById('saved-badge-logged');
  if (badgeLogged) badgeLogged.textContent = count;
  const badgeGuest = document.getElementById('saved-badge-guest');
  if (badgeGuest) badgeGuest.textContent = count;
}

// ==========================================
// 6. VISTA: PANEL PRIVADO DEL VENDEDOR
// ==========================================
async function openSellerPanel() {
  document.getElementById('user-dropdown-menu')?.classList.remove('show');
  if (!state.currentStore) {
    document.getElementById('modal-store-auth').style.display = 'flex';
    return;
  }

  showView('seller-panel-view');
  const sellerPanel = document.getElementById('seller-panel-view');
  if (sellerPanel) {
    sellerPanel.scrollTop = 0;
  }

  // Llenar datos de la tarjeta de perfil del vendedor
  const pAvatar = document.getElementById('seller-profile-avatar');
  const pName = document.getElementById('seller-profile-name');
  const pDesc = document.getElementById('seller-profile-desc');
  const pWa = document.getElementById('seller-profile-wa');
  const pCity = document.getElementById('seller-profile-city');
  const pHours = document.getElementById('seller-profile-hours');

  if (pAvatar) pAvatar.src = state.currentStore.avatar || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&auto=format&fit=crop&q=80';
  if (pName) pName.textContent = state.currentStore.name;
  if (pDesc) pDesc.textContent = state.currentStore.description || 'Sin descripción aún. Toca en "Editar Perfil" para personalizar tu información.';
  if (pWa) pWa.textContent = state.currentStore.whatsapp;
  if (pCity) pCity.textContent = state.currentStore.city;
  if (pHours) pHours.textContent = state.currentStore.hours || 'Lun - Sáb: 8:00 AM - 7:00 PM';

  // Configurar enlace oficial de negocio del vendedor (Catálogo Digital)
  const storeUrl = getPublicShareUrl(`?store=${state.currentStore.id}`);
  const storeUrlInput = document.getElementById('seller-store-share-url');
  if (storeUrlInput) {
    storeUrlInput.value = storeUrl;
  }

  // Botón Copiar Link del Negocio
  const copyBtn = document.getElementById('btn-seller-copy-link');
  if (copyBtn) {
    copyBtn.onclick = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(storeUrl).then(() => {
          showToast('📋 ¡Enlace de tu tienda copiado al portapapeles!');
        }).catch(() => {
          legacyClipboardCopy(storeUrl);
        });
      } else {
        legacyClipboardCopy(storeUrl);
      }
    };
  }

  // Botón Compartir Catálogo Oficial por WhatsApp
  const waShareBtn = document.getElementById('btn-seller-share-wa-catalog');
  if (waShareBtn) {
    waShareBtn.onclick = () => {
      const shareText = `🛍️ ¡Hola! Te invito a conocer el catálogo digital oficial de *${state.currentStore.name}* en la Vitrina.\n\n📍 ${state.currentStore.city}\nMira todos nuestros productos disponibles y haz tus pedidos directo por WhatsApp aquí:\n\n${storeUrl}`;
      if (navigator.share) {
        navigator.share({
          title: state.currentStore.name,
          text: shareText,
          url: storeUrl
        }).catch(() => {});
      } else {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, '_blank');
      }
    };
  }

  // Botón Ver Mi Catálogo Público
  const previewCatBtn = document.getElementById('btn-seller-preview-catalog');
  if (previewCatBtn) {
    previewCatBtn.onclick = () => {
      openStoreCatalog(state.currentStore.id);
    };
  }

  // Obtener videos frescos del vendedor directamente del servidor
  try {
    const freshRes = await fetch(`/api/videos?storeId=${encodeURIComponent(state.currentStore.id)}&_t=${Date.now()}`);
    if (freshRes.ok) {
      const freshVids = await freshRes.json();
      if (Array.isArray(freshVids)) {
        state.videos = state.videos.filter(v => v.storeId !== state.currentStore.id).concat(freshVids);
      }
    }
  } catch (err) {
    console.warn('Error al sincronizar spots del vendedor:', err);
  }

  const myVideos = state.videos.filter(v => v.storeId === state.currentStore.id);
  const totalViews = myVideos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalLikes = myVideos.reduce((sum, v) => sum + (v.likes || 0), 0);
  const totalSaved = myVideos.reduce((sum, v) => sum + (v.savedCount || 0), 0);

  // Cargar datos y notificaciones del vendedor
  document.getElementById('seller-dash-title').textContent = `Panel de Control: ${state.currentStore.name}`;
  if (document.getElementById('seller-stat-spot')) document.getElementById('seller-stat-spot').textContent = 'Activo';

  // Estado de Membresía Pro en panel vendedor
  const isMemActive = Boolean(
    state.currentStore.hasMembership && 
    (!state.currentStore.membershipExpiresAt || new Date(state.currentStore.membershipExpiresAt) > new Date())
  );
  const memLimit = Number(state.currentStore.membershipProductLimit) || Number(state.pricing?.membership_product_limit) || 100;
  const memStatEl = document.getElementById('seller-stat-membership');
  const memStatLabel = document.getElementById('seller-stat-membership-label');
  if (memStatEl) {
    if (isMemActive) {
      memStatEl.innerHTML = `<span style="color:#00ff88; font-weight:800;">👑 Activa</span>`;
      if (memStatLabel) memStatLabel.innerHTML = `Membresía Pro (<strong class="text-spot">${myVideos.length}</strong>/${memLimit} cupos)`;
    } else {
      memStatEl.textContent = 'Inactiva';
      if (memStatLabel) memStatLabel.textContent = 'Membresía Pro ($29.000 COP)';
    }
  }

  const freeQuota = Number(state.pricing?.free_spots_quota) || 5;
  const freeUsed = Math.min(freeQuota, myVideos.length);
  const freeRem = Math.max(0, freeQuota - myVideos.length);
  const isQuotaFull = !isMemActive && myVideos.length >= freeQuota;

  const welcomeStatEl = document.getElementById('seller-stat-welcome');
  const welcomeStatLabel = document.getElementById('seller-stat-welcome-label');
  const welcomeStatIcon = document.getElementById('seller-stat-welcome-icon');
  const quotaBadge = document.getElementById('seller-quota-badge');
  const quotaSubtitle = document.getElementById('seller-quota-subtitle');

  if (welcomeStatEl) {
    if (isMemActive) {
      welcomeStatEl.innerHTML = `<span style="color:#00ff88; font-weight:800;">${myVideos.length} / ${memLimit}</span>`;
      if (welcomeStatLabel) welcomeStatLabel.textContent = 'Cupo Membresía Pro';
      if (welcomeStatIcon) welcomeStatIcon.innerHTML = '<i class="fa-solid fa-crown text-spot"></i>';
    } else {
      welcomeStatEl.innerHTML = `<span style="color:#00ff88; font-weight:800;">${myVideos.length} activos</span>`;
      if (welcomeStatLabel) welcomeStatLabel.textContent = 'Publicaciones Ilimitadas ($0 COP)';
      if (welcomeStatIcon) welcomeStatIcon.innerHTML = '<i class="fa-solid fa-infinity text-gold"></i>';
    }
  }

  if (quotaBadge) {
    if (isMemActive) {
      quotaBadge.style.background = 'rgba(168,85,247,0.15)';
      quotaBadge.style.color = '#c084fc';
      quotaBadge.style.borderColor = 'rgba(168,85,247,0.4)';
      quotaBadge.innerHTML = `<i class="fa-solid fa-crown"></i> Membresía Pro: ${myVideos.length}/${memLimit}`;
    } else if (isQuotaFull) {
      quotaBadge.style.background = 'rgba(239,68,68,0.15)';
      quotaBadge.style.color = '#ef4444';
      quotaBadge.style.borderColor = 'rgba(239,68,68,0.4)';
      quotaBadge.innerHTML = `<i class="fa-solid fa-lock"></i> Spots Gratuitos: ${freeQuota}/${freeQuota} (Cupo Lleno)`;
    } else {
      quotaBadge.style.background = 'rgba(0,255,136,0.15)';
      quotaBadge.style.color = '#00ff88';
      quotaBadge.style.borderColor = 'rgba(0,255,136,0.3)';
      quotaBadge.innerHTML = `<i class="fa-solid fa-gift"></i> Spots Gratuitos: ${freeUsed}/${freeQuota} (Quedan ${freeRem})`;
    }
  }

  if (quotaSubtitle) {
    if (isQuotaFull) {
      quotaSubtitle.innerHTML = `<strong style="color:var(--spot-gold);">Has publicado ${freeUsed} de tus ${freeQuota} spots gratuitos.</strong> Publicaciones permanentes con carrusel de hasta 7 fotos a $0 COP.`;
    } else {
      quotaSubtitle.textContent = 'Tus SPOTS permanecen activos en la vitrina comercial';
    }
  }

  document.getElementById('seller-stat-views').textContent = formatNumber(totalViews);
  document.getElementById('seller-stat-likes').textContent = formatNumber(totalLikes);
  document.getElementById('seller-stat-saved').textContent = formatNumber(totalSaved);

  // Cargar notificaciones del vendedor en la campana flotante
  loadSellerNotifications();

  // Renderizar lista de videos con botones de Eliminar y Pausar
  const vList = document.getElementById('seller-videos-list');
  if (myVideos.length === 0) {
    vList.innerHTML = '<p class="text-muted" style="grid-column:1/-1;">Aún no has publicado ningún SPOT. ¡Publica tu primer producto o servicio gratis!</p>';
  } else {
    vList.innerHTML = myVideos.map((v, idx) => {
      const spotNumberBadge = !isMemActive && idx < freeQuota
        ? `<span style="position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.82); color:#00ff88; border:1px solid rgba(0,255,136,0.4); border-radius:6px; font-size:0.65rem; font-weight:800; padding:2px 7px;"><i class="fa-solid fa-gift"></i> Spot Gratis #${idx + 1}</span>`
        : (!isMemActive
            ? `<span style="position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.82); color:var(--spot-gold); border:1px solid rgba(255,184,0,0.4); border-radius:6px; font-size:0.65rem; font-weight:800; padding:2px 7px;"><i class="fa-solid fa-image"></i> Spot #${idx + 1}</span>`
            : `<span style="position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.82); color:#c084fc; border:1px solid rgba(168,85,247,0.4); border-radius:6px; font-size:0.65rem; font-weight:800; padding:2px 7px;"><i class="fa-solid fa-crown"></i> Pro #${idx + 1}</span>`
          );
      const vPhotos = (Array.isArray(v.photos) && v.photos.length > 0)
        ? v.photos
        : (Array.isArray(v.detailPhotos) ? v.detailPhotos : (v.thumbnailUrl ? [v.thumbnailUrl] : []));
      const photosCount = vPhotos.length;

      let slotsHtml = '';
      for (let sIdx = 0; sIdx < 3; sIdx++) {
        if (vPhotos[sIdx]) {
          slotsHtml += `
            <div class="seller-photo-wrapper" data-vid-id="${v.id}" data-photo-idx="${sIdx}" data-photo="${vPhotos[sIdx]}" data-title="${escapeHtml(v.title)}" title="Ver foto ${sIdx + 1} ampliada">
              <img src="${vPhotos[sIdx]}" class="seller-mini-photo" alt="Foto ${sIdx + 1}">
              <span class="zoom-hover-icon"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
              <button type="button" class="seller-photo-delete-badge" data-vid-id="${v.id}" data-photo-idx="${sIdx}" title="Eliminar foto ${sIdx + 1}">&times;</button>
            </div>
          `;
        } else {
          slotsHtml += `
            <div class="seller-photo-empty-slot" data-vid-id="${v.id}" data-slot-idx="${sIdx}" title="Toca para agregar foto ${sIdx + 1}">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>+ Foto ${sIdx + 1}</span>
            </div>
          `;
        }
      }

      const photosHtml = `
        <div class="seller-detail-photos-container">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span class="seller-photos-title" style="margin-bottom:0;"><i class="fa-solid fa-images text-spot"></i> Fotos de detalle (${photosCount}/3):</span>
            <span style="font-size:0.68rem; color:var(--spot-gold); font-weight:600;">3 fotos máx.</span>
          </div>
          <div class="seller-photos-strip">
            ${slotsHtml}
          </div>
        </div>
      `;

      let modBanner = '';
      if (v.moderationStatus === 'rejected_needs_fix') {
        modBanner = `
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.45); border-radius: 8px; padding: 10px; margin: 8px 0; font-size: 0.78rem;">
            <div style="color: #f59e0b; font-weight: 800; margin-bottom: 3px;">
              <i class="fa-solid fa-triangle-exclamation"></i> Fotos Rechazadas para Corrección
            </div>
            <div style="color: var(--text-dim); margin-bottom: 8px; font-size: 0.75rem; line-height: 1.35;">
              ${v.adminReason ? escapeHtml(v.adminReason) : 'Tus fotos no cumplen con las políticas comunitarias o nitidez comercial. <strong>¡Tu cupo está a salvo!</strong> Cambia las fotos para reactivar tu anuncio gratis.'}
            </div>
            <button type="button" class="btn btn-spot btn-sm btn-fix-rejected-spot" data-id="${v.id}" data-title="${escapeHtml(v.title)}" style="font-size: 0.75rem; padding: 6px 12px; width: 100%;">
              <i class="fa-solid fa-camera-rotate"></i> Cambiar Fotos y Reactivar SPOT ($0 COP)
            </button>
          </div>
        `;
      } else if (v.moderationStatus === 'under_review') {
        modBanner = `
          <div style="background: rgba(0, 210, 255, 0.12); border: 1px solid rgba(0, 210, 255, 0.35); border-radius: 8px; padding: 8px 10px; margin: 8px 0; font-size: 0.75rem; color: #00d2ff;">
            <i class="fa-solid fa-hourglass-half"></i> <strong>En Revisión Preventiva:</strong> Anuncio temporalmente pausado mientras el equipo de moderación revisa los reportes.
          </div>
        `;
      }

      return `
        <div class="seller-vid-item">
          <div style="position: relative;">
            <img class="seller-vid-thumb" src="${v.thumbnailUrl}" alt="${escapeHtml(v.title)}">
            ${spotNumberBadge}

          </div>
          <h4 style="margin: 4px 0 2px 0;">${escapeHtml(v.title)}</h4>
          <div style="font-size:0.88rem; color:var(--spot-gold); font-weight:800;">${v.priceFormatted}</div>
          <div style="font-size:0.75rem; color:var(--wa-green); font-weight:600;">${escapeHtml(cleanDelivery(v.delivery || 'Domicilio Gratis'))}</div>
          
          ${modBanner}
          ${photosHtml}

          <div style="font-size:0.75rem; color:var(--text-muted); margin: 6px 0;">
            <span>👀 ${v.views} vistas</span> • <span>❤️ ${v.likes} likes</span>
          </div>
          <div class="seller-vid-actions">
            <button type="button" class="btn btn-outline btn-sm btn-edit-video" data-id="${v.id}" title="Editar precio, título o etiquetas">
              <i class="fa-solid fa-pen-to-square"></i> Editar
            </button>
            <button class="btn btn-ghost btn-sm btn-del-video" data-id="${v.id}" title="Eliminar SPOT">
              <i class="fa-solid fa-trash"></i> Eliminar
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Listener para clic en fotos de detalle en el panel del vendedor (abre Lightbox)
    vList.querySelectorAll('.seller-photo-wrapper').forEach(wrapper => {
      wrapper.addEventListener('click', (e) => {
        if (e.target.closest('.seller-photo-delete-badge')) return;
        const pUrl = wrapper.getAttribute('data-photo');
        const pTitle = wrapper.getAttribute('data-title');
        const vidId = wrapper.getAttribute('data-vid-id');
        const targetVid = myVideos.find(x => x.id === vidId) || state.videos.find(x => x.id === vidId);
        const allList = (targetVid && targetVid.detailPhotos) ? targetVid.detailPhotos : [pUrl];
        openPhotoViewer(pUrl, pTitle, allList);
      });
    });

    // Listener para agregar foto en slot vacío (+ Foto 1, 2, 3)
    vList.querySelectorAll('.seller-photo-empty-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const vidId = slot.getAttribute('data-vid-id');
        const slotIdx = slot.getAttribute('data-slot-idx');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.onchange = async () => {
          if (!fileInput.files || fileInput.files.length === 0) {
            fileInput.remove();
            return;
          }
          const file = fileInput.files[0];
          const fData = new FormData();
          fData.append('photo', file);
          fData.append('index', slotIdx);

          showToast('Subiendo foto de detalle...');
          try {
            const upRes = await fetch(`/api/videos/${vidId}/photos`, {
              method: 'POST',
              body: fData
            });
            if (upRes.ok) {
              showToast('🎉 ¡Foto de detalle agregada con éxito!');
              await loadVideos();
              openSellerPanel();
            } else {
              const errData = await upRes.json().catch(() => ({}));
              alert('Error al subir foto: ' + (errData.error || upRes.statusText));
            }
          } catch (err) {
            alert('Error de conexión al subir la foto.');
          } finally {
            fileInput.remove();
          }
        };

        fileInput.click();
      });
    });

    // Listener para eliminar foto de detalle individual
    vList.querySelectorAll('.seller-photo-delete-badge').forEach(delBtn => {
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const vidId = delBtn.getAttribute('data-vid-id');
        const pIdx = delBtn.getAttribute('data-photo-idx');
        if (confirm(`¿Deseas quitar la foto ${Number(pIdx) + 1} de este anuncio?`)) {
          try {
            const res = await fetch(`/api/videos/${vidId}/photos/${pIdx}`, { method: 'DELETE' });
            if (res.ok) {
              showToast('🗑️ Foto eliminada del anuncio');
              await loadVideos();
              await openSellerPanel();
            } else {
              const errData = await res.json().catch(() => ({}));
              alert(errData.error || 'No se pudo eliminar la foto.');
            }
          } catch (err) {
            alert('Error de conexión al eliminar foto');
          }
        }
      });
    });

    // Listener para editar video (Precio, título, condiciones de entrega, categoría)
    vList.querySelectorAll('.btn-edit-video').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditProductModal(id);
      });
    });

    // Listener para eliminar video
    vList.querySelectorAll('.btn-del-video').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('¿Estás seguro de que deseas eliminar este SPOT? Desaparecerá de la Vitrina de inmediato.')) {
          const delRes = await fetch(`/api/videos/${id}?storeId=${state.currentStore.id}`, { method: 'DELETE' });
          if (delRes.ok) {
            showToast('SPOT eliminado con éxito');
            await loadVideos();
            openSellerPanel();
          }
        }
      });
    });



    // Listener para corregir fotos de un SPOT rechazado (Segunda Oportunidad $0 COP)
    vList.querySelectorAll('.btn-fix-rejected-spot').forEach(btn => {
      btn.addEventListener('click', () => {
        const vidId = btn.getAttribute('data-id');
        const vidTitle = btn.getAttribute('data-title');
        openFixRejectedModal(vidId, vidTitle);
      });
    });
  }
}

// ==========================================
// 6.1 GESTIÓN MODERNA DE NOTIFICACIONES (DROPDOWN & CAMPANA)
// ==========================================
async function loadSellerNotifications() {
  if (!state.currentStore) return;
  try {
    const notifRes = await fetch(`/api/notifications/${state.currentStore.id}`);
    if (notifRes.ok) {
      const notifs = await notifRes.json();
      renderSellerNotifications(notifs);
    }
  } catch (e) {
    console.error('Error cargando notificaciones:', e);
  }
}

function renderSellerNotifications(notifs) {
  const notifList = document.getElementById('seller-notif-list');
  const badge = document.getElementById('seller-notif-badge');
  const countTag = document.getElementById('notif-count-tag');
  const clearBtn = document.getElementById('btn-clear-all-notifs');

  const count = Array.isArray(notifs) ? notifs.length : 0;

  if (badge) {
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  if (countTag) {
    countTag.textContent = count;
  }

  if (clearBtn) {
    clearBtn.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  if (!notifList) return;

  if (count === 0) {
    notifList.innerHTML = '<div class="notif-empty-state"><i class="fa-regular fa-bell-slash" style="font-size:1.5rem; margin-bottom:8px; display:block; opacity:0.5;"></i>No tienes preguntas ni alertas pendientes.</div>';
    return;
  }

  notifList.innerHTML = notifs.map(n => `
    <div class="notif-item" data-notif-id="${n.id}">
      <div class="notif-content-col">
        <span class="notif-text">${escapeHtml(n.text)}</span>
        <span class="notif-time">${formatTimeAgo(n.date)}</span>
      </div>
      <button type="button" class="btn-dismiss-notif" data-id="${n.id}" title="Descartar esta alerta">&times;</button>
    </div>
  `).join('');

  notifList.querySelectorAll('.btn-dismiss-notif').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const nId = btn.getAttribute('data-id');
      await dismissSingleNotification(nId);
    });
  });
}

async function dismissSingleNotification(notifId) {
  if (!state.currentStore || !notifId) return;
  try {
    const res = await fetch(`/api/notifications/${state.currentStore.id}/${notifId}`, { method: 'DELETE' });
    if (res.ok) {
      await loadSellerNotifications();
    }
  } catch (err) {
    console.error('Error descartando notificación:', err);
  }
}

async function clearAllNotifications() {
  if (!state.currentStore) return;
  try {
    const res = await fetch(`/api/notifications/${state.currentStore.id}`, { method: 'DELETE' });
    if (res.ok) {
      renderSellerNotifications([]);
      showToast('Bandeja de notificaciones limpia', 'success');
    }
  } catch (err) {
    console.error('Error limpiando notificaciones:', err);
  }
}

// ==========================================
// 7. VISTA: PANEL MAESTRO DE ADMINISTRADOR
// ==========================================
function openAdminPortal() {
  showView('admin-panel-view');
  const loginScreen = document.getElementById('admin-login-screen');
  const execScreen = document.getElementById('admin-exec-screen');

  if (state.adminToken) {
    loginScreen.style.display = 'none';
    execScreen.style.display = 'block';
    loadAdminMetrics();
  } else {
    loginScreen.style.display = 'block';
    execScreen.style.display = 'none';
  }
  const adminPanel = document.getElementById('admin-panel-view');
  if (adminPanel) {
    adminPanel.scrollTop = 0;
  }
}

function updateAdminQuotaHelperUI(quotaVal) {
  const helperVal = document.getElementById('adm-helper-quota-val');
  if (helperVal) helperVal.textContent = 'Ilimitadas';
  const headerVal = document.getElementById('adm-header-quota-val');
  if (headerVal) headerVal.textContent = `PUBLICACIONES ILIMITADAS ($0 COP)`;
  const headerDesc = document.getElementById('adm-pricing-header-desc');
  if (headerDesc) {
    headerDesc.innerHTML = `Plataforma de catálogo con <strong>PUBLICACIONES ILIMITADAS 100% GRATIS</strong> para todos los comercios. El feed opera en modalidad <strong>100% ORGÁNICA Y DEMOCRÁTICA</strong> financiado pasivamente con <strong>Google AdMob</strong>.`;
  }
}

async function loadAdminMetrics() {
  try {
    const res = await fetch('/api/admin/metrics', {
      headers: { 'x-admin-token': state.adminToken }
    });

    if (res.status === 403) {
      state.adminToken = null;
      localStorage.removeItem('vitrina_admin_token');
      openAdminPortal();
      return;
    }

    if (res.ok) {
      const data = await res.json();
      document.getElementById('adm-revenue-total').textContent = data.counts.spotsActive || 0;
      document.getElementById('adm-wa-clicks').textContent = data.telemetry.totalWhatsAppClicks;
      document.getElementById('adm-spots-active').textContent = data.counts.spotsActive;
      document.getElementById('adm-stores-count').textContent = `${data.counts.stores} / ${data.counts.videos}`;

      // Parámetros Dinámicos Google AdMob & Monetización
      const prc = data.pricing || {};
      const admob = data.admob || {};
      state.admobConfig = Object.assign(state.admobConfig || {}, admob);

      const freeQuotaVal = prc.free_spots_quota || 100;
      updateAdminQuotaHelperUI(freeQuotaVal);

      if (document.getElementById('adm-admob-feed-freq')) {
        document.getElementById('adm-admob-feed-freq').value = admob.feedAdFrequency || 4;
      }
      if (document.getElementById('adm-admob-interstitial-upload')) {
        document.getElementById('adm-admob-interstitial-upload').value = admob.interstitialOnUpload !== false ? 'true' : 'false';
      }

      // Credenciales Oficiales de Google AdMob
      if (document.getElementById('adm-admob-test-mode')) {
        document.getElementById('adm-admob-test-mode').value = admob.testMode !== false ? 'true' : 'false';
      }
      if (document.getElementById('adm-admob-pub-id')) {
        document.getElementById('adm-admob-pub-id').value = admob.publisherId || 'ca-pub-3940256099942544';
      }
      if (document.getElementById('adm-admob-banner-unit-id')) {
        document.getElementById('adm-admob-banner-unit-id').value = admob.bannerUnitId || 'ca-app-pub-3940256099942544/6300978111';
      }
      if (document.getElementById('adm-admob-interstitial-unit-id')) {
        document.getElementById('adm-admob-interstitial-unit-id').value = admob.interstitialUnitId || 'ca-app-pub-3940256099942544/1033173712';
      }

      const admobBadge = document.getElementById('adm-admob-status-badge');
      if (admobBadge) {
        if (admob.testMode === false) {
          admobBadge.textContent = '🟢 MODO PRODUCCIÓN EN VIVO (INGRESOS REALES)';
          admobBadge.style.background = 'rgba(0, 255, 136, 0.2)';
          admobBadge.style.color = '#00ff88';
          admobBadge.style.borderColor = 'rgba(0, 255, 136, 0.5)';
        } else {
          admobBadge.textContent = '🧪 MODO PRUEBAS OFICIAL (TEST ADS)';
          admobBadge.style.background = 'rgba(0, 210, 255, 0.15)';
          admobBadge.style.color = '#00d2ff';
          admobBadge.style.borderColor = 'rgba(0, 210, 255, 0.4)';
        }
      }

      // Top tiendas
      const topList = document.getElementById('adm-top-stores-list');
      if (topList && Array.isArray(data.topStores)) {
        topList.innerHTML = data.topStores.map((s, idx) => `
          <div class="top-store-row">
            <span><strong>#${idx + 1}</strong> ${escapeHtml(s.name)}</span>
            <span class="text-green" style="font-weight:700;"><i class="fa-brands fa-whatsapp"></i> ${s.clicks} clientes</span>
          </div>
        `).join('');
      }

      // Telemetría & Estimación de Ganancias Google AdMob en Vivo
      const admobStats = data.admobStats || {
        feedImpressions: 0,
        interstitialImpressions: 0,
        totalImpressions: 0,
        estimatedUsd: 0,
        estimatedCop: 0,
        recentEvents: []
      };

      const estCopFormatted = `$${(admobStats.estimatedCop || 0).toLocaleString('es-CO')} COP`;
      const estUsdFormatted = `$${Number(admobStats.estimatedUsd || 0).toFixed(2)} USD`;
      const totalImpFormatted = (admobStats.totalImpressions || 0).toLocaleString('es-CO');

      const elEstCop = document.getElementById('adm-admob-est-cop');
      if (elEstCop) elEstCop.textContent = estCopFormatted;

      const elEstUsd = document.getElementById('adm-admob-est-usd');
      if (elEstUsd) elEstUsd.textContent = `${estUsdFormatted} • ${totalImpFormatted} Impresiones`;

      const elPillEarnings = document.getElementById('adm-admob-pill-earnings');
      if (elPillEarnings) {
        elPillEarnings.innerHTML = `${estCopFormatted} <small style="font-size: 0.75rem; color: #00ff88;">(${estUsdFormatted})</small>`;
      }

      const elTotalStat = document.getElementById('adm-admob-total-stat');
      if (elTotalStat) elTotalStat.textContent = totalImpFormatted;

      const elFeedStat = document.getElementById('adm-admob-feed-stat');
      if (elFeedStat) elFeedStat.textContent = (admobStats.feedImpressions || 0).toLocaleString('es-CO');

      const elInterStat = document.getElementById('adm-admob-inter-stat');
      if (elInterStat) elInterStat.textContent = (admobStats.interstitialImpressions || 0).toLocaleString('es-CO');

      const elEventsList = document.getElementById('adm-admob-events-list');
      if (elEventsList) {
        if (admobStats.recentEvents && admobStats.recentEvents.length > 0) {
          elEventsList.innerHTML = admobStats.recentEvents.map(ev => {
            const dateStr = new Date(ev.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const isInter = ev.typeKey === 'interstitial';
            return `
              <div class="tx-row" style="padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 0.85rem; color: ${isInter ? '#ff9800' : '#00d2ff'};">
                    <i class="fa-solid ${isInter ? 'fa-mobile-screen' : 'fa-rectangle-ad'}"></i> ${escapeHtml(ev.type)}
                  </strong>
                  <small style="display: block; color: var(--text-muted); font-size: 0.72rem;">Servido a usuario • ${dateStr}</small>
                </div>
                <span class="badge" style="background: rgba(0, 255, 136, 0.12); color: #00ff88; font-size: 0.72rem; font-weight: 700;">+ Moneda AdMob</span>
              </div>
            `;
          }).join('');
        } else {
          elEventsList.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 15px;">Registrando primeras impresiones de anuncios...</div>';
        }
      }

      // Cargar reportes de moderación comunitaria (Nivel 2)
      loadAdminModeration();
    }
  } catch (err) {
    console.error('Error cargando métricas admin:', err);
  }
}

// ==========================================
// 7.1 MODERACIÓN Y CONTROL RÁPIDO MAESTRO
// ==========================================
state.adminModTab = state.adminModTab || 'reported';
state.adminModSearch = state.adminModSearch || '';

window.previewSpotFromAdmin = function(videoId) {
  const targetIdx = state.videos.findIndex(v => v.id === videoId);
  if (targetIdx !== -1) {
    showView('feed-view');
    setTimeout(() => {
      scrollToFeedIndex(targetIdx, false);
      showToast('👁️ Viendo spot en modo comprador');
    }, 80);
  } else {
    showToast('Spot no encontrado en el feed actual.', 'error');
  }
};

async function loadAdminModeration() {
  const container = document.getElementById('adm-moderation-list');
  if (!container || !state.adminToken) return;

  try {
    const res = await fetch('/api/admin/moderation', {
      headers: { 'x-admin-token': state.adminToken }
    });
    let reportedItems = [];
    if (res.ok) {
      const data = await res.json();
      reportedItems = Array.isArray(data) ? data : (data.items || []);
    }

    // Actualizar badges numéricos
    const badgeReported = document.getElementById('mod-badge-reported');
    if (badgeReported) badgeReported.textContent = reportedItems.length;
    const badgeAll = document.getElementById('mod-badge-all');
    if (badgeAll) badgeAll.textContent = state.videos ? state.videos.length : 0;
    const badgeStores = document.getElementById('mod-badge-stores');
    if (badgeStores) badgeStores.textContent = state.stores ? state.stores.length : 0;

    const query = (state.adminModSearch || '').toLowerCase().trim();

    // 1. PESTAÑA: REPORTADOS Y EN REVISIÓN
    if (state.adminModTab === 'reported') {
      let filtered = reportedItems;
      if (query) {
        filtered = filtered.filter(item => {
          const vid = item.video || item;
          const store = item.store || {};
          return (vid.title || '').toLowerCase().includes(query) ||
                 (store.name || vid.storeName || '').toLowerCase().includes(query) ||
                 (vid.city || '').toLowerCase().includes(query);
        });
      }

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 24px 16px; background: rgba(0, 255, 136, 0.05); border: 1px dashed rgba(0, 255, 136, 0.3); border-radius: 12px; color: #10b981;">
            <i class="fa-solid fa-circle-check" style="font-size: 1.8rem; margin-bottom: 8px; display: block;"></i>
            <strong>¡Comunidad Limpia y Protegida!</strong>
            <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">${query ? 'No se encontraron reportes con ese criterio de búsqueda.' : 'No hay anuncios reportados ni en revisión en este momento.'}</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(item => {
        const vid = item.video || item;
        const store = item.store || {};
        const videoId = vid.id || item.videoId;
        const title = vid.title || item.title || 'Anuncio';
        const price = vid.price || item.price || 0;
        const coverUrl = vid.thumbnailUrl || vid.coverUrl || (vid.photos && vid.photos[0]) || '';
        const storeName = store.name || vid.storeName || item.storeName || 'Comercio';
        const storePhone = store.whatsapp || vid.storePhone || item.storePhone || '';
        const cleanWa = storePhone.replace(/[^0-9]/g, '');
        const storeId = store.id || vid.storeId || item.storeId;
        const reportCount = vid.reportCount || item.reportCount || (item.reports ? item.reports.length : 0);
        const modStatus = vid.moderationStatus || item.moderationStatus || item.status || 'reported';
        const adminReason = vid.adminReason || item.adminReason || '';
        const boostBadge = vid.boostLevel && vid.boostLevel !== 'none' ? vid.boostLevel : (item.boostBadge || null);

        let statusBadge = '<span style="background: rgba(239,68,68,0.2); color:#ef4444; border:1px solid rgba(239,68,68,0.4); padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-flag"></i> Reportado</span>';
        if (modStatus === 'under_review') {
          statusBadge = '<span style="background: rgba(0,210,255,0.2); color:#00d2ff; border:1px solid rgba(0,210,255,0.4); padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-hourglass-half"></i> En Revisión</span>';
        } else if (modStatus === 'rejected_needs_fix') {
          statusBadge = '<span style="background: rgba(245,158,11,0.2); color:#f59e0b; border:1px solid rgba(245,158,11,0.4); padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-camera-rotate"></i> Esperando Reemplazo</span>';
        }

        const reportsHtml = (item.reports || []).map(r => `
          <div style="font-size: 0.76rem; color: #fca5a5; background: rgba(239,68,68,0.1); padding: 4px 8px; border-radius: 4px; margin-top: 4px;">
            <strong>• ${escapeHtml(r.reason)}:</strong> ${escapeHtml(r.details || 'Sin detalles')} <span style="color: var(--text-muted); font-size: 0.7rem;">(${new Date(r.timestamp || r.date).toLocaleTimeString()})</span>
          </div>
        `).join('');

        return `
          <div class="admin-mod-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap;">
              <img src="${coverUrl}" alt="${escapeHtml(title)}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-subtle); flex-shrink: 0;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';">
              <div style="flex: 1; min-width: 200px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                  ${statusBadge}
                  <span style="font-size: 0.78rem; color: #ef4444; font-weight: 700;"><i class="fa-solid fa-triangle-exclamation"></i> ${reportCount} Reportes</span>
                  ${boostBadge ? `<span style="font-size: 0.72rem; background: var(--spot-gold); color: #000; font-weight: 800; padding: 2px 6px; border-radius: 4px;">⚡ ${boostBadge}</span>` : ''}
                </div>
                <h4 style="margin: 0 0 4px 0; color: #fff; font-size: 0.95rem;">${escapeHtml(title)}</h4>
                <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 2px;">
                  🏪 <strong>${escapeHtml(storeName)}</strong> • Tel: ${escapeHtml(storePhone || 'N/A')}
                </div>
                <div style="font-size: 0.82rem; color: var(--spot-gold); font-weight: 800;">
                  $${(price || 0).toLocaleString('es-CO')}
                </div>
                ${adminReason ? `<div style="font-size: 0.75rem; color: #f59e0b; margin-top: 4px;"><strong>Nota Admin:</strong> ${escapeHtml(adminReason)}</div>` : ''}
                ${reportsHtml ? `<div style="margin-top: 6px;">${reportsHtml}</div>` : ''}
              </div>
            </div>

            <!-- BOTONES DE ACCIÓN DE MODERACIÓN -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
              <button type="button" class="btn btn-ghost btn-sm" onclick="previewSpotFromAdmin('${videoId}')" style="font-size: 0.75rem; color: #00d2ff; border: 1px solid rgba(0,210,255,0.3); padding: 5px 10px;">
                <i class="fa-solid fa-eye"></i> Ver Spot
              </button>
              ${cleanWa ? `
              <a href="https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hola ${storeName}, te escribo desde la administración oficial de la Vitrina sobre tu spot "${title}".`)}" target="_blank" class="btn btn-sm" style="font-size: 0.75rem; background: rgba(37,211,102,0.18); color: #25d366; border: 1px solid rgba(37,211,102,0.35); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px;">
                <i class="fa-brands fa-whatsapp"></i> Chat Vendedor
              </a>` : ''}
              <button type="button" class="btn btn-warning btn-sm" onclick="executeAdminModeration('${videoId}', 'reject_needs_fix', '${storeId}')" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 0.75rem; font-weight: 700; padding: 5px 10px;">
                <i class="fa-solid fa-camera-rotate"></i> Rechazar Fotos
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="executeAdminModeration('${videoId}', 'approve', '${storeId}')" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 0.75rem; font-weight: 700; padding: 5px 10px;">
                <i class="fa-solid fa-check"></i> Aprobar
              </button>
              <button type="button" class="btn btn-ghost btn-sm" onclick="executeAdminModeration('${videoId}', 'delete', '${storeId}')" style="color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 0.75rem; padding: 5px 10px;">
                <i class="fa-solid fa-trash"></i> Eliminar
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="executeAdminModeration('${videoId}', 'ban_store', '${storeId}')" style="background: #ef4444; color: #fff; font-size: 0.75rem; font-weight: 700; border: none; padding: 5px 10px;">
                <i class="fa-solid fa-ban"></i> Bloquear Tienda
              </button>
            </div>
          </div>
        `;
      }).join('');

    // 2. PESTAÑA: TODOS LOS SPOTS ACTIVOS
    } else if (state.adminModTab === 'all') {
      let vids = state.videos || [];
      if (query) {
        vids = vids.filter(v => 
          (v.title || '').toLowerCase().includes(query) ||
          (v.storeName || '').toLowerCase().includes(query) ||
          (v.city || '').toLowerCase().includes(query) ||
          (v.category || '').toLowerCase().includes(query)
        );
      }

      if (vids.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted);"><i class="fa-solid fa-box-open" style="font-size:2rem; margin-bottom:8px; display:block;"></i>No se encontraron spots con ese criterio.</div>`;
        return;
      }

      container.innerHTML = vids.map(v => {
        const store = (state.stores || []).find(s => s.id === v.storeId) || {};
        const cleanWa = (store.whatsapp || v.storeWhatsapp || '').replace(/[^0-9]/g, '');
        const waMsg = encodeURIComponent(`Hola ${v.storeName}, te escribo desde la administración de la Vitrina sobre tu publicación "${v.title}".`);
        const cover = (v.photos && v.photos[0]) || v.thumbnailUrl || '';

        return `
          <div class="admin-mod-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <img src="${cover}" alt="${escapeHtml(v.title)}" style="width: 70px; height: 85px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';">
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px; flex-wrap: wrap;">
                  <span style="font-size: 0.72rem; color: var(--spot-gold); font-weight: 800; background: rgba(255,184,0,0.15); padding: 2px 6px; border-radius: 4px;">${v.hasSpot ? '⚡ SPOT DESTACADO' : 'ESTÁNDAR'}</span>
                  <span style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(v.city || 'Colombia')}</span>
                </div>
                <h4 style="margin: 0 0 3px 0; color: #fff; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(v.title)}</h4>
                <div style="font-size: 0.78rem; color: var(--text-dim); margin-bottom: 3px;">
                  🏪 <strong>${escapeHtml(v.storeName)}</strong> • ${(v.priceFormatted || `$${(v.price||0).toLocaleString('es-CO')}`)}
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; gap: 10px;">
                  <span><i class="fa-solid fa-eye"></i> ${v.views || 0}</span>
                  <span><i class="fa-solid fa-heart"></i> ${v.likes || 0}</span>
                  <span><i class="fa-brands fa-whatsapp text-wa"></i> ${v.whatsappClicks || 0}</span>
                </div>
              </div>
            </div>

            <!-- BOTONES DE GESTIÓN RÁPIDA -->
            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
              <button type="button" class="btn btn-ghost btn-sm" onclick="previewSpotFromAdmin('${v.id}')" style="font-size: 0.74rem; padding: 4px 8px; color: #00d2ff; border: 1px solid rgba(0,210,255,0.3);">
                <i class="fa-solid fa-eye"></i> Ver en Feed
              </button>
              ${cleanWa ? `
              <a href="https://wa.me/${cleanWa}?text=${waMsg}" target="_blank" class="btn btn-sm" style="font-size: 0.74rem; padding: 4px 8px; background: rgba(37,211,102,0.18); color: #25d366; border: 1px solid rgba(37,211,102,0.35); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fa-brands fa-whatsapp"></i> WhatsApp
              </a>` : ''}
              <button type="button" class="btn btn-warning btn-sm" onclick="executeAdminModeration('${v.id}', 'reject_needs_fix', '${v.storeId}')" style="font-size: 0.74rem; padding: 4px 8px; background: rgba(245,158,11,0.2); color: #f59e0b; border: 1px solid rgba(245,158,11,0.4);">
                <i class="fa-solid fa-pause"></i> Pausar
              </button>
              <button type="button" class="btn btn-ghost btn-sm" onclick="executeAdminModeration('${v.id}', 'delete', '${v.storeId}')" style="font-size: 0.74rem; padding: 4px 8px; color: #ef4444; border: 1px solid rgba(239,68,68,0.3);">
                <i class="fa-solid fa-trash"></i> Eliminar
              </button>
            </div>
          </div>
        `;
      }).join('');

    // 3. PESTAÑA: DIRECTORIO DE COMERCIOS
    } else if (state.adminModTab === 'stores') {
      let stores = state.stores || [];
      if (query) {
        stores = stores.filter(s =>
          (s.name || '').toLowerCase().includes(query) ||
          (s.city || '').toLowerCase().includes(query) ||
          (s.whatsapp || '').includes(query)
        );
      }

      if (stores.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted);"><i class="fa-solid fa-store-slash" style="font-size:2rem; margin-bottom:8px; display:block;"></i>No se encontraron comercios.</div>`;
        return;
      }

      container.innerHTML = stores.map(s => {
        const cleanWa = (s.whatsapp || '').replace(/[^0-9]/g, '');
        const storeSpotCount = (state.videos || []).filter(v => v.storeId === s.id).length;
        const waMsg = encodeURIComponent(`Hola ${s.name}, te escribo desde la administración oficial de la Vitrina.`);

        return `
          <div class="admin-mod-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <img src="${s.avatar}" alt="${escapeHtml(s.name)}" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--spot-gold); flex-shrink: 0;" onerror="this.src='https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120';">
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <h4 style="margin: 0; color: #fff; font-size: 0.94rem;">${escapeHtml(s.name)}</h4>
                  ${s.verified ? '<span style="color:#00d2ff; font-size:0.75rem;">☑️</span>' : ''}
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                  📍 ${escapeHtml(s.city || 'Colombia')} • ⭐ ${s.rating || '5.0'} • 📦 <strong>${storeSpotCount} spots</strong>
                </div>
                <div style="font-size: 0.75rem; color: var(--wa-green); font-weight: 600; margin-top: 2px;">
                  📱 ${escapeHtml(s.whatsapp || 'Sin WhatsApp')}
                </div>
              </div>
            </div>

            <!-- ACCIONES RÁPIDAS COMERCIO -->
            <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
              <button type="button" class="btn btn-ghost btn-sm" onclick="openStoreCatalog('${s.id}')" style="font-size: 0.74rem; padding: 4px 8px; color: var(--spot-gold); border: 1px solid rgba(255,184,0,0.3);">
                <i class="fa-solid fa-store"></i> Ver Catálogo
              </button>
              ${cleanWa ? `
              <a href="https://wa.me/${cleanWa}?text=${waMsg}" target="_blank" class="btn btn-sm" style="font-size: 0.74rem; padding: 4px 8px; background: rgba(37,211,102,0.18); color: #25d366; border: 1px solid rgba(37,211,102,0.35); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fa-brands fa-whatsapp"></i> Chat WhatsApp
              </a>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error cargando lista de moderación:', err);
  }
}

window.executeAdminModeration = async function(videoId, action, storeId) {
  if (!state.adminToken) return;

  let adminReason = '';
  if (action === 'reject_needs_fix') {
    adminReason = prompt('Motivo para rechazar las fotos (el vendedor podrá subir nuevas fotos gratis conservando su cupo de spot):', 'Tus fotos no cumplen con las políticas comunitarias o nitidez comercial. Sube nuevas fotos de tu producto.');
    if (adminReason === null) return;
  } else if (action === 'delete') {
    if (!confirm('¿Seguro que deseas eliminar definitivamente este SPOT?')) return;
  } else if (action === 'ban_store') {
    if (!confirm('⚠️ ¿Seguro que deseas BLOQUEAR permanentemente a este comercio y ocultar todo su contenido por infracción deliberada?')) return;
  }

  try {
    const res = await fetch(`/api/admin/videos/${videoId}/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': state.adminToken
      },
      body: JSON.stringify({ action, adminReason })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Acción de moderación aplicada con éxito.');
      loadAdminModeration();
      loadVideos();
    } else {
      alert(data.error || 'Error al aplicar moderación.');
    }
  } catch (err) {
    console.error('Error en moderación:', err);
    alert('Error al conectar con el servidor.');
  }
};

// ==========================================
// 8. MODELO 100% ORGÁNICO (SIN IMPULSOS ARTIFICIALES)
// ==========================================

// ==========================================
// 9. EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  const player = document.getElementById('reel-video');

  // Control de Audio Inteligente
  const soundBtn = document.getElementById('btn-toggle-sound');
  soundBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.isSoundEnabled = !state.isSoundEnabled;
    if (player) player.muted = !state.isSoundEnabled;
    const soundIcon = document.getElementById('sound-icon');
    const soundLabel = document.getElementById('sound-label');

    if (state.isSoundEnabled) {
      if (soundIcon) soundIcon.className = 'fa-solid fa-volume-high';
      if (soundLabel) soundLabel.textContent = 'Audio activo';
    } else {
      if (soundIcon) soundIcon.className = 'fa-solid fa-volume-xmark';
      if (soundLabel) soundLabel.textContent = 'Toca para sonido';
    }
  });

  // Interacción en la Foto Principal:
  // - Doble toque (< 340ms): Dar Like con corazón flotante
  // - Cero avance automático en toque simple (la foto permanece 100% estática hasta hacer scroll)
  let lastPhotoTap = 0;
  const reelPhoto = document.getElementById('reel-photo');
  reelPhoto?.addEventListener('click', (e) => {
    const currentTime = Date.now();
    const tapLength = currentTime - lastPhotoTap;
    if (tapLength < 340 && tapLength > 0) {
      triggerLike();
      createFloatingHeart(e.clientX, e.clientY);
    }
    lastPhotoTap = currentTime;
  });

  // Flechas laterales para cambiar fotos de producto
  document.getElementById('btn-photo-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    nextProductPhoto();
  });
  document.getElementById('btn-photo-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    prevProductPhoto();
  });

  // Clic en el badge contador abre visor de fotos
  document.getElementById('photo-counter-badge')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const video = state.videos[state.currentIndex];
    if (video && video._allPhotos && video._allPhotos.length > 0) {
      openPhotoViewer(video._allPhotos[state.currentPhotoIndex], video.title, video._allPhotos);
    }
  });

  // Flechas de navegación para PC
  document.getElementById('btn-prev-video')?.addEventListener('click', prevVideo);
  document.getElementById('btn-next-video')?.addEventListener('click', nextVideo);

  window.addEventListener('keydown', (e) => {
    if (document.getElementById('feed-view')?.classList.contains('active')) {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') nextVideo();
      if (e.key === 'ArrowUp' || e.key === 'PageUp') prevVideo();
      if (e.key === 'ArrowRight') nextProductPhoto();
      if (e.key === 'ArrowLeft') prevProductPhoto();
    }
  });

  // Navegación por rueda del ratón (desplazamiento continuo suave en PC)
  let wheelTimeout = null;
  const handleFeedWheel = (e) => {
    if (!document.getElementById('feed-view')?.classList.contains('active')) return;
    if (e.target.closest('.modal-dialog, .modal-overlay, .comments-sheet-dialog, .user-dropdown, .city-dropdown, .desk-comments-scroll')) return;
    if (wheelTimeout) return;
    if (e.deltaY > 25) {
      nextVideo();
      wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 280);
    } else if (e.deltaY < -25) {
      prevVideo();
      wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 280);
    }
  };
  document.getElementById('feed-view')?.addEventListener('wheel', handleFeedWheel, { passive: true });

  // Botones de flechas para PC
  document.getElementById('btn-prev-video')?.addEventListener('click', () => prevVideo());
  document.getElementById('btn-next-video')?.addEventListener('click', () => nextVideo());

  // Botón Like en lateral
  document.getElementById('btn-reel-like')?.addEventListener('click', triggerLike);

  // Botón Guardar en lateral
  document.getElementById('btn-reel-save')?.addEventListener('click', triggerSave);

  // Botón Compartir con soporte total en móviles, WhatsApp y PC
  document.getElementById('btn-reel-share')?.addEventListener('click', () => {
    const video = state.videos[state.currentIndex];
    if (!video) return;
    executeShareVideo(video);
  });

  // Botón Comentarios (Abre Bottom Sheet en móvil)
  document.getElementById('btn-reel-comments')?.addEventListener('click', () => {
    const video = state.videos[state.currentIndex];
    if (!video) return;
    openCommentsSheet(video);
  });

  // Cerrar Bottom Sheet de Comentarios con botón redondo X
  const btnCloseComments = document.getElementById('btn-close-comments-sheet');
  if (btnCloseComments) {
    const handleClose = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeCommentsSheet();
    };
    btnCloseComments.addEventListener('click', handleClose);
    btnCloseComments.addEventListener('touchend', handleClose);
  }

  // Cerrar al tocar la barra pill superior
  const dragCloseTrigger = document.getElementById('sheet-drag-close-trigger');
  if (dragCloseTrigger) {
    const handleDragClose = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeCommentsSheet();
    };
    dragCloseTrigger.addEventListener('click', handleDragClose);
    dragCloseTrigger.addEventListener('touchend', handleDragClose);
  }

  // Cerrar al hacer clic o tocar en el fondo oscuro exterior
  const modalComments = document.getElementById('modal-comments-sheet');
  if (modalComments) {
    const handleBackdrop = (e) => {
      if (!e.target.closest('.comments-sheet-dialog')) {
        closeCommentsSheet();
      }
    };
    modalComments.addEventListener('click', handleBackdrop);
    modalComments.addEventListener('touchend', (e) => {
      if (!e.target.closest('.comments-sheet-dialog')) {
        e.preventDefault();
        closeCommentsSheet();
      }
    });
  }

  // Gesto táctil de arrastrar/deslizar hacia abajo en la cabecera para cerrar
  let sheetTouchStartY = 0;
  const sheetHeader = document.querySelector('.sheet-header');
  [dragCloseTrigger, sheetHeader].forEach(el => {
    if (!el) return;
    el.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        sheetTouchStartY = e.touches[0].clientY;
      }
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const sheetTouchEndY = e.changedTouches[0].clientY;
        if (sheetTouchEndY - sheetTouchStartY > 30) {
          closeCommentsSheet();
        }
      }
    }, { passive: true });
  });

  // Cerrar con tecla Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCommentsSheet();
      if (typeof closeGiftsDrawer === 'function') closeGiftsDrawer();
    }
  });

  // Cerrar panel de Regalos al hacer clic en el fondo oscuro exterior
  const modalGifts = document.getElementById('modal-gifts-sheet');
  if (modalGifts) {
    const handleGiftsBackdrop = (e) => {
      if (!e.target.closest('.gifts-sheet-dialog')) {
        if (typeof closeGiftsDrawer === 'function') closeGiftsDrawer();
      }
    };
    modalGifts.addEventListener('click', handleGiftsBackdrop);
  }

  // Barra drag-close para regalos con detección táctil real (>30px hacia abajo)
  let giftsTouchStartY = 0;
  const giftsDragTrigger = document.getElementById('gifts-drag-close-trigger');
  const giftsHeader = document.querySelector('.gifts-sheet-header');
  [giftsDragTrigger, giftsHeader].forEach(el => {
    if (!el) return;
    el.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        giftsTouchStartY = e.touches[0].clientY;
      }
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchEndY - giftsTouchStartY > 35) {
          if (typeof closeGiftsDrawer === 'function') closeGiftsDrawer();
        }
      }
    }, { passive: true });
  });

  // Enviar comentario en Bottom Sheet
  document.getElementById('sheet-comment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('sheet-comment-input');
    const val = input.value.trim();
    if (val) {
      await submitComment(val);
      input.value = '';
    }
  });

  document.getElementById('sheet-comment-form')?.querySelector('button[type="submit"]')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const input = document.getElementById('sheet-comment-input');
    const val = input?.value.trim();
    if (val) {
      await submitComment(val);
      input.value = '';
    }
  });

  // Enviar comentario en widget lateral PC
  document.getElementById('desk-comment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('desk-comment-input');
    const val = input.value.trim();
    if (val) {
      await submitComment(val);
      input.value = '';
    }
  });

  // Clic en avatar/tienda en el video abre Catálogo
  document.getElementById('action-store-profile')?.addEventListener('click', () => {
    const video = state.videos[state.currentIndex];
    if (video) openStoreCatalog(video.storeId);
  });
  document.getElementById('reel-store-click-row')?.addEventListener('click', () => {
    const video = state.videos[state.currentIndex];
    if (video) openStoreCatalog(video.storeId);
  });
  document.getElementById('btn-desk-view-catalog')?.addEventListener('click', () => {
    const video = state.videos[state.currentIndex];
    if (video) openStoreCatalog(video.storeId);
  });

  // Logo lleva a la Pantalla de Inicio (Reset Total de Búsqueda, Filtros y Retorno al Primer SPOT)
  async function goToHomeScreen() {
    // 1. Cerrar cualquier modal o visor abierto (incluyendo fotos de detalle, reportes, calificaciones, auth)
    document.querySelectorAll('.modal').forEach(m => {
      m.style.display = 'none';
    });
    const photoViewer = document.getElementById('photo-viewer-modal');
    if (photoViewer) photoViewer.style.display = 'none';

    // 2. Cerrar cualquier menú desplegable abierto
    document.getElementById('city-dropdown-menu')?.classList.remove('show');
    document.getElementById('user-dropdown-menu')?.classList.remove('show');
    const notifDropdown = document.getElementById('seller-notif-dropdown');
    if (notifDropdown) notifDropdown.style.display = 'none';

    // 3. Limpiar y cerrar completamente el buscador flotante
    const floatingSearchBar = document.getElementById('floating-search-bar');
    if (floatingSearchBar) floatingSearchBar.style.display = 'none';
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
      searchInput.blur();
    }
    const clearBtn = document.getElementById('btn-clear-search');
    if (clearBtn) clearBtn.style.display = 'none';
    state.searchQuery = '';

    // 4. Resetear filtros de categoría a 'Todas'
    state.currentCategory = 'Todas';
    const catLabel = document.getElementById('current-category-label');
    if (catLabel) catLabel.textContent = 'Categorías';
    document.querySelectorAll('.cat-pill').forEach(pill => {
      if (pill.getAttribute('data-category') === 'Todas') {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // 5. Restablecer modo de visualización al feed principal vertical (inmersivo)
    state.feedViewMode = 'immersive';
    const feedScrollContainer = document.getElementById('feed-scroll-container');
    const feedGridContainer = document.getElementById('feed-grid-container');
    const toggleBtn = document.getElementById('btn-feed-view-toggle');
    const toggleIcon = document.getElementById('feed-toggle-icon');
    const deskPanel = document.querySelector('.desktop-details-panel');

    if (feedGridContainer) feedGridContainer.style.display = 'none';
    if (feedScrollContainer) feedScrollContainer.style.display = 'flex';
    if (deskPanel && window.innerWidth > 900) deskPanel.style.display = 'flex';

    if (toggleBtn) {
      toggleBtn.classList.remove('active-grid');
      toggleBtn.setAttribute('title', 'Ver en Cuadrícula (2 en 2)');
    }
    if (toggleIcon) toggleIcon.className = 'fa-solid fa-table-cells-large';

    // 6. Cambiar a la vista del feed principal
    showView('feed-view');

    // 7. Recargar los videos frescos completos desde el servidor (sin filtros de búsqueda)
    await loadVideos();

    // 8. Rebobinar suavemente el feed al primer spot (inicio absoluto)
    state.currentIndex = 0;
    if (feedScrollContainer) {
      feedScrollContainer.scrollTop = 0;
    }
    if (state.videos && state.videos.length > 0) {
      handleCardActive(0);
      scrollToFeedIndex(0, false);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 9. Feedback sutil para confirmación
    showToast('🏠 Inicio de la Vitrina');
  }
  window.goToHomeScreen = goToHomeScreen;

  // Alternador de vista: Vitrina 1x1 vs Cuadrícula 2x2
  document.getElementById('btn-feed-view-toggle')?.addEventListener('click', () => {
    toggleFeedViewMode();
  });

  // Selector de Ciudad
  const cityBtn = document.getElementById('btn-city-dropdown');
  const cityMenu = document.getElementById('city-dropdown-menu');
  cityBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    cityMenu.classList.toggle('show');
  });

  document.querySelectorAll('.city-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.city-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      state.currentCity = item.getAttribute('data-city');
      document.getElementById('current-city-label').textContent = state.currentCity;
      cityMenu.classList.remove('show');
      showView('feed-view');
      loadVideos();
    });
  });

  // Filtros por Categoría (Barra de Píldoras Horizontales)
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const cat = pill.getAttribute('data-category');
      selectCategory(cat);
    });
  });

  // Directorio Completo de Categorías (Modal y Cuadrícula de 31 Categorías ordenadas por mayor demanda)
  // Directorio Completo de Categorías (Modal y Cuadrícula de 31 Categorías ordenadas por mayor demanda)
  const ALL_CATEGORIES_CATALOG = [
    { name: 'Todas', emoji: '✨', sub: 'Todo el catálogo comercial en Colombia' },
    { name: 'Solo Ofertas', emoji: '🔥', sub: 'Precios de remate, promociones y liquidaciones' },
    { name: 'Calzado & Zapatos', emoji: '👟', sub: 'Tenis deportivos, zapatos casuales, botas y sandalias' },
    { name: 'Ropa de Mujer', emoji: '👗', sub: 'Vestidos, blusas, jeans, conjuntos y moda femenina' },
    { name: 'Ropa de Hombre', emoji: '👔', sub: 'Camisas, pantalones, chaquetas, trajes y moda masculina' },
    { name: 'Electrónica & Tecnología', emoji: '📱', sub: 'Celulares, computadores, tablets, consolas y audio' },
    { name: 'Vehículos & Motos', emoji: '🚗', sub: 'Carros, motocicletas, camionetas y vehículos comerciales' },
    { name: 'Comida & Domicilios', emoji: '🍔', sub: 'Restaurantes, comidas rápidas, repostería y postres' },
    { name: 'Empleo & Vacantes', emoji: '📢', sub: 'Ofertas laborales y convocatorias de contratación' },
    { name: 'Busco Empleo / Se Ofrece', emoji: '💼', sub: 'Profesionales, técnicos, operarios y ayudantes disponibles' },
    { name: 'Salud & Belleza', emoji: '💄', sub: 'Cuidado personal, maquillaje, estética y peluquería' },
    { name: 'Muebles', emoji: '🛋️', sub: 'Salas, comedores, camas, clósets y mobiliario' },
    { name: 'Electrodomésticos', emoji: '🔌', sub: 'Neveras, lavadoras, estufas, microondas y cocina' },
    { name: 'Alquileres & Arriendos', emoji: '🔑', sub: 'Apartamentos, casas, habitaciones, fincas y locales' },
    { name: 'Acarreos & Mudanzas', emoji: '🚚', sub: 'Trasteos, fletes locales y transporte de carga' },
    { name: 'Artículos Deportivos', emoji: '⚽', sub: 'Bicicletas, máquinas fitness, balones y ropa deportiva' },
    { name: 'Productos para Mascotas', emoji: '🐾', sub: 'Alimento, camas, collares, juguetes y salud animal' },
    { name: 'Autopartes & Repuestos', emoji: '⚙️', sub: 'Llantas, lujos, baterías y repuestos mecánicos' },
    { name: 'Propiedades en Venta', emoji: '🏢', sub: 'Casas, apartamentos, lotes, fincas y proyectos' },
    { name: 'Hogar & Cocina', emoji: '🍳', sub: 'Menaje, vajillas, utensilios, sábanas y decoración' },
    { name: 'Joyas, Relojes & Accesorios', emoji: '⌚', sub: 'Oro, plata, relojes originales, gafas y bisutería' },
    { name: 'Ropa para Niños & Bebés', emoji: '👶', sub: 'Moda infantil, calzado para niños y conjuntos' },
    { name: 'Bebés & Maternidad', emoji: '🍼', sub: 'Cunas, coches, corrales, pañales y cuidado infantil' },
    { name: 'Equipaje & Bolsos', emoji: '🎒', sub: 'Morrales escolares, maletas de viaje y carteras' },
    { name: 'Juguetes & Juegos', emoji: '🧸', sub: 'Juguetes didácticos, figuras de acción y videojuegos' },
    { name: 'Venta de Garaje', emoji: '🏷️', sub: 'Artículos usados en buen estado y saldos de bodega' },
    { name: 'Remodelaciones & Oficios', emoji: '🧱', sub: 'Pintores, plomeros, electricistas y albañiles' },
    { name: 'Patio & Jardín', emoji: '🌿', sub: 'Plantas ornamentales, viveros y herramientas de jardín' },
    { name: 'Instrumentos Musicales', emoji: '🎸', sub: 'Guitarras, teclados, percusión y audio profesional' },
    { name: 'Libros, Películas & Música', emoji: '📚', sub: 'Libros impresos, vinilos, discos y películas' },
    { name: 'Arte & Manualidades', emoji: '🎨', sub: 'Cuadros, esculturas, bordados y artesanías típicas' },
    { name: 'Antigüedades & Colección', emoji: '🏺', sub: 'Monedas antiguas, reliquias y objetos coleccionables' },
    { name: 'Varios', emoji: '📦', sub: 'Otros productos, servicios diversos y novedades' }
  ];

  // Diccionario Maestro de Sinónimos, Meta-Tags y Comercio Colombiano por Categoría
  const CATEGORY_KEYWORDS_MAP = {
    'Todas': 'todas todo general ver todos catalogo completo explorar productos todo colombia',
    'Solo Ofertas': 'ofertas promocion promociones descuento descuentos rebajas remate liquidacion precios bajos gangas pague 1 lleve 2 promo baraton baratillo 50% off remates saldos',
    'Calzado & Zapatos': 'calzado calzados zapatos zapateria zapaterias tenis zapatillas botas botines sandalias tacones baletas mocasines chanclas crocs calzado deportivo calzado formal cuero bucaramanga restrepo calzado infantil calzado dama calzado caballero sneakers tenis deportivos calzado bucaramanga calzado de cuero',
    'Comida & Domicilios': 'restaurante restaurantes postre postres bebida bebidas hamburguesa hamburguesas pizza pizzas comida rapida almuerzo almuerzos cena desayunos cafeteria panaderia pasteleria empanadas asados sushi cafe arepas pollo frito licores jugos tortas gastronomia heladeria delivery domicilios comidas',
    'Ropa de Mujer': 'vestido vestidos blusa blusas pantalon pantalones falda faldas jeans short shorts moda femenina dama damas calzado zapatos tenis zapatillas tacones sandalias botines botas lenceria pijamas ropa interior bikinis trajes de baño chaquetas enterizos tops crop tops buzos fajas accesorios sandalia tenis dama',
    'Ropa de Hombre': 'camisa camisas camiseta camisetas chaqueta chaquetas pantalon pantalones jeans bermudas buzo buzos moda masculina caballero caballeros calzado zapatos tenis zapatillas mocasines botas calzoncillos medias corbatas trajes sacos gorras polos busos sudaderas calzado hombre',
    'Ropa para Niños & Bebés': 'niño niños niña niñas conjunto conjuntos pijama pijamas ropa infantil vestidos bebes bodies medias zapatitos ropa de niño uniforme uniformes shorts mamelucos enterizos calzado infantil',
    'Bebés & Maternidad': 'bebe bebes coche coches cuna cunas corral corrales tetero teteros pañales pañalera lactancia extractor biberon andador juguetes bebe maternidad fajas embarazo chupos cambiador portabebe bebes',
    'Electrónica & Tecnología': 'celular celulares telefono telefonos smartphone pc computadores computador portatil portatiles laptop laptops tablet tablets ipad audifonos diademas parlante parlantes bluetooth cargador cargadores cables pantallas televisores smart tv camaras smartwatch relojes inteligentes iphone samsung xiaomi memorias usb gamer pc gamer tecnologia impresoras teclados mouse accesorios celular',
    'Electrodomésticos': 'nevera neveras lavadora lavadoras microondas estufa estufas licuadora licuadoras airfryer freidora de aire horno hornos cafetera sandwichera batidora plancha ventilador aire acondicionado aspiradora dispensador electrodomestico waflera campana',
    'Muebles': 'sala salas sofa sofas mueble muebles cama camas colchon colchones closet closets armario armarios comedor comedores mesas sillas escritorio escritorios repisas comodas nocheros cabeceros sofacama estantes organizadores decoracion',
    'Hogar & Cocina': 'cocina menaje ollas sartenes vajilla cubiertos decoracion cortinas sabanas almohadas toallas lamparas cuadros espejos organizadores tapetes cojines reloj de pared refractarias termos vasos cubrecamas edredones manteles',
    'Patio & Jardín': 'jardin plantas materas vivero flores exteriores cesped pasto mangueras herramientas podadoras asadores bbq muebles de jardin sombrillas abonos tierra semillas macetas fumigadoras',
    'Salud & Belleza': 'belleza maquillaje cosmeticos labial base pestañina sombras cuidado facial skincare crema cremas protectores solares perfume perfumes lociones fragancias peluqueria barberia planchas de cabello secador tintes uñas manicure esmaltes vitaminas colageno suplementos spa pestañas cejas exfoliante bloqueador tintes cabello',
    'Joyas, Relojes & Accesorios': 'joya joyas oro plata acero bisuteria anillo anillos aretes cadenas collares pulseras reloj relojes manillas dijes gafas gafas de sol cinturones correas billeteras pashminas diamantes perlas tobilleras',
    'Equipaje & Bolsos': 'morral morrales bolso bolsos maleta maletas cartera carteras mochilas canguros cosmetiqueros billeteras equipaje de mano valijas tulas viaje cartucheras riñoneras neceseres portafolios',
    'Vehículos & Motos': 'carro carros automovil automoviles moto motos camioneta camionetas scooter bws pulsar akt yamaha suzuki honda chevrolet mazda renault toyota furgon cuatrimotos compraventa vehiculos usados nuevos camperos vans ciclomotores automotores',
    'Autopartes & Repuestos': 'repuesto repuestos llantas baterias lujos accesorios auto luces led amortiguadores frenos pastillas aceite lubricantes cascos moto chalecos alarmas mecanica talleres rines bujias filtros parabrisas plumillas autopartes',
    'Artículos Deportivos': 'deporte deportes bicicleta bicicletas cicla ciclas fitness gimnasio pesas mancuernas bandas caminadora balones futbol baloncesto tenis ropa deportiva licras termos suplementos proteinas creatina patines camping carpas boxeo guantes natacion raquetas',
    'Productos para Mascotas': 'mascota mascotas perro perros gato gatos cachorros concentrado comida para perros comida para gatos arena para gatos camas correas collares juguetes rascadores veterinaria snacks pecheras transportadoras bozales acuarios',
    'Juguetes & Juegos': 'juguete juguetes didacticos muñecas carritos lego figuras de accion juegos de mesa playstation ps4 ps5 xbox nintendo switch videojuegos controles juegos infantiles peluches rompecabezas pistas transformers barbies',
    'Alquileres & Arriendos': 'arriendo arriendos alquiler alquileres apartamento apartamentos apartaestudios casa casas habitacion habitaciones locales locales comerciales oficinas bodegas amoblados finca fincas hospedaje vacacional inmobiliaria renta',
    'Propiedades en Venta': 'venta propiedades casas apartamentos lotes terrenos fincas bodegas locales consultorios proyectos sobre planos bienes raices inmobiliaria parcelaciones condominios',
    'Remodelaciones & Oficios': 'oficios plomero plomeria electricista electricidad pintor pintura drywall construccion albañil carpinteria cerrajero cerrajeria herreria impermeabilizacion aluminio vidrio enchapador pisos tecnicos arreglos reparaciones instalacion gas soldadura mantenimiento',
    'Acarreos & Mudanzas': 'acarreo acarreos mudanza mudanzas trasteo trasteos flete fletes transporte de carga camion camioneta viajes envio de encomiendas trasteos locales nacionales logistica camiones furgon estacas',
    'Empleo & Vacantes': 'empleo empleos vacante vacantes trabajo trabajos contratacion bolsa de empleo ofertas laborales hojas de vida personal auxilar mesero conductor vendedor cajero asesora modista operario recepcionista practicante vacante',
    'Instrumentos Musicales': 'musica instrumento instrumentos guitarra guitarras teclado teclados piano ukelele bateria tambores bajo microfono microfonos sonido parlantes bafles consolas cables de audio guitarras acusticas electricas amplificadores violin acordeon trompeta',
    'Arte & Manualidades': 'arte manualidades pintura pinturas lienzos oleo acuarelas pinceles esculturas tejidos lanas crochet ceramica resina porcelanicron papel artesanias costura cuadros cuadros decorativos dibujo moldes barro',
    'Antigüedades & Colección': 'antiguedades coleccion reliquias monedas billetes antiguos vinilos tocadiscos camaras antiguas autos a escala figuras retro vintage recuerdos arte antiguo antigüedades numismatica coleccionables cartas antiguedad',
    'Libros, Películas & Música': 'libro libros novelas textos escolares universitarios literatura comics mangas cds discos vinilo peliculas enciclopedias cuadernos papeleria lectura bibles revistas cuentos diccionarios',
    'Venta de Garaje': 'venta de garaje segunda mano usado usados gangazo remate liquidacion rebajas baratillo articulos usados segundazo ferias pulguero saldos pulgueros remates baratillos baratones',
    'Varios': 'varios otros miscelanea servicios generales multiservicios varios articulos novedades regalos detalles anchetas sorpresas piñateria papeleria miscelanea productos variados bazar cacharreria'
  };

  const normCatStr = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  function matchCategoryTokens(cat, query) {
    if (!query) return true;
    const qNorm = normCatStr(query);
    const tokens = qNorm.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return true;

    const extraKeywords = CATEGORY_KEYWORDS_MAP[cat.name] || '';
    const haystack = normCatStr(`${cat.name} ${cat.sub} ${extraKeywords}`);

    return tokens.every(tok => haystack.includes(tok));
  }

  function highlightCategoryText(text, query) {
    const raw = (text || '').toString();
    if (!query) return escapeHtml(raw);
    const qNorm = normCatStr(query);
    const tokens = qNorm.split(/\s+/).filter(t => t.length >= 2);
    if (tokens.length === 0) return escapeHtml(raw);

    const safeTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${safeTokens.join('|')})`, 'gi');
    return escapeHtml(raw).replace(pattern, '<mark class="cat-highlight">$1</mark>');
  }

  function renderAllCategoriesDirectory(query = '') {
    const grid = document.getElementById('all-categories-grid');
    const badgeEl = document.getElementById('cat-dir-counter-badge');
    if (!grid) return;

    const filtered = ALL_CATEGORIES_CATALOG.filter(c => matchCategoryTokens(c, query));

    if (badgeEl) {
      badgeEl.textContent = (!query.trim() ? ALL_CATEGORIES_CATALOG.length : `${filtered.length} de ${ALL_CATEGORIES_CATALOG.length}`);
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="cat-picker-empty" style="grid-column: 1 / -1; padding: 36px 18px; text-align: center;">
          <i class="fa-regular fa-face-frown" style="font-size: 2.2rem; color: var(--spot-gold); margin-bottom: 10px; display: block;"></i>
          <p style="color: var(--text-muted); margin: 0 0 14px; font-size: 0.9rem;">No encontramos ninguna categoría con "<strong>${escapeHtml(query)}</strong>".</p>
          <button type="button" class="btn btn-ghost" id="btn-reset-cat-dir" style="margin: 0 auto;">Ver todas las 31 categorías</button>
        </div>
      `;
      document.getElementById('btn-reset-cat-dir')?.addEventListener('click', () => {
        const inp = document.getElementById('filter-categories-input');
        if (inp) inp.value = '';
        const clr = document.getElementById('btn-clear-cat-dir-search');
        if (clr) clr.style.display = 'none';
        updateDirChipsActive('');
        renderAllCategoriesDirectory('');
      });
      return;
    }

    grid.innerHTML = filtered.map(c => {
      const isActive = state.currentCategory === c.name;
      return `
        <div class="category-directory-card ${isActive ? 'active' : ''}" data-category="${escapeHtml(c.name)}">
          <div class="category-directory-emoji-bubble">${c.emoji}</div>
          <div class="category-directory-info">
            <span class="category-directory-name">${highlightCategoryText(c.name, query)}</span>
            <span class="category-directory-sub">${highlightCategoryText(c.sub, query)}</span>
          </div>
          <i class="fa-solid fa-chevron-right category-directory-arrow"></i>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.category-directory-card').forEach(card => {
      card.addEventListener('click', () => {
        const selectedCat = card.getAttribute('data-category');
        selectCategory(selectedCat);
        const catModalEl = document.getElementById('modal-all-categories');
        if (catModalEl) catModalEl.style.display = 'none';
      });
    });
  }

  function selectCategory(catName) {
    state.currentCategory = catName;
    const catLabel = document.getElementById('current-category-label');
    if (catLabel) {
      catLabel.textContent = (catName === 'Todas') ? 'Categorías' : catName;
      catLabel.title = `Categoría: ${catName}`;
    }
    document.querySelectorAll('.cat-pill').forEach(p => {
      if (p.getAttribute('data-category') === catName) {
        p.classList.add('active');
        p.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        p.classList.remove('active');
      }
    });
    showView('feed-view');
    loadVideos();
    showToast(`📂 Categoría: ${catName}`);
  }
  window.selectCategory = selectCategory;

  function updateDirChipsActive(chipVal) {
    document.querySelectorAll('#cat-dir-quick-chips .cat-chip-btn').forEach(btn => {
      if ((btn.getAttribute('data-chip') || '') === chipVal) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  const btnOpenCatModal = document.getElementById('btn-open-categories-modal');
  const btnNavCategoryPicker = document.getElementById('btn-nav-category-picker');
  const catModal = document.getElementById('modal-all-categories');
  const filterCatInput = document.getElementById('filter-categories-input');
  const clearCatDirBtn = document.getElementById('btn-clear-cat-dir-search');

  const openCategoriesModal = (e) => {
    if (e) e.stopPropagation();
    if (!catModal) return;
    if (filterCatInput) {
      filterCatInput.value = '';
      filterCatInput.blur(); // Prevenir apertura automática del teclado en móviles
    }
    if (clearCatDirBtn) clearCatDirBtn.style.display = 'none';
    updateDirChipsActive('');
    renderAllCategoriesDirectory('');
    catModal.style.display = 'flex';
  };

  btnOpenCatModal?.addEventListener('click', openCategoriesModal);
  btnNavCategoryPicker?.addEventListener('click', openCategoriesModal);

  document.getElementById('btn-close-all-categories')?.addEventListener('click', () => {
    if (catModal) catModal.style.display = 'none';
    filterCatInput?.blur();
  });

  catModal?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-all-categories') {
      catModal.style.display = 'none';
      filterCatInput?.blur();
    }
  });

  const btnHideKeyboardDir = document.getElementById('btn-hide-keyboard-dir');

  // Control inteligente del teclado virtual
  filterCatInput?.addEventListener('focus', () => {
    catModal?.classList.add('keyboard-active');
    if (btnHideKeyboardDir) btnHideKeyboardDir.style.display = 'inline-flex';
  });

  filterCatInput?.addEventListener('blur', () => {
    catModal?.classList.remove('keyboard-active');
    if (btnHideKeyboardDir) btnHideKeyboardDir.style.display = 'none';
  });

  btnHideKeyboardDir?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    filterCatInput?.blur();
  });

  // Ocultar teclado automáticamente cuando el usuario desliza o toca la lista de categorías
  const catModalBody = catModal?.querySelector('.modal-body');
  catModalBody?.addEventListener('scroll', () => {
    if (document.activeElement === filterCatInput) {
      filterCatInput.blur();
    }
  }, { passive: true });

  const catGridEl = document.getElementById('all-categories-grid');
  catGridEl?.addEventListener('touchstart', () => {
    if (document.activeElement === filterCatInput) {
      filterCatInput.blur();
    }
  }, { passive: true });

  filterCatInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (clearCatDirBtn) clearCatDirBtn.style.display = val ? 'block' : 'none';
    updateDirChipsActive(val.trim().toLowerCase());
    renderAllCategoriesDirectory(val);
  });

  clearCatDirBtn?.addEventListener('click', () => {
    if (filterCatInput) filterCatInput.value = '';
    if (clearCatDirBtn) clearCatDirBtn.style.display = 'none';
    updateDirChipsActive('');
    renderAllCategoriesDirectory('');
    filterCatInput?.focus();
  });

  filterCatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      filterCatInput.blur();
      const allCards = document.querySelectorAll('#all-categories-grid .category-directory-card');
      if (allCards.length === 1) {
        allCards[0].click();
      }
    }
  });

  // Setup chips for Directorio
  document.querySelectorAll('#cat-dir-quick-chips .cat-chip-btn').forEach(chipBtn => {
    chipBtn.addEventListener('click', () => {
      const chipVal = chipBtn.getAttribute('data-chip') || '';
      updateDirChipsActive(chipVal);
      if (filterCatInput) {
        filterCatInput.value = chipVal;
        if (clearCatDirBtn) clearCatDirBtn.style.display = chipVal ? 'block' : 'none';
        renderAllCategoriesDirectory(chipVal);
        filterCatInput.blur(); // Cierra el teclado en móviles para ver la lista inmediatamente
      }
    });
  });

  // ==========================================
  // SELECTOR VISUAL DE CATEGORÍAS (CREAR SPOT)
  // ==========================================
  const UPLOAD_CATEGORIES_LIST = [
    { name: "Comida & Domicilios", emoji: "🍔", sub: "Restaurantes, Postres, Bebidas" },
    { name: "Calzado & Zapatos", emoji: "👟", sub: "Tenis, Zapatos, Botas, Sandalias" },
    { name: "Ropa de Mujer", emoji: "👗", sub: "Vestidos, Blusas, Pantalones" },
    { name: "Ropa de Hombre", emoji: "👔", sub: "Camisas, Chaquetas, Jeans" },
    { name: "Ropa para Niños & Bebés", emoji: "👶", sub: "Conjuntos, Pijamas, Niños" },
    { name: "Bebés & Maternidad", emoji: "🍼", sub: "Coches, Cunas, Accesorios" },
    { name: "Electrónica & Tecnología", emoji: "📱", sub: "Celulares, PCs, Audio" },
    { name: "Electrodomésticos", emoji: "🔌", sub: "Neveras, Lavadoras, Cocina" },
    { name: "Muebles", emoji: "🛋️", sub: "Salas, Camas, Clósets" },
    { name: "Hogar & Cocina", emoji: "🍳", sub: "Menaje, Decoración, Utensilios" },
    { name: "Patio & Jardín", emoji: "🌿", sub: "Plantas, Viveros, Exteriores" },
    { name: "Salud & Belleza", emoji: "💄", sub: "Cuidado Facial, Peluquería" },
    { name: "Joyas, Relojes & Accesorios", emoji: "⌚", sub: "Oro, Relojes, Bisutería" },
    { name: "Equipaje & Bolsos", emoji: "🎒", sub: "Morrales, Maletas, Carteras" },
    { name: "Vehículos & Motos", emoji: "🚗", sub: "Carros, Motos, Camionetas" },
    { name: "Autopartes & Repuestos", emoji: "⚙️", sub: "Llantas, Lujos, Mecánica" },
    { name: "Artículos Deportivos", emoji: "⚽", sub: "Bicicletas, Fitness, Gimnasio" },
    { name: "Productos para Mascotas", emoji: "🐾", sub: "Alimento, Camas, Accesorios" },
    { name: "Juguetes & Juegos", emoji: "🧸", sub: "Videojuegos, Didácticos" },
    { name: "Alquileres & Arriendos", emoji: "🔑", sub: "Apartamentos, Locales" },
    { name: "Propiedades en Venta", emoji: "🏢", sub: "Casas, Lotes, Fincas" },
    { name: "Remodelaciones & Oficios", emoji: "🧱", sub: "Pintura, Drywall, Plomería" },
    { name: "Acarreos & Mudanzas", emoji: "🚚", sub: "Fletes, Trasteos, Carga" },
    { name: "Empleo & Vacantes", emoji: "📢", sub: "Ofertas Laborales" },
    { name: "Busco Empleo / Se Ofrece", emoji: "💼", sub: "Profesiones, Técnicos, Ayudantes" },
    { name: "Instrumentos Musicales", emoji: "🎸", sub: "Guitarras, Teclados, Sonido" },
    { name: "Arte & Manualidades", emoji: "🎨", sub: "Pinturas, Esculturas, Tejidos" },
    { name: "Antigüedades & Colección", emoji: "🏺", sub: "Monedas, Vinilos, Reliquias" },
    { name: "Libros, Películas & Música", emoji: "📚", sub: "Libros, Discos, Cómics" },
    { name: "Venta de Garaje", emoji: "🏷️", sub: "Segunda mano, Liquidación" },
    { name: "Varios", emoji: "📦", sub: "Otros productos y servicios" }
  ];

  function updatePickerChipsActive(chipVal) {
    document.querySelectorAll('#cat-picker-quick-chips .cat-chip-btn').forEach(btn => {
      if ((btn.getAttribute('data-chip') || '') === chipVal) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function renderCategoryPickerButtons(query = '') {
    const grid = document.getElementById('cat-picker-buttons-grid');
    const emptyEl = document.getElementById('cat-picker-no-results');
    if (!grid) return;

    const currentSelected = document.getElementById('upload-cat')?.value || 'Comida & Domicilios';

    const filtered = UPLOAD_CATEGORIES_LIST.filter(c => matchCategoryTokens(c, query));

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyEl) {
        emptyEl.style.display = 'block';
        const p = emptyEl.querySelector('p');
        if (p) p.innerHTML = `No encontramos ninguna categoría con "<strong>${escapeHtml(query)}</strong>".`;
      }
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    grid.innerHTML = filtered.map(c => {
      const isActive = currentSelected === c.name;
      return `
        <button type="button" class="cat-picker-card ${isActive ? 'active' : ''}" data-cat-name="${escapeHtml(c.name)}" data-cat-emoji="${c.emoji}">
          <span class="cat-picker-card-emoji">${c.emoji}</span>
          <div class="cat-picker-card-content">
            <span class="cat-picker-card-name">${highlightCategoryText(c.name, query)}</span>
            <span class="cat-picker-card-sub">${highlightCategoryText(c.sub, query)}</span>
          </div>
          <i class="fa-solid fa-circle-check cat-picker-card-check"></i>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.cat-picker-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const catName = btn.getAttribute('data-cat-name');
        const catEmoji = btn.getAttribute('data-cat-emoji');
        selectUploadCategory(catName, catEmoji);
      });
    });
  }

  function selectUploadCategory(catName, catEmoji) {
    const hiddenInput = document.getElementById('upload-cat');
    const iconEl = document.getElementById('cat-picker-preview-icon');
    const textEl = document.getElementById('cat-picker-preview-text');
    const modalEl = document.getElementById('modal-category-picker');

    if (!catEmoji) {
      const match = UPLOAD_CATEGORIES_LIST.find(c => c.name === catName);
      catEmoji = match ? match.emoji : '📦';
    }

    if (hiddenInput) hiddenInput.value = catName;
    if (iconEl) iconEl.textContent = catEmoji;
    if (textEl) textEl.textContent = catName;

    // Actualizar clase activa en los botones visuales
    const grid = document.getElementById('cat-picker-buttons-grid');
    if (grid) {
      grid.querySelectorAll('.cat-picker-card').forEach(b => {
        if (b.getAttribute('data-cat-name') === catName) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }

    // Micro-vibración táctil en dispositivos móviles
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(25); } catch (_) {}
    }

    // Cierre suave de la hoja
    setTimeout(() => {
      if (modalEl) modalEl.style.display = 'none';
    }, 180);
  }
  window.selectUploadCategory = selectUploadCategory;

  // Listeners del selector visual de categorías
  const btnOpenCatPicker = document.getElementById('btn-open-category-picker');
  const catPickerModal = document.getElementById('modal-category-picker');
  const catPickerSearchInput = document.getElementById('cat-picker-search-input');
  const btnClearCatSearch = document.getElementById('btn-clear-cat-search');
  const btnCloseCatPicker = document.getElementById('btn-close-category-picker');
  const btnResetCatSearch = document.getElementById('btn-reset-cat-search');
  const btnHideKeyboardPicker = document.getElementById('btn-hide-keyboard-picker');

  btnOpenCatPicker?.addEventListener('click', () => {
    if (!catPickerModal) return;
    if (catPickerSearchInput) {
      catPickerSearchInput.value = '';
      catPickerSearchInput.blur(); // Nunca forzar teclado automático en móviles al abrir
    }
    if (btnClearCatSearch) btnClearCatSearch.style.display = 'none';
    updatePickerChipsActive('');
    renderCategoryPickerButtons();
    catPickerModal.style.display = 'flex';
  });

  btnCloseCatPicker?.addEventListener('click', () => {
    if (catPickerModal) catPickerModal.style.display = 'none';
    catPickerSearchInput?.blur();
  });

  catPickerModal?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-category-picker') {
      catPickerModal.style.display = 'none';
      catPickerSearchInput?.blur();
    }
  });

  // Control inteligente del teclado virtual en el selector de categoría
  catPickerSearchInput?.addEventListener('focus', () => {
    catPickerModal?.classList.add('keyboard-active');
    if (btnHideKeyboardPicker) btnHideKeyboardPicker.style.display = 'inline-flex';
  });

  catPickerSearchInput?.addEventListener('blur', () => {
    catPickerModal?.classList.remove('keyboard-active');
    if (btnHideKeyboardPicker) btnHideKeyboardPicker.style.display = 'none';
  });

  btnHideKeyboardPicker?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    catPickerSearchInput?.blur();
  });

  // Ocultar teclado automáticamente cuando el usuario desliza o toca la lista de categorías
  const pickerGridEl = document.getElementById('cat-picker-buttons-grid');
  pickerGridEl?.addEventListener('touchstart', () => {
    if (document.activeElement === catPickerSearchInput) {
      catPickerSearchInput.blur();
    }
  }, { passive: true });

  const pickerScrollBody = catPickerModal?.querySelector('.cat-picker-scrollable-body');
  pickerScrollBody?.addEventListener('scroll', () => {
    if (document.activeElement === catPickerSearchInput) {
      catPickerSearchInput.blur();
    }
  }, { passive: true });

  catPickerSearchInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (btnClearCatSearch) btnClearCatSearch.style.display = val ? 'block' : 'none';
    updatePickerChipsActive(val.trim().toLowerCase());
    renderCategoryPickerButtons(val);
  });

  btnClearCatSearch?.addEventListener('click', () => {
    if (catPickerSearchInput) catPickerSearchInput.value = '';
    if (btnClearCatSearch) btnClearCatSearch.style.display = 'none';
    updatePickerChipsActive('');
    renderCategoryPickerButtons();
    catPickerSearchInput?.focus();
  });

  btnResetCatSearch?.addEventListener('click', () => {
    if (catPickerSearchInput) catPickerSearchInput.value = '';
    if (btnClearCatSearch) btnClearCatSearch.style.display = 'none';
    updatePickerChipsActive('');
    renderCategoryPickerButtons();
    catPickerSearchInput?.focus();
  });

  catPickerSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      catPickerSearchInput.blur(); // Ocultar teclado inmediatamente en móviles
      const allCards = document.querySelectorAll('#cat-picker-buttons-grid .cat-picker-card');
      if (allCards.length === 1) {
        allCards[0].click();
      }
    }
  });

  // Setup chips for Crear SPOT
  document.querySelectorAll('#cat-picker-quick-chips .cat-chip-btn').forEach(chipBtn => {
    chipBtn.addEventListener('click', () => {
      const chipVal = chipBtn.getAttribute('data-chip') || '';
      updatePickerChipsActive(chipVal);
      if (catPickerSearchInput) {
        catPickerSearchInput.value = chipVal;
        if (btnClearCatSearch) btnClearCatSearch.style.display = chipVal ? 'block' : 'none';
        renderCategoryPickerButtons(chipVal);
      }
    });
  });

  // Buscador
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('btn-clear-search');
  const searchSubmitBtn = document.getElementById('btn-submit-search');
  const searchBox = document.querySelector('.search-box');
  let searchDebounceTimer = null;

  // Al hacer clic en cualquier parte de la barra o en la lupa, enfocar inmediatamente el campo de escritura
  searchBox?.addEventListener('click', (e) => {
    if (e.target !== clearBtn && !e.target.closest('#btn-clear-search')) {
      searchInput?.focus();
    }
  });

  searchInput?.addEventListener('input', () => {
    const val = searchInput.value.trim();
    clearBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';

    // Resetear visualmente las píldoras de categoría al escribir en el buscador
    if (val.length > 0 && state.currentCategory !== 'Todas') {
      state.currentCategory = 'Todas';
      document.querySelectorAll('.cat-pill').forEach(p => {
        if (p.getAttribute('data-category') === 'Todas') p.classList.add('active');
        else p.classList.remove('active');
      });
    }

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.searchQuery = val;
      showView('feed-view');
      loadVideos();
    }, 280);
  });

  clearBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    searchInput.value = '';
    clearBtn.style.display = 'none';
    state.searchQuery = '';
    showView('feed-view');
    loadVideos();
    searchInput.focus();
  });

  const floatingSearchBar = document.getElementById('floating-search-bar');
  const btnSearchToggle = document.getElementById('btn-nav-search-toggle');
  const btnCloseSearch = document.getElementById('btn-close-floating-search');

  // Evitar que clics dentro del buscador lo cierren accidentalmente
  floatingSearchBar?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  btnSearchToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!floatingSearchBar) return;
    const isClosed = (floatingSearchBar.style.display === 'none' || !floatingSearchBar.style.display);
    if (isClosed) {
      floatingSearchBar.style.display = 'block';
      setTimeout(() => { searchInput?.focus(); }, 60);
    } else {
      floatingSearchBar.style.display = 'none';
      searchInput?.blur();
    }
  });

  btnCloseSearch?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (floatingSearchBar) {
      floatingSearchBar.style.display = 'none';
      searchInput?.blur();
    }
  });

  const performSearch = (e) => {
    if (e) e.preventDefault();
    clearTimeout(searchDebounceTimer);
    const val = searchInput ? searchInput.value.trim() : '';
    if (!val) {
      searchInput?.focus();
      return;
    }
    state.searchQuery = val;
    if (searchInput) searchInput.blur();
    if (floatingSearchBar) floatingSearchBar.style.display = 'none';
    showView('feed-view');
    loadVideos();
  };

  searchForm?.addEventListener('submit', performSearch);
  searchSubmitBtn?.addEventListener('click', performSearch);

  // Menú de usuario / Tienda
  const storeMenuBtn = document.getElementById('btn-nav-store-menu');
  const userDropdown = document.getElementById('user-dropdown-menu');
  storeMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });

  // Botón flotante Mi Tienda en móvil (debajo del botón +)
  const floatingMyStoreBtn = document.getElementById('btn-floating-my-store');
  floatingMyStoreBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown?.classList.toggle('show');
  });

  // Cierre limpio al hacer clic o tocar FUERA del menú
  document.addEventListener('click', (e) => {
    cityMenu?.classList.remove('show');
    if (!e.target.closest('#user-dropdown-menu') && !e.target.closest('#story-my-business-btn') && !e.target.closest('#btn-nav-store-menu') && !e.target.closest('#btn-floating-my-store')) {
      userDropdown?.classList.remove('show');
    }
    if (floatingSearchBar && floatingSearchBar.style.display === 'block') {
      floatingSearchBar.style.display = 'none';
      searchInput?.blur();
    }
  });

  document.addEventListener('touchend', (e) => {
    if (userDropdown && userDropdown.classList.contains('show')) {
      if (!e.target.closest('#user-dropdown-menu') && !e.target.closest('#story-my-business-btn') && !e.target.closest('#btn-nav-store-menu') && !e.target.closest('#btn-floating-my-store')) {
        userDropdown.classList.remove('show');
      }
    }
  }, { passive: true });

  // Helper de enlace universal (Táctil Móvil + Clic de Escritorio con Cierre Automático)
  function bindMenuAction(buttonId, actionFn) {
    const el = document.getElementById(buttonId);
    if (!el) return;
    let touchMoved = false;
    let lastTriggerTime = 0;
    const run = () => {
      const now = Date.now();
      if (now - lastTriggerTime < 350) return;
      lastTriggerTime = now;
      document.getElementById('user-dropdown-menu')?.classList.remove('show');
      actionFn();
    };
    el.addEventListener('touchstart', () => { touchMoved = false; }, { passive: true });
    el.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (!touchMoved) {
        e.preventDefault();
        e.stopPropagation();
        run();
      }
    });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      run();
    });
  }

  // 1. Publicar Nuevo SPOT
  bindMenuAction('btn-dropdown-upload-spot', () => {
    triggerOpenUploadModal();
  });

  // 2. Panel de Mi Negocio
  bindMenuAction('btn-open-seller-panel', () => {
    openSellerPanel();
  });

  // 3. Mi Catálogo Público
  bindMenuAction('btn-open-my-catalog', () => {
    if (state.currentStore) openStoreCatalog(state.currentStore.id);
  });

  // 4. Mis SPOTS Guardados (Comerciante y Visitante)
  bindMenuAction('btn-open-saved-spots', () => { openSavedView(); });
  bindMenuAction('btn-guest-saved-spots', () => { openSavedView(); });
  document.getElementById('btn-nav-saved')?.addEventListener('click', openSavedView);

  // 6. Políticas y Reglas de Oro
  bindMenuAction('btn-open-legal-terms-logged', () => { openLegalTermsModal(); });
  bindMenuAction('btn-guest-legal-terms', () => { openLegalTermsModal(); });

  // 7. Recomendar VitrinaSpot
  bindMenuAction('btn-store-share-app', () => { openShareAppModal(); });
  bindMenuAction('btn-guest-share-app', () => { openShareAppModal(); });

  // 8. Cerrar Sesión / Salir
  bindMenuAction('btn-store-logout', () => {
    state.currentStore = null;
    localStorage.removeItem('vitrina_current_store_id');
    updateNavStoreUI();
    showToast('👋 Has cerrado sesión');
    showView('feed-view');
  });

  // 9. Opciones de Invitado: Crear Tienda e Ingresar
  bindMenuAction('btn-guest-register-trigger', () => {
    const authModal = document.getElementById('modal-store-auth');
    if (authModal) authModal.style.display = 'flex';
    document.getElementById('auth-tab-register')?.click();
  });
  bindMenuAction('btn-guest-login-trigger', () => {
    const authModal = document.getElementById('modal-store-auth');
    if (authModal) authModal.style.display = 'flex';
    document.getElementById('auth-tab-login')?.click();
  });

  // 10. Acceso al Panel Maestro Admin desde el menú
  document.querySelectorAll('.btn-shortcut-admin-panel').forEach(btn => {
    let touchMoved = false;
    let lastTime = 0;
    const runAdmin = () => {
      const now = Date.now();
      if (now - lastTime < 350) return;
      lastTime = now;
      document.getElementById('user-dropdown-menu')?.classList.remove('show');
      openAdminPortal();
    };
    btn.addEventListener('touchstart', () => { touchMoved = false; }, { passive: true });
    btn.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });
    btn.addEventListener('touchend', (e) => {
      if (!touchMoved) {
        e.preventDefault();
        e.stopPropagation();
        runAdmin();
      }
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      runAdmin();
    });
  });

  // Modal de Recomendar VitrinaSpot - Cierre
  document.getElementById('btn-close-share-app')?.addEventListener('click', () => {
    document.getElementById('modal-share-app').style.display = 'none';
  });
  document.getElementById('modal-share-app')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-share-app') {
      document.getElementById('modal-share-app').style.display = 'none';
    }
  });

  // Botones de vuelta
  document.getElementById('btn-back-from-catalog')?.addEventListener('click', () => showView('feed-view'));
  document.getElementById('btn-back-from-saved')?.addEventListener('click', () => showView('feed-view'));
  document.getElementById('btn-back-from-seller')?.addEventListener('click', () => showView('feed-view'));

  // Apertura de Panel de Vendedor
  document.getElementById('btn-open-seller-panel')?.addEventListener('click', openSellerPanel);
  document.getElementById('btn-open-my-catalog')?.addEventListener('click', () => {
    if (state.currentStore) openStoreCatalog(state.currentStore.id);
  });

  // Campana de Notificaciones de Clientes (Dropdown Flotante)
  const btnSellerBell = document.getElementById('btn-seller-notif-bell');
  const sellerNotifDropdown = document.getElementById('seller-notif-dropdown');
  btnSellerBell?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!sellerNotifDropdown) return;
    const isVisible = sellerNotifDropdown.style.display !== 'none';
    sellerNotifDropdown.style.display = isVisible ? 'none' : 'block';
  });

  document.getElementById('btn-clear-all-notifs')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('¿Deseas vaciar y limpiar todas las notificaciones de tu negocio?')) {
      clearAllNotifications();
    }
  });

  // Cerrar menú de notificaciones al hacer clic fuera o presionar Escape
  const closeNotifOnOutsideClick = (e) => {
    if (sellerNotifDropdown && sellerNotifDropdown.style.display !== 'none') {
      if (!e.target.closest('.seller-notif-bell-wrapper') && !e.target.closest('#seller-notif-dropdown')) {
        sellerNotifDropdown.style.display = 'none';
      }
    }
  };
  window.addEventListener('click', closeNotifOnOutsideClick);
  window.addEventListener('touchend', closeNotifOnOutsideClick);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (sellerNotifDropdown) sellerNotifDropdown.style.display = 'none';
    }
  });

  // Modal de Subida de Anuncios
  const uploadModal = document.getElementById('modal-upload');
  const openUploadBtns = [
    document.getElementById('btn-nav-upload'), 
    document.getElementById('btn-seller-new-video'), 
    document.getElementById('btn-empty-register'),
    document.getElementById('btn-floating-fab-upload'),
    document.getElementById('btn-dropdown-upload-spot')
  ];
  openUploadBtns.forEach(b => {
    b?.addEventListener('click', () => {
      // Pre-llenar datos de tienda si existen, o dejar limpios para nuevo comercio
      const nameInput = document.getElementById('upload-store-name');
      const waInput = document.getElementById('upload-whatsapp');
      if (state.currentStore) {
        if (nameInput) nameInput.value = state.currentStore.name;
        if (waInput) waInput.value = (state.currentStore.whatsapp || '').replace('+57', '').replace(/[^0-9]/g, '');
      } else {
        if (nameInput) nameInput.value = '';
        if (waInput) waInput.value = '';
      }
      refreshUploadMembershipUI();
      renderDynamicPlansUI();
      const freeQuota = Number(state.pricing?.free_spots_quota) || 5;
      const storeCount = state.currentStore && state.videos 
        ? state.videos.filter(v => v.storeId === state.currentStore.id).length 
        : 0;
      const isMemActive = Boolean(
        state.currentStore &&
        state.currentStore.hasMembership &&
        (!state.currentStore.membershipExpiresAt || new Date(state.currentStore.membershipExpiresAt) > new Date())
      );
      updatePlanSelection('photos_5');
      uploadModal.style.display = 'flex';
    });
  });

  document.getElementById('btn-close-upload')?.addEventListener('click', () => { uploadModal.style.display = 'none'; });
  document.getElementById('btn-cancel-upload')?.addEventListener('click', () => { uploadModal.style.display = 'none'; });

  // Manejo de los Planes Publicitarios de VitrinaSpot
  const planCards = document.querySelectorAll('.video-plan-card');
  const planHiddenInput = document.getElementById('upload-selected-plan');
  const submitUploadBtn = document.getElementById('btn-submit-upload');

  function updatePlanSelection(planType) {
    const prc = state.pricing || {
      photos_5_price: 0,
      boost_standard_price: 5000,
      boost_standard_days: 2,
      boost_platino_price: 10000,
      boost_platino_days: 5,
      boost_diamante_price: 15000,
      boost_diamante_days: 8,
      boost_extreme_price: 15000,
      boost_extreme_days: 8,
      membership_pro_price: 29000,
      membership_pro_days: 30,
      membership_product_limit: 100
    };

    planCards.forEach(c => {
      if (c.getAttribute('data-plan') === planType) c.classList.add('active');
      else c.classList.remove('active');
    });

    if (planHiddenInput) planHiddenInput.value = planType;

    if (planType === 'photos_5') {
      const freeQuota = Number(prc.free_spots_quota) || 5;
      const storeCount = state.currentStore && state.videos 
        ? state.videos.filter(v => v.storeId === state.currentStore.id).length 
        : 0;
      const isMemActive = Boolean(
        state.currentStore &&
        state.currentStore.hasMembership &&
        (!state.currentStore.membershipExpiresAt || new Date(state.currentStore.membershipExpiresAt) > new Date())
      );
      if (!isMemActive && storeCount >= freeQuota) {
        showToast(`🔒 Plan Gratuito Bloqueado: Has alcanzado el límite de ${freeQuota} spots gratis. Has completado tu cupo de publicaciones para este comercio.`, 'error');
        updatePlanSelection('spot_permanent');
        const permCard = document.querySelector('.video-plan-card[data-plan="spot_permanent"]');
        if (permCard) {
          permCard.classList.add('plan-highlight-pulse');
          setTimeout(() => permCard.classList.remove('plan-highlight-pulse'), 1600);
        }
        return;
      }
      if (submitUploadBtn) submitUploadBtn.innerHTML = `<i class="fa-solid fa-check"></i> Publicar Spot Gratuito ($0 COP)`;
    } else if (planType === 'spot_permanent') {
      if (submitUploadBtn) submitUploadBtn.innerHTML = '<i class="fa-solid fa-check"></i> Publicar Spot Gratuito ($0 COP)';
    } else if (planType === 'boost_standard') {
      if (submitUploadBtn) submitUploadBtn.innerHTML = '<i class="fa-solid fa-check"></i> Publicar Spot Gratuito ($0 COP)';
    } else if (planType === 'boost_platino') {
      if (submitUploadBtn) submitUploadBtn.innerHTML = '<i class="fa-solid fa-check"></i> Publicar Spot Gratuito ($0 COP)';
    } else if (planType === 'boost_diamante' || planType === 'boost_extreme' || planType === 'photos_5_spot') {
      if (submitUploadBtn) submitUploadBtn.innerHTML = '<i class="fa-solid fa-check"></i> Publicar Spot Gratuito ($0 COP)';
    } else if (planType === 'membership_pro') {
      const price = prc.membership_pro_price || 29000;
      if (submitUploadBtn) submitUploadBtn.innerHTML = `<i class="fa-solid fa-certificate text-spot"></i> Activar Membresía Mensual Pro ($${price.toLocaleString('es-CO')} COP/mes)`;
    }
  }

  planCards.forEach(card => {
    card.addEventListener('click', () => {
      const p = card.getAttribute('data-plan');
      if (p === 'photos_5') {
        const freeQuota = Number(state.pricing?.free_spots_quota) || 5;
        const storeCount = state.currentStore && state.videos 
          ? state.videos.filter(v => v.storeId === state.currentStore.id).length 
          : 0;
        const isMemActive = Boolean(
          state.currentStore &&
          state.currentStore.hasMembership &&
          (!state.currentStore.membershipExpiresAt || new Date(state.currentStore.membershipExpiresAt) > new Date())
        );
        // Publicaciones ilimitadas y gratuitas sin bloqueo de cupo
      }
      updatePlanSelection(p);
    });
  });

  // Helper para previsualizar imágenes con soporte para HEIC/HEIF (Android/iPhone)
  async function previewImageHelper(file, onLoaded) {
    if (!file) return;
    const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                   file.name.toLowerCase().endsWith('.heif') || 
                   (file.type && (file.type.includes('heic') || file.type.includes('heif')));

    if (isHeic && window.heic2any) {
      try {
        const resBlob = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
        const blob = Array.isArray(resBlob) ? resBlob[0] : resBlob;
        const objectUrl = URL.createObjectURL(blob);
        onLoaded(objectUrl);
        return;
      } catch (err) {
        console.warn('heic2any preview fallback:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => onLoaded(e.target.result);
    reader.readAsDataURL(file);
  }

  // Auto-compresión inteligente de imágenes (reduce fotos de 15MB a ~45-65KB en WebP/JPEG HD)
  // Permite almacenamiento directo permanente en PostgreSQL Cloud y máxima velocidad móvil
  async function compressImageToBlob(file, maxWidth = 960, maxHeight = 1280, quality = 0.82) {
    if (!file) return file;
    let sourceBlob = file;
    const isHeic = file.name && (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif'));
    if (isHeic && window.heic2any) {
      try {
        const res = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
        sourceBlob = Array.isArray(res) ? res[0] : res;
      } catch (e) {
        console.warn('HEIC compression fallback:', e);
      }
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', quality);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(sourceBlob);
    });
  }

  async function prepareCompressedFormData(form) {
    const formData = new FormData(form);
    const photoFields = ['coverPhoto', 'photo1', 'photo2', 'photo3', 'photo4', 'photo5', 'photo6', 'photo7'];
    for (const fName of photoFields) {
      const file = formData.get(fName);
      if (file && file instanceof File && file.size > 0) {
        try {
          const compBlob = await compressImageToBlob(file, 960, 1280, 0.82);
          formData.set(fName, compBlob, `${fName}.jpg`);
        } catch (err) {
          console.warn(`No se pudo comprimir ${fName}:`, err);
        }
      }
    }
    return formData;
  }

  // =========================================================
  // IDEA 98: FLUJO MAESTRO DE PUBLICACIÓN ("CREAR SPOT")
  // - 100% ENFOCADO EN FOTOS LIMPIAS (CERO FRICCIÓN)
  // - BOTONES DE ELIMINACIÓN INDIVIDUAL DE FOTO (✕)
  // - SHAKE & TOASTS DE VALIDACIÓN AMIGABLE
  // - VISTA PREVIA INTERACTIVA EN CELULAR (SMARTPHONE MOCKUP)
  // =========================================================

  // Función de validación amigable: sacudida visual suave y toast
  function triggerFieldShake(el, message) {
    if (!el) return;
    el.classList.add('field-error-shake');
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof el.focus === 'function') el.focus();
    } catch (err) {}
    setTimeout(() => el.classList.remove('field-error-shake'), 750);
    showToast(message, 'warning');
    if (navigator.vibrate) {
      try { navigator.vibrate([25, 40, 25]); } catch (e) {}
    }
  }

  // Vista previa instantánea de Foto Portada Principal
  const coverInput = document.getElementById('upload-cover-photo');
  coverInput?.addEventListener('change', () => {
    if (coverInput.files && coverInput.files[0]) {
      const file = coverInput.files[0];
      previewImageHelper(file, (src) => {
        const previewImg = document.getElementById('cover-preview-img');
        const previewWrap = document.getElementById('cover-preview-wrapper');
        const titleEl = document.getElementById('cover-dropzone-title');
        if (previewImg) previewImg.src = src;
        if (previewWrap) previewWrap.style.display = 'inline-block';
        if (titleEl) titleEl.textContent = `✓ Portada: ${file.name}`;
      });
    }
  });

  // Botón para quitar/eliminar la Foto de Portada con un solo toque
  document.getElementById('btn-remove-cover-photo')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (coverInput) coverInput.value = '';
    const previewWrap = document.getElementById('cover-preview-wrapper');
    const previewImg = document.getElementById('cover-preview-img');
    const titleEl = document.getElementById('cover-dropzone-title');
    if (previewWrap) previewWrap.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (titleEl) titleEl.textContent = 'Toca aquí para elegir la Foto de Portada';
    showToast('🗑️ Foto de portada retirada');
    if (navigator.vibrate) { try { navigator.vibrate(10); } catch (err) {} }
  });

  // Vistas previas instantáneas y botones de eliminación de Fotos 2, 3, 4, 5, 6 y 7
  [2, 3, 4, 5, 6, 7].forEach(num => {
    const pInput = document.getElementById(`upload-photo-${num}`);
    const pImg = document.getElementById(`preview-photo-${num}`);
    const btnRemove = document.getElementById(`btn-remove-photo-${num}`);

    pInput?.addEventListener('change', () => {
      if (pInput.files && pInput.files[0]) {
        previewImageHelper(pInput.files[0], (src) => {
          if (pImg) {
            pImg.src = src;
            pImg.style.display = 'block';
          }
          if (btnRemove) btnRemove.style.display = 'flex';
        });
      }
    });

    btnRemove?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (pInput) pInput.value = '';
      if (pImg) {
        pImg.src = '';
        pImg.style.display = 'none';
      }
      btnRemove.style.display = 'none';
      showToast(`🗑️ Foto ${num} retirada`);
      if (navigator.vibrate) { try { navigator.vibrate(10); } catch (err) {} }
    });
  });

  // Selector de Domicilio Dinámico (Gratis, Tarifa Personalizada, Local, Nacional)
  const delivTypeSelect = document.getElementById('upload-delivery-type');
  const customDelivBox = document.getElementById('custom-delivery-price-box');
  const customDelivInput = document.getElementById('upload-custom-delivery');

  delivTypeSelect?.addEventListener('change', () => {
    if (delivTypeSelect.value === 'custom') {
      customDelivBox.style.display = 'block';
      customDelivInput?.focus();
    } else {
      customDelivBox.style.display = 'none';
    }
  });

  // Envío del formulario de subida con protección anti-duplicados
  const uploadForm = document.getElementById('upload-video-form');
  let isUploadingVideo = false;

  uploadForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    processUpload();
  });

  document.getElementById('btn-submit-upload')?.addEventListener('click', (e) => {
    e.preventDefault();
    processUpload();
  });

  // =========================================================
  // VISTA PREVIA EN CELULAR (SMARTPHONE MOCKUP ANTES DE PUBLICAR)
  // =========================================================
  let mockupCurrentPhotoIdx = 0;
  let mockupPhotoList = [];

  function openSpotMockupPreview() {
    const coverSrc = document.getElementById('cover-preview-img')?.src;

    if (!coverSrc || coverSrc === '' || document.getElementById('cover-preview-wrapper')?.style.display === 'none') {
      triggerFieldShake(document.getElementById('cover-dropzone-box'), '⚠️ Primero selecciona la foto de portada para previsualizar.');
      return;
    }

    // Extraer datos del formulario en vivo
    const storeName = document.getElementById('upload-store-name')?.value.trim() || state.currentStore?.name || 'Mi Negocio';
    const storeAvatar = state.currentStore?.avatar || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100&auto=format&fit=crop&q=80';
    const titleVal = document.getElementById('upload-title')?.value.trim() || 'Título de tu producto o servicio';
    const priceNum = Number(document.getElementById('upload-price')?.value || 0);
    const priceText = priceNum > 0 ? `$${priceNum.toLocaleString('es-CO')} COP` : 'Precio a Convenir';

    // Domicilio
    let delivText = '🛵 Domicilio Gratis';
    const dType = delivTypeSelect ? delivTypeSelect.value : 'gratis';
    if (dType === 'custom') {
      const cVal = Number(customDelivInput?.value || 0);
      delivText = cVal > 0 ? `🛵 Domicilio: $${cVal.toLocaleString('es-CO')} COP` : '🛵 Domicilio según destino';
    } else if (dType === 'local') {
      delivText = '🏪 Recogida en Local';
    } else if (dType === 'nacional') {
      delivText = '🇨🇴 Envíos Nacionales';
    }

    const descVal = document.getElementById('upload-desc')?.value.trim() || 'Toca el botón de WhatsApp abajo para contactar a la tienda y consultar disponibilidad.';
    const badgeSelect = document.getElementById('upload-badge')?.value;
    const badgeHtml = (badgeSelect && badgeSelect !== 'none') ? `<span class="badge" style="background: rgba(255, 184, 0, 0.2); color: var(--spot-gold); border: 1px solid var(--spot-gold); font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 6px;">${escapeHtml(badgeSelect)}</span>` : '';

    // Recopilar lista de fotos para carrusel del mockup
    mockupPhotoList = [];
    mockupPhotoList.push(coverSrc);
    [2, 3, 4, 5, 6, 7].forEach(num => {
      const pImg = document.getElementById(`preview-photo-${num}`);
      if (pImg && pImg.src && pImg.style.display !== 'none') {
        mockupPhotoList.push(pImg.src);
      }
    });

    mockupCurrentPhotoIdx = 0;
    const screenBox = document.getElementById('mockup-screen-container');
    if (!screenBox) return;

    const dotsHtml = mockupPhotoList.length > 1
      ? `<div class="mockup-dots-bar" id="mockup-dots-bar">${mockupPhotoList.map((_, i) => `<span class="mockup-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></span>`).join('')}</div>`
      : '';

    const counterBadgeHtml = mockupPhotoList.length > 1
      ? `<span id="mockup-counter-badge" style="position: absolute; top: 12px; right: 12px; z-index: 7; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.7rem; font-weight: 800; padding: 2px 7px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.2);">1 / ${mockupPhotoList.length}</span>`
      : '';

    screenBox.innerHTML = `
      <div class="mockup-card-container">
        <div class="mockup-media-viewport" id="mockup-viewport" title="Toca para pasar a la siguiente foto">
          <img id="mockup-photo-display" src="${mockupPhotoList[0]}" alt="Vista previa SPOT">
        </div>
        ${counterBadgeHtml}
        ${dotsHtml}
        <div class="mockup-overlay-top">
          <div class="mockup-store-pill">
            <img src="${storeAvatar}" class="mockup-store-avatar" alt="Avatar">
            <span class="mockup-store-name">${escapeHtml(storeName)}</span>
            <span style="color: #ffb800; font-size: 0.7rem;">5.0 ⭐</span>
          </div>
          ${badgeHtml}
        </div>
        <div class="mockup-overlay-bottom">
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <span class="mockup-price-tag">${priceText}</span>
            <span class="mockup-delivery-badge">${escapeHtml(delivText)}</span>
          </div>
          <h4 class="mockup-title-text">${escapeHtml(titleVal)}</h4>
          <p class="mockup-desc-text">${escapeHtml(descVal)}</p>
          <button type="button" class="mockup-wa-btn">
            <i class="fa-brands fa-whatsapp" style="font-size: 1.1rem;"></i>
            <span>Comprar por WhatsApp</span>
          </button>
        </div>
      </div>
    `;

    // Evento interactivo: tocar la imagen en la pantalla del celular para pasar fotos
    const viewport = document.getElementById('mockup-viewport');
    viewport?.addEventListener('click', () => {
      if (mockupPhotoList.length <= 1) return;
      mockupCurrentPhotoIdx = (mockupCurrentPhotoIdx + 1) % mockupPhotoList.length;
      const img = document.getElementById('mockup-photo-display');
      const counter = document.getElementById('mockup-counter-badge');
      if (img) img.src = mockupPhotoList[mockupCurrentPhotoIdx];
      if (counter) counter.textContent = `${mockupCurrentPhotoIdx + 1} / ${mockupPhotoList.length}`;
      const dots = screenBox.querySelectorAll('.mockup-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === mockupCurrentPhotoIdx);
      });
      if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
    });

    const modal = document.getElementById('modal-spot-preview-mockup');
    if (modal) modal.style.display = 'flex';
  }

  document.getElementById('btn-preview-spot-mockup')?.addEventListener('click', openSpotMockupPreview);

  document.getElementById('btn-close-spot-mockup')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-spot-preview-mockup');
    if (modal) modal.style.display = 'none';
  });

  document.getElementById('btn-mockup-back-edit')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-spot-preview-mockup');
    if (modal) modal.style.display = 'none';
  });

  document.getElementById('btn-mockup-publish-now')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-spot-preview-mockup');
    if (modal) modal.style.display = 'none';
    processUpload();
  });

  async function processUpload() {
    if (isUploadingVideo) return;

    const coverFile = coverInput?.files;
    if (!coverFile || coverFile.length === 0) {
      triggerFieldShake(document.getElementById('cover-dropzone-box'), '⚠️ Por favor selecciona la Foto de Portada Principal de tu producto.');
      return;
    }

    const storeNameInput = document.getElementById('upload-store-name');
    if (!storeNameInput?.value.trim()) {
      triggerFieldShake(storeNameInput, '⚠️ Por favor escribe el nombre de tu tienda o negocio.');
      return;
    }

    const titleInput = document.getElementById('upload-title');
    if (!titleInput?.value.trim()) {
      triggerFieldShake(titleInput, '⚠️ Por favor escribe el nombre de tu producto o servicio.');
      return;
    }

    const waInput = document.getElementById('upload-whatsapp');
    if (!waInput?.value.trim()) {
      triggerFieldShake(waInput, '⚠️ Por favor escribe tu número de WhatsApp para que los clientes te compren.');
      return;
    }

    if (delivTypeSelect?.value === 'custom') {
      const cVal = Number(customDelivInput?.value || 0);
      if (!cVal || cVal <= 0) {
        triggerFieldShake(customDelivInput, '⚠️ Por favor escribe el valor del domicilio en COP.');
        return;
      }
    }

    const selectedPlan = planHiddenInput ? planHiddenInput.value : 'photos_5';
    const prc = state.pricing || {
      photos_5_price: 0,
      boost_standard_price: 5000,
      boost_standard_days: 2,
      boost_platino_price: 10000,
      boost_platino_days: 5,
      boost_diamante_price: 15000,
      boost_diamante_days: 8,
      boost_extreme_price: 15000,
      boost_extreme_days: 8,
      membership_pro_price: 29000,
      membership_pro_days: 30
    };

    let amount = 0;
    let typeKey = 'photos_7_pack';
    let planTitle = `📸 Publicación 7 Fotos Gratis (100% GRATIS - Permanente)`;
    let isSpotPlan = false;
    let isStandardBoost = false;

    if (selectedPlan === 'photos_5' || selectedPlan === 'photos_7') {
      const freeQuota = Number(prc.free_spots_quota) || 5;
      const storeCount = state.currentStore && state.videos 
        ? state.videos.filter(v => v.storeId === state.currentStore.id).length 
        : 0;
      const isMemActive = Boolean(
        state.currentStore &&
        state.currentStore.hasMembership &&
        (!state.currentStore.membershipExpiresAt || new Date(state.currentStore.membershipExpiresAt) > new Date())
      );
      if (!isMemActive && storeCount >= freeQuota) {
        amount = 0; typeKey = 'photos_7_pack'; planTitle = '📸 Spot 7 Fotos Gratis (Permanente)';
      } else {
        amount = 0;
        typeKey = 'photos_7_pack';
        planTitle = `📸 Publicación 7 Fotos Gratis (100% GRATIS - Permanente)`;
      }

    } else {
      amount = 0;
      typeKey = 'photos_7_pack';
      planTitle = '📸 Publicación 7 Fotos Gratis (100% GRATIS - Permanente)';
    }

    // Calcular etiqueta de domicilio configurada por el vendedor
    const dType = delivTypeSelect ? delivTypeSelect.value : 'gratis';
    let formattedDelivery = 'Domicilio Gratis';
    if (dType === 'gratis') {
      formattedDelivery = 'Domicilio Gratis';
    } else if (dType === 'custom') {
      const cVal = Number(customDelivInput?.value || 0);
      if (cVal > 0) {
        formattedDelivery = `Domicilio: $${cVal.toLocaleString('es-CO')} COP`;
      } else {
        formattedDelivery = 'Domicilio con costo según destino';
      }
    } else if (dType === 'local') {
      formattedDelivery = 'Recogida en Local Físico';
    } else if (dType === 'nacional') {
      formattedDelivery = 'Envíos a Todo el País';
    }

    // MODELO DE NEGOCIO VITRINASPOT 100% GRATIS (MONETIZACIÓN CON GOOGLE ADMOB):
    // Publicar spots de hasta 7 fotos es 100% GRATIS ($0 COP) para todos los comercios.
    const submitBtn = document.getElementById('btn-submit-upload');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Optimizando fotos...';
    }
    const sendData = await prepareCompressedFormData(uploadForm);
    if (state.currentStore) sendData.append('storeId', state.currentStore.id);
    sendData.set('delivery', formattedDelivery);
    sendData.append('paidPlan', selectedPlan || 'photos_7');
    const isBoostPlan = selectedPlan && (selectedPlan.includes('boost') || selectedPlan.includes('diamante') || selectedPlan.includes('platino'));
    sendData.append('hasSpot', isBoostPlan ? 'true' : 'false');
    sendData.append('isStandardBoost', selectedPlan === 'boost_standard' ? 'true' : 'false');
    sendData.append('spotBoost', isBoostPlan ? 'true' : 'false');
    sendData.append('isPermanent', 'true');
    sendData.append('transactionId', 'tx_free_admob_model');
    executeVideoUpload(sendData, selectedPlan || 'photos_5');
    return;
  }

  function executeVideoUpload(formData, selectedPlan) {
    const progCard = document.getElementById('upload-progress-card');
    const progFill = document.getElementById('upload-fill');
    const progPct = document.getElementById('upload-pct');
    const submitBtn = document.getElementById('btn-submit-upload');

    isUploadingVideo = true;
    progCard.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publicando en la Vitrina...';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/videos', true);
    xhr.timeout = 300000; // 5 minutos de tiempo de espera

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const percent = Math.round((ev.loaded / ev.total) * 100);
        progFill.style.width = `${percent}%`;
        progPct.textContent = `${percent}%`;
      }
    };

    xhr.onload = async () => {
      isUploadingVideo = false;
      submitBtn.disabled = false;
      progCard.style.display = 'none';
      if (xhr.status === 201 || xhr.status === 200) {
        let createdVideoId = null;
        try {
          const resp = JSON.parse(xhr.responseText || '{}');
          if (resp.store) {
            state.currentStore = resp.store;
            localStorage.setItem('vitrina_current_store', JSON.stringify(resp.store));
            updateNavStoreUI();
          }
          if (resp.video && resp.video.id) {
            createdVideoId = resp.video.id;
          }
        } catch (e) {}

        uploadModal.style.display = 'none';
        uploadForm.reset();
        if (coverInput) coverInput.value = '';
        const previewWrap = document.getElementById('cover-preview-wrapper');
        const coverTitleEl = document.getElementById('cover-dropzone-title');
        if (previewWrap) previewWrap.style.display = 'none';
        if (coverTitleEl) coverTitleEl.textContent = 'Toca aquí para elegir la Foto de Portada';
        [2, 3, 4, 5, 6, 7].forEach(num => {
          const pImg = document.getElementById(`preview-photo-${num}`);
          const pBtn = document.getElementById(`btn-remove-photo-${num}`);
          if (pImg) { pImg.src = ''; pImg.style.display = 'none'; }
          if (pBtn) { pBtn.style.display = 'none'; }
        });

        selectUploadCategory('Comida & Domicilios', '🍔');
        updatePlanSelection('photos_5');
        refreshUploadMembershipUI();
        await loadStores();
        await loadVideos();

        // 🎉 ABRIR MODAL DE ÉXITO Y BUCLE VIRAL (MOMENTO DE GRATIFICACIÓN)
        openUploadSuccessModal(createdVideoId);
      } else {
        updatePlanSelection(selectedPlan);
        alert('Error al publicar SPOT: ' + xhr.responseText);
      }
    };

    xhr.ontimeout = () => {
      isUploadingVideo = false;
      submitBtn.disabled = false;
      updatePlanSelection(selectedPlan);
      progCard.style.display = 'none';
      alert('⚠️ La subida tardó demasiado debido a la velocidad de la conexión. Conéctate a tu Wi-Fi para subir a máxima velocidad.');
    };

    xhr.onerror = () => {
      isUploadingVideo = false;
      submitBtn.disabled = false;
      updatePlanSelection(selectedPlan);
      progCard.style.display = 'none';
      alert('⚠️ Hubo un error de conexión al enviar el video. Te recomendamos conectarte a tu Wi-Fi e ingresar por http://192.168.1.10:4000 para subir sin límites.');
    };

    xhr.send(formData);
  }

  // Modal de Celebración y Bucle Viral Post-Publicación (Opción 3)
  function openUploadSuccessModal(videoId) {
    // Telemetría AdMob: Registrar impresión de anuncio Intersticial post-publicación
    if (state.admobConfig && state.admobConfig.interstitialOnUpload !== false) {
      trackAdMobImpression('interstitial');
    }

    const modal = document.getElementById('modal-upload-success');
    if (!modal) {
      showToast('🚀 ¡Tu SPOT ha sido publicado con éxito!');
      if (document.getElementById('seller-panel-view').style.display === 'block') {
        openSellerPanel();
      } else {
        showView('feed-view');
      }
      return;
    }

    modal.style.display = 'flex';

    // Cuota dinámica configurada por el Administrador
    const freeQuota = Number(state.pricing?.free_spots_quota) || 5;

    // Calibrar dinámicamente textos visuales de la tarjeta viral post-publicación
    const viralBadge = modal.querySelector('.viral-share-badge');
    if (viralBadge) {
      viralBadge.innerHTML = `<i class="fa-solid fa-gift"></i> ${freeQuota} PUBLICACIONES 100% GRATIS`;
    }
    const viralDesc = modal.querySelector('.viral-share-card p');
    if (viralDesc) {
      viralDesc.innerHTML = `Invítalos a publicar sus primeros <strong>${freeQuota} SPOTS</strong> en la Vitrina <strong>100% GRATIS</strong> sin comisiones ni mensualidades.`;
    }
    const viralBtnText = document.getElementById('btn-viral-share-wa');
    if (viralBtnText) {
      viralBtnText.innerHTML = `<i class="fa-brands fa-whatsapp"></i> Invitar Comercios (${freeQuota} SPOTS Gratis)`;
    }

    // Configurar botón Compartir por WhatsApp
    const shareBtn = document.getElementById('btn-viral-share-wa');
    if (shareBtn) {
      shareBtn.onclick = () => {
        const shareUrl = getPublicShareUrl();
        const shareMsg = `¡Hola colega! 👋 Mira esta nueva vitrina comercial en Colombia que encontré: *La Vitrina* (Tu catálogo digital, pedidos al chat directo).\n\n` +
          `🎁 Acabo de subir mi SPOT y están regalando *${freeQuota} SPOTS 100% GRATIS* y fijos para los primeros 1.000 comercios pioneros.\n\n` +
          `Aprovecha y sube tus productos antes de que se completen los 1.000 cupos aquí:\n\n` +
          `${shareUrl}`;

        if (navigator.share) {
          navigator.share({
            title: `Vitrina - ${freeQuota} SPOTS Gratis para Comercios Pioneros`,
            text: shareMsg,
            url: shareUrl
          }).catch(() => {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank');
          });
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank');
        }
      };
    }

    // Ver anuncio en el feed
    const viewBtn = document.getElementById('btn-success-view-product');
    if (viewBtn) {
      viewBtn.onclick = () => {
        modal.style.display = 'none';
        showView('feed-view');
        if (videoId) {
          setTimeout(() => {
            const card = document.getElementById(`card-${videoId}`);
            if (card) {
              card.scrollIntoView({ behavior: 'smooth' });
            }
          }, 150);
        }
      };
    }

    // Ir a Mi Panel de Negocio
    const panelBtn = document.getElementById('btn-success-open-panel');
    if (panelBtn) {
      panelBtn.onclick = () => {
        modal.style.display = 'none';
        openSellerPanel();
      };
    }

    // Botón cerrar 'X'
    const closeBtn = document.getElementById('btn-close-upload-success');
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.style.display = 'none';
        if (document.getElementById('seller-panel-view').style.display === 'block') {
          openSellerPanel();
        } else {
          showView('feed-view');
        }
      };
    }
  }
  window.openUploadSuccessModal = openUploadSuccessModal;

  // Modal Autenticación / Registro de Tienda
  const authModal = document.getElementById('modal-store-auth');
  const btnCloseAuth = document.getElementById('btn-close-store-auth');
  const tabRegister = document.getElementById('tab-btn-register');
  const tabLogin = document.getElementById('tab-btn-login');
  const formRegister = document.getElementById('store-register-form');
  const formLogin = document.getElementById('store-login-form');
  const formForgot = document.getElementById('store-forgot-form');

  btnCloseAuth?.addEventListener('click', () => {
    if (authModal) authModal.style.display = 'none';
  });

  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.style.display = 'none';
    }
  });

  tabRegister?.addEventListener('click', () => {
    clearRegNameError();
    tabRegister.classList.add('active');
    tabLogin?.classList.remove('active');
    if (formRegister) formRegister.style.display = 'block';
    if (formLogin) formLogin.style.display = 'none';
    if (formForgot) formForgot.style.display = 'none';
  });

  tabLogin?.addEventListener('click', () => {
    clearRegNameError();
    tabLogin.classList.add('active');
    tabRegister?.classList.remove('active');
    if (formLogin) formLogin.style.display = 'block';
    if (formRegister) formRegister.style.display = 'none';
    if (formForgot) formForgot.style.display = 'none';
  });

  // Navegación a Recuperar Contraseña
  document.getElementById('btn-goto-forgot-pass')?.addEventListener('click', () => {
    tabLogin?.classList.remove('active');
    tabRegister?.classList.remove('active');
    if (formLogin) formLogin.style.display = 'none';
    if (formRegister) formRegister.style.display = 'none';
    if (formForgot) {
      formForgot.style.display = 'block';
      const step1 = document.getElementById('forgot-step-1');
      const step2 = document.getElementById('forgot-step-2');
      if (step1) step1.style.display = 'block';
      if (step2) step2.style.display = 'none';

      // Pre-llenar WhatsApp si ya se había escrito en el login
      const loginWa = document.getElementById('login-store-whatsapp')?.value.trim();
      const forgotWa = document.getElementById('forgot-store-whatsapp');
      if (loginWa && forgotWa && !forgotWa.value) {
        forgotWa.value = loginWa;
      }
    }
  });

  document.getElementById('btn-back-to-login')?.addEventListener('click', () => {
    tabLogin?.click();
  });

  // Paso 1 de Recuperación: Solicitar Código OTP
  let currentRecoveryWhatsApp = '';
  document.getElementById('btn-request-recovery-code')?.addEventListener('click', async () => {
    const waInput = document.getElementById('forgot-store-whatsapp');
    const waVal = waInput ? waInput.value.trim() : '';
    if (!waVal) {
      showToast('⚠️ Ingresa tu número de WhatsApp registrado.', 'error');
      waInput?.focus();
      return;
    }

    const btn = document.getElementById('btn-request-recovery-code');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando código...';
      btn.disabled = true;
    }

    try {
      const res = await fetch('/api/stores/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: waVal })
      });
      const data = await res.json();

      if (res.ok) {
        currentRecoveryWhatsApp = waVal;
        showToast('🔑 Código generado. Abriendo tu WhatsApp...');

        // Actualizar datos del paso 2
        const targetLabel = document.getElementById('forgot-target-wa');
        if (targetLabel) targetLabel.textContent = `+${data.whatsapp}`;

        // Enlace para abrir o reabrir el código en WhatsApp
        const waMsg = encodeURIComponent(`🔐 Tu código de recuperación de la Vitrina para "${data.storeName}" es: *${data.code}*.\n\nEs válido por 15 minutos. Ingresa este código en la pantalla para crear tu nueva contraseña.`);
        const waUrl = `https://api.whatsapp.com/send?phone=${data.whatsapp}&text=${waMsg}`;
        const reopenLink = document.getElementById('btn-reopen-wa-code');
        if (reopenLink) reopenLink.href = waUrl;

        // Abrir WhatsApp automáticamente
        window.open(waUrl, '_blank');

        // Cambiar a paso 2
        document.getElementById('forgot-step-1').style.display = 'none';
        document.getElementById('forgot-step-2').style.display = 'block';
        document.getElementById('forgot-input-code')?.focus();
      } else {
        showToast(data.error || 'No se pudo generar el código.', 'error');
      }
    } catch (e) {
      showToast('Error de conexión al solicitar código.', 'error');
    } finally {
      if (btn) {
        btn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Enviar Código por WhatsApp';
        btn.disabled = false;
      }
    }
  });

  // Paso 2 de Recuperación: Validar Código y Establecer Nueva Contraseña
  document.getElementById('btn-submit-reset-password')?.addEventListener('click', async () => {
    const codeVal = document.getElementById('forgot-input-code')?.value.trim();
    const newPass = document.getElementById('forgot-new-password')?.value;
    const confirmPass = document.getElementById('forgot-confirm-password')?.value;

    if (!codeVal || codeVal.length < 4) {
      showToast('⚠️ Ingresa el código de 4 dígitos.', 'error');
      document.getElementById('forgot-input-code')?.focus();
      return;
    }

    if (!newPass || newPass.trim().length < 3) {
      showToast('⚠️ La contraseña debe tener al menos 3 caracteres.', 'error');
      document.getElementById('forgot-new-password')?.focus();
      return;
    }

    if (newPass !== confirmPass) {
      showToast('⚠️ Las contraseñas no coinciden. Escríbelas iguales.', 'error');
      document.getElementById('forgot-confirm-password')?.focus();
      return;
    }

    const btn = document.getElementById('btn-submit-reset-password');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
      btn.disabled = true;
    }

    try {
      const res = await fetch('/api/stores/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: currentRecoveryWhatsApp,
          code: codeVal,
          newPassword: newPass
        })
      });
      const data = await res.json();

      if (res.ok) {
        state.currentStore = data.store;
        localStorage.setItem('vitrina_current_store_id', data.store.id);
        updateNavStoreUI();
        if (authModal) authModal.style.display = 'none';
        showToast('🎉 ¡Contraseña actualizada con éxito! Bienvenido a tu negocio.');
        openSellerPanel(); // Apertura instantánea
        loadStores().catch(console.error);
        loadVideos().catch(console.error);
      } else {
        showToast(data.error || 'Código incorrecto o vencido.', 'error');
      }
    } catch (e) {
      showToast('Error de conexión al actualizar contraseña.', 'error');
    } finally {
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Actualizar Contraseña y Entrar';
        btn.disabled = false;
      }
    }
  });

  // Disparadores rápidos desde el menú de invitados
  document.getElementById('btn-guest-login-trigger')?.addEventListener('click', () => {
    document.getElementById('user-dropdown-menu')?.classList.remove('show');
    document.getElementById('user-dropdown-menu')?.classList.remove('show');
    tabLogin?.click();
    authModal.style.display = 'flex';
  });

  document.getElementById('btn-guest-register-trigger')?.addEventListener('click', () => {
    document.getElementById('user-dropdown-menu')?.classList.remove('show');
    document.getElementById('user-dropdown-menu')?.classList.remove('show');
    tabRegister?.click();
    authModal.style.display = 'flex';
  });

  // Disparador para leer las reglas completas desde el registro
  document.getElementById('btn-read-rules-reg')?.addEventListener('click', (e) => {
    e.preventDefault();
    openLegalTermsModal();
  });

  // Alternadores de visualización de contraseña (ojito ver/ocultar)
  window.setupPasswordEye('btn-toggle-reg-pass', 'reg-store-pass', 'icon-toggle-reg-pass');
  window.setupPasswordEye('btn-toggle-login-pass', 'login-store-pass', 'icon-toggle-login-pass');

  // Funciones para alerta en rojo de nombre duplicado en Registro
  function showRegNameError(msg) {
    const alertBox = document.getElementById('reg-store-name-error');
    const alertText = document.getElementById('reg-store-name-error-text');
    const input = document.getElementById('reg-store-name');
    if (alertBox && alertText) {
      alertText.innerHTML = msg || 'Este nombre de usuario o tienda ya existe. Debes colocar otro nombre para continuar.';
      alertBox.style.display = 'block';
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (input) {
      input.style.border = '1.5px solid #ef4444';
      input.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.35)';
      input.focus();
    }
  }

  function clearRegNameError() {
    const alertBox = document.getElementById('reg-store-name-error');
    const input = document.getElementById('reg-store-name');
    if (alertBox) alertBox.style.display = 'none';
    if (input) {
      input.style.border = '';
      input.style.boxShadow = '';
    }
  }

  document.getElementById('reg-store-name')?.addEventListener('input', clearRegNameError);
  document.getElementById('reg-store-city')?.addEventListener('change', clearRegNameError);

  // Crear nueva tienda
  formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearRegNameError();
    const name = document.getElementById('reg-store-name').value.trim();
    const whatsapp = document.getElementById('reg-store-whatsapp').value.trim();
    const email = document.getElementById('reg-store-email')?.value.trim().toLowerCase() || '';
    const city = document.getElementById('reg-store-city').value;
    const password = document.getElementById('reg-store-pass').value;
    const acceptRules = document.getElementById('reg-store-accept-rules')?.checked;

    if (!password || password.trim().length === 0) {
      showToast('⚠️ Por favor escribe una contraseña para tu negocio.', 'error');
      document.getElementById('reg-store-pass')?.focus();
      return;
    }

    if (!acceptRules) {
      showToast('⚠️ Debes aceptar las Políticas de Seguridad y Reglas de Oro para activar tu negocio.', 'error');
      document.getElementById('reg-store-accept-rules')?.focus();
      return;
    }

    // Validación de unicidad de nombre de tienda en la misma ciudad
    const normName = name.trim().toLowerCase();
    const normCity = (city || 'Bogotá').trim().toLowerCase();
    const localConflict = (state.stores || []).find(s => 
      (s.name || '').trim().toLowerCase() === normName &&
      (s.city || 'Bogotá').trim().toLowerCase() === normCity
    );
    if (localConflict) {
      showRegNameError(`Este nombre de usuario o tienda ya existe en <strong>${escapeHtml(localConflict.city)}</strong>. A no ser que el filtro de ciudad sea diferente, debes colocar otro nombre.`);
      showToast('⚠️ Este nombre de usuario ya existe. Debes colocar otro.', 'error');
      return;
    }

    const submitBtn = formRegister.querySelector('button[type="submit"]');

    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creando tu tienda...';
      submitBtn.disabled = true;
    }

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsapp, email, city, password, acceptedRules: true })
      });
      const data = await res.json();
      if (res.ok) {
        state.currentStore = data.store;
        localStorage.setItem('vitrina_current_store_id', data.store.id);
        updateNavStoreUI();
        authModal.style.display = 'none';
        showToast(`🎉 ¡Tienda "${data.store.name}" creada con éxito!`);
        openSellerPanel(); // Apertura instantánea sin esperar
        loadStores().catch(console.error);
        loadVideos().catch(console.error);
      } else {
        if (data.error && (data.error.toLowerCase().includes('ya existe') || data.error.toLowerCase().includes('inválido'))) {
          showRegNameError(escapeHtml(data.error));
        }
        showToast(data.error || 'Error al registrar tienda.', 'error');
      }
    } catch (e) {
      showToast('Error de conexión al crear tienda.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Crear Mi Tienda y Empezar';
        submitBtn.disabled = false;
      }
    }
  });

  // Iniciar sesión en tienda existente con apertura instantánea (0.1s)
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const whatsapp = document.getElementById('login-store-whatsapp').value.trim();
    const password = document.getElementById('login-store-pass').value;

    if (!whatsapp) {
      showToast('⚠️ Ingresa tu número de WhatsApp.', 'error');
      document.getElementById('login-store-whatsapp')?.focus();
      return;
    }
    if (!password) {
      showToast('⚠️ Ingresa tu contraseña.', 'error');
      document.getElementById('login-store-pass')?.focus();
      return;
    }

    const submitBtn = formLogin.querySelector('button[type="submit"]');

    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando a tu perfil...';
      submitBtn.disabled = true;
    }

    try {
      const res = await fetch('/api/stores/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp, password })
      });
      const data = await res.json();
      if (res.ok) {
        state.currentStore = data.store;
        localStorage.setItem('vitrina_current_store_id', data.store.id);
        updateNavStoreUI();
        authModal.style.display = 'none';
        showToast(`👋 ¡Bienvenido de vuelta, ${data.store.name}!`);
        openSellerPanel(); // Apertura instantánea (0.1s)
        loadStores().catch(console.error);
        loadVideos().catch(console.error);
      } else {
        showToast(data.error || 'Número o contraseña incorrectos.', 'error');
      }
    } catch (err) {
      showToast('Error de conexión al iniciar sesión.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión en Mi Negocio';
        submitBtn.disabled = false;
      }
    }
  });

  // Cerrar sesión de tienda
  document.getElementById('btn-store-logout')?.addEventListener('click', () => {
    state.currentStore = null;
    localStorage.removeItem('vitrina_current_store_id');
    updateNavStoreUI();
    showToast('👋 Has cerrado sesión');
    showView('feed-view');
  });


// Listeners de planes de pago e impulsos removidos (Sistema 100% Orgánico)

  // ==========================================
  // CALIFICACIÓN INTERACTIVA DE TIENDA (1 A 5 ESTRELLAS)
  // ==========================================
  const rateModal = document.getElementById('modal-rate-store');
  let selectedRating = 5;
  let targetRateStoreId = null;
  let targetRateStoreName = '';

  const ratingDescriptions = {
    5: '⭐⭐⭐⭐⭐ 5.0 - ¡Excelente atención y productos!',
    4: '⭐⭐⭐⭐ 4.0 - Muy buena tienda y atención',
    3: '⭐⭐⭐ 3.0 - Buena atención',
    2: '⭐⭐ 2.0 - Regular / Podría mejorar',
    1: '⭐ 1.0 - Mala experiencia de compra'
  };

  function updateStarsPickerUI(val) {
    selectedRating = val;
    document.querySelectorAll('.star-pick').forEach((s, idx) => {
      if (idx < val) s.classList.add('active');
      else s.classList.remove('active');
    });
    const labelEl = document.getElementById('rate-stars-score-label');
    if (labelEl) labelEl.textContent = ratingDescriptions[val] || `${val}.0 ⭐`;
  }

  window.openRateModal = function(storeId, storeName) {
    if (!storeId) {
      const curVideo = state.videos[state.currentIndex];
      if (curVideo) {
        storeId = curVideo.storeId;
        storeName = curVideo.storeName;
      }
    }
    if (!storeId) return;

    targetRateStoreId = storeId;
    targetRateStoreName = storeName || 'Este Comercio';

    const titleEl = document.getElementById('rate-modal-store-name');
    if (titleEl) titleEl.textContent = targetRateStoreName;

    // Verificar si el usuario ya votó por esta tienda
    let prevRating = 5;
    try {
      const userRatings = JSON.parse(localStorage.getItem('vitrinaspot_user_ratings') || '{}');
      if (userRatings[storeId]) {
        prevRating = Number(userRatings[storeId]) || 5;
        const descEl = document.getElementById('rate-modal-desc');
        if (descEl) descEl.textContent = `Ya has calificado a este negocio con ${prevRating} ⭐. Puedes actualizar tu calificación:`;
      } else {
        const descEl = document.getElementById('rate-modal-desc');
        if (descEl) descEl.textContent = '¿Cómo calificarías la atención, seriedad y productos de este comercio?';
      }
    } catch (_) {}

    updateStarsPickerUI(prevRating);

    if (rateModal) rateModal.style.display = 'flex';
  };

  document.getElementById('btn-close-rate')?.addEventListener('click', () => {
    if (rateModal) rateModal.style.display = 'none';
  });

  rateModal?.addEventListener('click', (e) => {
    if (e.target === rateModal) rateModal.style.display = 'none';
  });

  document.querySelectorAll('.star-pick').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-val'), 10) || 5;
      updateStarsPickerUI(val);
    });
  });

  document.getElementById('btn-submit-rating')?.addEventListener('click', async () => {
    if (!targetRateStoreId) {
      const curVideo = state.videos[state.currentIndex];
      if (curVideo) targetRateStoreId = curVideo.storeId;
    }
    if (!targetRateStoreId) return;

    const btnSubmit = document.getElementById('btn-submit-rating');
    const originalText = btnSubmit ? btnSubmit.innerHTML : '';
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    }

    try {
      const res = await fetch(`/api/stores/${targetRateStoreId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (rateModal) rateModal.style.display = 'none';

        // Guardar voto en localStorage anti-spam
        try {
          const userRatings = JSON.parse(localStorage.getItem('vitrinaspot_user_ratings') || '{}');
          userRatings[targetRateStoreId] = selectedRating;
          localStorage.setItem('vitrinaspot_user_ratings', JSON.stringify(userRatings));
        } catch (_) {}

        const newRating = Number(data.rating).toFixed(1);
        const newCount = data.count;

        // Actualizar datos en memoria de videos de esta tienda
        state.videos.forEach(v => {
          if (v.storeId === targetRateStoreId) {
            v.storeRating = Number(newRating);
            v.storeRatingCount = newCount;
          }
        });

        // Actualizar badges visibles en el feed
        document.querySelectorAll(`.store-info-row`).forEach(row => {
          const badge = row.querySelector('.store-stars-badge span');
          if (badge) badge.textContent = newRating;
        });

        // Actualizar badge en vista de catálogo
        const catRatingEl = document.getElementById('cat-store-rating');
        if (catRatingEl) {
          catRatingEl.innerHTML = `<i class="fa-solid fa-star text-gold"></i> ${newRating} (${newCount} opiniones)`;
        }

        // Actualizar badge en panel de escritorio
        const deskStars = document.getElementById('desk-store-stars');
        if (deskStars) {
          deskStars.textContent = `⭐ ${newRating} (${newCount})`;
        }

        showToast(`⭐ ¡Calificación guardada! ${targetRateStoreName} ahora tiene ${newRating} ⭐ (${newCount} votos)`);
      } else {
        showToast(data.error || 'No se pudo guardar la calificación.');
      }
    } catch (e) {
      showToast('Error de conexión al calificar.');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText || '<i class="fa-solid fa-check"></i> Confirmar Calificación';
      }
    }
  });

  // Modal Editar Perfil & Foto de Tienda
  function openEditProfileModal() {
    if (!state.currentStore) {
      document.getElementById('modal-store-auth').style.display = 'flex';
      return;
    }
    const modal = document.getElementById('modal-edit-profile');
    const previewImg = document.getElementById('edit-preview-avatar');
    const nameInput = document.getElementById('edit-store-name');
    const waInput = document.getElementById('edit-store-whatsapp');
    const emailInput = document.getElementById('edit-store-email');
    const citySelect = document.getElementById('edit-store-city');
    const descInput = document.getElementById('edit-store-desc');
    const hoursInput = document.getElementById('edit-store-hours');
    const addressInput = document.getElementById('edit-store-address');
    const avatarInput = document.getElementById('edit-profile-avatar-input');
    const filenameEl = document.getElementById('edit-avatar-filename');

    if (previewImg) previewImg.src = state.currentStore.avatar || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&auto=format&fit=crop&q=80';
    if (nameInput) nameInput.value = state.currentStore.name || '';
    if (waInput) waInput.value = (state.currentStore.whatsapp || '').replace('+57', '').replace(/[^0-9]/g, '');
    if (emailInput) emailInput.value = state.currentStore.email || '';
    if (citySelect) citySelect.value = state.currentStore.city || 'Bogotá';
    if (descInput) descInput.value = state.currentStore.description || '';
    if (hoursInput) hoursInput.value = state.currentStore.hours || 'Lun - Sáb: 8:00 AM - 7:00 PM';
    if (addressInput) addressInput.value = state.currentStore.address || 'Venta online y envíos a todo el país';
    if (avatarInput) avatarInput.value = '';
    if (filenameEl) filenameEl.innerHTML = '';
    optimizedProfileAvatarBlob = null;

    modal.style.display = 'flex';
  }

  // Utilidad para recortar y optimizar avatar a 1:1 cuadrado centrado antes de subir
  async function createSquareAvatarBlob(fileOrBlob, targetSize = 400) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(fileOrBlob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const minDim = Math.min(w, h);
        const sx = (w - minDim) / 2;
        const sy = (h - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
        canvas.toBlob((blob) => {
          resolve(blob || fileOrBlob);
        }, 'image/jpeg', 0.88);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(fileOrBlob);
      };
      img.src = url;
    });
  }

  let optimizedProfileAvatarBlob = null;

  document.getElementById('btn-open-edit-profile')?.addEventListener('click', openEditProfileModal);
  document.getElementById('btn-open-edit-profile-dash')?.addEventListener('click', openEditProfileModal);
  document.getElementById('btn-quick-change-avatar')?.addEventListener('click', openEditProfileModal);
  document.getElementById('btn-close-edit-profile')?.addEventListener('click', () => {
    document.getElementById('modal-edit-profile').style.display = 'none';
  });
  document.getElementById('btn-cancel-edit-profile')?.addEventListener('click', () => {
    document.getElementById('modal-edit-profile').style.display = 'none';
  });

  // Vista previa en vivo al elegir foto de perfil con recorte 1:1 cuadrado automático
  const avatarInput = document.getElementById('edit-profile-avatar-input');
  const previewAvatarImg = document.getElementById('edit-preview-avatar');
  const avatarFilenameEl = document.getElementById('edit-avatar-filename');

  avatarInput?.addEventListener('change', async () => {
    if (avatarInput.files && avatarInput.files[0]) {
      const file = avatarInput.files[0];
      let sourceBlob = file;
      const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      if (isHeic && window.heic2any) {
        try {
          const res = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.88 });
          sourceBlob = Array.isArray(res) ? res[0] : res;
        } catch (e) {
          sourceBlob = file;
        }
      }
      try {
        optimizedProfileAvatarBlob = await createSquareAvatarBlob(sourceBlob, 400);
        previewAvatarImg.src = URL.createObjectURL(optimizedProfileAvatarBlob);
        const sizeKb = (optimizedProfileAvatarBlob.size / 1024).toFixed(0);
        avatarFilenameEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Foto cuadrada optimizada: <strong>${escapeHtml(file.name)}</strong> (${sizeKb} KB)`;
      } catch (err) {
        previewAvatarImg.src = URL.createObjectURL(file);
        avatarFilenameEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Foto lista: <strong>${escapeHtml(file.name)}</strong>`;
      }
    }
  });

  // Funciones para alerta en rojo de nombre duplicado en Edición de Perfil
  function showEditNameError(msg) {
    const alertBox = document.getElementById('edit-store-name-error');
    const alertText = document.getElementById('edit-store-name-error-text');
    const input = document.getElementById('edit-store-name');
    if (alertBox && alertText) {
      alertText.innerHTML = msg || 'Este nombre de usuario o tienda ya existe. Debes colocar otro nombre para continuar.';
      alertBox.style.display = 'block';
    }
    if (input) {
      input.style.border = '1.5px solid #ef4444';
      input.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.35)';
      input.focus();
    }
  }

  function clearEditNameError() {
    const alertBox = document.getElementById('edit-store-name-error');
    const input = document.getElementById('edit-store-name');
    if (alertBox) alertBox.style.display = 'none';
    if (input) {
      input.style.border = '';
      input.style.boxShadow = '';
    }
  }

  document.getElementById('edit-store-name')?.addEventListener('input', clearEditNameError);
  document.getElementById('edit-store-city')?.addEventListener('change', clearEditNameError);

  // Guardar cambios del perfil
  const editProfileForm = document.getElementById('edit-profile-form');
  editProfileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearEditNameError();
    if (!state.currentStore) return;

    const submitBtn = document.getElementById('btn-submit-edit-profile');

    // Validación de unicidad de nombre de tienda en la misma ciudad al editar perfil
    const editName = document.getElementById('edit-store-name')?.value.trim();
    const editCity = document.getElementById('edit-store-city')?.value.trim() || state.currentStore.city || 'Bogotá';
    if (editName) {
      const conflict = (state.stores || []).find(s => 
        s.id !== state.currentStore.id &&
        (s.name || '').trim().toLowerCase() === editName.toLowerCase() &&
        (s.city || 'Bogotá').trim().toLowerCase() === editCity.toLowerCase()
      );
      if (conflict) {
        showEditNameError(`Este nombre de usuario o tienda ya existe en <strong>${escapeHtml(conflict.city)}</strong>. A no ser que el filtro de ciudad sea diferente, debes usar otro nombre.`);
        showToast('⚠️ Este nombre de usuario ya existe. Debes colocar otro.', 'error');
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
      const formData = new FormData(editProfileForm);
      const rawWa = document.getElementById('edit-store-whatsapp')?.value.trim();
      let cleanWa = rawWa.replace(/[^0-9]/g, '');
      if (cleanWa.length === 10 && !cleanWa.startsWith('57')) {
        cleanWa = `+57${cleanWa}`;
      } else if (!cleanWa.startsWith('+')) {
        cleanWa = `+${cleanWa}`;
      }
      formData.set('whatsapp', cleanWa);

      // Si se optimizó la foto en canvas 1:1, adjuntarla; si no se cambió, no enviar campo avatar
      if (optimizedProfileAvatarBlob) {
        formData.set('avatar', optimizedProfileAvatarBlob, 'avatar_profile.jpg');
      } else {
        const aInput = document.getElementById('edit-profile-avatar-input');
        if (!aInput || !aInput.files || aInput.files.length === 0) {
          formData.delete('avatar');
        }
      }

      const res = await fetch(`/api/stores/${state.currentStore.id}`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        state.currentStore = data.store;
        updateNavStoreUI();
        document.getElementById('modal-edit-profile').style.display = 'none';
        showToast('🎉 ¡Foto de perfil y datos actualizados con éxito!');
        await loadStores();
        await loadVideos();
        openSellerPanel();
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error && (errData.error.toLowerCase().includes('ya existe') || errData.error.toLowerCase().includes('inválido'))) {
          showEditNameError(escapeHtml(errData.error));
        }
        showToast(errData.error || 'Error guardando perfil.', 'error');
      }
    } catch (err) {
      showToast('Error de conexión al actualizar perfil.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios de Perfil';
    }
  });

  // ==========================================
  // MODAL EDITAR PRODUCTO / ANUNCIO (BLINDAJE TOTAL DE SPOT VIP Y GESTIÓN DE FOTOS)
  // ==========================================
  let editingSpotPhotos = [];

  function renderEditSpotPhotos() {
    const strip = document.getElementById('edit-prod-photos-strip');
    const countEl = document.getElementById('edit-prod-photos-count');
    if (!strip) return;

    if (countEl) countEl.textContent = editingSpotPhotos.length;

    let html = '';
    editingSpotPhotos.forEach((photoUrl, idx) => {
      const isCover = idx === 0;
      html += `
        <div class="edit-photo-card ${isCover ? 'is-cover' : ''}" data-idx="${idx}">
          <img src="${photoUrl}" alt="Foto ${idx + 1}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80'">
          <span class="edit-photo-card-label">${isCover ? '⭐ Portada' : 'Foto ' + (idx + 1)}</span>
          <button type="button" class="btn-remove-edit-photo" data-idx="${idx}" title="Eliminar foto ${idx + 1}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;
    });

    if (editingSpotPhotos.length < 7) {
      html += `
        <div class="edit-photo-add-slot" id="btn-add-edit-photo" role="button" tabindex="0" title="Agregar foto (${editingSpotPhotos.length + 1}/7)">
          <i class="fa-solid fa-plus"></i>
          <span>+ Foto ${editingSpotPhotos.length + 1}</span>
        </div>
      `;
    }

    strip.innerHTML = html;

    // Eliminar foto individual de la previsualización del modal
    strip.querySelectorAll('.btn-remove-edit-photo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pIdx = parseInt(btn.getAttribute('data-idx'), 10);
        if (editingSpotPhotos.length <= 1) {
          alert('Tu SPOT debe tener al menos una foto para ser visible en el catálogo de la Vitrina.');
          return;
        }
        editingSpotPhotos.splice(pIdx, 1);
        renderEditSpotPhotos();
        showToast('Foto removida. Presiona "Guardar Cambios" para confirmar.');
      });
    });

    // Abrir selector de archivo al pulsar slot vacío
    const addSlot = strip.querySelector('#btn-add-edit-photo');
    if (addSlot) {
      addSlot.addEventListener('click', () => {
        const fileInput = document.getElementById('edit-prod-file-input');
        if (fileInput) {
          fileInput.value = '';
          fileInput.click();
        }
      });
    }
  }

  // Listener del input de fotos del modal de edición
  const editFileInput = document.getElementById('edit-prod-file-input');
  if (editFileInput) {
    editFileInput.addEventListener('change', async () => {
      if (!editFileInput.files || editFileInput.files.length === 0) return;
      if (editingSpotPhotos.length >= 7) {
        alert('Este SPOT ya cuenta con las 7 fotos permitidas.');
        return;
      }
      const file = editFileInput.files[0];
      const fData = new FormData();
      fData.append('photo', file);

      showToast('Subiendo foto...');
      try {
        const res = await fetch('/api/upload-photo', {
          method: 'POST',
          body: fData
        });
        const data = await res.json();
        if (res.ok && data.photoUrl) {
          editingSpotPhotos.push(data.photoUrl);
          renderEditSpotPhotos();
          showToast('📸 Foto agregada. Presiona "Guardar Cambios" para confirmar.');
        } else {
          alert(data.error || 'No se pudo subir la foto seleccionada.');
        }
      } catch (err) {
        console.error('Error al subir foto:', err);
        alert('Error de conexión al subir la imagen.');
      } finally {
        editFileInput.value = '';
      }
    });
  }

  function openEditProductModal(vidId) {
    const video = state.videos.find(x => x.id === vidId) || (state.currentStoreVideos && state.currentStoreVideos.find(x => x.id === vidId));
    if (!video) return;

    const modal = document.getElementById('modal-edit-product');
    if (!modal) return;

    document.getElementById('edit-prod-id').value = video.id;
    document.getElementById('edit-prod-title').value = video.title || '';
    document.getElementById('edit-prod-price').value = (typeof video.price === 'number') ? video.price : '';
    document.getElementById('edit-prod-delivery').value = cleanDelivery(video.delivery) || 'Domicilio Gratis';
    document.getElementById('edit-prod-city').value = video.city || 'Bogotá';
    document.getElementById('edit-prod-category').value = video.category || 'Tecnología';
    const kwInput = document.getElementById('edit-prod-keywords');
    if (kwInput) kwInput.value = video.keywords || '';
    document.getElementById('edit-prod-desc').value = video.description || '';

    // Inicializar fotos en el gestor visual del modal
    const rawPhotos = (Array.isArray(video.photos) && video.photos.length > 0)
      ? [...video.photos]
      : ((Array.isArray(video.detailPhotos) && video.detailPhotos.length > 0)
        ? [...video.detailPhotos]
        : (video.thumbnailUrl ? [video.thumbnailUrl] : []));
    editingSpotPhotos = rawPhotos.filter(p => typeof p === 'string' && p.trim().length > 0);
    renderEditSpotPhotos();

    const spotBanner = document.getElementById('edit-prod-spot-banner');
    if (spotBanner) {
      spotBanner.style.display = video.hasSpot ? 'flex' : 'none';
    }

    modal.style.display = 'flex';
  }
  window.openEditProductModal = openEditProductModal;

  document.getElementById('btn-close-edit-product')?.addEventListener('click', () => {
    document.getElementById('modal-edit-product').style.display = 'none';
  });
  document.getElementById('btn-cancel-edit-product')?.addEventListener('click', () => {
    document.getElementById('modal-edit-product').style.display = 'none';
  });
  document.getElementById('modal-edit-product')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-edit-product') {
      document.getElementById('modal-edit-product').style.display = 'none';
    }
  });

  document.getElementById('form-edit-product')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const vidId = document.getElementById('edit-prod-id').value;
    const title = document.getElementById('edit-prod-title').value.trim();
    const price = document.getElementById('edit-prod-price').value;
    const delivery = document.getElementById('edit-prod-delivery').value.trim();
    const city = document.getElementById('edit-prod-city').value;
    const category = document.getElementById('edit-prod-category').value;
    const keywords = document.getElementById('edit-prod-keywords')?.value.trim() || '';
    const description = document.getElementById('edit-prod-desc').value.trim();

    if (!title) {
      alert('Por favor ingresa un título para el producto.');
      return;
    }

    if (editingSpotPhotos.length === 0) {
      alert('El SPOT debe tener al menos una foto principal.');
      return;
    }

    const saveBtn = document.getElementById('btn-save-edit-product');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando Cambios...';
    }

    try {
      const res = await fetch(`/api/videos/${vidId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': state.adminToken || ''
        },
        body: JSON.stringify({
          storeId: state.isAdmin ? 'admin' : (state.currentStore ? state.currentStore.id : 'admin'),
          title,
          price: price !== '' ? Number(price) : 0,
          delivery,
          city,
          category,
          keywords,
          description,
          photos: editingSpotPhotos,
          detailPhotos: editingSpotPhotos,
          thumbnailUrl: editingSpotPhotos[0] || ''
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: text || `Error ${res.status}` };
      }

      if (res.ok && data.success) {
        showToast('✅ SPOT y fotos actualizados con éxito');
        document.getElementById('modal-edit-product').style.display = 'none';
        await loadVideos();
        if (state.currentStore) {
          await openSellerPanel();
        } else if (state.isAdmin) {
          await openAdminPortal();
        }
      } else {
        alert(data.error || `No se pudo actualizar el producto (${res.status}).`);
      }
    } catch (err) {
      console.error('Error al editar producto:', err);
      alert('No se pudo guardar los cambios: ' + (err.message || 'Error de conexión. Inténtalo de nuevo.'));
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios';
      }
    }
  });

  // Portal Administrador
  document.getElementById('btn-open-admin-portal')?.addEventListener('click', openAdminPortal);
  document.getElementById('btn-admin-cancel')?.addEventListener('click', () => goToHomeScreen());
  document.getElementById('btn-admin-exit-feed')?.addEventListener('click', () => goToHomeScreen());

  document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email-input').value;
    const password = document.getElementById('admin-pass-input').value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        state.adminToken = data.token;
        localStorage.setItem('vitrina_admin_token', data.token);
        if (typeof updateNavStoreUI === 'function') updateNavStoreUI();
        openAdminPortal();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Credenciales de administrador inválidas.');
      }
    } catch (e) {
      console.error('Error al iniciar sesión de administrador:', e);
      alert('Error al iniciar sesión de administrador: ' + (e.message || e));
    }
  });

  document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
    state.adminToken = null;
    localStorage.removeItem('vitrina_admin_token');
    if (typeof updateNavStoreUI === 'function') updateNavStoreUI();
    openAdminPortal();
  });

  // Actualizar parámetros de cupos y publicidad AdMob en el panel de Administrador
  document.getElementById('admin-pricing-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const freeQuota = Number(document.getElementById('adm-quota-free-spots')?.value) || 100;
    const feedFreq = Math.max(2, Number(document.getElementById('adm-admob-feed-freq')?.value) || 4);
    const interstitialOnUpload = document.getElementById('adm-admob-interstitial-upload')?.value === 'true';

    try {
      // 1. Guardar cupo gratuito por comercio
      const pRes = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': state.adminToken
        },
        body: JSON.stringify({
          free_spots_quota: freeQuota
        })
      });

      // 2. Guardar parámetros de AdMob (Frecuencia e Intersticial)
      const adRes = await fetch('/api/admin/admob-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': state.adminToken
        },
        body: JSON.stringify({
          feedAdFrequency: feedFreq,
          interstitialOnUpload: interstitialOnUpload
        })
      });

      if (pRes.ok && adRes.ok) {
        const adData = await adRes.json();
        if (adData.admob) {
          state.admobConfig = Object.assign(state.admobConfig || {}, adData.admob);
        }
        updateAdminQuotaHelperUI(freeQuota);
        showToast('⚙️ ¡Cupos y parámetros publicitarios guardados exitosamente!');
      } else {
        alert('Error al guardar parámetros en el servidor.');
      }
    } catch (e) { alert('Error de conexión al guardar parámetros.'); }
  });

  // Actualización en tiempo real al escribir en el panel de Administrador
  document.getElementById('adm-quota-free-spots')?.addEventListener('input', (e) => {
    updateAdminQuotaHelperUI(e.target.value);
  });

  // Configuración oficial de Google AdMob desde el panel de Administrador
  document.getElementById('admin-admob-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const testMode = document.getElementById('adm-admob-test-mode')?.value === 'true';
    const publisherId = document.getElementById('adm-admob-pub-id')?.value.trim();
    const bannerUnitId = document.getElementById('adm-admob-banner-unit-id')?.value.trim();
    const interstitialUnitId = document.getElementById('adm-admob-interstitial-unit-id')?.value.trim();

    try {
      const res = await fetch('/api/admin/admob-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': state.adminToken
        },
        body: JSON.stringify({
          testMode,
          publisherId,
          bannerUnitId,
          rewardedUnitId,
          interstitialUnitId
        })
      });
      if (res.ok) {
        const data = await res.json();
        const badgeEl = document.getElementById('adm-admob-status-badge');
        if (badgeEl && data.admob) {
          state.admobConfig = Object.assign(state.admobConfig || {}, data.admob);
          if (data.admob.testMode === false) {
            badgeEl.textContent = '🟢 MODO PRODUCCIÓN EN VIVO (INGRESOS REALES)';
            badgeEl.style.background = 'rgba(0, 255, 136, 0.2)';
            badgeEl.style.color = '#00ff88';
            badgeEl.style.borderColor = 'rgba(0, 255, 136, 0.5)';
          } else {
            badgeEl.textContent = '🧪 MODO PRUEBAS OFICIAL (TEST ADS)';
            badgeEl.style.background = 'rgba(0, 210, 255, 0.15)';
            badgeEl.style.color = '#00d2ff';
            badgeEl.style.borderColor = 'rgba(0, 210, 255, 0.4)';
          }
        }
        showToast('📡 ¡Credenciales de Google AdMob vinculadas exitosamente!');
      } else {
        alert('Error al guardar credenciales de AdMob.');
      }
    } catch (err) {
      alert('Error de conexión al guardar credenciales de AdMob.');
    }
  });



  // Botón Reclamar Publicaciones Gratis de Bienvenida en la barra superior
  document.getElementById('btn-claim-welcome-pack')?.addEventListener('click', () => {
    const navUpload = document.getElementById('btn-nav-upload');
    if (navUpload) navUpload.click();
  });

  // Botón Limpiar Datos y Purgar a Modo Virgen (0 perfiles, 0 anuncios, suscriptores reales)
  document.getElementById('btn-admin-clean-demo')?.addEventListener('click', async () => {
    const ok = confirm('⚠️ ¿Deseas purgar toda la plataforma y dejarla con CERO perfiles y CERO anuncios?\n\n• La base de datos quedará 100% virgen para recibir nuevos suscriptores reales.\n• Tu acceso como Super Administrador se conservará intacto.');
    if (!ok) return;

    try {
      const res = await fetch('/api/admin/clean-to-virgin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': state.adminToken
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Base de datos restablecida a modo virgen exitosamente.');
        await loadStores();
        await loadVideos();
        openAdminPortal();
      } else {
        alert(data.error || 'Error limpiando base de datos.');
      }
    } catch (err) {
      alert('Error de conexión con el servidor al purgar base de datos.');
    }
  });

  // Disparadores y Formulario SSO Spot Play (1 clic)
  document.getElementById('btn-close-sso-modal')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-sso-activate-store');
    if (modal) modal.style.display = 'none';
  });

  document.getElementById('modal-sso-activate-store')?.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'modal-sso-activate-store') {
      e.target.style.display = 'none';
    }
  });

  const ssoForm = document.getElementById('form-sso-activate-store');
  ssoForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const spotPlayUid = document.getElementById('sso-user-uid')?.value;
    const name = document.getElementById('sso-store-name')?.value.trim();
    const whatsapp = document.getElementById('sso-store-whatsapp')?.value.trim();
    const city = document.getElementById('sso-store-city')?.value || 'Bogotá';
    const avatar = document.getElementById('sso-user-avatar')?.value || '';
    const email = document.getElementById('sso-user-email')?.value || '';

    if (!whatsapp) {
      showToast('⚠️ Ingresa tu número de WhatsApp para recibir pedidos directos.', 'error');
      document.getElementById('sso-store-whatsapp')?.focus();
      return;
    }

    const submitBtn = ssoForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Activando Vitrina...';
      submitBtn.disabled = true;
    }

    try {
      const res = await fetch('/api/auth/sso-spotplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotPlayUid, name, whatsapp, city, avatar, email })
      });
      const data = await res.json();
      if (res.ok && data.store) {
        state.currentStore = data.store;
        localStorage.setItem('vitrina_current_store_id', data.store.id);
        updateNavStoreUI();
        const modal = document.getElementById('modal-sso-activate-store');
        if (modal) modal.style.display = 'none';
        showToast(`🎉 ¡Tu Vitrina Comercial "${data.store.name}" está activa y vinculada con Spot Play!`);
        window.history.replaceState({}, document.title, window.location.pathname);
        loadStores().catch(console.error);
        openSellerPanel();
      } else {
        showToast(data.error || 'No se pudo activar la vitrina.', 'error');
      }
    } catch (err) {
      showToast('Error de conexión al activar vitrina comercial.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> Activar Mi Vitrina Comercial';
        submitBtn.disabled = false;
      }
    }
  });

  // Botón de retorno a Spot Play desde la barra superior de la Vitrina
  document.getElementById('btn-nav-goto-spotplay')?.addEventListener('click', (e) => {
    if (typeof window.handleGoToSpotPlay === 'function') {
      window.handleGoToSpotPlay(e);
    }
  });

  // Botón de salto rápido al Panel Maestro de Spot Play desde la bóveda de VitrinaSpot
  document.getElementById('btn-admin-goto-spotplay')?.addEventListener('click', () => {
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'SPOTPLAY_OPEN_ADMIN' }, '*');
        return;
      } catch (e) {}
    }
    let spotOrigin = (new URLSearchParams(window.location.search)).get('spotplay_origin') || localStorage.getItem('spotplay_origin_url');
    if (!spotOrigin) {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      spotOrigin = isLocal ? 'http://localhost:5173' : 'https://changelog-heat-consultant-renewal.trycloudflare.com';
    }
    window.open(spotOrigin + '/#admin', '_blank');
  });
}

// ==========================================
// 10. ACCIONES INTERACTIVAS (LIKES, SAVE, COMMENTS)
// ==========================================
async function triggerLike() {
  const video = state.videos[state.currentIndex];
  if (!video) return;
  toggleCardLike(video.id);
}

function triggerSave() {
  const video = state.videos[state.currentIndex];
  if (!video) return;
  toggleCardSave(video.id);
}

// Lógica de Compartir con compatibilidad total (HTTPS y HTTP)
function executeShareVideo(video) {
  if (!video) return;
  const shareUrl = getPublicShareUrl(`?v=${video.id}`);
  const shareText = `¡Hola! Me interesa este producto, ¿sigue disponible?\n\n${shareUrl}`;

  if (navigator.share) {
    navigator.share({
      title: `${video.title} | Vitrina`,
      text: shareText
    }).then(() => {
      showToast('🚀 ¡Enlace listo para compartir!');
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        fallbackShare(shareUrl, shareText);
      }
    });
  } else {
    fallbackShare(shareUrl, shareText);
  }
}

function fallbackShare(url, text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('📋 ¡Enlace copiado al portapapeles!');
    }).catch(() => {
      legacyClipboardCopy(url);
    });
  } else {
    legacyClipboardCopy(url);
  }

  // Abrir WhatsApp con la ficha completa del producto
  setTimeout(() => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  }, 300);
}

function legacyClipboardCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast('📋 ¡Enlace copiado al portapapeles!');
  } catch (e) {
    showToast('Listo para compartir');
  }
  document.body.removeChild(ta);
}

// ==========================================
// RECOMENDAR / COMPARTIR VITRINASPOT GENERAL
// ==========================================
function openShareAppModal() {
  const shareUrl = getPublicShareUrl();
  const freeQuota = Number(state.pricing?.free_spots_quota) || 5;
  const shareTitle = `Vitrina - ${freeQuota} SPOTS Gratis para Comercios`;
  const shareMsg = `🛍️ ¡Hola! Te recomiendo *Vitrina Colombia* (Tu catálogo digital, pedidos al chat directo).\n\n` +
    `🎁 Para comercios y emprendedores están regalando *${freeQuota} SPOTS 100% GRATIS* y permanentes para exhibir tus productos con fotos y videos.\n\n` +
    `Es una plataforma genial para descubrir tiendas reales y hacer pedidos directo por WhatsApp sin intermediarios ni comisiones:\n\n` +
    `👉 ${shareUrl}`;

  // Si el dispositivo cuenta con menú nativo de compartir (móviles Android / iPhone)
  if (navigator.share) {
    navigator.share({
      title: shareTitle,
      text: shareMsg,
      url: shareUrl
    }).then(() => {
      showToast('🚀 ¡Gracias por recomendar la Vitrina!');
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        showShareAppDialog(shareUrl, shareMsg);
      }
    });
  } else {
    showShareAppDialog(shareUrl, shareMsg);
  }
}
window.openShareAppModal = openShareAppModal;

function showShareAppDialog(shareUrl, shareMsg) {
  const modal = document.getElementById('modal-share-app');
  if (!modal) return;

  const urlInput = document.getElementById('share-app-url-input');
  if (urlInput) urlInput.value = shareUrl;

  const waBtn = document.getElementById('btn-share-app-wa');
  if (waBtn) {
    waBtn.onclick = () => {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`, '_blank');
    };
  }

  const copyAction = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('📋 ¡Enlace de la Vitrina copiado al portapapeles!');
      }).catch(() => {
        legacyClipboardCopy(shareUrl);
      });
    } else {
      legacyClipboardCopy(shareUrl);
    }
  };

  const copyBtn = document.getElementById('btn-share-app-copy');
  if (copyBtn) copyBtn.onclick = copyAction;

  const copyInputBtn = document.getElementById('btn-copy-share-app-input');
  if (copyInputBtn) copyInputBtn.onclick = copyAction;

  const fbBtn = document.getElementById('btn-share-app-fb');
  if (fbBtn) {
    fbBtn.onclick = () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    };
  }

  const tgBtn = document.getElementById('btn-share-app-tg');
  if (tgBtn) {
    tgBtn.onclick = () => {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMsg)}`, '_blank');
    };
  }

  modal.style.display = 'flex';
}
window.showShareAppDialog = showShareAppDialog;

let activeCommentsVideoId = null;
let commentsRefreshInterval = null;

function closeCommentsSheet() {
  const modal = document.getElementById('modal-comments-sheet');
  if (modal) {
    modal.classList.remove('active');
    modal.style.setProperty('display', 'none', 'important');
  }
  activeCommentsVideoId = null;
  if (commentsRefreshInterval) {
    clearInterval(commentsRefreshInterval);
    commentsRefreshInterval = null;
  }
}

function updateSpotCommentsBadges(videoId, count) {
  const formatted = formatNumber(count || 0);
  const vId = String(videoId).trim();
  document.querySelectorAll(`.comments-count-${vId}`).forEach(el => {
    el.textContent = formatted;
  });
  document.querySelectorAll(`[id^="comments-count-${vId}"]`).forEach(el => {
    el.textContent = formatted;
  });
  const reelCommentCount = document.getElementById('reel-comment-count');
  if (reelCommentCount) reelCommentCount.textContent = formatted;
}
window.updateSpotCommentsBadges = updateSpotCommentsBadges;

function renderCommentsInSheet(comments) {
  const container = document.getElementById('sheet-comments-container');
  if (!container) return;
  if (!comments || comments.length === 0) {
    container.innerHTML = '<p class="text-muted" style="font-size:0.9rem; text-align: center; margin: 28px 0;"><i class="fa-regular fa-comments" style="font-size:1.8rem; display:block; margin-bottom:8px; opacity:0.5;"></i>Sé el primero en dejar una pregunta al vendedor.</p>';
  } else {
    container.innerHTML = comments.map(c => `
      <div class="sheet-comment-item">
        <img class="sheet-comment-avatar" src="${c.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}" alt="${escapeHtml(c.author)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';" loading="lazy">
        <div class="sheet-comment-content">
          <div class="sheet-comment-author-row">
            <span class="sheet-comment-author">${escapeHtml(c.author)}</span>
            ${c.isStoreOwner ? '<span class="badge-owner">Vendedor</span>' : (c.isVerifiedBuyer || (c.author && c.author !== 'Comprador Anónimo' && c.author !== 'Usuario VitrinaSpot') ? '<span class="badge-verified-buyer"><i class="fa-solid fa-circle-check"></i> Verificado</span>' : '')}
            <span class="sheet-comment-time">${formatRelativeTime(c.createdAt)}</span>
          </div>
          <p class="sheet-comment-body">${escapeHtml(c.text)}</p>
        </div>
      </div>
    `).join('');
  }
}

function openCommentsSheet(videoOrId, e) {
  if (e) e.stopPropagation();
  let video = videoOrId;
  if (typeof videoOrId === 'string') {
    video = state.videos.find(v => String(v.id).trim().toLowerCase() === String(videoOrId).trim().toLowerCase());
  }
  if (!video) return;
  activeCommentsVideoId = video.id;

  const modal = document.getElementById('modal-comments-sheet');
  const myAvatarImg = document.getElementById('sheet-current-user-avatar');
  const commentInput = document.getElementById('sheet-comment-input');
  
  if (modal) {
    modal.classList.add('active');
    modal.style.setProperty('display', 'flex', 'important');
  }

  if (commentInput) {
    commentInput.disabled = false;
    commentInput.readOnly = false;
  }

  // Mostrar la foto real del usuario activo en la barra de escribir comentario
  if (state.currentStore && state.currentStore.avatar) {
    if (myAvatarImg) {
      myAvatarImg.src = state.currentStore.avatar;
      myAvatarImg.style.display = 'inline-block';
      myAvatarImg.title = `Comentando como ${state.currentStore.name}`;
    }
    if (commentInput) {
      commentInput.placeholder = `Escribe tu pregunta como ${state.currentStore.name}...`;
    }
  } else {
    if (myAvatarImg) myAvatarImg.style.display = 'none';
    if (commentInput) commentInput.placeholder = 'Pregúntale al vendedor sobre este producto...';
  }

  // 1. Render inmediato de comentarios en memoria
  renderCommentsInSheet(video.comments || []);

  // 2. Sincronización en segundo plano con el servidor (PostgreSQL)
  fetch(`/api/videos/${encodeURIComponent(video.id)}/comments`)
    .then(r => r.ok ? r.json() : null)
    .then(freshComments => {
      if (freshComments && Array.isArray(freshComments) && activeCommentsVideoId === video.id) {
        video.comments = freshComments;
        video.commentsCount = freshComments.length;
        renderCommentsInSheet(freshComments);
        updateSpotCommentsBadges(video.id, freshComments.length);
        renderDesktopComments(freshComments);
      }
    }).catch(() => {});
}

async function submitComment(text) {
  if (!text || text.trim() === '') return;
  const targetId = activeCommentsVideoId || (state.videos[state.currentIndex] ? state.videos[state.currentIndex].id : null);
  if (!targetId) return;
  const video = state.videos.find(v => String(v.id).trim().toLowerCase() === String(targetId).trim().toLowerCase()) || state.videos[state.currentIndex];
  if (!video) return;

  // Foto y nombre real del usuario autenticado en VitrinaSpot
  const isLogged = !!state.currentStore;
  const author = isLogged ? state.currentStore.name : 'Usuario VitrinaSpot';
  const avatar = (isLogged && state.currentStore.avatar)
    ? state.currentStore.avatar
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
  const isOwner = isLogged && state.currentStore.id === video.storeId;

  try {
    const res = await fetch(`/api/videos/${encodeURIComponent(video.id)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), author, avatar, isStoreOwner: isOwner, isVerifiedBuyer: isLogged })
    });

    if (res.ok) {
      const newComment = await res.json();
      if (!Array.isArray(video.comments)) video.comments = [];
      video.comments.unshift(newComment);
      video.commentsCount = video.comments.length;
      
      // Actualizar contadores y badges en tiempo real en todas las tarjetas activas
      updateSpotCommentsBadges(video.id, video.comments.length);
      renderCommentsInSheet(video.comments);
      renderDesktopComments(video.comments);

      // Limpiar campos de texto
      const input = document.getElementById('sheet-comment-input');
      if (input) input.value = '';
      const deskInput = document.getElementById('desk-comment-input');
      if (deskInput) deskInput.value = '';

      // Auto-scroll suave hacia el comentario publicado (arriba del listado)
      const container = document.getElementById('sheet-comments-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Si el usuario es dueño de una tienda, actualizar campanita
      if (state.currentStore) {
        loadSellerNotifications().catch(() => {});
      }

      showToast('🎉 ¡Pregunta enviada al vendedor!');
    } else {
      const errData = await res.json().catch(() => ({}));
      showToast(errData.error || 'Error al publicar comentario', 'error');
    }
  } catch (err) {
    console.error('Error al enviar comentario:', err);
    showToast('Error de red al publicar comentario', 'error');
  }
}

// Corazón animado al hacer doble clic
function createFloatingHeart(x, y) {
  const heart = document.createElement('i');
  heart.className = 'fa-solid fa-heart';
  heart.style.position = 'fixed';
  heart.style.left = `${x - 25}px`;
  heart.style.top = `${y - 25}px`;
  heart.style.fontSize = '3.5rem';
  heart.style.color = '#ff2d55';
  heart.style.zIndex = '9999';
  heart.style.pointerEvents = 'none';
  heart.style.animation = 'floatHeart 0.75s ease-out forwards';
  document.body.appendChild(heart);

  setTimeout(() => heart.remove(), 750);
}

// Estilos de animación del corazón en JS
const heartStyle = document.createElement('style');
heartStyle.innerHTML = `
  @keyframes floatHeart {
    0% { transform: scale(0.5); opacity: 1; }
    50% { transform: scale(1.4) translateY(-30px); opacity: 0.9; }
    100% { transform: scale(1.8) translateY(-60px); opacity: 0; }
  }
`;
document.head.appendChild(heartStyle);

// ==========================================
// 🎁 SISTEMA ORIGINAL DE REGALOS VIRTUALES (SPOT PLAY)
// ==========================================
const VIRTUAL_GIFTS = [
  { id: 'gift-rose', name: 'Rosa Roja', coins: 1, emoji: '🌹', description: 'Un detalle cariñoso para el creador' },
  { id: 'gift-coffee', name: 'Café Energético', coins: 5, emoji: '☕', description: 'Para que siga creando videos geniales' },
  { id: 'gift-fire', name: 'Fuego Viral', coins: 20, emoji: '🔥', description: '¡Este video merece ser viral!' },
  { id: 'gift-crown', name: 'Corona Dorada', coins: 100, emoji: '👑', description: 'Regalo VIP para creadores top' },
  { id: 'gift-lion', name: 'León de Oro', coins: 500, emoji: '🦁', description: '¡El mayor honor de SpotPlay!' }
];

const COIN_PACKS = [
  { id: 'pack-1', coins: 70, priceCOP: 4900, bonus: '0%' },
  { id: 'pack-2', coins: 350, priceCOP: 22900, bonus: '+10% extra', popular: true },
  { id: 'pack-3', coins: 1400, priceCOP: 89900, bonus: '+25% extra' }
];

let activeGiftsVideoId = null;
let selectedGiftId = 'gift-rose';

function getUserSpotCoins() {
  const saved = localStorage.getItem('spotplay_coins');
  if (saved === null || isNaN(parseInt(saved, 10))) {
    localStorage.setItem('spotplay_coins', '100');
    return 100;
  }
  const coins = parseInt(saved, 10);
  return coins < 0 ? 0 : coins;
}

function setUserSpotCoins(coins) {
  const validCoins = Math.max(0, parseInt(coins, 10) || 0);
  localStorage.setItem('spotplay_coins', validCoins.toString());
  const displays = document.querySelectorAll('.user-spotcoins-val');
  displays.forEach(el => el.textContent = validCoins.toLocaleString('es-CO'));
  const headerDisplay = document.getElementById('gifts-user-coins-display');
  if (headerDisplay) headerDisplay.textContent = validCoins.toLocaleString('es-CO');
}

function openGiftsDrawerById(videoId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const targetId = videoId || (state.videos && state.videos[state.currentIndex] ? state.videos[state.currentIndex].id : null);
  const video = state.videos.find(v => v.id === targetId) || (state.videos && state.videos[state.currentIndex]);
  if (!video) return;
  activeGiftsVideoId = video.id;
  selectedGiftId = 'gift-rose';

  const modal = document.getElementById('modal-gifts-sheet');
  const title = document.getElementById('gifts-header-title');
  const coinsDisplay = document.getElementById('gifts-user-coins-display');
  const mainView = document.getElementById('gifts-main-view');
  const rechargeView = document.getElementById('gifts-recharge-view');

  if (title) {
    title.textContent = `Enviar regalo a @${video.storeName || 'creador'}`;
  }
  if (coinsDisplay) {
    coinsDisplay.textContent = getUserSpotCoins().toLocaleString('es-CO');
  }

  if (mainView) mainView.style.display = 'flex';
  if (rechargeView) rechargeView.style.display = 'none';

  renderGiftsGrid();
  updateSelectedGiftSummary();

  if (modal) {
    modal.classList.add('active');
    modal.style.setProperty('display', 'flex', 'important');
  }
}
window.openGiftsDrawerById = openGiftsDrawerById;

function closeGiftsDrawer() {
  const modal = document.getElementById('modal-gifts-sheet');
  if (modal) {
    modal.classList.remove('active');
    modal.style.setProperty('display', 'none', 'important');
  }
  activeGiftsVideoId = null;
}
window.closeGiftsDrawer = closeGiftsDrawer;

function renderGiftsGrid() {
  const container = document.getElementById('gifts-grid-container');
  if (!container) return;

  container.innerHTML = VIRTUAL_GIFTS.map(gift => {
    const isSelected = gift.id === selectedGiftId;
    return `
      <div class="gift-card-item ${isSelected ? 'selected' : ''}" onclick="selectGift('${gift.id}')">
        <span class="gift-emoji">${gift.emoji}</span>
        <span class="gift-name">${gift.name}</span>
        <span class="gift-cost"><i class="fa-solid fa-coins text-gold"></i> ${gift.coins}</span>
      </div>
    `;
  }).join('');
}
window.renderGiftsGrid = renderGiftsGrid;

function selectGift(giftId) {
  selectedGiftId = giftId;
  if ('vibrate' in navigator) {
    try { navigator.vibrate(20); } catch (_) {}
  }
  renderGiftsGrid();
  updateSelectedGiftSummary();
}
window.selectGift = selectGift;

function updateSelectedGiftSummary() {
  const gift = VIRTUAL_GIFTS.find(g => g.id === selectedGiftId) || VIRTUAL_GIFTS[0];
  const nameEl = document.getElementById('gifts-selected-name');
  const coinsEl = document.getElementById('gifts-selected-coins');
  if (nameEl) nameEl.textContent = gift.name;
  if (coinsEl) coinsEl.textContent = `${gift.coins} ${gift.coins === 1 ? 'Moneda' : 'Monedas'}`;
}

function showRechargeView() {
  const mainView = document.getElementById('gifts-main-view');
  const rechargeView = document.getElementById('gifts-recharge-view');
  const list = document.getElementById('recharge-packs-list');

  if (mainView) mainView.style.display = 'none';
  if (rechargeView) rechargeView.style.display = 'block';

  if (list) {
    list.innerHTML = `
      <!-- Bono de Monedas Inmediato 100% Gratis para probar el sistema -->
      <div class="recharge-free-bonus-card" onclick="rechargeCoins(100, event)">
        <div class="pack-info-left">
          <div class="pack-coins-icon bonus-gold-glow"><i class="fa-solid fa-gift"></i></div>
          <div>
            <div class="pack-coins-qty">🎁 +100 SpotCoins GRATIS</div>
            <div class="pack-bonus-tag" style="color: var(--spot-gold);">Bono Inmediato de Bienvenida</div>
          </div>
        </div>
        <button type="button" class="btn-pack-buy btn-bonus-claim" onclick="rechargeCoins(100, event)">
          ¡Reclamar $0!
        </button>
      </div>
    ` + COIN_PACKS.map(pack => `
      <div class="recharge-pack-card ${pack.popular ? 'popular' : ''}" onclick="rechargeCoins(${pack.coins}, event)">
        <div class="pack-info-left">
          <div class="pack-coins-icon"><i class="fa-solid fa-coins text-gold"></i></div>
          <div>
            <div class="pack-coins-qty">${pack.coins} SpotCoins</div>
            <div class="pack-bonus-tag">${pack.bonus}</div>
          </div>
        </div>
        <button type="button" class="btn-pack-buy" onclick="rechargeCoins(${pack.coins}, event)">
          $${pack.priceCOP.toLocaleString('es-CO')} COP
        </button>
      </div>
    `).join('');
  }
}
window.showRechargeView = showRechargeView;

function hideRechargeView() {
  const mainView = document.getElementById('gifts-main-view');
  const rechargeView = document.getElementById('gifts-recharge-view');
  if (mainView) mainView.style.display = 'flex';
  if (rechargeView) rechargeView.style.display = 'none';
}
window.hideRechargeView = hideRechargeView;

function rechargeCoins(coinsToAdd, e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const current = getUserSpotCoins();
  const next = current + coinsToAdd;
  setUserSpotCoins(next);
  if ('vibrate' in navigator) {
    try { navigator.vibrate([30, 50, 80]); } catch (_) {}
  }
  showToast(`🎉 ¡Recarga exitosa! Se añadieron +${coinsToAdd} SpotCoins a tu saldo.`);
  hideRechargeView();
  updateSelectedGiftSummary();
}
window.rechargeCoins = rechargeCoins;

function submitSendGift() {
  const targetVideoId = activeGiftsVideoId || (state.videos && state.videos[state.currentIndex] ? state.videos[state.currentIndex].id : null);
  const video = state.videos.find(v => v.id === targetVideoId) || (state.videos && state.videos[state.currentIndex]);
  if (!video) {
    showToast('Selecciona un video para enviar el regalo.', 'warning');
    return;
  }

  const gift = VIRTUAL_GIFTS.find(g => g.id === selectedGiftId) || VIRTUAL_GIFTS[0];
  const userCoins = getUserSpotCoins();

  if (userCoins < gift.coins) {
    showToast(`Saldo insuficiente (${userCoins} monedas). Reclama monedas gratis para enviar ${gift.name}`, 'warning');
    showRechargeView();
    return;
  }

  // Descontar monedas
  setUserSpotCoins(userCoins - gift.coins);

  // Aumentar contador de regalos del video
  video.giftsCount = (video.giftsCount || 140) + 1;
  video.hasUserGifted = true;

  // Actualizar DOM en la tarjeta actual
  const cardGiftBtn = document.querySelector(`#card-${video.id} .btn-card-gift`) || document.querySelector('.reel-player-card.active .btn-card-gift');
  if (cardGiftBtn) {
    cardGiftBtn.classList.add('gifted');
    const countEl = cardGiftBtn.querySelector('.gift-count');
    if (countEl) countEl.textContent = formatNumber(video.giftsCount);
  }

  // Notificar al backend de forma asíncrona
  fetch(`/api/videos/${video.id}/gift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ giftId: gift.id, coins: gift.coins, giftName: gift.name })
  }).catch(() => {});

  // Cerrar Drawer
  closeGiftsDrawer();

  // Animación espectacular de regalo flotante sobre el video
  spawnFloatingGift(gift.emoji, gift.name);

  // Vibración háptica
  if ('vibrate' in navigator) {
    try { navigator.vibrate([40, 60, 100]); } catch (_) {}
  }

  // Toast de confirmación
  showToast(`🎁 ¡Has enviado ${gift.emoji} ${gift.name} a @${video.storeName || 'creador'}! (-${gift.coins} SpotCoins)`);
}
window.submitSendGift = submitSendGift;

function spawnFloatingGift(emoji, giftName) {
  const container = document.createElement('div');
  container.className = 'floating-gift-bubble';
  container.innerHTML = `
    <span class="floating-gift-emoji">${emoji}</span>
    <span class="floating-gift-label">${giftName}</span>
  `;
  document.body.appendChild(container);

  setTimeout(() => {
    container.remove();
  }, 1900);
}
window.spawnFloatingGift = spawnFloatingGift;

// ==========================================
// 11. UTILIDADES Y GESTIÓN DE VISTAS
// ==========================================
function showView(viewId) {
  // Cerrar siempre el menú flotante de usuario al cambiar de vista
  document.getElementById('user-dropdown-menu')?.classList.remove('show');

  if (viewId === 'spotplay-view') {
    showView('feed-view');
    return;
  }
  document.querySelectorAll('.view-panel').forEach(v => {
    v.classList.remove('active');
    v.style.display = 'none';
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    target.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (viewId === 'feed-view') {
      requestAnimationFrame(adjustFeedContainerHeight);
      setTimeout(adjustFeedContainerHeight, 80);
    }
  }

  const isAdminView = (viewId === 'admin-panel-view');
  const isFeedView = (viewId === 'feed-view');

  // Si sale del feed vertical, desarmar cualquier estado colapsado para que la vista tenga altura limpia
  if (!isFeedView) {
    document.body.classList.remove('vitrina-header-collapsed');
  }

  if (isAdminView) {
    document.body.classList.add('admin-active-view');
    const adminPanel = document.getElementById('admin-panel-view');
    if (adminPanel) adminPanel.scrollTop = 0;
  } else {
    document.body.classList.remove('admin-active-view');
  }

  if (target) {
    target.scrollTop = 0;
  }

  // Mostrar el botón alternador de vista solo cuando está en el feed
  const viewToggleBtn = document.getElementById('btn-feed-view-toggle');
  if (viewToggleBtn) {
    viewToggleBtn.style.display = isFeedView ? 'inline-flex' : 'none';
  }

  // Mostrar u ocultar barra selectora de modo principal (Vitrina vs Spot Play)
  const modeSwitcherBar = document.getElementById('main-mode-switcher-bar');
  if (modeSwitcherBar) {
    modeSwitcherBar.style.display = isFeedView ? 'flex' : 'none';
  }

  // Ocultar barra de acciones (ciudad, buscador, publicar spot, perfil) en el Panel de Control Maestro para máxima limpieza
  const standardNavActions = document.getElementById('standard-nav-actions');
  if (standardNavActions) {
    standardNavActions.style.display = isAdminView ? 'none' : 'flex';
  }

  // Las historias y categorías pertenecen exclusivamente al feed público.
  // En Mi Negocio, Catálogo, Guardados y Admin se ocultan para dar 100% de pantalla completa limpia
  const storiesSection = document.getElementById('stories-section');
  const categoriesNav = document.querySelector('.categories-nav');
  if (storiesSection) {
    storiesSection.style.display = isFeedView ? '' : 'none';
  }
  if (categoriesNav) {
    categoriesNav.style.display = isFeedView ? '' : 'none';
  }

  // Ocultar botón flotante FAB fuera del feed público
  const floatingFab = document.getElementById('btn-floating-fab-upload');
  const floatingMyStore = document.getElementById('btn-floating-my-store');
  if (floatingFab) {
    floatingFab.style.display = isFeedView ? '' : 'none';
  }
  if (floatingMyStore) {
    floatingMyStore.style.display = isFeedView ? '' : 'none';
  }

  // Pausar video si sale del feed
  const player = document.getElementById('reel-video');
  if (viewId !== 'feed-view') {
    player?.pause();
  } else {
    player?.play().catch(() => {});
  }
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

function formatTimeAgo(isoDate) {
  if (!isoDate) return 'hace un momento';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  if (diffHrs > 0) return `hace ${diffHrs} hora${diffHrs > 1 ? 's' : ''}`;
  if (diffMin > 0) return `hace ${diffMin} min`;
  return 'hace unos segundos';
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('app-toast');
  const icon = document.getElementById('toast-icon');
  const text = document.getElementById('toast-msg');
  if (!toast || !text) return;

  text.textContent = msg;
  if (icon) {
    if (type === 'error') {
      icon.className = 'fa-solid fa-circle-exclamation text-red';
    } else if (type === 'warning') {
      icon.className = 'fa-solid fa-triangle-exclamation text-gold';
    } else {
      icon.className = 'fa-solid fa-circle-check toast-bubble-icon';
    }
  }
  toast.style.display = 'flex';

  setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function cleanDelivery(str) {
  if (!str) return '';
  return str.replace(/^[🛵🚚🏍️\?\[\]\s\uD800-\uDBFF\uDC00-\uDFFF\uFFFD]+/, '').trim();
}

// ==========================================
// VISOR DE FOTOS DE DETALLE EN PANTALLA COMPLETA (LIGHTBOX)
// ==========================================
function openPhotoViewer(mainPhotoUrl, title, photoList = []) {
  const modal = document.getElementById('modal-photo-viewer');
  const mainImg = document.getElementById('photo-viewer-main-img');
  const titleEl = document.getElementById('photo-viewer-title');
  const thumbsRow = document.getElementById('photo-viewer-thumbs');

  if (!modal || !mainImg) return;

  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid fa-camera text-spot"></i> ${escapeHtml(title || 'Fotos de Detalle')}`;
  }

  mainImg.src = mainPhotoUrl;

  const list = Array.isArray(photoList) && photoList.length > 0 ? photoList : [mainPhotoUrl];
  if (thumbsRow) {
    if (list.length > 1) {
      thumbsRow.style.display = 'flex';
      thumbsRow.innerHTML = list.map(p => `
        <img src="${p}" class="lightbox-thumb ${p === mainPhotoUrl ? 'active' : ''}" alt="Miniatura">
      `).join('');

      thumbsRow.querySelectorAll('.lightbox-thumb').forEach((thumb, idx) => {
        thumb.addEventListener('click', () => {
          thumbsRow.querySelectorAll('.lightbox-thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          mainImg.src = list[idx];
        });
      });
    } else {
      thumbsRow.style.display = 'none';
      thumbsRow.innerHTML = '';
    }
  }

  modal.style.display = 'flex';
}

// Cerrar visor de fotos
document.getElementById('btn-close-photo-viewer')?.addEventListener('click', () => {
  const modal = document.getElementById('modal-photo-viewer');
  if (modal) modal.style.display = 'none';
});

document.getElementById('modal-photo-viewer')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-photo-viewer') {
    e.target.style.display = 'none';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-photo-viewer');
    if (modal && modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
    const sheetModal = document.getElementById('modal-catalog-product-detail');
    if (sheetModal && sheetModal.style.display === 'flex') {
      sheetModal.style.display = 'none';
    }
  }
});

// MODAL: FICHA DE PRODUCTO EN TIENDA (IN-STORE PRODUCT SHEET)
document.getElementById('btn-close-product-sheet')?.addEventListener('click', closeCatalogProductSheet);
document.getElementById('btn-sheet-back-catalog')?.addEventListener('click', closeCatalogProductSheet);
document.getElementById('btn-sheet-prev-photo')?.addEventListener('click', (e) => {
  e.stopPropagation();
  prevSheetPhoto();
});
document.getElementById('btn-sheet-next-photo')?.addEventListener('click', (e) => {
  e.stopPropagation();
  nextSheetPhoto();
});
document.getElementById('modal-catalog-product-detail')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-catalog-product-detail') {
    closeCatalogProductSheet();
  }
});

// Soporte gestos táctiles horizontales en el carrusel de la ficha de producto
const sheetCarousel = document.getElementById('sheet-carousel-viewport');
if (sheetCarousel) {
  let sStartX = 0;
  let sStartY = 0;
  sheetCarousel.addEventListener('touchstart', (e) => {
    sStartX = e.touches[0].clientX;
    sStartY = e.touches[0].clientY;
  }, { passive: true });
  sheetCarousel.addEventListener('touchend', (e) => {
    const sEndX = e.changedTouches[0].clientX;
    const sEndY = e.changedTouches[0].clientY;
    const diffX = sStartX - sEndX;
    const diffY = sStartY - sEndY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) >= 30) {
      if (diffX > 0) nextSheetPhoto();
      else prevSheetPhoto();
    }
  }, { passive: true });
}

// ==========================================
// 8. PWA INSTALADOR MÓVIL AUTOMÁTICO (ANDROID / iOS)
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration fallback:', err);
    });
  });
}

let deferredPwaPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;

  const dismissed = localStorage.getItem('pwa_banner_dismissed');
  const banner = document.getElementById('pwa-install-banner');
  if (banner && !dismissed) {
    banner.style.display = 'flex';
  }
});

document.getElementById('btn-pwa-install')?.addEventListener('click', async () => {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.style.display = 'none';

  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    const { outcome } = await deferredPwaPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('🎉 ¡Vitrina instalada con éxito en tu celular!');
    }
    deferredPwaPrompt = null;
  }
});

document.getElementById('btn-pwa-dismiss')?.addEventListener('click', () => {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.style.display = 'none';
  localStorage.setItem('pwa_banner_dismissed', 'true');
});

window.addEventListener('appinstalled', () => {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.style.display = 'none';
  showToast('🚀 ¡Vitrina ya está en tu pantalla de inicio!');
});

// =========================================================
// 12. SISTEMA DE PROTECCIÓN Y MODERACIÓN COMUNITARIA (NIVELES 1, 2, 3)
// =========================================================

// NIVEL 1: MODAL DE REPORTE COMUNITARIO
window.openReportModal = function(videoId, title) {
  const modal = document.getElementById('modal-report-video');
  if (!modal) return;
  const idInput = document.getElementById('report-video-id');
  const titleEl = document.getElementById('report-video-title');
  const detailsEl = document.getElementById('report-details');

  if (idInput) idInput.value = videoId;
  if (titleEl) titleEl.textContent = title || 'Anuncio Seleccionado';
  if (detailsEl) detailsEl.value = '';

  const defaultRadio = modal.querySelector('input[name="reportReason"][value="adult"]');
  if (defaultRadio) defaultRadio.checked = true;

  modal.style.display = 'flex';
};

window.closeReportModal = function() {
  const modal = document.getElementById('modal-report-video');
  if (modal) modal.style.display = 'none';
};

document.getElementById('btn-close-report-modal')?.addEventListener('click', closeReportModal);
document.getElementById('btn-cancel-report')?.addEventListener('click', closeReportModal);

const formReport = document.getElementById('form-report-video');
if (formReport) {
  formReport.addEventListener('submit', async (e) => {
    e.preventDefault();
    const videoId = document.getElementById('report-video-id').value;
    const reasonInput = formReport.querySelector('input[name="reportReason"]:checked');
    const reason = reasonInput ? reasonInput.value : 'other';
    const details = document.getElementById('report-details').value.trim();

    try {
      const res = await fetch(`/api/videos/${videoId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details })
      });
      const data = await res.json();
      if (res.ok) {
        closeReportModal();
        showToast(data.message || '🚨 Reporte recibido. Gracias por cuidar nuestra comunidad.');

        // Marcar este anuncio como reportado por el usuario (solo entonces se pone roja la bandera)
        state.reportedVideoIds.add(videoId);
        localStorage.setItem('vitrina_reported_spots', JSON.stringify(Array.from(state.reportedVideoIds)));

        const reportBtns = document.querySelectorAll(`.side-action-btn.btn-card-report[onclick*="${videoId}"]`);
        reportBtns.forEach(btn => {
          btn.classList.add('reported');
          const txt = btn.querySelector('.action-count');
          if (txt) txt.textContent = 'Reportado';
          btn.setAttribute('title', 'Ya has reportado este anuncio');
        });

        if (data.quarantined) {
          state.videos = state.videos.filter(v => v.id !== videoId);
          renderVideosFeed();
        }
      } else {
        alert(data.error || 'Error enviando el reporte.');
      }
    } catch (err) {
      console.error('Error al enviar reporte:', err);
      alert('Error de conexión.');
    }
  });
}

// POLÍTICAS DE SEGURIDAD Y LAS 4 REGLAS DE ORO
window.openLegalTermsModal = function() {
  const modal = document.getElementById('modal-legal-terms');
  if (modal) modal.style.display = 'flex';
};

window.closeLegalTermsModal = function() {
  const modal = document.getElementById('modal-legal-terms');
  if (modal) modal.style.display = 'none';
};

document.getElementById('btn-open-legal-terms-logged')?.addEventListener('click', () => {
    document.getElementById('user-dropdown-menu')?.classList.remove('show');
    openLegalTermsModal();
  });
document.getElementById('btn-guest-legal-terms')?.addEventListener('click', openLegalTermsModal);
document.getElementById('link-upload-legal')?.addEventListener('click', openLegalTermsModal);
document.getElementById('btn-close-legal-modal')?.addEventListener('click', closeLegalTermsModal);
document.getElementById('btn-accept-legal-terms')?.addEventListener('click', closeLegalTermsModal);

// MODAL PARA REEMPLAZAR FOTOS RECHAZADAS GRATIS (SEGUNDA OPORTUNIDAD $0 COP)
window.openFixRejectedModal = function(videoId, title) {
  const modal = document.getElementById('modal-fix-rejected-spot');
  if (!modal) return;
  const idInput = document.getElementById('fix-video-id');
  if (idInput) idInput.value = videoId;
  modal.style.display = 'flex';
};

window.closeFixRejectedModal = function() {
  const modal = document.getElementById('modal-fix-rejected-spot');
  if (modal) modal.style.display = 'none';
};

document.getElementById('btn-close-fix-modal')?.addEventListener('click', closeFixRejectedModal);
document.getElementById('btn-cancel-fix-modal')?.addEventListener('click', closeFixRejectedModal);

const formFix = document.getElementById('form-fix-rejected-spot');
if (formFix) {
  formFix.addEventListener('submit', async (e) => {
    e.preventDefault();
    const videoId = document.getElementById('fix-video-id').value;
    const coverFile = document.getElementById('fix-cover-photo').files[0];
    if (!coverFile) {
      alert('Por favor selecciona una nueva foto de portada.');
      return;
    }
    const currentStore = state.currentStore;
    if (!currentStore || !currentStore.id) {
      alert('Debes iniciar sesión con tu comercio para corregir este spot.');
      return;
    }

    const btnSubmit = document.getElementById('btn-submit-fix-spot');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo fotos...';
    }

    try {
      const formData = new FormData();
      formData.append('storeId', currentStore.id);
      formData.append('coverPhoto', coverFile);
      for (let i = 2; i <= 7; i++) {
        const inp = document.getElementById(`fix-photo-${i}`);
        if (inp && inp.files[0]) {
          formData.append(`photo${i}`, inp.files[0]);
        }
      }

      const res = await fetch(`/api/videos/${videoId}/fix-rejected`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        closeFixRejectedModal();
        showToast('🎉 ¡Fotos actualizadas! Tu SPOT ha sido reactivado sin costo.');
        if (typeof loadSellerVideos === 'function') loadSellerVideos();
        loadVideos();
      } else {
        alert(data.error || 'Error al actualizar fotos.');
      }
    } catch (err) {
      console.error('Error al actualizar fotos:', err);
      alert('Error de conexión.');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fa-solid fa-check"></i> Reactivar Spot Gratis';
      }
    }
  });
}

// CONTROL Y TABS DE MODERACIÓN RÁPIDA EN PANEL MAESTRO
const updateModTabsUI = () => {
  const tabs = [
    { id: 'tab-mod-reported', key: 'reported', color: '#ff6b6b', bg: 'rgba(239,68,68,0.25)', border: 'rgba(239,68,68,0.5)' },
    { id: 'tab-mod-all', key: 'all', color: 'var(--spot-gold)', bg: 'rgba(255,184,0,0.2)', border: 'rgba(255,184,0,0.4)' },
    { id: 'tab-mod-stores', key: 'stores', color: '#00d2ff', bg: 'rgba(0,210,255,0.2)', border: 'rgba(0,210,255,0.4)' }
  ];

  tabs.forEach(t => {
    const el = document.getElementById(t.id);
    if (!el) return;
    if (state.adminModTab === t.key) {
      el.style.background = t.bg;
      el.style.color = t.color;
      el.style.border = `1px solid ${t.border}`;
    } else {
      el.style.background = 'rgba(255,255,255,0.06)';
      el.style.color = 'var(--text-muted)';
      el.style.border = '1px solid rgba(255,255,255,0.12)';
    }
  });
};

document.getElementById('tab-mod-reported')?.addEventListener('click', () => {
  state.adminModTab = 'reported';
  updateModTabsUI();
  loadAdminModeration();
});

document.getElementById('tab-mod-all')?.addEventListener('click', () => {
  state.adminModTab = 'all';
  updateModTabsUI();
  loadAdminModeration();
});

document.getElementById('tab-mod-stores')?.addEventListener('click', () => {
  state.adminModTab = 'stores';
  updateModTabsUI();
  loadAdminModeration();
});

document.getElementById('adm-mod-search')?.addEventListener('input', (e) => {
  state.adminModSearch = e.target.value;
  loadAdminModeration();
});

// BOTÓN ACTUALIZAR REVISIONES EN ADMIN
document.getElementById('btn-refresh-moderation')?.addEventListener('click', () => {
  loadAdminModeration();
});

// =========================================================
// 13. GESTIÓN Y ELIMINACIÓN SEGURA DE CUENTA (HABEAS DATA)
// =========================================================
window.openDeleteAccountModal = function() {
  if (!state.currentStore) {
    showToast('⚠️ No tienes una sesión activa de tienda.', 'error');
    return;
  }
  const modal = document.getElementById('modal-delete-account');
  const passInput = document.getElementById('delete-account-password');
  const icon = document.getElementById('icon-toggle-delete-pass');
  const eyeBtn = document.getElementById('btn-toggle-delete-pass');

  if (passInput) {
    passInput.value = '';
    passInput.type = 'password';
  }
  if (icon) {
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
  if (eyeBtn) {
    eyeBtn.style.color = 'var(--text-muted, #94a3b8)';
  }

  if (window.setupPasswordEye) {
    window.setupPasswordEye('btn-toggle-delete-pass', 'delete-account-password', 'icon-toggle-delete-pass');
  }

  if (modal) modal.style.display = 'flex';
};

window.closeDeleteAccountModal = function() {
  const modal = document.getElementById('modal-delete-account');
  if (modal) modal.style.display = 'none';
};

document.getElementById('btn-open-delete-account-modal')?.addEventListener('click', openDeleteAccountModal);
document.getElementById('btn-close-delete-account')?.addEventListener('click', closeDeleteAccountModal);
document.getElementById('btn-cancel-delete-account')?.addEventListener('click', closeDeleteAccountModal);

// Toggle ojito para el modal de eliminación de cuenta
if (window.setupPasswordEye) {
  window.setupPasswordEye('btn-toggle-delete-pass', 'delete-account-password', 'icon-toggle-delete-pass');
}

const formDeleteAccount = document.getElementById('form-delete-account');
if (formDeleteAccount) {
  formDeleteAccount.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentStore) return;

    const pass = document.getElementById('delete-account-password')?.value;
    if (!pass || pass.trim().length === 0) {
      showToast('⚠️ Debes ingresar tu contraseña actual para confirmar.', 'error');
      document.getElementById('delete-account-password')?.focus();
      return;
    }

    const confirmBtn = document.getElementById('btn-confirm-delete-account');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Eliminando cuenta...';
    }

    try {
      const res = await fetch(`/api/stores/${state.currentStore.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      });
      const data = await res.json();

      if (res.ok) {
        closeDeleteAccountModal();
        const deletedStoreName = state.currentStore.name;
        
        // Limpiar sesión local
        state.currentStore = null;
        localStorage.removeItem('vitrina_current_store_id');
        updateNavStoreUI();

        // Ocultar panel de vendedor y volver a vitrina principal
        const sellerPanel = document.getElementById('seller-panel-view');
        if (sellerPanel) sellerPanel.style.display = 'none';
        const feedSection = document.getElementById('feed-section');
        if (feedSection) feedSection.style.display = 'block';

        showToast(`🗑️ Tu tienda "${deletedStoreName}" y todos sus spots han sido eliminados de la Vitrina.`);
        
        // Recargar datos públicos
        await loadStores();
        await loadVideos();
      } else {
        alert(data.error || 'No se pudo eliminar la cuenta.');
      }
    } catch (err) {
      console.error('Error al eliminar cuenta:', err);
      alert('Error de conexión al intentar eliminar la cuenta.');
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Confirmar y Eliminar';
      }
    }
  });
}

// =========================================================
// MOTOR UNIFICADO DE NAVEGACIÓN Y EXPERIENCIA SPOT PLAY (VIDEOS)
// =========================================================

function switchAppMode(mode) {
  state.currentAppMode = mode;
  const btnVitrina = document.getElementById('btn-mode-vitrina');
  const btnSpotPlay = document.getElementById('btn-mode-spotplay');
  const spotPlayTopBar = document.getElementById('spotplay-top-bar');

  if (mode === 'spotplay') {
    // 1. Activar pantalla completa inmersiva (oculta navbar, historias y categorías)
    document.body.classList.remove('vitrina-header-collapsed');
    document.body.classList.add('spotplay-active');
    if (spotPlayTopBar) spotPlayTopBar.style.display = 'flex';
    if (btnVitrina) btnVitrina.classList.remove('active');
    if (btnSpotPlay) btnSpotPlay.classList.add('active');
  } else {
    // 2. Modo Vitrina: restaurar cabecera, barra de historias y categorías de fotos
    document.body.classList.remove('vitrina-header-collapsed');
    document.body.classList.remove('spotplay-active');
    if (spotPlayTopBar) spotPlayTopBar.style.display = 'none';
    if (btnSpotPlay) btnSpotPlay.classList.remove('active');
    if (btnVitrina) btnVitrina.classList.add('active');
    pauseAllSpotPlayVideos();
  }

  // Re-renderizar el feed maestro conservando todas las funciones
  renderContinuousFeed();

  // Si estamos en Spot Play, arrancar el video activo inmediatamente
  if (mode === 'spotplay') {
    setTimeout(() => {
      const activeCard = document.querySelector('.reel-player-card.active') || document.querySelector('.reel-player-card:not(.welcome-hook-card)');
      const activeVid = activeCard ? activeCard.querySelector('video.reel-hero-video') : document.querySelector('video.reel-hero-video');
      if (activeVid) {
        if (!activeVid.src && activeVid.dataset.src) activeVid.src = activeVid.dataset.src;
        activeVid.play().catch(() => {});
      }
    }, 120);
  }

  if (typeof adjustFeedContainerHeight === 'function') {
    requestAnimationFrame(adjustFeedContainerHeight);
  }
}
window.switchAppMode = switchAppMode;

function pauseAllSpotPlayVideos() {
  document.querySelectorAll('video.reel-hero-video').forEach(v => {
    try { v.pause(); } catch (_) {}
  });
}
window.pauseAllSpotPlayVideos = pauseAllSpotPlayVideos;

function toggleFeedVideoPlayPause(videoId, videoEl, e) {
  if (e) e.stopPropagation();
  if (!videoEl) videoEl = document.getElementById(`video-${videoId}`);
  if (!videoEl) return;
  const indicator = document.getElementById(`indicator-${videoId}`);

  if (videoEl.paused) {
    videoEl.play().then(() => {
      if (indicator) {
        indicator.innerHTML = '<i class="fa-solid fa-play"></i>';
        indicator.classList.remove('visible');
      }
    }).catch(() => {});
  } else {
    videoEl.pause();
    if (indicator) {
      indicator.innerHTML = '<i class="fa-solid fa-pause"></i>';
      indicator.classList.add('visible');
    }
  }
}
window.toggleFeedVideoPlayPause = toggleFeedVideoPlayPause;

function toggleFeedSound(videoId, e) {
  if (e) e.stopPropagation();
  state.spotPlayMuted = !state.spotPlayMuted;
  document.querySelectorAll('video.reel-hero-video').forEach(v => {
    v.muted = state.spotPlayMuted;
  });
  document.querySelectorAll('.btn-spotplay-feed-sound i').forEach(icon => {
    icon.className = `fa-solid ${state.spotPlayMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`;
  });
  showToast(state.spotPlayMuted ? '🔇 Audio silenciado' : '🔊 Audio activado');
}
window.toggleFeedSound = toggleFeedSound;

// Compatibilidad con llamadas previas
window.renderSpotPlayFeed = function() {
  renderContinuousFeed();
};
window.toggleSpotPlayAudio = function(e) {
  toggleFeedSound(null, e);
};
window.toggleSpotPlayPlayPause = function(videoId, videoEl, e) {
  toggleFeedVideoPlayPause(videoId, videoEl, e);
};

// =========================================================
// GESTIÓN DEL MODAL DE SUBIDA SPOT PLAY (1 VIDEO GRATIS)
// =========================================================
function setSpotPlayUploadType(type) {
  const hiddenInput = document.getElementById('spotplay-video-type');
  const btnEnt = document.getElementById('btn-type-entertainment');
  const btnProd = document.getElementById('btn-type-product');
  const commercialRow = document.getElementById('spotplay-commercial-row');
  const titleLabel = document.getElementById('spotplay-title-label');
  const titleInput = document.getElementById('spotplay-title');

  if (hiddenInput) hiddenInput.value = type;

  if (type === 'entertainment') {
    if (btnEnt) btnEnt.classList.add('active');
    if (btnProd) btnProd.classList.remove('active');
    if (commercialRow) commercialRow.style.display = 'none';
    if (titleLabel) titleLabel.innerHTML = '<i class="fa-solid fa-tag text-gold"></i> Título o Descripción del Video *';
    if (titleInput) titleInput.placeholder = 'Ej: Mi nuevo baile viral / Humor colombiano / Tips express';
  } else {
    if (btnEnt) btnEnt.classList.remove('active');
    if (btnProd) btnProd.classList.add('active');
    if (commercialRow) commercialRow.style.display = 'flex';
    if (titleLabel) titleLabel.innerHTML = '<i class="fa-solid fa-tag text-gold"></i> Título del Producto o Servicio *';
    if (titleInput) titleInput.placeholder = 'Ej: Arepas Rellenas / Zapatillas Air Jordan';
  }
}
window.setSpotPlayUploadType = setSpotPlayUploadType;

function setupSpotPlayUploadModal() {
  const modal = document.getElementById('modal-spotplay-upload');
  const btnOpen = document.getElementById('btn-open-spotplay-upload');
  const btnEmptyOpen = document.getElementById('btn-empty-spotplay-upload');
  const btnClose = document.getElementById('btn-close-spotplay-upload');
  const btnCancel = document.getElementById('btn-cancel-spotplay-upload');
  const form = document.getElementById('spotplay-upload-form');
  const dropzone = document.getElementById('spotplay-dropzone');
  const fileInput = document.getElementById('spotplay-video-input');
  const promptBox = document.getElementById('spotplay-dropzone-prompt');
  const previewBox = document.getElementById('spotplay-dropzone-preview');
  const previewPlayer = document.getElementById('spotplay-preview-player');
  const filenameText = document.getElementById('spotplay-video-filename');
  const btnChangeVideo = document.getElementById('btn-change-spotplay-video');

  const openModal = () => {
    if (modal) modal.style.display = 'flex';
    // Si hay tienda activa, pre-llenar sus datos
    if (state.currentStore) {
      const waInput = document.getElementById('spotplay-whatsapp');
      const citySelect = document.getElementById('spotplay-city');
      if (waInput && state.currentStore.whatsapp) {
        let clean = state.currentStore.whatsapp.replace(/[^0-9]/g, '');
        if (clean.startsWith('57') && clean.length === 12) clean = clean.slice(2);
        waInput.value = clean;
      }
      if (citySelect && state.currentStore.city) {
        citySelect.value = state.currentStore.city;
      }
    }
  };

  const closeModal = () => {
    if (modal) modal.style.display = 'none';
    if (previewPlayer) {
      previewPlayer.pause();
      previewPlayer.src = '';
    }
  };

  btnOpen?.addEventListener('click', openModal);
  btnEmptyOpen?.addEventListener('click', openModal);
  btnClose?.addEventListener('click', closeModal);
  btnCancel?.addEventListener('click', closeModal);

  // Selector de archivo de video
  dropzone?.addEventListener('click', (e) => {
    if (e.target.closest('#btn-change-spotplay-video') || e.target.closest('video')) return;
    fileInput?.click();
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    // Validación de tamaño (máx 60MB)
    if (file.size > 60 * 1024 * 1024) {
      showToast('⚠️ El video no debe superar 60MB. Elige un archivo más corto o comprimido.');
      fileInput.value = '';
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    if (previewPlayer) {
      previewPlayer.src = videoUrl;
      previewPlayer.play().catch(() => {});
    }
    if (filenameText) {
      filenameText.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
    }
    if (promptBox) promptBox.style.display = 'none';
    if (previewBox) previewBox.style.display = 'flex';
  });

  btnChangeVideo?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (fileInput) fileInput.value = '';
    if (previewPlayer) {
      previewPlayer.pause();
      previewPlayer.src = '';
    }
    if (previewBox) previewBox.style.display = 'none';
    if (promptBox) promptBox.style.display = 'flex';
  });

  // Envío del formulario de subida
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const videoFile = fileInput?.files && fileInput.files[0];
    const titleInput = document.getElementById('spotplay-title');
    const priceInput = document.getElementById('spotplay-price');
    const cityInput = document.getElementById('spotplay-city');
    const catInput = document.getElementById('spotplay-category');
    const delInput = document.getElementById('spotplay-delivery');
    const waInput = document.getElementById('spotplay-whatsapp');
    const submitBtn = document.getElementById('btn-submit-spotplay-upload');
    const submitText = document.getElementById('btn-spotplay-submit-text');

    if (!videoFile) {
      triggerFieldShake(dropzone, '⚠️ Debes seleccionar un video vertical para Spot Play.');
      return;
    }

    if (!titleInput || !titleInput.value.trim()) {
      triggerFieldShake(titleInput, '⚠️ Escribe un título atractivo para tu video.');
      return;
    }

    if (!waInput || !waInput.value.trim()) {
      triggerFieldShake(waInput, '⚠️ Ingresa el WhatsApp donde recibirás pedidos.');
      return;
    }

    // Preparar FormData
    const videoTypeInput = document.getElementById('spotplay-video-type');
    const videoType = videoTypeInput ? videoTypeInput.value : 'entertainment';
    const isProduct = videoType === 'product';

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', titleInput.value.trim());
    formData.append('videoType', videoType);
    formData.append('price', (isProduct && priceInput) ? (priceInput.value.trim() || '0') : '0');
    formData.append('city', cityInput ? cityInput.value : 'Toda Colombia');
    formData.append('category', catInput ? catInput.value : '🎭 Humor & Comedia');
    formData.append('delivery', isProduct && delInput ? delInput.value : '');
    formData.append('whatsapp', waInput.value.trim());
    if (state.currentStore) {
      formData.append('storeId', state.currentStore.id);
      formData.append('storeName', state.currentStore.name);
    }

    // Estado cargando
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo video...';

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        closeModal();
        form.reset();
        setSpotPlayUploadType('entertainment');
        if (fileInput) fileInput.value = '';
        if (previewBox) previewBox.style.display = 'none';
        if (promptBox) promptBox.style.display = 'flex';

        showToast('🎉 ¡Tu video se publicó con éxito en Spot Play!');

        // Recargar videos y activar la vista Spot Play
        await loadVideos();
        switchAppMode('spotplay');

        // Scroll al inicio del feed de videos
        const scrollBox = document.getElementById('spotplay-scroll-container');
        if (scrollBox) scrollBox.scrollTo({ top: 0, behavior: 'smooth' });

      } else {
        triggerFieldShake(submitBtn, data.error || 'No se pudo subir el video.');
      }
    } catch (err) {
      console.error('Error al subir video a Spot Play:', err);
      showToast('⚠️ Error de conexión al subir el video. Intenta nuevamente.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Publicar Video Gratis en Spot Play';
    }
  });
}

// Inicializar listeners del selector de modo superior
function setupModeSwitcherListeners() {
  const btnVitrina = document.getElementById('btn-mode-vitrina');
  const btnSpotPlay = document.getElementById('btn-mode-spotplay');
  const btnBackVitrina = document.getElementById('btn-back-to-vitrina');

  btnVitrina?.addEventListener('click', () => switchAppMode('vitrina'));
  btnSpotPlay?.addEventListener('click', () => switchAppMode('spotplay'));
  btnBackVitrina?.addEventListener('click', () => switchAppMode('vitrina'));
}

// Compatibilidad segura: funciones auxiliares
window.switchAppMode = function(m) {};
window.pauseAllSpotPlayVideos = function() {};
window.toggleFeedSound = function() {};
window.openGiftsDrawerById = function() {};
window.closeGiftsDrawer = function() {};
window.renderSpotPlayFeed = function() {};



  // Simulación interactiva de impacto publicitario AdMob (Play Store Simulator)
  document.getElementById('btn-simulate-admob')?.addEventListener('click', async () => {
    if (!state.adminToken) return;
    try {
      const res = await fetch('/api/admin/admob-simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': state.adminToken
        },
        body: JSON.stringify({ type: 'feed' })
      });
      const data = await res.json();
      if (data.ok && data.admobStats) {
        showToast('🧪 ¡Simulación exitosa! Se sumó 1 impacto publicitario en vivo a tu cuenta AdMob.');
        loadAdminMetrics();
      }
    } catch (err) {
      console.error('Error al simular impacto publicitario:', err);
    }
  });
