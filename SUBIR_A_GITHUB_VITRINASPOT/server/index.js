import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import multer from 'multer';
import convert from 'heic-convert';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 4000;

// Configurar carpetas de subidas
const uploadsDir = path.join(rootDir, 'uploads');
const videosDir = path.join(uploadsDir, 'videos');
const thumbsDir = path.join(uploadsDir, 'thumbnails');
const FFMPEG_BIN = process.env.FFMPEG_PATH || (process.platform === 'win32' ? 'C:\\Users\\Admin\\Desktop\\Tahoma2D\\ffmpeg\\ffmpeg.exe' : 'ffmpeg');

// Optimizador automático de video comercial (H.264 + FastStart moov atom al inicio)
function optimizeVideoAsync(rawFilePath) {
  if (!rawFilePath || !fs.existsSync(rawFilePath)) return;
  const isWin = process.platform === 'win32';
  const hasCustomBin = isWin && fs.existsSync(FFMPEG_BIN);
  const ffmpegCmd = hasCustomBin ? `"${FFMPEG_BIN}"` : 'ffmpeg';
  const tempPath = rawFilePath + '.opt.mp4';
  const codec = isWin ? 'h264_mf' : 'libx264';
  const cmd = `${ffmpegCmd} -i "${rawFilePath}" -c:v ${codec} -preset fast -b:v 2500k -c:a aac -b:a 128k -movflags +faststart "${tempPath}" -y`;
  
  exec(cmd, (err) => {
    if (!err && fs.existsSync(tempPath)) {
      try {
        fs.copyFileSync(tempPath, rawFilePath);
        fs.unlinkSync(tempPath);
        console.log(`✅ Video optimizado con éxito (FastStart): ${path.basename(rawFilePath)}`);
      } catch (e) {
        console.error('Error reemplazando video optimizado:', e);
      }
    } else {
      const cmdFast = `${ffmpegCmd} -i "${rawFilePath}" -c copy -movflags +faststart "${tempPath}" -y`;
      exec(cmdFast, (err2) => {
        if (!err2 && fs.existsSync(tempPath)) {
          try {
            fs.copyFileSync(tempPath, rawFilePath);
            fs.unlinkSync(tempPath);
            console.log(`✅ Video optimizado con FastStart copy: ${path.basename(rawFilePath)}`);
          } catch (e) {}
        }
      });
    }
  });
}



// Convertidor automático de fotos HEIC/HEIF (iPhones y Android modernos) a JPEG estándar compatible
async function ensureJpegCompatible(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return filePath;
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.heic' || ext === '.heif') {
    try {
      const inputBuffer = fs.readFileSync(filePath);
      const outputBuffer = await convert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.88
      });
      const jpgPath = filePath.replace(/\.(heic|heif)$/i, '.jpg');
      fs.writeFileSync(jpgPath, outputBuffer);
      try { fs.unlinkSync(filePath); } catch (e) {}
      console.log(`📸 Imagen convertida con éxito a JPEG: ${path.basename(filePath)} -> ${path.basename(jpgPath)}`);
      return jpgPath;
    } catch (err) {
      console.error('⚠️ Error convirtiendo HEIC a JPEG:', err);
      return filePath;
    }
  }
  return filePath;
}

// Helper: Convertir archivo de imagen a Base64 Data URI permanente si <= 850KB para persistencia total en PostgreSQL Cloud
function fileToDataUriIfReasonable(filePath, maxBytes = 850 * 1024) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (stat.size <= maxBytes) {
      const buf = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'jpeg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  } catch (err) {
    console.error('⚠️ Error convirtiendo archivo a Data URI:', err.message);
  }
  return null;
}

[uploadsDir, videosDir, thumbsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos con prevención estricta de caché para móviles
app.use((req, res, next) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.css') || req.url === '/' || req.url.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
// Inyección dinámica de Meta Tags Open Graph (Vista Previa con Miniatura en WhatsApp/Redes Sociales)
app.get('/', (req, res, next) => {
  const videoId = req.query.v;
  const storeId = req.query.store;

  if (!videoId && !storeId) {
    return next();
  }

  const indexPath = path.join(rootDir, 'public', 'index.html');
  fs.readFile(indexPath, 'utf8', (err, html) => {
    if (err) return next();

    const host = req.get('host') || 'localhost:4000';
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const baseUrl = `${proto}://${host}`;

    let ogTitle = 'VitrinaSpot Colombia - Tu vitrina digital, directo a WhatsApp';
    let ogDesc = 'Compra y vende productos directamente por WhatsApp sin intermediarios ni comisiones.';
    let ogImage = `${baseUrl}/uploads/thumbnails/placeholder.jpg`;
    let ogUrl = `${baseUrl}/`;

    if (videoId) {
      const video = db.getVideoById(videoId);
      if (video) {
        ogTitle = `${video.title} - ${video.priceFormatted} | VitrinaSpot`;
        ogDesc = `Vendido por "${video.storeName}" en ${video.city || 'Colombia'}. ${video.delivery ? `(${video.delivery}). ` : ''}Toca aquí para ver fotos y contactar por WhatsApp.`;
        ogUrl = `${baseUrl}/?v=${video.id}`;
        let img = (video.photos && video.photos[0]) || video.thumbnailUrl || '';
        if (img) {
          ogImage = img.startsWith('http') ? img : `${baseUrl}${img}`;
        }
      }
    } else if (storeId) {
      const store = db.getStoreById(storeId);
      if (store) {
        ogTitle = `Tienda ${store.name} - Catálogo Oficial | VitrinaSpot`;
        ogDesc = `Explora los productos de ${store.name} en ${store.city || 'Colombia'}. Contacta directamente a su WhatsApp.`;
        ogUrl = `${baseUrl}/?store=${store.id}`;
        let img = store.avatar || '';
        if (img) {
          ogImage = img.startsWith('http') ? img : `${baseUrl}${img}`;
        }
      }
    }

    const cleanStr = str => (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const dynamicTags = `
  <!-- VISTA PREVIA OFICIAL EN WHATSAPP Y REDES SOCIALES (OPEN GRAPH) -->
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="VitrinaSpot Colombia">
  <meta property="og:title" content="${cleanStr(ogTitle)}">
  <meta property="og:description" content="${cleanStr(ogDesc)}">
  <meta property="og:image" content="${cleanStr(ogImage)}">
  <meta property="og:image:secure_url" content="${cleanStr(ogImage)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="800">
  <meta property="og:url" content="${cleanStr(ogUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${cleanStr(ogTitle)}">
  <meta name="twitter:description" content="${cleanStr(ogDesc)}">
  <meta name="twitter:image" content="${cleanStr(ogImage)}">`;

    const injectedHtml = html.replace('</head>', `${dynamicTags}\n</head>`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'all, index, follow');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(injectedHtml);
  });
});

app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Configuración de Multer para subida de videos y fotos de perfil/miniaturas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, videosDir);
    } else {
      cb(null, thumbsDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${cleanName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 } // Hasta 300MB
});

// ==========================================
// RUTAS PÚBLICAS LEGALES & GOOGLE PLAY COMPLIANCE
// ==========================================
app.get('/privacidad', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'privacidad.html'));
});

app.get('/politicas', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'privacidad.html'));
});

app.get('/eliminar-cuenta', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'eliminar-cuenta.html'));
});

// ==========================================
// 1. RUTAS DE VIDEOS Y FEED COMERCIAL
// ==========================================

// Obtener feed de videos con filtros de ciudad, categoría, búsqueda y tienda (Aleatorio Ponderado)
app.get('/api/videos', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  const { city, category, q, storeId } = req.query;
  const videos = db.getVideos({ city, category, q, storeId });
  res.json(videos);
});

// Obtener detalle de un video e incrementar vistas
app.get('/api/videos/:id', (req, res) => {
  const video = db.getVideoById(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video no encontrado' });
  res.json(video);
});

// Registrar clic al botón de WhatsApp
app.post('/api/videos/:id/whatsapp-click', (req, res) => {
  const clicks = db.recordWhatsAppClick(req.params.id);
  res.json({ success: true, clicks, totalTelemetry: db.getConfig().telemetry.totalWhatsAppClicks });
});

// Dar Like o Quitar Like a un video / producto comercial
app.post('/api/videos/:id/like', (req, res) => {
  const action = req.body && req.body.action === 'unlike' ? 'unlike' : 'like';
  const likes = db.toggleLike(req.params.id, action);
  res.json({ success: true, likes, action });
});

// Enviar Regalo Virtual animado (SpotCoins / SpotPlay)
app.post('/api/videos/:id/gift', (req, res) => {
  const giftsCount = db.addGift(req.params.id, req.body || {});
  res.json({ success: true, giftsCount });
});

// Agregar comentario a un video con verificación de cliente
app.post('/api/videos/:id/comments', (req, res) => {
  const { text, author, avatar, isStoreOwner, isVerifiedBuyer } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'El comentario no puede estar vacío.' });
  }

  const cleanAuthor = author ? author.trim() : 'Comprador Anónimo';
  const isVerified = Boolean(isVerifiedBuyer) || (cleanAuthor !== 'Comprador Anónimo' && cleanAuthor !== 'Usuario VitrinaSpot');

  const comment = {
    id: `c-${Date.now()}`,
    author: cleanAuthor,
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    text: text.trim(),
    isStoreOwner: Boolean(isStoreOwner),
    isVerifiedBuyer: isVerified,
    createdAt: new Date().toISOString()
  };

  const added = db.addComment(req.params.id, comment);
  if (!added) return res.status(404).json({ error: 'Video no encontrado' });
  res.status(201).json(comment);
});

