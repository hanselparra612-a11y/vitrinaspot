import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c12"/>
      <stop offset="50%" stop-color="#121622"/>
      <stop offset="100%" stop-color="#08090d"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffe259"/>
      <stop offset="50%" stop-color="#ffa751"/>
      <stop offset="100%" stop-color="#ffb800"/>
    </linearGradient>
    <radialGradient id="ambientGold" cx="50%" cy="30%" r="55%">
      <stop offset="0%" stop-color="rgba(255, 184, 0, 0.22)"/>
      <stop offset="60%" stop-color="rgba(255, 184, 0, 0.03)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>

  <!-- Fondo base -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <circle cx="600" cy="210" r="420" fill="url(#ambientGold)"/>
  <circle cx="1080" cy="90" r="280" fill="rgba(134, 59, 255, 0.12)"/>
  <circle cx="120" cy="540" r="280" fill="rgba(255, 184, 0, 0.08)"/>

  <!-- Placa Superior Oficial -->
  <g transform="translate(435, 55)">
    <rect width="330" height="38" rx="19" fill="rgba(255, 184, 0, 0.12)" stroke="rgba(255, 184, 0, 0.4)" stroke-width="1.5"/>
    <text x="165" y="24" fill="#ffc83b" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" letter-spacing="2">COLOMBIA - PLATAFORMA OFICIAL</text>
  </g>

  <!-- Gran Título de Marca: SPOT PLAY & SPOT VITRINA -->
  <g transform="translate(600, 195)">
    <text x="0" y="0" fill="url(#goldGrad)" font-family="Arial, sans-serif" font-size="80" font-weight="900" text-anchor="middle" letter-spacing="-1">SPOT PLAY</text>
    <text x="0" y="46" fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="800" text-anchor="middle" letter-spacing="5">&amp; SPOT VITRINA</text>
  </g>

  <!-- Subtítulo -->
  <g transform="translate(600, 298)">
    <text x="0" y="0" fill="#cbd5e0" font-family="Arial, sans-serif" font-size="21" font-weight="500" text-anchor="middle">Videos Cortos, Transmisiones en Vivo y Catálogo Comercial Directo</text>
  </g>

  <!-- 3 Tarjetas de Características Destacadas -->
  <!-- Tarjeta 1: Feed de Videos -->
  <g transform="translate(140, 355)">
    <rect width="280" height="155" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,184,0,0.25)" stroke-width="1.5"/>
    <circle cx="55" cy="52" r="26" fill="rgba(255, 184, 0, 0.15)"/>
    <text x="55" y="60" fill="#ffc83b" font-family="Arial, sans-serif" font-size="22" text-anchor="middle">&#9658;</text>
    <text x="96" y="48" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="bold">Spot Play Feed</text>
    <text x="96" y="68" fill="#a0aec0" font-family="Arial, sans-serif" font-size="13">Videos cortos y virales</text>
    <text x="24" y="112" fill="#718096" font-family="Arial, sans-serif" font-size="13">Entretenimiento de creadores</text>
    <text x="24" y="132" fill="#ffc83b" font-family="Arial, sans-serif" font-size="12" font-weight="600">&#9733; SpotCoins y Regalos</text>
  </g>

  <!-- Tarjeta 2: Spot Vitrina -->
  <g transform="translate(460, 355)">
    <rect width="280" height="155" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,184,0,0.35)" stroke-width="1.5"/>
    <circle cx="55" cy="52" r="26" fill="rgba(255, 184, 0, 0.22)"/>
    <text x="55" y="60" fill="#ffc83b" font-family="Arial, sans-serif" font-size="22" text-anchor="middle">&#9733;</text>
    <text x="96" y="48" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="bold">Spot Vitrina</text>
    <text x="96" y="68" fill="#a0aec0" font-family="Arial, sans-serif" font-size="13">Catálogo y comercios</text>
    <text x="24" y="112" fill="#718096" font-family="Arial, sans-serif" font-size="13">Exhibición comercial directa</text>
    <text x="24" y="132" fill="#ffc83b" font-family="Arial, sans-serif" font-size="12" font-weight="600">&#10004; Tu tienda en Colombia</text>
  </g>

  <!-- Tarjeta 3: Pedidos WhatsApp -->
  <g transform="translate(780, 355)">
    <rect width="280" height="155" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(37,211,102,0.3)" stroke-width="1.5"/>
    <circle cx="55" cy="52" r="26" fill="rgba(37, 211, 102, 0.2)"/>
    <text x="55" y="60" fill="#25d366" font-family="Arial, sans-serif" font-size="22" text-anchor="middle">&#9993;</text>
    <text x="96" y="48" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="bold">Chat WhatsApp</text>
    <text x="96" y="68" fill="#a0aec0" font-family="Arial, sans-serif" font-size="13">Contacto directo al vendedor</text>
    <text x="24" y="112" fill="#718096" font-family="Arial, sans-serif" font-size="13">Sin comisiones ni intermediarios</text>
    <text x="24" y="132" fill="#25d366" font-family="Arial, sans-serif" font-size="12" font-weight="600">&#10004; Trato 100% directo</text>
  </g>

  <!-- Pie con URL oficial -->
  <g transform="translate(600, 565)">
    <text x="0" y="0" fill="#ffb800" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="1">https://spotplay-1.onrender.com</text>
    <text x="0" y="22" fill="#718096" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">Disponible en Web PWA y Aplicación Móvil Android</text>
  </g>
</svg>`;

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
const pngData = resvg.render().asPng();

// Guardar en VitrinaSpot public/icons
fs.writeFileSync('public/icons/spotplay-vitrina-banner.png', pngData);
fs.writeFileSync('public/icons/spotplay-vitrina-banner.jpg', pngData);
fs.writeFileSync('public/icons/vitrinaspot-brand-logo.jpg', pngData); // Reemplaza la imagen antigua del toldo

// Guardar también en Spot Play public/
try {
  fs.writeFileSync('../nuevo proyecto 1986/public/spotplay-vitrina-banner.png', pngData);
  fs.writeFileSync('../nuevo proyecto 1986/public/spotplay-vitrina-banner.jpg', pngData);
} catch (e) {
  console.log('Error copying to Spot Play:', e.message);
}

console.log('SUCCESS: Banner created with size', pngData.length, 'bytes');
