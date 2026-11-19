import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

// Tiendas y negocios semilla de alta calidad en Colombia
const DEFAULT_STORES = [
  {
    id: "store-1",
    name: "Calzados Bucaramanga",
    whatsapp: "+573124567890",
    city: "Bucaramanga",
    avatar: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80",
    rating: 4.9,
    ratingCount: 84,
    verified: true,
    description: "Fabricantes directos de calzado 100% cuero en Bucaramanga. Envíos nacionales y pago contraentrega en las principales ciudades.",
    address: "Carrera 15 # 34-20, Centro",
    hours: "Lun - Sáb: 8:30 AM - 7:00 PM",
    paymentMethods: ["Nequi", "Daviplata", "Contraentrega", "Bancolombia", "Efectivo"],
    password: "123",
    hasSpot: true,
    spotExpiresAt: new Date(Date.now() + 86400000 * 6).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: "store-2",
    name: "Burger Master Artesanal",
    whatsapp: "+573019876543",
    city: "Medellín",
    avatar: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80",
    rating: 5.0,
    ratingCount: 142,
    verified: true,
    description: "Hamburguesas al carbón con carnes maduradas y pan brioche artesanal. Domicilios rápidos en Medellín y el Valle de Aburrá.",
    address: "Circular 4ta # 72-15, Laureles",
    hours: "Todos los días: 12:00 PM - 11:00 PM",
    paymentMethods: ["Nequi", "Daviplata", "Contraentrega", "Efectivo"],
    password: "123",
    hasSpot: true,
    spotExpiresAt: new Date(Date.now() + 86400000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    id: "store-3",
    name: "TechStore Colombia",
    whatsapp: "+573152345678",
    city: "Bogotá",
    avatar: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80",
    rating: 4.8,
    ratingCount: 67,
    verified: true,
    description: "Tecnología, Smartwatches de alta gama, auriculares con cancelación de ruido y accesorios para celular con garantía de 1 año.",
    address: "Cra 13 # 64-18, Chapinero",
    hours: "Lun - Sáb: 9:00 AM - 6:30 PM",
    paymentMethods: ["Nequi", "Daviplata", "PSE", "Tarjetas", "Efectivo"],
    password: "123",
    hasSpot: false,
    spotExpiresAt: null,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: "store-4",
    name: "Motos & Taller Cali Pro",
    whatsapp: "+573208765432",
    city: "Cali",
    avatar: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&auto=format&fit=crop&q=80",
    rating: 4.9,
    ratingCount: 39,
    verified: true,
    description: "Mantenimiento preventivo, sincronización electrónica y repuestos originales para motos de bajo y alto cilindraje en Cali.",
    address: "Autopista Suroriental # 45-10",
    hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
    paymentMethods: ["Nequi", "Daviplata", "Bancolombia", "Efectivo"],
    password: "123",
    hasSpot: false,
    spotExpiresAt: null,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
  }
];

// Videos iniciales con muestras comerciales verticales
const DEFAULT_VIDEOS = [
  {
    id: "vid-1",
    storeId: "store-1",
    storeName: "Calzados Bucaramanga",
    storeAvatar: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80",
    storeVerified: true,
    hasSpot: true,
    spotExpiresAt: new Date(Date.now() + 86400000 * 6).toISOString(),
    title: "Zapatos Clásicos en Cuero Genuino Oxford",
    description: "Hechos a mano en Bucaramanga. Suela ergonómica antideslizante, plantilla de confort y costura reforzada. Tallas 37 al 43. Pide por WhatsApp y paga al recibir en tu casa.",
    category: "Moda / Calzado",
    city: "Bucaramanga",
    price: 139900,
    priceFormatted: "$139.900 COP",
    promoBadge: "¡EN OFERTA!",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    duration: 15,
    durationLabel: "0:15",
    views: 3420,
    likes: 485,
    whatsappClicks: 124,
    savedCount: 92,
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    comments: [
      {
        id: "c-1",
        author: "Felipe Morales",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
        text: "¿Tienen disponible en color marrón oscuro en talla 40?",
        isStoreOwner: false,
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
      },
      {
        id: "c-2",
        author: "Calzados Bucaramanga",
        avatar: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80",
        text: "¡Hola Felipe! Sí, tenemos marrón oscuro y miel listos para despacho. Escríbenos al botón de WhatsApp y te apartamos tu par con envío gratis.",
        isStoreOwner: true,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
      }
    ]
  },
  {
    id: "vid-2",
    storeId: "store-2",
    storeName: "Burger Master Artesanal",
    storeAvatar: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80",
    storeVerified: true,
    hasSpot: true,
    spotExpiresAt: new Date(Date.now() + 86400000 * 4).toISOString(),
    title: "Combo Doble Carne Angustifolia Ahumada con Queso Cheddar Fundido",
    description: "250g de carne 100% res asada a la leña, doble queso cheddar fundido, tocineta crocante caramelizada y papas rústicas de la casa. ¡El mejor sabor de Medellín directo a tu puerta!",
    category: "Comida / Restaurantes",
    city: "Medellín",
    price: 34900,
    priceFormatted: "$34.900 COP",
    promoBadge: "ENVÍO GRATIS",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    duration: 15,
    durationLabel: "0:15",
    views: 6890,
    likes: 812,
    whatsappClicks: 215,
    savedCount: 160,
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    comments: [
      {
        id: "c-3",
        author: "Andrea Gómez",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
        text: "¡Ayer la pedí por WhatsApp y llegó caliente y deliciosa en 25 minutos! Súper recomendados.",
        isStoreOwner: false,
        createdAt: new Date(Date.now() - 3600000 * 14).toISOString()
      }
    ]
  },
  {
    id: "vid-3",
    storeId: "store-3",
    storeName: "TechStore Colombia",
    storeAvatar: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80",
    storeVerified: true,
    hasSpot: false,
    spotExpiresAt: null,
    title: "Auriculares Pro Wireless con Cancelación Activa de Ruido 40dB",
    description: "Batería de 30 horas continuas, sonido Hi-Res Bass, resistentes al sudor y micrófono ultranítido para llamadas y trabajo. Compatibles con iPhone y Android.",
    category: "Tecnología",
    city: "Bogotá",
    price: 189000,
    priceFormatted: "$189.000 COP",
    promoBadge: "ÚLTIMAS UNIDADES",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    duration: 30,
    durationLabel: "0:30",
    views: 2950,
    likes: 310,
    whatsappClicks: 89,
    savedCount: 75,
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    comments: []
  },
  {
    id: "vid-4",
    storeId: "store-4",
    storeName: "Motos & Taller Cali Pro",
    storeAvatar: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&auto=format&fit=crop&q=80",
    storeVerified: true,
    hasSpot: false,
    spotExpiresAt: null,
    title: "Sincronización Electrónica y Mantenimiento Integral de Motos",
    description: "Lavado ultrasonido de inyectores, calibración de válvulas, escáner computarizado multimarca y revisión de frenos. Agenda tu turno por WhatsApp sin filas.",
    category: "Servicios / Talleres",
    city: "Cali",
    price: 0,
    priceFormatted: "Cotización Gratis / A convenir",
    promoBadge: null,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80",
    duration: 15,
    durationLabel: "0:15",
    views: 1820,
    likes: 195,
    whatsappClicks: 64,
    savedCount: 42,
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    comments: []
  }
];

// Transacciones iniciales para el módulo financiero del administrador
const DEFAULT_TRANSACTIONS = [
  {
    id: "tx-1",
    storeId: "store-1",
    storeName: "Calzados Bucaramanga",
    type: "spot_7d",
    typeLabel: "SPOT Destacado 7 Días",
    amount: 25000,
    method: "wompi_nequi",
    status: "approved",
    date: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: "tx-2",
    storeId: "store-2",
    storeName: "Burger Master Artesanal",
    type: "spot_7d",
    typeLabel: "SPOT Destacado 7 Días",
    amount: 25000,
    method: "wompi_pse",
    status: "approved",
    date: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "tx-3",
    storeId: "store-3",
    storeName: "TechStore Colombia",
    type: "video_30s",
    typeLabel: "Video Extendido 30s",
    amount: 10000,
    method: "manual_nequi",
    status: "approved",
    date: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

class Database {
  constructor() {
    this.pgPool = null;
    this._isSavingToPg = false;
    this._hasPendingPgSave = false;
    this.init();
  }

  async initAsync() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.log('ℹ️ [DB Engine] DATABASE_URL no detectada. Operando en almacenamiento local.');
      return;
    }

    try {
      console.log('🔌 [DB Engine] Conectando a PostgreSQL Cloud...');
      const pgModule = await import('pg');
      const Pool = pgModule.default?.Pool || pgModule.Pool;
      this.pgPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });

      // 1. Probar conexión y crear tabla de persistencia permanente
      const client = await this.pgPool.connect();
      console.log('✅ [DB Engine] Conectado exitosamente a PostgreSQL Cloud.');

      await client.query(`
        CREATE TABLE IF NOT EXISTS vitrina_app_state (
          id VARCHAR(64) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Consultar si ya existe el estado guardado
      const res = await client.query(`SELECT data FROM vitrina_app_state WHERE id = 'main_state' LIMIT 1;`);
      client.release();

      if (res.rows.length > 0 && res.rows[0].data) {
        const cloudData = res.rows[0].data;
        this.data = {
          ...this.data,
          ...cloudData,
          config: {
            ...(this.data?.config || {}),
            ...(cloudData?.config || {})
          }
        };
        console.log(`📦 [DB Engine] Datos restaurados desde PostgreSQL Cloud:`);
        console.log(`   - Tiendas registradas: ${this.data.stores?.length || 0}`);
        console.log(`   - Anuncios/Videos activos: ${this.data.videos?.length || 0}`);
        console.log(`   - Transacciones: ${this.data.transactions?.length || 0}`);
        
        // Mantener copia local en sincronía
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
        } catch (e) {}
      } else {
        console.log('🌱 [DB Engine] No hay datos previos en PostgreSQL. Inicializando registro maestro...');
        await this.syncToPostgresAsync();
      }
    } catch (err) {
      console.error('⚠️ [DB Engine] Error inicializando conexión a PostgreSQL:', err.message);
      console.log('   Continuando con estado local...');
    }
  }

  async syncToPostgresAsync() {
    if (!this.pgPool) return;
    if (this._isSavingToPg) {
      this._hasPendingPgSave = true;
      return;
    }
    this._isSavingToPg = true;
    try {
      const payload = JSON.stringify(this.data);
      const query = `
        INSERT INTO vitrina_app_state (id, data, updated_at)
        VALUES ('main_state', $1::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE 
        SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;
      `;
      await this.pgPool.query(query, [payload]);
    } catch (err) {
      console.error('❌ Error guardando en PostgreSQL:', err.message);
    } finally {
      this._isSavingToPg = false;
      if (this._hasPendingPgSave) {
        this._hasPendingPgSave = false;
        setImmediate(() => this.syncToPostgresAsync());
      }
    }
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.data = {
        stores: [],
        videos: [],
        transactions: [],
        notifications: [],
        config: {
          pricing: {
            free_spots_quota: 100,
            spot_permanent_price: 0,
            boost_standard_standalone_price: 0,
            photos_5_price: 0,
            boost_standard_price: 0,
            boost_standard_days: 3,
            boost_platino_price: 0,
            boost_platino_days: 5,
            boost_diamante_price: 0,
            boost_diamante_days: 7,
            boost_extreme_price: 0,
            boost_extreme_days: 7,
            membership_pro_price: 0,
            membership_pro_days: 30,
            currency: "COP",
            membership_product_limit: 100
          },
          admin: {
            email: "admin@vitrinaspot.com",
            password: "admin123vitrina",
            token: "vitrina_super_secret_token_2026"
          },
          wompi: {
            publicKey: "pub_test_xK9sampleKeyColombia2026",
            eventSecret: "test_secret_eventKeyWompi2026",
            isLive: false,
            nequiManualNumber: "3001234567",
            daviplataManualNumber: "3001234567"
          },
          telemetry: {
            totalWhatsAppClicks: 492,
            totalViews: 15080
          },
          reports: []
        }
      };
      this.save();
    } else {
      try {
        this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (err) {
        console.error("Error leyendo database.json, inicializando valores por defecto:", err);
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Advertencia escribiendo a database.json:', err.message);
    }
    if (this.pgPool) {
      this.syncToPostgresAsync().catch(e => {
        console.error('Sync error:', e.message);
      });
    }
  }

  // --- 2.0 AUTOMATIZACIÓN DE IMPULSOS Y MEMBRESÍAS PRO ---
  cleanExpiredSpotsAndMemberships() {
    const now = new Date().toISOString();
    let hasChanged = false;

    if (!Array.isArray(this.data.notifications)) {
      this.data.notifications = [];
    }

    // 1. Limpieza y degradación de Spots / Videos vencidos con notificación
    if (Array.isArray(this.data.videos)) {
      this.data.videos.forEach(v => {
        if (v.spotExpiresAt && v.spotExpiresAt < now) {
          v.hasSpot = false;
          v.spotExpiresAt = null;
          v.boostLevel = 'none';
          hasChanged = true;

          // Notificación automática en el panel del comerciante para fomentar la recompra inmediata
          const titleShort = v.title ? (v.title.length > 25 ? v.title.substring(0, 25) + '...' : v.title) : 'Producto';
          this.data.notifications.unshift({
            id: `notif-exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            storeId: v.storeId,
            text: `🚀 Tu impulso comercial en "${titleShort}" ha finalizado. ¡Vuelve a impulsarlo para seguir multiplicando tus ventas en WhatsApp!`,
            date: now,
            read: false
          });
        }
      });
    }

    // 2. Limpieza de Membresías Pro vencidas
    if (Array.isArray(this.data.stores)) {
      this.data.stores.forEach(store => {
        if (store.membershipExpiresAt && store.membershipExpiresAt < now) {
          store.hasMembership = false;
          store.isMembershipActive = false;
          hasChanged = true;

          this.data.notifications.unshift({
            id: `notif-mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            storeId: store.id,
            text: `⭐ Tu membresía comercial ha finalizado. Renuévala para conservar tu cupo de spots y Tienda Verificada.`,
            date: now,
            read: false
          });
        }

        // 3. Recalcular estado de la tienda según el máximo entre sus videos activos
        const storeActiveBoostedVideos = (this.data.videos || []).filter(v => 
          v.storeId === store.id && 
          v.status !== 'deleted' && 
          v.hasSpot && 
          v.spotExpiresAt && 
          v.spotExpiresAt >= now
        );

        if (storeActiveBoostedVideos.length > 0) {
          let maxExpiry = storeActiveBoostedVideos[0].spotExpiresAt;
          const weights = { diamante: 3, extreme: 3, platino: 2, standard: 1 };
          let highestLevel = 'standard';
          let highestWeight = 1;

          storeActiveBoostedVideos.forEach(v => {
            if (v.spotExpiresAt > maxExpiry) maxExpiry = v.spotExpiresAt;
            const w = weights[v.boostLevel] || 1;
            if (w > highestWeight) {
              highestWeight = w;
              highestLevel = v.boostLevel;
            }
          });

          if (store.hasSpot !== true || store.spotExpiresAt !== maxExpiry || store.boostLevel !== highestLevel) {
            store.hasSpot = true;
            store.spotExpiresAt = maxExpiry;
            store.boostLevel = highestLevel;
            hasChanged = true;
          }
        } else {
          // Si no tiene videos activos con impulso, apagar el spot de la tienda
          if (store.spotExpiresAt && store.spotExpiresAt < now) {
            store.hasSpot = false;
            store.spotExpiresAt = null;
            store.boostLevel = 'none';
            hasChanged = true;
          } else if (!store.spotExpiresAt && store.hasSpot) {
            store.hasSpot = false;
            store.boostLevel = 'none';
            hasChanged = true;
          }
        }
      });
    }

    if (hasChanged) {
      this.save();
    }

    return hasChanged;
  }

  // Recalcular estado de impulso de una tienda específica inmediatamente tras una compra o subida
  recalculateStoreBoost(storeId) {
    const store = this.data.stores.find(s => s.id === storeId);
    if (!store) return null;

    const now = new Date().toISOString();
    const activeBoostedVideos = (this.data.videos || []).filter(v => 
      v.storeId === storeId && 
      v.status !== 'deleted' && 
      v.hasSpot && 
      v.spotExpiresAt && 
      v.spotExpiresAt >= now
    );

    if (activeBoostedVideos.length > 0) {
      const weights = { diamante: 3, extreme: 3, platino: 2, standard: 1 };
      let maxExpiry = activeBoostedVideos[0].spotExpiresAt;
      let highestLevel = 'standard';
      let highestWeight = 1;

      activeBoostedVideos.forEach(v => {
        if (v.spotExpiresAt > maxExpiry) maxExpiry = v.spotExpiresAt;
        const w = weights[v.boostLevel] || 1;
        if (w > highestWeight) {
          highestWeight = w;
          highestLevel = v.boostLevel;
        }
      });

      store.hasSpot = true;
      store.spotExpiresAt = maxExpiry;
      store.boostLevel = highestLevel;
    } else {
      if (store.spotExpiresAt && store.spotExpiresAt < now) {
        store.hasSpot = false;
        store.spotExpiresAt = null;
        store.boostLevel = 'none';
      }
    }

    this.save();
    return store;
  }

  // --- MÉTODOS DE VIDEOS ---
  getVideos(filter = {}) {
    // 1. Limpieza preventiva proactiva de vencimientos
    this.cleanExpiredSpotsAndMemberships();

    let list = this.data.videos.filter(v => {
      if (v.status === "deleted") return false;
      // Ocultar si está bajo moderación o rechazado para corrección (a menos que se consulte por su propia tienda para corregir fotos)
      if (v.moderationStatus === "under_review" || v.moderationStatus === "rejected_needs_fix" || v.moderationStatus === "banned") {
        if (!filter.includeModerated && filter.storeId !== v.storeId) return false;
      }
      const st = this.data.stores.find(s => s.id === v.storeId);
      if (st && st.status === "banned") return false;
      return true;
    });

    // Enriquecer cada video con la información y reputación actualizada de su tienda
    list.forEach(v => {
      const st = this.data.stores.find(s => s.id === v.storeId);
      if (st) {
        v.storeRating = (typeof st.rating === 'number' && !isNaN(st.rating)) ? st.rating : 5.0;
        v.storeRatingCount = st.ratingCount || 1;
        v.storeName = st.name || v.storeName;
        v.storeAvatar = st.avatar || v.storeAvatar;
      } else {
        v.storeRating = v.storeRating || 5.0;
        v.storeRatingCount = v.storeRatingCount || 1;
      }
    });

    // Filtro por ciudad (con normalización de tildes, subcadenas y palabras clave regionales)
    if (filter.city && filter.city !== "Toda Colombia") {
      const norm = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const normFilter = norm(filter.city);
      const filterWords = normFilter.split(/[\s&,/]+/).filter(w => w.length > 2);
      list = list.filter(v => {
        const normCity = norm(v.city);
        if (normCity === normFilter || normCity.includes(normFilter) || normFilter.includes(normCity)) return true;
        return filterWords.some(w => normCity.includes(w));
      });
    }

    // Filtro por categoría (soporte flexible e insensible a tildes o variaciones de ampersand/barra)
    if (filter.category && filter.category !== "Todas") {
      const normCat = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\/&]/g, ' ').replace(/\s+/g, ' ').trim();
      const targetCat = normCat(filter.category);
      list = list.filter(v => {
        if (!v.category) return false;
        const vCat = normCat(v.category);
        return vCat === targetCat || vCat.includes(targetCat) || targetCat.includes(vCat);
      });
    }

    // Filtro por tienda
    if (filter.storeId) {
      list = list.filter(v => v.storeId === filter.storeId);
    }

    // 🎲 ALGORITMO DE DESCUBRIMIENTO ALEATORIO PONDERADO (FISHER-YATES SHUFFLE)
    // Cada usuario y cada sesión recibe un orden dinámico, fresco e impredecible:
    // 1. Si hay spots VIP Diamante / Extreme, se barajan al azar entre ellos (el puesto #1 rota entre los VIP).
    // 2. Luego se barajan al azar los spots Platino.
    // 3. Luego se barajan al azar los spots Estándar.
    // 4. Todos los productos orgánicos/gratuitos se barajan al 100% al azar entre sí.
    // 5. Si no hay spots pagados en ese filtro, el feed completo es 100% aleatorio puro para todos los comercios.
    const shuffleArray = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    // Si se consulta por tienda específica (desde el riel de historias), barajar aleatoriamente sus productos
    if (filter.storeId) {
      return shuffleArray(list);
    }

    // Filtro por búsqueda de texto inteligente con jerarquía oficial de impulsos aleatorizada
    if (filter.q && filter.q.trim() !== "") {
      const normalize = s => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const rawTerm = normalize(filter.q);
      const queryWords = rawTerm.split(/\s+/).filter(Boolean);

      list = list.filter(v => {
        const searchable = normalize([
          v.title,
          v.description,
          v.storeName,
          v.city,
          v.category,
          v.keywords,
          v.delivery,
          v.promoBadge
        ].join(' '));

        return searchable.includes(rawTerm) || (queryWords.length > 0 && queryWords.every(w => searchable.includes(w)));
      });

      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return list;
    }

    // FEED PÚBLICO 100% ORGÁNICO Y DEMOCRÁTICO (TODOS COMPITEN EN IGUALDAD DE CONDICIONES)
    // Orden cronológico inverso: el producto más reciente sube de primero de forma natural
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }

  getVideosByStoreId(storeId) {
    this.cleanExpiredSpotsAndMemberships();
    return this.data.videos.filter(v => v.storeId === storeId && v.status !== "deleted");
  }

  getVideoById(id) {
    this.cleanExpiredSpotsAndMemberships();
    const video = this.data.videos.find(v => v.id === id);
    if (video) {
      video.views = (video.views || 0) + 1;
      this.data.config.telemetry.totalViews = (this.data.config.telemetry.totalViews || 0) + 1;
      this.save();
    }
    return video;
  }

  addVideo(video) {
    this.data.videos.unshift(video);
    this.save();
    return video;
  }

  updateVideo(id, updates) {
    const video = this.data.videos.find(v => v.id === id);
    if (video) {
      Object.assign(video, updates);
      this.save();
      return video;
    }
    return null;
  }

  deleteVideo(id, storeId) {
    const index = this.data.videos.findIndex(v => v.id === id && (storeId === "admin" || v.storeId === storeId));
    if (index !== -1) {
      this.data.videos.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  toggleLike(id, action = 'like') {
    const video = this.data.videos.find(v => v.id === id);
    if (video) {
      if (action === 'unlike') {
        video.likes = Math.max(0, (video.likes || 1) - 1);
      } else {
        video.likes = (video.likes || 0) + 1;
      }
      this.save();
      return video.likes;
    }
    return 0;
  }

  addGift(id, giftData = {}) {
    const video = this.data.videos.find(v => v.id === id);
    if (video) {
      video.giftsCount = (video.giftsCount || 140) + 1;
      if (!video.giftsHistory) video.giftsHistory = [];
      video.giftsHistory.push({
        id: 'gift_' + Date.now(),
        ...giftData,
        createdAt: new Date().toISOString()
      });
      this.save();
      return video.giftsCount;
    }
    return 141;
  }

  recordWhatsAppClick(id) {
    const video = this.data.videos.find(v => v.id === id);
    if (video) {
      video.whatsappClicks = (video.whatsappClicks || 0) + 1;
      this.data.config.telemetry.totalWhatsAppClicks = (this.data.config.telemetry.totalWhatsAppClicks || 0) + 1;
      this.save();
      return video.whatsappClicks;
    }
    return 0;
  }

  addComment(videoId, comment) {
    const video = this.data.videos.find(v => v.id === videoId);
    if (video) {
      if (!video.comments) video.comments = [];
      video.comments.unshift(comment);

      // Notificación para la tienda dueña SOLO si es de un cliente externo (Cero auto-notificaciones)
      const isOwner = comment.isStoreOwner || (comment.author && video.storeName && comment.author.trim().toLowerCase() === video.storeName.trim().toLowerCase());
      if (!isOwner) {
        if (!Array.isArray(this.data.notifications)) this.data.notifications = [];
        this.data.notifications.unshift({
          id: `notif-${Date.now()}`,
          storeId: video.storeId,
          text: `💬 ${comment.author} preguntó en "${video.title.substring(0, 28)}..."`,
          date: new Date().toISOString(),
          read: false
        });
      }

      this.save();
      return comment;
    }
    return null;
  }

  // --- MÉTODOS DE TIENDAS / VENDEDORES ---
  getStores() {
    this.cleanExpiredSpotsAndMemberships();
    return this.data.stores;
  }

  getStoreById(id) {
    this.cleanExpiredSpotsAndMemberships();
    const store = this.data.stores.find(s => s.id === id);
    return store || null;
  }

  createStore(storeData) {
    const newStore = {
      id: `store-${Date.now()}`,
      name: storeData.name,
      whatsapp: storeData.whatsapp,
      city: storeData.city || "Bogotá",
      avatar: storeData.avatar || "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&auto=format&fit=crop&q=80",
      rating: 5.0,
      ratingCount: 1,
      verified: true,
      description: storeData.description || "¡Bienvenidos a nuestra vitrina en VitrinaSpot! Escríbenos por WhatsApp para atenderte.",
      address: storeData.address || "Venta online y envíos",
      hours: storeData.hours || "Lun - Sáb: 8:00 AM - 7:00 PM",
      paymentMethods: storeData.paymentMethods || ["Nequi", "Daviplata", "Efectivo"],
      password: storeData.password || "123",
      hasSpot: false,
      spotExpiresAt: null,
      acceptedRules: storeData.acceptedRules === true,
      acceptedRulesAt: storeData.acceptedRules ? new Date().toISOString() : null,
      createdAt: new Date().toISOString()
    };
    this.data.stores.push(newStore);
    this.save();
    return newStore;
  }

  updateStore(id, updates) {
    const store = this.getStoreById(id);
    if (store) {
      Object.assign(store, updates);
      // Actualizar también en los videos que tenga esa tienda
      this.data.videos.forEach(v => {
        if (v.storeId === id) {
          if (updates.name) v.storeName = updates.name;
          if (updates.avatar) v.storeAvatar = updates.avatar;
          if (updates.city) v.city = updates.city;
        }
      });
      this.save();
      return store;
    }
    return null;
  }

  deleteStore(storeId) {
    const sIdx = (this.data.stores || []).findIndex(s => s.id === storeId);
    if (sIdx === -1) return null;

    const deletedStore = this.data.stores.splice(sIdx, 1)[0];

    // Eliminar todos los videos de esta tienda
    if (Array.isArray(this.data.videos)) {
      this.data.videos = this.data.videos.filter(v => v.storeId !== storeId);
    }

    // Eliminar notificaciones de esta tienda
    if (Array.isArray(this.data.notifications)) {
      this.data.notifications = this.data.notifications.filter(n => n.storeId !== storeId);
    }

    this.save();
    return deletedStore;
  }

  rateStore(storeId, rating) {
    const store = this.getStoreById(storeId);
    if (store) {
      const currentCount = store.ratingCount || 1;
      const currentAvg = store.rating || 5.0;
      const newCount = currentCount + 1;
      const newAvg = Number(((currentAvg * currentCount + rating) / newCount).toFixed(1));
      store.rating = newAvg;
      store.ratingCount = newCount;
      this.save();
      return { rating: newAvg, count: newCount };
    }
    return null;
  }

  // Activar SPOT publicitario a una tienda con nivel de impulso
  activateSpot(storeId, days = 7, boostLevel = 'standard') {
    const store = this.getStoreById(storeId);
    if (store) {
      const expiresAt = new Date(Date.now() + 86400000 * days).toISOString();
      store.hasSpot = true;
      store.spotExpiresAt = expiresAt;
      store.boostLevel = boostLevel;

      // Actualizar sus videos
      this.data.videos.forEach(v => {
        if (v.storeId === storeId) {
          v.hasSpot = true;
          v.spotExpiresAt = expiresAt;
          v.boostLevel = boostLevel;
        }
      });

      this.save();
      return expiresAt;
    }
    return null;
  }

  // Activar Membresía Pro a una tienda (⚠️ NO activa spots ni impulsos)
  activateMembership(storeId, days = 30, limit = 100) {
    const store = this.getStoreById(storeId);
    if (store) {
      const expiresAt = new Date(Date.now() + 86400000 * days).toISOString();
      store.hasMembership = true;
      store.membershipExpiresAt = expiresAt;
      store.membershipProductLimit = limit;
      store.verified = true;
      this.save();
      return store;
    }
    return null;
  }

  // --- TRANSACCIONES & MONETIZACIÓN ---
  addTransaction(tx) {
    const newTx = {
      id: tx.id || `tx-${Date.now()}`,
      reference: tx.reference || null,
      wompiTransactionId: tx.wompiTransactionId || null,
      storeId: tx.storeId,
      storeName: tx.storeName,
      type: tx.type, // 'spot_7d', 'spot_15d', 'video_30s', 'video_60s'
      typeLabel: tx.typeLabel,
      amount: tx.amount,
      method: tx.method, // 'wompi_nequi', 'wompi_pse', 'manual_nequi'
      status: tx.status || "approved",
      date: new Date().toISOString()
    };
    this.data.transactions.unshift(newTx);
    this.save();
    return newTx;
  }

  getTransactions() {
    return this.data.transactions;
  }

  // --- CONFIGURACIÓN & TELEMETRÍA ---
  getConfig() {
    return this.data.config;
  }

  updatePricing(newPrices) {
    Object.assign(this.data.config.pricing, newPrices);
    this.save();
    return this.data.config.pricing;
  }

  updatePublicUrl(newUrl) {
    if (newUrl) {
      this.data.config.public_url = newUrl.trim().replace(/\/+$/, '');
      this.save();
    }
    return this.data.config.public_url;
  }

  updateWompiConfig(wompiData) {
    if (!this.data.config.wompi) this.data.config.wompi = {};
    if (wompiData.publicKey !== undefined) this.data.config.wompi.publicKey = wompiData.publicKey.trim();
    if (wompiData.integritySecret !== undefined) this.data.config.wompi.integritySecret = wompiData.integritySecret.trim();
    if (wompiData.eventSecret !== undefined) this.data.config.wompi.eventSecret = wompiData.eventSecret.trim();
    if (typeof wompiData.isLive === 'boolean') this.data.config.wompi.isLive = wompiData.isLive;
    if (wompiData.nequiManualNumber !== undefined) this.data.config.wompi.nequiManualNumber = wompiData.nequiManualNumber.trim();
    if (wompiData.daviplataManualNumber !== undefined) this.data.config.wompi.daviplataManualNumber = wompiData.daviplataManualNumber.trim();
    this.save();
    return this.data.config.wompi;
  }

  // --- MODELO OFICIAL GOOGLE ADMOB (100% GRATIS PARA COMERCIOS / PLAY STORE COMPLIANT) ---
  updateAdMobConfig(admobData) {
    if (!this.data.config.admob) {
      this.data.config.admob = {
        enabled: true,
        publisherId: "ca-pub-3940256099942544",
        feedAdFrequency: 4,
        boostStdDays: 3,
        boostDiamDays: 7,
        interstitialOnUpload: true,
        testMode: true,
        bannerUnitId: "ca-app-pub-3940256099942544/6300978111",
        rewardedUnitId: "ca-app-pub-3940256099942544/5224354917",
        interstitialUnitId: "ca-app-pub-3940256099942544/1033173712"
      };
    }
    if (admobData.enabled !== undefined) this.data.config.admob.enabled = Boolean(admobData.enabled);
    if (admobData.publisherId !== undefined) this.data.config.admob.publisherId = String(admobData.publisherId).trim();
    if (admobData.feedAdFrequency !== undefined) this.data.config.admob.feedAdFrequency = Math.max(2, Number(admobData.feedAdFrequency) || 4);
    if (admobData.boostStdDays !== undefined) this.data.config.admob.boostStdDays = Math.max(1, Number(admobData.boostStdDays) || 3);
    if (admobData.boostDiamDays !== undefined) this.data.config.admob.boostDiamDays = Math.max(1, Number(admobData.boostDiamDays) || 7);
    if (admobData.interstitialOnUpload !== undefined) this.data.config.admob.interstitialOnUpload = Boolean(admobData.interstitialOnUpload);
    if (admobData.testMode !== undefined) this.data.config.admob.testMode = Boolean(admobData.testMode);
    if (admobData.bannerUnitId !== undefined) this.data.config.admob.bannerUnitId = String(admobData.bannerUnitId).trim();
    if (admobData.rewardedUnitId !== undefined) this.data.config.admob.rewardedUnitId = String(admobData.rewardedUnitId).trim();
    if (admobData.interstitialUnitId !== undefined) this.data.config.admob.interstitialUnitId = String(admobData.interstitialUnitId).trim();
    this.save();
    return this.data.config.admob;
  }

  // --- CAMPAÑA DE LANZAMIENTO PIONEROS (GANCHO 1.000 TIENDAS / 5 FOTOS GRATIS) ---
  getLaunchCampaign() {
    return {
      welcome_pack_enabled: false,
      pioneers_phase_active: false,
      boosts_locked: false,
      free_welcome_products_quota: 999999,
      pioneers_target: 1000,
      current_pioneers_count: this.data.stores.filter(s => !s.id.startsWith('store-demo')).length,
      remaining_pioneers_slots: 0
    };
  }

  updateLaunchCampaign(updates) {
    if (!this.data.config.launch_campaign) this.data.config.launch_campaign = {};
    Object.assign(this.data.config.launch_campaign, updates, { boosts_locked: false });
    this.save();
    return this.getLaunchCampaign();
  }

  getStoreWelcomeStatus(storeId) {
    const prc = this.data.config?.pricing || {};
    const freeQuota = Number(prc.free_spots_quota) || 5;
    const publishedCount = storeId ? this.getVideosByStoreId(storeId).length : 0;
    const freeRemaining = Math.max(0, freeQuota - publishedCount);
    return {
      isPioneerEligible: false,
      publishedCount,
      freeQuota,
      freeRemaining,
      hasFreeWelcomeSlots: freeRemaining > 0,
      boostsLocked: false
    };
  }

  getNotifications(storeId) {
    if (!Array.isArray(this.data.notifications)) this.data.notifications = [];
    return this.data.notifications.filter(n => n.storeId === storeId);
  }

  clearNotifications(storeId) {
    if (!Array.isArray(this.data.notifications)) this.data.notifications = [];
    this.data.notifications = this.data.notifications.filter(n => n.storeId !== storeId);
    this.save();
    return true;
  }

  deleteNotification(storeId, notifId) {
    if (!Array.isArray(this.data.notifications)) this.data.notifications = [];
    this.data.notifications = this.data.notifications.filter(n => !(n.storeId === storeId && n.id === notifId));
    this.save();
    return true;
  }

  addNotification(storeId, notifData) {
    if (!Array.isArray(this.data.notifications)) this.data.notifications = [];
    const notif = {
      id: `notif-${Date.now()}`,
      storeId,
      text: notifData.message || notifData.text || notifData.title || '',
      title: notifData.title || 'Notificación',
      type: notifData.type || 'info',
      videoId: notifData.videoId || null,
      date: new Date().toISOString(),
      read: false
    };
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  reportVideo(report) {
    if (!Array.isArray(this.data.config.reports)) this.data.config.reports = [];
    const newRep = {
      id: `rep-${Date.now()}`,
      videoId: report.videoId,
      reason: report.reason,
      details: report.details || '',
      date: new Date().toISOString(),
      status: "pending"
    };
    this.data.config.reports.unshift(newRep);

    // Auto-ocultación Comunitaria: si acumula 3 reportes pendientes, se pasa a 'under_review'
    const pendingForThis = this.data.config.reports.filter(r => r.videoId === report.videoId && r.status === "pending");
    const video = this.getVideoById(report.videoId);
    if (video) {
      video.reportCount = pendingForThis.length;
      if (pendingForThis.length >= 3 && video.moderationStatus !== 'rejected_needs_fix') {
        video.moderationStatus = 'under_review';
      }
    }

    this.save();
    return newRep;
  }

  // Moderar un video desde el panel de administrador
  moderateVideo(videoId, action, adminReason = '') {
    const video = this.getVideoById(videoId);
    if (!video) return null;

    if (action === 'reject_needs_fix') {
      video.moderationStatus = 'rejected_needs_fix';
      video.moderationReason = adminReason || 'Fotos no cumplen políticas de contenido familiar';
      
      // Notificar al vendedor garantizando que su pago y spot están seguros
      this.addNotification(video.storeId, {
        title: '⚠️ Spot Pausado para Corrección de Fotos',
        message: `Tu anuncio "${video.title}" requiere ajuste fotográfico: ${video.moderationReason}. Tranquilo, tu pago y días de impulso siguen 100% activos. Cambia las fotos para reactivarlo sin costo adicional.`,
        type: 'moderation',
        videoId: video.id
      });
    } else if (action === 'approve') {
      video.moderationStatus = 'active';
      video.moderationReason = null;
      video.reportCount = 0;
    } else if (action === 'delete') {
      video.status = 'deleted';
      video.moderationStatus = 'deleted';
    } else if (action === 'ban_store') {
      video.status = 'deleted';
      video.moderationStatus = 'banned';
      const store = this.getStoreById(video.storeId);
      if (store) {
        store.status = 'banned';
        this.data.videos.forEach(v => {
          if (v.storeId === store.id) {
            v.status = 'deleted';
            v.moderationStatus = 'banned';
          }
        });
      }
    }

    // Resolver reportes asociados
    if (Array.isArray(this.data.config.reports)) {
      this.data.config.reports.forEach(r => {
        if (r.videoId === videoId && r.status === 'pending') {
          r.status = 'resolved';
          r.resolution = action;
        }
      });
    }

    this.save();
    return video;
  }

  // Reactivar un spot cuando el vendedor corrige sus fotos
  fixRejectedVideo(id, storeId, updates) {
    const video = this.getVideoById(id);
    if (!video || video.storeId !== storeId) return null;
    Object.assign(video, updates, {
      moderationStatus: 'active',
      moderationReason: null,
      reportCount: 0
    });
    this.save();
    return video;
  }

  // Obtener lista completa de moderación para el Administrador
  getModerationItems() {
    const pendingReports = (this.data.config.reports || []).filter(r => r.status === 'pending');
    const items = [];
    
    // Videos con reportes pendientes o en estado under_review / rejected_needs_fix
    this.data.videos.forEach(v => {
      if (v.status === 'deleted') return;
      const vReports = pendingReports.filter(r => r.videoId === v.id);
      if (vReports.length > 0 || v.moderationStatus === 'under_review' || v.moderationStatus === 'rejected_needs_fix') {
        const store = this.getStoreById(v.storeId);
        items.push({
          video: v,
          store: store ? { id: store.id, name: store.name, whatsapp: store.whatsapp, status: store.status } : null,
          reports: vReports,
          status: v.moderationStatus || (vReports.length >= 3 ? 'under_review' : 'reported')
        });
      }
    });

    return items;
  }

  // Purgar y restablecer la base de datos a cero (Modo Virgen para lanzamiento oficial)
  resetToVirginState() {
    const initialStores = this.data.stores.length;
    const initialVideos = this.data.videos.length;

    this.data.stores = [];
    this.data.videos = [];
    this.data.transactions = [];
    this.data.notifications = [];
    if (!this.data.config) this.data.config = {};
    if (!this.data.config.telemetry) {
      this.data.config.telemetry = { totalWhatsAppClicks: 0, totalViews: 0 };
    } else {
      this.data.config.telemetry.totalWhatsAppClicks = 0;
      this.data.config.telemetry.totalViews = 0;
    }
    this.data.config.reports = [];
    this.save();

    return {
      success: true,
      removedStores: initialStores,
      removedVideos: initialVideos,
      remainingStores: 0,
      remainingVideos: 0,
      message: 'Base de datos restablecida a modo virgen: 0 tiendas, 0 perfiles y 0 anuncios.'
    };
  }

  // Limpiar tiendas y videos de prueba para lanzamiento oficial conservando negocios reales
  cleanDemoData() {
    const demoStoreIds = ['store-1', 'store-2', 'store-3', 'store-4'];
    const demoVideoIds = ['vid-1', 'vid-2', 'vid-3', 'vid-4'];

    const initialStores = this.data.stores.length;
    const initialVideos = this.data.videos.length;

    this.data.stores = this.data.stores.filter(s => {
      if (demoStoreIds.includes(s.id)) return false;
      if (s.name.includes('Calzados Bucaramanga') || s.name.includes('Burger Master') || s.name.includes('TechStore')) return false;
      return true;
    });

    this.data.videos = this.data.videos.filter(v => {
      if (demoVideoIds.includes(v.id)) return false;
      if (demoStoreIds.includes(v.storeId)) return false;
      return true;
    });

    this.save();
    return {
      removedStores: initialStores - this.data.stores.length,
      removedVideos: initialVideos - this.data.videos.length,
      remainingStores: this.data.stores.length,
      remainingVideos: this.data.videos.length
    };
  }
}

export const db = new Database();