// ==========================================
// 2.5 FILTRO PREVENTIVO DE PALABRAS PROHIBIDAS (NIVEL 3)
// ==========================================
const PROHIBITED_WORDS = [
  // Contenido para adultos / erótico explícito
  'porno', 'pornografia', 'pornografía', 'xxx', 'sexo', 'erotico', 'erótico', 'erotica', 'erótica',
  'prostituta', 'prostitutas', 'prepago', 'prepagos', 'escort', 'escorts', 'onlyfans', 'webcam', 'camgirl',
  'desnudo', 'desnudos', 'desnuda', 'desnudas', 'vagina', 'pene', 'tetas', 'follar',
  // Armas y violencia
  'arma de fuego', 'armas de fuego', 'pistola', 'pistolas', 'revolver', 'revólver', 'escopeta', 'escopetas',
  'fusil', 'fusiles', 'balas', 'municion', 'munición', 'municiones', 'granada', 'explosivo', 'explosivos',
  'sicario', 'asesinato', 'homicidio',
  // Drogas y estupefacientes
  'cocaina', 'cocaína', 'marihuana', 'weed', 'cannabis', 'tusi', 'popper', 'bazuco', 'heroina', 'heroína',
  'drogas ilicitas', 'drogas ilícitas', 'perico',
  // Estafas y captación ilegal
  'piramide', 'pirámide', 'dinero facil', 'dinero fácil', 'ganar dinero sin trabajar', 'inversion milagrosa',
  'inversión milagrosa', 'esquema ponzi', 'clonar tarjetas', 'hackear whatsapp'
];

function checkProhibitedText(text) {
  if (!text) return null;
  const normalized = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // elimina tildes para búsqueda uniforme
  
  for (const word of PROHIBITED_WORDS) {
    const normWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const regex = new RegExp(`(^|[^a-záéíóú0-9])${normWord}([^a-záéíóú0-9]|$)`, 'i');
    if (regex.test(normalized) || normalized.includes(normWord)) {
      return word;
    }
  }
  return null;
}

// Reportar video a moderación comunitaria (Nivel 1)
app.post('/api/videos/:id/report', (req, res) => {
  const { reason, details } = req.body;
  const rep = db.reportVideo({ 
    videoId: req.params.id, 
    reason: reason || 'Contenido inadecuado',
    details: details || ''
  });
  res.json({ 
    success: true, 
    message: 'Reporte recibido. Gracias por cuidar nuestra comunidad y mantener limpia la vitrina.', 
    report: rep 
  });
});

// Subir nuevo anuncio comercial (Paquete de 7 Imágenes Gratis o Video)
app.post('/api/videos', upload.fields([
  { name: 'coverPhoto', maxCount: 1 },
  { name: 'photo1', maxCount: 1 },
  { name: 'photo2', maxCount: 1 },
  { name: 'photo3', maxCount: 1 },
  { name: 'photo4', maxCount: 1 },
  { name: 'photo5', maxCount: 1 },
  { name: 'photo6', maxCount: 1 },
  { name: 'photo7', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const detailPhotos = [];
    const photoFields = ['coverPhoto', 'photo1', 'photo2', 'photo3', 'photo4', 'photo5', 'photo6', 'photo7'];
    for (const fName of photoFields) {
      if (req.files && req.files[fName] && req.files[fName].length > 0) {
        const fileObj = req.files[fName][0];
        const finalPath = await ensureJpegCompatible(fileObj.path);
        const finalFilename = path.basename(finalPath);
        const dataUri = fileToDataUriIfReasonable(finalPath);
        detailPhotos.push(dataUri || `/uploads/thumbnails/${finalFilename}`);
      }
    }

    const videoFile = (req.files && req.files.video && req.files.video.length > 0) ? req.files.video[0] : null;

    if (detailPhotos.length === 0 && !videoFile) {
      return res.status(400).json({ error: 'Debes seleccionar al menos la foto principal del producto.' });
    }

    const {
      storeId,
      storeName,
      whatsapp,
      title,
      description,
      category,
      city,
      price,
      delivery,
      keywords,
      promoBadge,
      duration
    } = req.body;

    // 🛡️ Nivel 3: Filtro Preventivo de Palabras Prohibidas
    const textToScan = `${title || ''} ${description || ''} ${keywords || ''}`;
    const prohibitedWord = checkProhibitedText(textToScan);
    if (prohibitedWord) {
      return res.status(400).json({
        error: `⚠️ Tu anuncio contiene términos no permitidos según nuestras políticas de seguridad comunitaria: "${prohibitedWord}". Por favor corrige el texto.`
      });
    }

    // Buscar o crear tienda asociada con su WhatsApp
    let store = null;
    if (storeId) {
      store = db.getStoreById(storeId);
    }

    if (!store && whatsapp) {
      let cleanWa = whatsapp.replace(/[^0-9]/g, '');
      if (cleanWa.length === 10 && !cleanWa.startsWith('57')) {
        cleanWa = `+57${cleanWa}`;
      } else if (!cleanWa.startsWith('+')) {
        cleanWa = `+${cleanWa}`;
      }

      // Buscar si ya existe tienda con este whatsapp
      store = db.getStores().find(s => s.whatsapp === cleanWa);
      if (!store) {
        store = db.createStore({
          name: storeName || 'Mi Tienda Comercial',
          whatsapp: cleanWa,
          city: city || 'Bogotá'
        });
      }
    }

    if (!store) {
      store = db.getStores()[0]; // Fallback
    }

    // Miniatura por defecto
    const defaultThumb = detailPhotos.length > 0 
      ? detailPhotos[0] 
      : 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop&q=80';

    const durSec = parseInt(duration, 10) || 15;
    const durLabel = durSec < 60 ? `0:${durSec < 10 ? '0' : ''}${durSec}` : '1:00';

    const numPrice = Number(price);
    const isCommercial = req.body.videoType === 'product' || (!isNaN(numPrice) && numPrice > 0);
    const priceFormatted = isCommercial && !isNaN(numPrice) && numPrice > 0
      ? `$${numPrice.toLocaleString('es-CO')} COP`
      : (req.body.videoType === 'product' ? 'Cotización Gratis / A convenir' : '');

    // Soporte para los 4 paquetes comerciales de VitrinaSpot:
    // 1. photos_5: Fijo permanente hasta que el propio vendedor lo elimine
    // 2. boost_standard: Anuncio fijo + 3 días de impulso estándar
    // 3. boost_extreme: Anuncio fijo + 7 días de SPOT VIP (posición #1 e historias)
    // 4. membership_pro: Tienda verificada Pro (⚠️ no incluye impulsos)
    // Duración y configuraciones dinámicas configuradas por el Administrador
    const platformConfig = db.getConfig();
    const currentPricing = platformConfig.pricing || {};

    // 🚀 Modelo Comercial: 5 spots gratis de 7 imágenes por tienda
    // Al superar los 5 spots, la publicación permanente cuesta $3.500 COP o requiere un Impulso/Membresía
    const isDiamante = req.body.paidPlan === 'boost_diamante' || req.body.paidPlan === 'boost_extreme' || req.body.paidPlan === 'photos_5_spot' || req.body.paidPlan === 'photos_7_spot' || req.body.paidPlan === 'spot_boost_diamante' || req.body.hasSpot === 'true';
    const isPlatino = req.body.paidPlan === 'boost_platino' || req.body.paidPlan === 'spot_boost_platino';
    const isStandard = req.body.paidPlan === 'boost_standard' || req.body.paidPlan === 'spot_boost_standard' || req.body.isStandardBoost === 'true';
    const wantsBoost = isDiamante || isPlatino || isStandard;
    const isSpotPermanent = req.body.paidPlan === 'spot_permanent' || req.body.paidPlan === 'spot_permanent_pack';

    const storeVideos = db.getVideosByStoreId(store.id);
    const freeQuota = Number(currentPricing.free_spots_quota) || 5;
    const isMembershipActive = Boolean(
      store.hasMembership && 
      store.membershipExpiresAt && 
      new Date(store.membershipExpiresAt) > new Date()
    );
    const memLimit = Number(store.membershipProductLimit) || Number(currentPricing.membership_product_limit) || 100;
    const hasMembershipQuota = isMembershipActive && storeVideos.length < memLimit;
    const hasFreeQuota = storeVideos.length < freeQuota;

    // 🚀 MODELO 100% GRATUITO PARA COMERCIOS (MONETIZACIÓN CON GOOGLE ADMOB)
    // Cualquier negocio puede publicar spots permanentes de 7 imágenes sin límite ni cobros
    const isStandardFree = true;
    const hasValidTx = true;

    const isBoosted = Boolean(wantsBoost && hasValidTx);
    let boostExpiry = null;
    let boostDays = 0;
    let boostLevel = 'none';

    if (isDiamante) {
      boostDays = Number(currentPricing.boost_diamante_days) || Number(currentPricing.boost_extreme_days) || 8;
      boostLevel = 'diamante';
    } else if (isPlatino) {
      boostDays = Number(currentPricing.boost_platino_days) || 5;
      boostLevel = 'platino';
    } else if (isStandard) {
      boostDays = Number(currentPricing.boost_standard_days) || 2;
      boostLevel = 'standard';
    }

    if (isBoosted) {
      boostExpiry = new Date(Date.now() + boostDays * 24 * 60 * 60 * 1000).toISOString();
      store.hasSpot = true;
      store.spotExpiresAt = boostExpiry;
      store.boostLevel = boostLevel;
      db.updateStore(store.id, { hasSpot: true, spotExpiresAt: boostExpiry, boostLevel: store.boostLevel });
    }

    const newVideo = {
      id: `vid-${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      storeAvatar: store.avatar,
      storeVerified: store.verified,
      hasSpot: isBoosted,
      spotExpiresAt: isBoosted ? boostExpiry : null,
      boostLevel: isBoosted ? boostLevel : 'none',
      isPermanent: true, // Fijo indefinido hasta que el propio vendedor lo elimine
      title: title || 'Producto en VitrinaSpot',
      description: description || 'Contáctanos por WhatsApp para consultar disponibilidad y pedidos.',
      category: category || 'Emprendimientos',
      city: city || store.city || 'Bogotá',
      videoType: req.body.videoType || (isCommercial ? 'product' : 'entertainment'),
      price: !isNaN(numPrice) ? numPrice : 0,
      priceFormatted,
      delivery: isCommercial ? (delivery || '🛵 Domicilio Gratis') : null,
      giftsCount: 140,
      keywords: keywords || '',
      promoBadge: promoBadge && promoBadge !== 'none' ? promoBadge : null,
      videoUrl: videoFile ? `/api/stream/${videoFile.filename}` : null,
      thumbnailUrl: defaultThumb,
      detailPhotos,
      photos: detailPhotos,
      duration: durSec,
      durationLabel: durLabel,
      views: 1,
      likes: 0,
      whatsappClicks: 0,
      savedCount: 0,
      status: 'active',
      paidPlan: req.body.paidPlan || '15s',
      transactionId: req.body.transactionId || null,
      createdAt: new Date().toISOString(),
      comments: []
    };

    db.addVideo(newVideo);

    if (isStandardFree) {
      db.addTransaction({
        storeId: store.id,
        storeName: store.name,
        type: 'free_product_upload',
        typeLabel: `Publicación Gratuita de Producto: ${newVideo.title}`,
        amount: 0,
        method: 'free_standard',
        status: 'approved'
      });
    }

    if (isBoosted) {
      db.recalculateStoreBoost(store.id);
    }

    const updatedVideos = db.getVideosByStoreId(store.id);
    const updatedWelcomeStatus = db.getStoreWelcomeStatus(store.id);
    const currentStoreData = db.getStoreById(store.id) || store;
    const enrichedStore = {
      ...currentStoreData,
      isMembershipActive,
      productsCount: updatedVideos.length,
      membershipProductLimit: memLimit,
      welcome_status: updatedWelcomeStatus
    };

    res.status(201).json({ success: true, video: newVideo, store: enrichedStore });

    // Optimizar video automáticamente a H.264 FastStart para reproducción ultra fluida en móviles
    if (videoFile && videoFile.filename) {
      optimizeVideoAsync(path.join(videosDir, videoFile.filename));
    }
  } catch (err) {
    console.error('Error subiendo video comercial:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al procesar el archivo.' });
    }
  }
});

// Eliminar video
app.delete('/api/videos/:id', (req, res) => {
  const { storeId } = req.query;
  const deleted = db.deleteVideo(req.params.id, storeId || 'admin');
  if (deleted) {
    res.json({ success: true, message: 'Video eliminado con éxito.' });
  } else {
    res.status(404).json({ error: 'Video no encontrado o no tienes permiso.' });
  }
});

// Editar video / producto comercial (Blindaje Total de SPOT Pagado, Likes y Vistas)
app.put('/api/videos/:id', express.json(), (req, res) => {
  try {
    const { storeId, title, price, delivery, category, city, description, keywords, photos, detailPhotos, thumbnailUrl } = req.body;
    const video = db.getVideoById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    if (storeId !== 'admin' && video.storeId !== storeId) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este producto.' });
    }

    // 🛡️ Nivel 3: Filtro Preventivo de Palabras Prohibidas
    const textToScan = `${title || ''} ${description || ''} ${keywords || ''}`;
    const prohibitedWord = checkProhibitedText(textToScan);
    if (prohibitedWord) {
      return res.status(400).json({
        error: `⚠️ Tu edición contiene términos no permitidos según nuestras políticas comunitarias: "${prohibitedWord}". Por favor corrige el texto.`
      });
    }

    const updates = {};
    if (typeof title === 'string' && title.trim()) updates.title = title.trim();
    if (price !== undefined && price !== null) {
      const numPrice = Number(price);
      updates.price = !isNaN(numPrice) ? Math.max(0, numPrice) : 0;
      updates.priceFormatted = updates.price > 0
        ? `$${updates.price.toLocaleString('es-CO')} COP`
        : 'Cotización Gratis / A convenir';
    }
    if (typeof delivery === 'string' && delivery.trim()) updates.delivery = delivery.trim();
    if (typeof category === 'string' && category.trim()) updates.category = category.trim();
    if (typeof city === 'string' && city.trim()) updates.city = city.trim();
    if (typeof description === 'string') updates.description = description.trim();
    if (keywords !== undefined && typeof keywords === 'string') updates.keywords = keywords.trim();

    // Actualización y sincronización de fotos
    const rawPhotos = Array.isArray(photos) ? photos : (Array.isArray(detailPhotos) ? detailPhotos : null);
    if (rawPhotos) {
      const clean = rawPhotos.filter(p => typeof p === 'string' && p.trim().length > 0);
      updates.photos = clean;
      updates.detailPhotos = clean;
      updates.thumbnailUrl = clean.length > 0 ? clean[0] : (thumbnailUrl || '');
    }

    // Si el video estaba pausado por fotos/contenido y se edita, se reactiva
    if (video.moderationStatus === 'rejected_needs_fix') {
      updates.moderationStatus = 'active';
      updates.moderationReason = null;
      updates.reportCount = 0;
    }

    // db.updateVideo preserva hasSpot, spotExpiresAt, photos, views, likes, etc.
    const updated = db.updateVideo(req.params.id, updates);
    res.json({ success: true, message: 'Producto actualizado con éxito.', video: updated });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ error: 'Error del servidor al actualizar el producto.' });
  }
});

// ==========================================
// 2.6 MODERACIÓN Y SEGURIDAD COMUNITARIA (NIVEL 2)
// ==========================================

// Obtener items de moderación para el panel de Administrador
app.get('/api/admin/moderation', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== db.getConfig().admin.token) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  const items = db.getModerationItems();
  res.json({ success: true, items });
});

// Ejecutar acción de moderación desde el panel de Administrador
app.post('/api/admin/videos/:id/moderate', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== db.getConfig().admin.token) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  const { action, adminReason } = req.body;
  const video = db.moderateVideo(req.params.id, action, adminReason);
  if (!video) return res.status(404).json({ error: 'Spot no encontrado.' });
  res.json({ success: true, message: 'Acción de moderación aplicada con éxito.', video });
});

// Reactivar spot con fotos corregidas por el comerciante (Segunda Oportunidad sin volver a pagar)
app.post('/api/videos/:id/fix-rejected', upload.fields([
  { name: 'coverPhoto', maxCount: 1 },
  { name: 'photo1', maxCount: 1 },
  { name: 'photo2', maxCount: 1 },
  { name: 'photo3', maxCount: 1 },
  { name: 'photo4', maxCount: 1 },
  { name: 'photo5', maxCount: 1 },
  { name: 'photo6', maxCount: 1 },
  { name: 'photo7', maxCount: 1 }
]), async (req, res) => {
  try {
    const { storeId, title, price, description } = req.body;
    const video = db.getVideoById(req.params.id);
    if (!video || video.storeId !== storeId) {
      return res.status(403).json({ error: 'No autorizado para modificar este spot.' });
    }

    const detailPhotos = [...(video.detailPhotos || [])];
    const photoFields = ['coverPhoto', 'photo1', 'photo2', 'photo3', 'photo4', 'photo5', 'photo6', 'photo7'];
    for (let i = 0; i < photoFields.length; i++) {
      const fName = photoFields[i];
      if (req.files && req.files[fName] && req.files[fName].length > 0) {
        const fileObj = req.files[fName][0];
        const finalPath = await ensureJpegCompatible(fileObj.path);
        const finalFilename = path.basename(finalPath);
        const dataUri = fileToDataUriIfReasonable(finalPath);
        detailPhotos[i] = dataUri || `/uploads/thumbnails/${finalFilename}`;
      }
    }

    const cleanPhotos = detailPhotos.filter(Boolean);
    const updates = {
      detailPhotos: cleanPhotos,
      thumbnailUrl: cleanPhotos[0] || video.thumbnailUrl,
      title: title ? title.trim() : video.title,
      price: price ? Number(price) : video.price,
      description: description ? description.trim() : video.description,
      moderationStatus: 'active',
      moderationReason: null,
      reportCount: 0
    };

    const fixed = db.fixRejectedVideo(video.id, storeId, updates);
    res.json({ 
      success: true, 
      message: '¡Fotos corregidas con éxito! Tu anuncio ha sido reactivado en la vitrina pública sin costo adicional.', 
      video: fixed 
    });
  } catch (err) {
    console.error('Error corrigiendo fotos de spot:', err);
    res.status(500).json({ error: 'Error al actualizar fotos.' });
  }
});

// Subir foto individual para gestor de fotos de SPOT
app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Debes seleccionar una imagen.' });
    const finalPath = await ensureJpegCompatible(req.file.path);
    const dataUri = fileToDataUriIfReasonable(finalPath);
    const photoUrl = dataUri || `/uploads/thumbnails/${path.basename(finalPath)}`;
    res.json({ success: true, photoUrl });
  } catch (err) {
    console.error('Error al subir foto:', err);
    res.status(500).json({ error: 'Error del servidor al procesar la imagen.' });
  }
});

// Agregar o actualizar fotos de detalle de un anuncio
app.post('/api/videos/:id/photos', upload.single('photo'), async (req, res) => {
  try {
    const video = db.getVideoById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video no encontrado.' });
    if (!req.file) return res.status(400).json({ error: 'Debes seleccionar una imagen.' });

    const finalPath = await ensureJpegCompatible(req.file.path);
    const dataUri = fileToDataUriIfReasonable(finalPath);
    const photoUrl = dataUri || `/uploads/thumbnails/${path.basename(finalPath)}`;
    const photos = Array.isArray(video.detailPhotos) ? [...video.detailPhotos] : [];
    const index = parseInt(req.body.index, 10);

    if (!isNaN(index) && index >= 0 && index < 3) {
      photos[index] = photoUrl;
    } else {
      if (photos.length < 3) photos.push(photoUrl);
      else photos[photos.length - 1] = photoUrl;
    }

    const cleanPhotos = photos.filter(Boolean);
    const updated = db.updateVideo(video.id, {
      detailPhotos: cleanPhotos,
      photos: cleanPhotos,
      thumbnailUrl: cleanPhotos.length > 0 ? cleanPhotos[0] : ''
    });

    res.json({ success: true, message: 'Foto de detalle agregada con éxito.', video: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir la foto de detalle.' });
  }
});

// Eliminar una foto de detalle específica
app.delete('/api/videos/:id/photos/:index', (req, res) => {
  try {
    const video = db.getVideoById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video no encontrado.' });
    const idx = parseInt(req.params.index, 10);
    const existingList = (Array.isArray(video.detailPhotos) && video.detailPhotos.length > 0)
      ? video.detailPhotos
      : (Array.isArray(video.photos) ? video.photos : []);

    if (isNaN(idx) || idx < 0 || !existingList || !existingList[idx]) {
      return res.status(400).json({ error: 'Índice de foto no válido.' });
    }

    const photos = [...existingList];
    const removedPhoto = photos.splice(idx, 1)[0];
    const cleanPhotos = photos.filter(Boolean);

    let newThumb = video.thumbnailUrl;
    if (newThumb === removedPhoto || !cleanPhotos.includes(newThumb)) {
      newThumb = cleanPhotos.length > 0 ? cleanPhotos[0] : '';
    }

    const updated = db.updateVideo(video.id, { 
      detailPhotos: cleanPhotos,
      photos: cleanPhotos,
      thumbnailUrl: newThumb
    });
    res.json({ success: true, message: 'Foto eliminada con éxito.', video: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar foto.' });
  }
});

// ==========================================
// 2. RUTAS DE TIENDAS Y PERFILES VENDEDORES
// ==========================================

// Listado de tiendas (para barra de historias / spots superiores)
app.get('/api/stores', (req, res) => {
  res.json(db.getStores());
});

// Detalle de tienda con su catálogo de videos
app.get('/api/stores/:id', (req, res) => {
  const store = db.getStoreById(req.params.id);
  if (!store) return res.status(404).json({ error: 'Tienda no encontrada.' });

  const storeVideos = db.getVideos({ storeId: store.id });
  const cfg = db.getConfig();
  const prc = cfg.pricing || {};
  const isMembershipActive = Boolean(
    store.hasMembership && 
    store.membershipExpiresAt && 
    new Date(store.membershipExpiresAt) > new Date()
  );
  const memLimit = Number(store.membershipProductLimit) || Number(prc.membership_product_limit) || 100;

  res.json({
    store: {
      ...store,
      isMembershipActive,
      productsCount: storeVideos.length,
      membershipProductLimit: memLimit,
      welcome_status: db.getStoreWelcomeStatus(store.id)
    },
    videos: storeVideos
  });
}

);

// Registrar nueva tienda de negocio
app.post('/api/stores', (req, res) => {
  const { name, whatsapp, city, password, acceptedRules } = req.body;
  if (!name || !whatsapp) {
    return res.status(400).json({ error: 'Nombre de tienda y WhatsApp son obligatorios.' });
  }
  if (!acceptedRules) {
    return res.status(400).json({ error: 'Debes aceptar las Políticas de Seguridad y las 4 Reglas de Oro para activar tu tienda en VitrinaSpot.' });
  }

  // Formatear WhatsApp a estándar internacional
  let cleanWhatsApp = whatsapp.replace(/[^0-9]/g, '');
  if (cleanWhatsApp.length === 10 && !cleanWhatsApp.startsWith('57')) {
    cleanWhatsApp = `+57${cleanWhatsApp}`;
  } else if (!cleanWhatsApp.startsWith('+')) {
    cleanWhatsApp = `+${cleanWhatsApp}`;
  }

  const trimmedName = name.trim();
  const targetCity = city ? city.trim() : 'Bogotá';

  // Verificar si ya existe una tienda con este WhatsApp
  const stores = db.getStores();
  const existing = stores.find(s => {
    const sClean = (s.whatsapp || '').replace(/[^0-9]/g, '');
    const reqClean = cleanWhatsApp.replace(/[^0-9]/g, '');
    return sClean === reqClean;
  });

  // Validar que el nombre de la tienda no se repita en la misma ciudad
  const nameConflict = stores.find(s => {
    if (existing && s.id === existing.id) return false;
    const sName = (s.name || '').trim().toLowerCase();
    const sCity = (s.city || 'Bogotá').trim().toLowerCase();
    return sName === trimmedName.toLowerCase() && sCity === targetCity.toLowerCase();
  });

  if (nameConflict) {
    return res.status(400).json({ 
      error: `Nombre de tienda inválido: ya existe un negocio registrado como "${nameConflict.name}" en la ciudad de ${nameConflict.city}. A no ser que el filtro de ciudad sea diferente, debes ingresar un nombre de tienda diferente.` 
    });
  }

  if (existing) {
    // Si ya existe, actualizamos el nombre si cambió y devolvemos la sesión
    existing.name = trimmedName;
    existing.city = targetCity;
    db.save();
    return res.json({ success: true, store: existing, message: 'Ya existía una tienda con este WhatsApp. Has iniciado sesión.' });
  }

  const newStore = db.createStore({
    name: trimmedName,
    whatsapp: cleanWhatsApp,
    city: targetCity,
    password: password || '123',
    acceptedRules: true
  });

  res.status(201).json({ success: true, store: newStore });
});

// Iniciar sesión en tienda existente con WhatsApp y contraseña
app.post('/api/stores/login', (req, res) => {
  const { whatsapp, password } = req.body;
  if (!whatsapp) {
    return res.status(400).json({ error: 'Por favor ingresa tu número de WhatsApp.' });
  }

  let cleanWhatsApp = whatsapp.replace(/[^0-9]/g, '');
  if (cleanWhatsApp.length === 10 && !cleanWhatsApp.startsWith('57')) {
    cleanWhatsApp = `+57${cleanWhatsApp}`;
  } else if (!cleanWhatsApp.startsWith('+')) {
    cleanWhatsApp = `+${cleanWhatsApp}`;
  }

  const stores = db.getStores();
  const store = stores.find(s => {
    const sClean = (s.whatsapp || '').replace(/[^0-9]/g, '');
    const reqClean = cleanWhatsApp.replace(/[^0-9]/g, '');
    return sClean === reqClean;
  });

  if (!store) {
    return res.status(404).json({ error: 'No encontramos ninguna tienda registrada con ese número de WhatsApp. ¡Crea tu tienda gratis!' });
  }

  if (password && store.password && store.password !== password) {
    return res.status(401).json({ error: 'Contraseña incorrecta para esta tienda.' });
  }

  const cfg = db.getConfig();
  const prc = cfg.pricing || {};
  const isMembershipActive = Boolean(
    store.hasMembership && 
    store.membershipExpiresAt && 
    new Date(store.membershipExpiresAt) > new Date()
  );
  const memLimit = Number(store.membershipProductLimit) || Number(prc.membership_product_limit) || 100;
  const storeVideos = db.getVideosByStoreId(store.id);

  res.json({
    success: true,
    store: {
      ...store,
      isMembershipActive,
      productsCount: storeVideos.length,
      membershipProductLimit: memLimit,
      welcome_status: db.getStoreWelcomeStatus(store.id)
    }
  });
}

);

// Memoria volátil para códigos de recuperación OTP (expiran en 15 minutos)
const recoveryCodes = new Map();

// Solicitar código de recuperación por WhatsApp
app.post('/api/stores/forgot-password', (req, res) => {
  const { whatsapp } = req.body;
  if (!whatsapp) {
    return res.status(400).json({ error: 'Por favor ingresa tu número de WhatsApp registrado.' });
  }

  const cleanReq = whatsapp.replace(/[^0-9]/g, '');
  if (cleanReq.length < 7) {
    return res.status(400).json({ error: 'Número de WhatsApp inválido.' });
  }

  const stores = db.getStores();
  const store = stores.find(s => {
    const sClean = (s.whatsapp || '').replace(/[^0-9]/g, '');
    return sClean.endsWith(cleanReq.slice(-10)) || sClean === cleanReq;
  });

  if (!store) {
    return res.status(404).json({ error: 'No encontramos ninguna tienda registrada con ese número de WhatsApp. Verifica tu número o crea una tienda gratis.' });
  }

  // Generar código de seguridad de 4 dígitos (1000 - 9999)
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos de vigencia
  const keyWa = cleanReq.slice(-10);

  recoveryCodes.set(keyWa, {
    code,
    expiresAt,
    storeId: store.id
  });

  const fullCleanWa = (store.whatsapp || '').replace(/[^0-9]/g, '');

  res.json({
    success: true,
    message: 'Código de recuperación generado con éxito.',
    code,
    whatsapp: fullCleanWa,
    storeName: store.name
  });
}

);

// Verificar código y restablecer contraseña
app.post('/api/stores/reset-password', (req, res) => {
  const { whatsapp, code, newPassword } = req.body;

  if (!whatsapp || !code || !newPassword) {
    return res.status(400).json({ error: 'Por favor completa todos los campos (WhatsApp, código y nueva contraseña).' });
  }

  if (newPassword.trim().length < 3) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 3 caracteres.' });
  }

  const cleanReq = whatsapp.replace(/[^0-9]/g, '').slice(-10);
  const record = recoveryCodes.get(cleanReq);

  if (!record) {
    return res.status(400).json({ error: 'No hay ninguna solicitud de recuperación activa o el código ya venció. Solicita uno nuevo.' });
  }

  if (Date.now() > record.expiresAt) {
    recoveryCodes.delete(cleanReq);
    return res.status(400).json({ error: 'El código de seguridad ha expirado. Por favor solicita uno nuevo.' });
  }

  if (record.code !== code.trim()) {
    return res.status(400).json({ error: 'Código de seguridad incorrecto. Revisa el código de 4 dígitos enviado a tu WhatsApp.' });
  }

  // Actualizar contraseña en la tienda
  const updatedStore = db.updateStore(record.storeId, { password: newPassword.trim() });
  if (!updatedStore) {
    return res.status(404).json({ error: 'No se pudo actualizar la tienda en la base de datos.' });
  }

  // Descartar código usado
  recoveryCodes.delete(cleanReq);

  res.json({
    success: true,
    message: '¡Contraseña actualizada con éxito!',
    store: updatedStore
  });
}

);

// Actualizar perfil de la tienda (soporta tanto PUT como POST para compatibilidad móvil)
const handleStoreUpdate = async (req, res) => {
  const storeId = req.params.id;
  const currentStore = db.getStoreById(storeId);
  if (!currentStore) return res.status(404).json({ error: 'Tienda no encontrada.' });

  const updates = { ...req.body };
  const newName = updates.name ? updates.name.trim() : null;
  const targetCity = updates.city ? updates.city.trim() : (currentStore.city || 'Bogotá').trim();

  // Validar si el nuevo nombre ya existe en la misma ciudad para otra tienda
  if (newName) {
    const stores = db.getStores();
    const conflict = stores.find(s => 
      s.id !== storeId &&
      (s.name || '').trim().toLowerCase() === newName.toLowerCase() &&
      (s.city || 'Bogotá').trim().toLowerCase() === targetCity.toLowerCase()
    );
    if (conflict) {
      return res.status(400).json({
        error: `Nombre de tienda inválido: ya existe un negocio registrado como "${conflict.name}" en la ciudad de ${conflict.city}. A no ser que el filtro de ciudad sea diferente, debes ingresar un nombre de tienda diferente.`
      });
    }
  }

  if (req.file) {
    const finalPath = await ensureJpegCompatible(req.file.path);
    const dataUri = fileToDataUriIfReasonable(finalPath);
    updates.avatar = dataUri || `/uploads/thumbnails/${path.basename(finalPath)}`;
  }
  const updated = db.updateStore(storeId, updates);
  res.json({ success: true, store: updated });
};

app.put('/api/stores/:id', upload.single('avatar'), handleStoreUpdate);
app.post('/api/stores/:id', upload.single('avatar'), handleStoreUpdate);

// Eliminar cuenta de comercio definitivamente (Derecho de Supresión / Habeas Data)
app.delete('/api/stores/:id', (req, res) => {
  const storeId = req.params.id;
  const store = db.getStoreById(storeId);
  if (!store) {
    return res.status(404).json({ error: 'La tienda no existe o ya fue eliminada.' });
  }

  const { password } = req.body;
  if (!password || (store.password && store.password !== password.trim())) {
    return res.status(401).json({ error: 'Contraseña incorrecta. Por tu seguridad debes ingresar la contraseña correcta para eliminar la cuenta.' });
  }

  const deleted = db.deleteStore(storeId);
  if (!deleted) {
    return res.status(500).json({ error: 'No se pudo eliminar la tienda.' });
  }

  res.json({
    success: true,
    message: `La cuenta de "${deleted.name}" y todos sus productos han sido eliminados de VitrinaSpot exitosamente.`
  });
});

// Endpoint exclusivo para cambiar foto de perfil rápidamente
app.post('/api/stores/:id/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se envió ninguna foto.' });
  const finalPath = await ensureJpegCompatible(req.file.path);
  const dataUri = fileToDataUriIfReasonable(finalPath);
  const avatarUrl = dataUri || `/uploads/thumbnails/${path.basename(finalPath)}`;
  const updated = db.updateStore(req.params.id, { avatar: avatarUrl });
  if (!updated) return res.status(404).json({ error: 'Tienda no encontrada.' });
  res.json({ success: true, avatar: avatarUrl, store: updated });
});

// Calificar tienda con estrellas (1 a 5)
app.post('/api/stores/:id/rate', (req, res) => {
  const rating = Number(req.body.rating);
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Calificación inválida (debe ser 1 a 5 estrellas).' });
  }
  const result = db.rateStore(req.params.id, rating);
  if (!result) return res.status(404).json({ error: 'Tienda no encontrada.' });
  res.json({ success: true, ...result });
});

// Notificaciones para el vendedor
app.get('/api/notifications/:storeId', (req, res) => {
  res.json(db.getNotifications(req.params.storeId));
});

// Limpiar todas las notificaciones de la tienda
app.delete('/api/notifications/:storeId', (req, res) => {
  db.clearNotifications(req.params.storeId);
  res.json({ success: true, message: 'Notificaciones eliminadas correctamente.' });
});

// Eliminar una notificación individual
app.delete('/api/notifications/:storeId/:notifId', (req, res) => {
  db.deleteNotification(req.params.storeId, req.params.notifId);
  res.json({ success: true, message: 'Notificación eliminada.' });
});

// ==========================================
// 3. PAGOS AUTOMÁTICOS & MONETIZACIÓN (WOMPI / NEQUI)
// ==========================================

// Checkout: Comprar SPOT o Extensión de video (30s / 60s / Impulso de Video Existente)
app.post('/api/payments/checkout', (req, res) => {
  const { storeId, videoId, type, method, amount } = req.body;
  const store = db.getStoreById(storeId);
  if (!store) return res.status(404).json({ error: 'Tienda no encontrada.' });

  const config = db.getConfig();
  const prc = config.pricing || {};
  let typeLabel = 'Servicio Publicitario';
  let days = 0;
  let bLevel = 'standard';

  if (type === 'spot_boost_diamante' || type === 'spot_boost_extreme' || type === 'spot_7d') {
    days = Number(prc.boost_diamante_days) || Number(prc.boost_extreme_days) || 8;
    bLevel = 'diamante';
    typeLabel = `Impulso Diamante VIP (${days} Días)`;
  } else if (type === 'spot_boost_platino') {
    days = Number(prc.boost_platino_days) || 5;
    bLevel = 'platino';
    typeLabel = `Impulso Platino (${days} Días)`;
  } else if (type === 'boost_standard_standalone' || type === 'spot_boost_standard_only') {
    days = Number(prc.boost_standard_days) || 2;
    bLevel = 'standard';
    typeLabel = `Solo Impulso Estándar (${days} Días - Sin Spot)`;
  } else if (type === 'spot_boost_standard' || type === 'spot_boost_15s' || type === 'spot_boost_single_video') {
    days = Number(prc.boost_standard_days) || 2;
    bLevel = 'standard';
    typeLabel = `Impulso Estándar (${days} Días)`;
  } else if (type === 'membership_pro_monthly') {
    days = Number(prc.membership_pro_days) || 30;
    const limit = Number(prc.membership_product_limit) || 100;
    typeLabel = `Membresía Mensual Pro (${days} Días)`;
    db.activateMembership(storeId, days, limit);
  } else if (type === 'spot_permanent' || type === 'spot_permanent_pack') {
    typeLabel = 'Spot Permanente 7 Imágenes (Sin Impulso)';
  } else if (type === 'photos_7_pack' || type === 'photos_5_pack') {
    typeLabel = 'Publicación 7 Imágenes Gratis (Permanente)';
  } else if (type === 'spot_15d') {
    typeLabel = 'SPOT Destacado 15 Días';
    days = 15;
    bLevel = 'diamante';
  }

  // Si se envió un videoId específico para impulsar post-publicación
  let boostedVideo = null;
  if (videoId) {
    const vid = db.getVideoById(videoId);
    if (vid) {
      const vidExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      vid.hasSpot = true;
      vid.spotExpiresAt = vidExpiry;
      vid.boostLevel = bLevel;
      db.updateVideo(vid.id, { hasSpot: true, spotExpiresAt: vidExpiry, boostLevel: bLevel });
      boostedVideo = vid;

      // Actualizar tienda con vigencia armónica (máximo entre sus videos activos)
      db.recalculateStoreBoost(store.id);
    }
  } else if (days > 0 && !type.includes('membership') && !type.includes('permanent')) {
    // Si no se especificó un videoId único (compra general a nivel tienda), se impulsa la tienda y su catálogo
    db.activateSpot(storeId, days, bLevel);
  }

  // Calibración exacta de tarifa si no se especificó en el request
  let finalAmount = Number(amount) || 0;
  if (!finalAmount) {
    if (type.includes('diamante') || type.includes('extreme')) {
      finalAmount = Number(prc.boost_diamante_price || prc.boost_extreme_price) || 15000;
    } else if (type.includes('platino')) {
      finalAmount = Number(prc.boost_platino_price) || 10000;
    } else if (type.includes('standalone') || type.includes('standard_only')) {
      finalAmount = Number(prc.boost_standard_standalone_price) || 3500;
    } else if (type.includes('standard')) {
      finalAmount = Number(prc.boost_standard_price) || 5000;
    } else if (type.includes('membership')) {
      finalAmount = Number(prc.membership_pro_price) || 29000;
    } else if (type.includes('permanent')) {
      finalAmount = Number(prc.spot_permanent_price) || 3500;
    } else {
      finalAmount = Number(config.pricing[type]) || 5000;
    }
  }

  // Registrar transacción en el libro de cuentas del administrador
  const tx = db.addTransaction({
    storeId,
    storeName: store.name,
    type,
    typeLabel: boostedVideo ? `Impulso SPOT: ${boostedVideo.title}` : typeLabel,
    amount: finalAmount,
    method: method || 'wompi_nequi',
    status: 'approved'
  });

  const updatedStore = db.getStoreById(storeId);
  const isMembershipActive = Boolean(
    updatedStore.hasMembership && 
    updatedStore.membershipExpiresAt && 
    new Date(updatedStore.membershipExpiresAt) > new Date()
  );
  const memLimit = Number(updatedStore.membershipProductLimit) || Number(prc.membership_product_limit) || 100;
  const storeVideos = db.getVideosByStoreId(storeId);

  res.json({
    success: true,
    message: `¡Pago exitoso! ${boostedVideo ? 'Tu producto "' + boostedVideo.title + '"' : 'Tu ' + typeLabel} ha sido activado.`,
    transaction: tx,
    store: {
      ...updatedStore,
      isMembershipActive,
      productsCount: storeVideos.length,
      membershipProductLimit: memLimit
    },
    video: boostedVideo
  });
}

);

// Endpoint exclusivo para impulsar un producto existente post-publicación
app.post('/api/videos/:id/boost', (req, res) => {
  const video = db.getVideoById(req.params.id);
  if (!video) return res.status(404).json({ error: 'Producto no encontrado.' });
  const store = db.getStoreById(video.storeId);
  const cfg = db.getConfig();
  const prc = cfg.pricing || {};

  const bType = req.body.boostType || (req.body.isExtreme ? 'diamante' : 'standard');
  const isDiam = bType === 'diamante' || bType === 'extreme';
  const isPlat = bType === 'platino';
  const isStd = !isDiam && !isPlat;

  let boostDays = 2;
  let boostAmount = 5000;
  let boostLevel = 'standard';

  if (isDiam) {
    boostDays = Number(prc.boost_diamante_days) || Number(prc.boost_extreme_days) || 8;
    boostAmount = Number(prc.boost_diamante_price) || Number(prc.boost_extreme_price) || 15000;
    boostLevel = 'diamante';
  } else if (isPlat) {
    boostDays = Number(prc.boost_platino_days) || 5;
    boostAmount = Number(prc.boost_platino_price) || 10000;
    boostLevel = 'platino';
  } else {
    boostDays = Number(prc.boost_standard_days) || 2;
    boostAmount = Number(prc.boost_standard_standalone_price) || 3500;
    boostLevel = 'standard';
  }

  const boostExpiry = new Date(Date.now() + boostDays * 24 * 60 * 60 * 1000).toISOString();
  
  video.hasSpot = true;
  video.spotExpiresAt = boostExpiry;
  video.boostLevel = boostLevel;
  db.updateVideo(video.id, { hasSpot: true, spotExpiresAt: boostExpiry, boostLevel: video.boostLevel });
  
  if (store) {
    db.recalculateStoreBoost(store.id);
  }
  
  const tx = db.addTransaction({
    storeId: video.storeId,
    storeName: video.storeName,
    type: `spot_boost_${boostLevel}`,
    typeLabel: `Impulso ${boostLevel.toUpperCase()} (${boostDays}d): ${video.title}`,
    amount: boostAmount,
    method: req.body.method || 'wompi_nequi',
    status: 'approved'
  });
  
  res.json({
    success: true,
    message: `🚀 ¡Producto impulsado con éxito (${boostLevel.toUpperCase()}) durante ${boostDays} días!`,
    video,
    transaction: tx
  });
}

);

// Endpoint de purga total a modo virgen (0 tiendas, 0 perfiles, 0 publicaciones)
app.post('/api/admin/clean-to-virgin', (req, res) => {
  try {
    const token = req.headers['x-admin-token'];
    const config = db.getConfig();
    if (token && token !== config.admin?.token) {
      return res.status(403).json({ error: 'Acceso Denegado 403: Zona de Administración Privada.' });
    }
    const result = db.resetToVirginState();
    res.json({
      success: true,
      message: `¡Modo Virgen activado! Se purgaron ${result.removedStores} tiendas y ${result.removedVideos} anuncios. La plataforma quedó en cero perfiles, lista para el ingreso de suscriptores reales.`,
      result
    });
  } catch (err) {
    console.error('Error restableciendo a modo virgen:', err);
    res.status(500).json({ error: 'Error al restablecer a modo virgen.' });
  }
});

// Endpoint de limpieza oficial de datos de prueba conservando negocios reales
app.post('/api/admin/clean-demo-data', (req, res) => {
  try {
    const result = db.cleanDemoData();
    res.json({
      success: true,
      message: `¡Limpieza completada! Se eliminaron ${result.removedStores} tiendas y ${result.removedVideos} videos de prueba. Tus comercios reales se mantienen 100% seguros.`,
      result
    });
  } catch (err) {
    console.error('Error limpiando datos de prueba:', err);
    res.status(500).json({ error: 'Error al limpiar datos de demostración.' });
  }
});

// Generar Firma de Integridad SHA-256 oficial para Wompi Bancolombia
app.get('/api/wompi/signature', (req, res) => {
  try {
    const { reference, amountInCents, currency = 'COP' } = req.query;
    if (!reference || !amountInCents) {
      return res.status(400).json({ error: 'Faltan parámetros: reference y amountInCents son requeridos.' });
    }

    const wompiConfig = db.getConfig().wompi || {};
    const integritySecret = wompiConfig.integritySecret || '';
    const isLive = Boolean(wompiConfig.isLive || wompiConfig.publicKey?.startsWith('pub_prod_'));
    
    // Concatenación oficial Wompi: <Referencia><MontoEnCentavos><Moneda><SecretoDeIntegridad>
    const stringToHash = `${reference}${amountInCents}${currency}${integritySecret}`;
    const signature = crypto.createHash('sha256').update(stringToHash).digest('hex');

    res.json({
      success: true,
      signature,
      reference,
      amountInCents: Number(amountInCents),
      currency,
      publicKey: wompiConfig.publicKey || '',
      isLive
    });
  } catch (err) {
    console.error('Error generando firma de integridad Wompi:', err);
    res.status(500).json({ error: 'Error al generar firma Wompi.' });
  }
});

// Verificación y Healthcheck para validación de URL de eventos de Wompi Bancolombia
app.get('/api/wompi/webhook', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'VitrinaSpot Wompi Webhook Receiver', ready: true });
});
app.head('/api/wompi/webhook', (req, res) => {
  res.status(200).end();
});

// Webhook para pagos en vivo de Wompi Bancolombia
app.post('/api/wompi/webhook', (req, res) => {
  try {
    const event = req.body;
    console.log('🔔 Evento Webhook Wompi recibido:', event?.event);

    if (event && event.data && event.data.transaction) {
      const txData = event.data.transaction;
      const txStatus = (txData.status || '').toUpperCase();
      const amountCOP = Math.round((txData.amount_in_cents || 0) / 100);
      const reference = txData.reference || '';

      console.log(`💳 Transacción Wompi ID [${txData.id}] - Estado: ${txStatus} - Ref: ${reference} - $${amountCOP} COP`);

      if (txStatus === 'APPROVED') {
        let storeId = null;
        let planType = 'spot_boost_standard';
        let videoId = null;

        // Soporte para formato de referencia: REF__{storeId}__{planType}__{videoId}__{timestamp}
        if (reference.startsWith('REF__')) {
          const parts = reference.split('__');
          storeId = parts[1] || null;
          planType = parts[2] || 'spot_boost_standard';
          videoId = parts[3] && parts[3] !== 'novid' ? parts[3] : null;
        } else if (reference.startsWith('REF_')) {
          const parts = reference.split('_');
          storeId = parts[1] || null;
          planType = parts[2] || 'spot_boost_standard';
          videoId = parts[3] && parts[3] !== 'novid' ? parts[3] : null;
        }

        const store = storeId ? db.getStoreById(storeId) : null;
        const config = db.getConfig();
        const prc = config.pricing || {};
        let typeLabel = 'Servicio Publicitario Wompi';

        // Evitar duplicación si el webhook se reintenta
        const existingTx = db.getTransactions().find(t => t.id === txData.id || t.reference === reference);

        if (!existingTx && store) {
          let days = 0;
          let bLevel = 'standard';
          if (planType === 'spot_boost_diamante' || planType === 'spot_boost_extreme' || planType === 'spot_7d') {
            days = Number(prc.boost_diamante_days) || Number(prc.boost_extreme_days) || 8;
            bLevel = 'diamante';
            typeLabel = `Impulso Diamante VIP (${days} Días)`;
          } else if (planType === 'spot_boost_platino') {
            days = Number(prc.boost_platino_days) || 5;
            bLevel = 'platino';
            typeLabel = `Impulso Platino (${days} Días)`;
          } else if (planType === 'boost_standard_standalone' || planType === 'spot_boost_standard_only') {
            days = Number(prc.boost_standard_days) || 2;
            bLevel = 'standard';
            typeLabel = `Solo Impulso Estándar (${days} Días - Sin Spot)`;
          } else if (planType === 'spot_boost_standard' || planType === 'spot_boost_15s' || planType === 'spot_boost_single_video') {
            days = Number(prc.boost_standard_days) || 2;
            bLevel = 'standard';
            typeLabel = `Impulso Estándar (${days} Días)`;
          } else if (planType === 'membership_pro_monthly') {
            days = Number(prc.membership_pro_days) || 30;
            const limit = Number(prc.membership_product_limit) || 100;
            typeLabel = `Membresía Mensual Pro (${days} Días)`;
            db.activateMembership(storeId, days, limit);
          } else if (planType === 'spot_permanent' || planType === 'spot_permanent_pack') {
            typeLabel = 'Spot Permanente 7 Imágenes (Sin Impulso)';
          } else if (planType === 'photos_7_pack' || planType === 'photos_5_pack') {
            typeLabel = 'Publicación 7 Imágenes Gratis (Permanente)';
          }

          // Si vino asociado a un video
          let boostedVideo = null;
          if (videoId) {
            const vid = db.getVideoById(videoId);
            if (vid) {
              const vidExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
              vid.hasSpot = true;
              vid.spotExpiresAt = vidExpiry;
              vid.boostLevel = bLevel;
              db.updateVideo(vid.id, { hasSpot: true, spotExpiresAt: vidExpiry, boostLevel: bLevel });
              boostedVideo = vid;

              db.recalculateStoreBoost(store.id);
            }
          } else if (days > 0 && !planType.includes('membership') && !planType.includes('permanent')) {
            db.activateSpot(storeId, days, bLevel);
          }

          db.addTransaction({
            id: txData.id || `tx-wompi-${Date.now()}`,
            reference,
            storeId,
            storeName: store.name,
            type: planType,
            typeLabel: boostedVideo ? `Impulso SPOT: ${boostedVideo.title}` : typeLabel,
            amount: amountCOP,
            method: `wompi_${(txData.payment_method_type || 'online').toLowerCase()}`,
            status: 'approved',
            wompiTransactionId: txData.id
          });

          console.log(`✅ Webhook Wompi: Activación exitosa de ${typeLabel} para tienda "${store.name}".`);
        }
      }
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error procesando Webhook Wompi:', err);
    res.status(200).json({ received: true, error: err.message });
  }
});

// ==========================================
// 4. PANEL DE CONTROL MAESTRO (ADMINISTRADOR)
// ==========================================

// Login de administrador
app.post('/api/admin/login', (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  const password = (req.body?.password || '').trim();
  const adminConf = db.getConfig().admin;

  if (email === adminConf.email.toLowerCase() && password === adminConf.password) {
    res.json({
      success: true,
      token: adminConf.token,
      admin: { email: adminConf.email, name: 'Super Administrador VitrinaSpot' }
    });
  } else {
    res.status(401).json({ error: 'Credenciales de administrador incorrectas.' });
  }
});

// Métricas ejecutivas completas para el Administrador
app.get('/api/admin/metrics', (req, res) => {
  const token = req.headers['x-admin-token'];
  const config = db.getConfig();

  if (token !== config.admin.token) {
    return res.status(403).json({ error: 'Acceso Denegado 403: Zona de Administración Privada.' });
  }

  const transactions = db.getTransactions();
  const totalRevenue = transactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const spotsRevenue = transactions
    .filter(t => t.type?.startsWith('spot_') && t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const videosRevenue = transactions
    .filter(t => t.type?.startsWith('video_') && t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const stores = db.getStores();
  const videos = db.getVideos({});

  // Top 10 tiendas con más contactos a WhatsApp
  const storeClicksMap = {};
  videos.forEach(v => {
    storeClicksMap[v.storeName] = (storeClicksMap[v.storeName] || 0) + (v.whatsappClicks || 0);
  });
  const topStores = Object.entries(storeClicksMap)
    .map(([name, clicks]) => ({ name, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  res.json({
    revenue: {
      total: totalRevenue,
      spots: spotsRevenue,
      extendedVideos: videosRevenue,
      formattedTotal: `$${totalRevenue.toLocaleString('es-CO')} COP`
    },
    telemetry: {
      totalWhatsAppClicks: config.telemetry.totalWhatsAppClicks,
      totalViews: config.telemetry.totalViews
    },
    counts: {
      stores: stores.length,
      videos: videos.length,
      spotsActive: stores.filter(s => s.hasSpot).length,
      reports: config.reports.length
    },
    topStores,
    pricing: config.pricing,
    launch_campaign: db.getLaunchCampaign(),
    admob: config.admob || {
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
    },
    admob: config.admob || {
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
    },
    wompi: config.wompi,
    reports: config.reports,
    recentTransactions: transactions.slice(0, 15)
  });
}

);

// Obtener tarifas y tiempos oficiales de la plataforma (público para la app)
app.get('/api/pricing', (req, res) => {
  const config = db.getConfig();
  const pricing = config.pricing || {};
  res.json({
    success: true,
    pricing: {
      free_spots_quota: Number(pricing.free_spots_quota) || 5,
      spot_permanent_price: Number(pricing.spot_permanent_price) || 3500,
      boost_standard_standalone_price: Number(pricing.boost_standard_standalone_price) || 3500,
      photos_5_price: 0,
      boost_standard_price: Number(pricing.boost_standard_price) || 5000,
      boost_standard_days: Number(pricing.boost_standard_days) || 2,
      boost_platino_price: Number(pricing.boost_platino_price) || 10000,
      boost_platino_days: Number(pricing.boost_platino_days) || 5,
      boost_diamante_price: Number(pricing.boost_diamante_price) || 15000,
      boost_diamante_days: Number(pricing.boost_diamante_days) || 8,
      boost_extreme_price: Number(pricing.boost_diamante_price || pricing.boost_extreme_price) || 15000,
      boost_extreme_days: Number(pricing.boost_diamante_days || pricing.boost_extreme_days) || 8,
      membership_pro_price: Number(pricing.membership_pro_price) || 29000,
      membership_pro_days: Number(pricing.membership_pro_days) || 30,
      membership_product_limit: Number(pricing.membership_product_limit) || 100,
      currency: pricing.currency || "COP"
    },
    public_url: config.public_url || "https://eco-dock-chart-locking.trycloudflare.com",
    launch_campaign: db.getLaunchCampaign(),
    admob: config.admob || {
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
    }
  });
});

// Actualizar URL pública oficial de la plataforma desde el panel de Administrador
app.post('/api/admin/public-url', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== db.getConfig().admin.token) {
    return res.status(403).json({ error: 'Acceso Denegado.' });
  }

  const updatedUrl = db.updatePublicUrl(req.body.public_url);
  res.json({ success: true, public_url: updatedUrl });
});

// Actualizar tarifas dinámicas y tiempos de impulso desde el panel de Administrador
app.post('/api/admin/pricing', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== db.getConfig().admin.token) {
    return res.status(403).json({ error: 'Acceso Denegado.' });
  }

  const newPrices = {
    free_spots_quota: Number(req.body.free_spots_quota) || 5,
    spot_permanent_price: Number(req.body.spot_permanent_price) || 3500,
    boost_standard_standalone_price: Number(req.body.boost_standard_standalone_price) || 3500,
    photos_5_price: 0,
    boost_standard_price: Number(req.body.boost_standard_price) || 5000,
    boost_standard_days: Number(req.body.boost_standard_days) || 2,
    boost_platino_price: Number(req.body.boost_platino_price) || 10000,
    boost_platino_days: Number(req.body.boost_platino_days) || 5,
    boost_diamante_price: Number(req.body.boost_diamante_price) || 15000,
    boost_diamante_days: Number(req.body.boost_diamante_days) || 8,
    boost_extreme_price: Number(req.body.boost_diamante_price || req.body.boost_extreme_price) || 15000,
    boost_extreme_days: Number(req.body.boost_diamante_days || req.body.boost_extreme_days) || 8,
    membership_pro_price: Number(req.body.membership_pro_price) || 29000,
    membership_pro_days: Number(req.body.membership_pro_days) || 30,
    membership_product_limit: Number(req.body.membership_product_limit) || 100,
    currency: req.body.currency || "COP"
  };

  const updatedPricing = db.updatePricing(newPrices);
  res.json({ success: true, pricing: updatedPricing });
});

// Actualizar configuración de la Campaña de Lanzamiento Pioneros desde el panel de Administrador
app.post('/api/admin/launch-campaign', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== db.getConfig().admin.token) {
    return res.status(403).json({ error: 'Acceso Denegado.' });
  }

  const updated = db.updateLaunchCampaign({
    welcome_pack_enabled: req.body.welcome_pack_enabled,
    free_welcome_products_quota: req.body.free_welcome_products_quota,
    pioneers_target: req.body.pioneers_target,
    lock_boosts_until_target: req.body.lock_boosts_until_target
  });

  res.json({ success: true, launch_campaign: updated });
});

// Actualizar llaves y credenciales de Wompi Bancolombia desde el panel de Administrador
app.post('/api/admin/wompi-config', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== db.getConfig().admin.token) {
    return res.status(403).json({ error: 'Acceso Denegado.' });
  }

  const updatedWompi = db.updateWompiConfig({
    publicKey: req.body.publicKey,
    integritySecret: req.body.integritySecret,
    eventSecret: req.body.eventSecret,
    isLive: typeof req.body.isLive === 'boolean' ? req.body.isLive : req.body.isLive === 'true',
    nequiManualNumber: req.body.nequiManualNumber,
    daviplataManualNumber: req.body.daviplataManualNumber
  });

  res.json({ success: true, wompi: updatedWompi });
});

// Actualizar configuración oficial de Google AdMob desde el panel de Administrador
app.post('/api/admin/admob-config', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== db.getConfig().admin.token) {
    return res.status(403).json({ error: 'Acceso Denegado.' });
  }

  const updatedAdmob = db.updateAdMobConfig({
    enabled: req.body.enabled,
    publisherId: req.body.publisherId,
    feedAdFrequency: req.body.feedAdFrequency,
    boostStdDays: req.body.boostStdDays,
    boostDiamDays: req.body.boostDiamDays,
    interstitialOnUpload: req.body.interstitialOnUpload,
    testMode: req.body.testMode,
    bannerUnitId: req.body.bannerUnitId,
    rewardedUnitId: req.body.rewardedUnitId,
    interstitialUnitId: req.body.interstitialUnitId
  });

  res.json({ success: true, admob: updatedAdmob });
});

// ==========================================
// 5. STREAMING DE VIDEO EN TIEMPO REAL (HTTP 206)
// ==========================================
app.get('/api/stream/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(videosDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo de video no encontrado.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska'
  };
  const contentType = mimeTypes[ext] || 'video/mp4';

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send(`Rango no satisfacible: ${start} >= ${fileSize}`);
      return;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

// ==========================================
// 3.0 AUTOMATIZACIÓN DE IMPULSOS Y VENCIMIENTOS (DAEMON EN SEGUNDO PLANO)
// ==========================================
// Limpieza inicial y rutina periódica cada 10 minutos
try {
  db.cleanExpiredSpotsAndMemberships();
} catch (err) {
  console.error('Error en inicialización de vencimientos:', err);
}

setInterval(() => {
  try {
    const cleaned = db.cleanExpiredSpotsAndMemberships();
    if (cleaned) {
      console.log('🔄 [Daemon] Vencimientos de spots y membresías procesados con éxito.');
    }
  } catch (err) {
    console.error('Error en daemon de vencimientos de impulsos:', err);
  }
}, 10 * 60 * 1000);

// Iniciar servidor en 0.0.0.0 con soporte para PostgreSQL Cloud
async function startServer() {
  if (typeof db.initAsync === 'function') {
    try {
      await db.initAsync();
    } catch (err) {
      console.error('Error inicializando motor de base de datos:', err);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 VitrinaSpot Server corriendo con éxito:`);
    console.log(`   - Local:    http://localhost:${PORT}`);
    console.log(`   - En Red:   http://192.168.1.10:${PORT}`);
    console.log(`   - Admin:    http://localhost:${PORT}/admin`);
    console.log(`=======================================================`);
  });
}

startServer();
