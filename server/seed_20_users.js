import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

if (!fs.existsSync(DB_FILE)) {
  console.error("El archivo database.json no existe.");
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

if (!db.stores) db.stores = [];
if (!db.videos) db.videos = [];

console.log(`Estado inicial: ${db.stores.length} tiendas, ${db.videos.length} spots.`);

// Listado de 20 Tiendas Nuevas y Realistas
const NEW_STORES_DATA = [
  {
    name: "Arepas & Café Paisa",
    city: "Medellín",
    whatsapp: "+573001234001",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&auto=format&fit=crop&q=80",
    description: "Arepas tradicionales de choclo al carbón y café de origen antioqueño. Domicilios rápidos en Medellín y Envigado.",
    address: "Cra. 43A # 18 Sur-35, El Poblado",
    hours: "Lun - Dom: 7:00 AM - 9:00 PM",
    paymentMethods: ["Nequi", "Bancolombia", "Daviplata", "Efectivo contraentrega"],
    rating: 4.9,
    ratingCount: 52,
    hasSpot: true,
    boostDays: 7,
    spots: [
      {
        title: "Arepas de Choclo con Queso Campesino",
        price: 14000,
        delivery: "🛵 Domicilio Gratis en Medellín",
        category: "Comida / Restaurantes",
        keywords: "arepas, choclo, queso, desayuno, comida rapida, medellin",
        description: "Arepas 100% maíz tierno asadas al carbón con abundante queso campesino fresco derretido. Pedidos al instante.",
        thumb: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Café Especial de Origen Antioquia 500g",
        price: 38000,
        delivery: "📦 Envíos a todo el país",
        category: "Comida / Restaurantes",
        keywords: "cafe, cafe especial, grano, molido, antioquia, exportacion",
        description: "Café arábico tostado medio con notas a caramelo y chocolate. Cosechado en Fredonia a 1.800 msnm.",
        thumb: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Desayuno Típico Montañero a Domicilio",
        price: 25000,
        delivery: "🛵 Domicilio Incluido",
        category: "Comida / Restaurantes",
        keywords: "desayuno, tipico, calentao, huevos, chocolate, arepa",
        description: "Calentao de frijol campesino, huevos al gusto, arepa con quesito y chocolate caliente en termo.",
        thumb: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "D'Cuero Artesanías",
    city: "Bogotá",
    whatsapp: "+573102345002",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&auto=format&fit=crop&q=80",
    description: "Marroquinería fina y calzado en cuero 100% vacuno en el barrio Restrepo de Bogotá. Garantía total de 1 año.",
    address: "Calle 17 Sur # 22-10, Barrio Restrepo",
    hours: "Lun - Sáb: 9:00 AM - 7:00 PM",
    paymentMethods: ["Nequi", "Daviplata", "Tarjetas", "Contraentrega"],
    rating: 4.8,
    ratingCount: 38,
    hasSpot: true,
    boostDays: 5,
    spots: [
      {
        title: "Chaqueta Biker en Cuero Genuino",
        price: 290000,
        delivery: "📦 Envío Gratis Nacional",
        category: "Moda / Calzado",
        keywords: "chaqueta, cuero, biker, moto, moda masculina, bogota",
        description: "Chaqueta clásica para hombre y dama con forro térmico y cierres metálicos inoxidables de alta durabilidad.",
        thumb: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Billetera y Cinturón en Cuero Café",
        price: 85000,
        delivery: "🛵 Domicilio en Bogotá $6.000",
        category: "Moda / Calzado",
        keywords: "billetera, cinturon, combo, cuero, regalo, hombre",
        description: "Combo ejecutivo en caja de regalo de lujo. Cuero graneado que no se cuartea con ranuras para 8 tarjetas.",
        thumb: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Botas Todo Terreno para Hombre",
        price: 210000,
        delivery: "📦 Envíos Contraentrega",
        category: "Moda / Calzado",
        keywords: "botas, hombre, cuero, senderismo, trabajo, suela tractor",
        description: "Botas de cuero nobuck con suela vulcanizada tractor antideslizante, plantilla ortopédica ultra cómoda.",
        thumb: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "TechZone Colombia",
    city: "Bogotá",
    whatsapp: "+573113456003",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80",
    description: "Importadores de tecnología, gadgets, smartwatches y accesorios para celulares con garantía de 6 meses.",
    address: "Carrera 15 # 77-05, Unilago",
    hours: "Lun - Sáb: 9:30 AM - 7:00 PM",
    paymentMethods: ["Nequi", "Daviplata", "PSE", "Tarjetas"],
    rating: 4.7,
    ratingCount: 65,
    hasSpot: true,
    boostDays: 6,
    spots: [
      {
        title: "Audífonos Inalámbricos Bluetooth ANC",
        price: 120000,
        delivery: "📦 Envíos a Nivel Nacional",
        category: "Tecnología",
        keywords: "audifonos, bluetooth, cancelacion ruido, anc, musica",
        description: "Cancelación activa de ruido, batería de hasta 28 horas con estuche de carga y graves profundos Hi-Fi.",
        thumb: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Soporte Metálico para Portátil Ajustable",
        price: 55000,
        delivery: "🛵 Domicilio Rápido",
        category: "Tecnología",
        keywords: "soporte, portatil, laptop, ergonomico, aluminio, oficina",
        description: "Fabricado en aleación de aluminio plegable con 7 niveles de inclinación y almohadillas de silicona.",
        thumb: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Sabor Valluno & Cholados",
    city: "Cali",
    whatsapp: "+573124567004",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=80",
    description: "Auténticos manjares del Valle del Cauca: cholados, luladas, empanadas y aborrajados en el corazón de Cali.",
    address: "Carrera 34 # 3-12, Parque del Perro",
    hours: "Todos los días: 11:00 AM - 10:00 PM",
    paymentMethods: ["Nequi", "Daviplata", "Efectivo"],
    rating: 5.0,
    ratingCount: 94,
    hasSpot: true,
    boostDays: 4,
    spots: [
      {
        title: "Cholado Tradicional con Frutas y Helado",
        price: 15000,
        delivery: "🛵 Domicilio en Cali",
        category: "Comida / Restaurantes",
        keywords: "cholado, cali, frutas, lulo, maracuya, lecherita, helado",
        description: "Hielo frappeado con jarabes de fruta natural, banano, fresa, piña, maracuyá, leche condensada y bola de helado.",
        thumb: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Empanadas Vallunas con Ají Pique (x10)",
        price: 22000,
        delivery: "🛵 Domicilio Caliente",
        category: "Comida / Restaurantes",
        keywords: "empanadas, vallunas, aji, carne, crocantes, pasabocas",
        description: "Masa de maíz crocante rellena de carne desmechada y papa criolla con ají casero y limón.",
        thumb: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Champús Valluno Casero Frío 1L",
        price: 18000,
        delivery: "🛵 Entrega Inmediata",
        category: "Comida / Restaurantes",
        keywords: "champus, bebida, lulo, piña, maiz, cali, tradicional",
        description: "Bebida ancestral valluna preparada con maíz quebrado, melao de panela, lulo en trozos, piña y hojas de naranjo.",
        thumb: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Boutique Esmeralda",
    city: "Barranquilla",
    whatsapp: "+573135678005",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80",
    description: "Moda femenina fresca, vestidos de lino, accesorios y artesanías costeñas de alta costura.",
    address: "Calle 84 # 51B-22, Alto Prado",
    hours: "Lun - Sáb: 10:00 AM - 7:30 PM",
    paymentMethods: ["Nequi", "Daviplata", "Tarjetas", "Contraentrega"],
    rating: 4.9,
    ratingCount: 47,
    hasSpot: true,
    boostDays: 6,
    spots: [
      {
        title: "Vestido Playero en Lino Tropical",
        price: 145000,
        delivery: "📦 Envíos a Toda Colombia",
        category: "Moda / Calzado",
        keywords: "vestido, lino, playa, moda mujer, barranquilla, fresco",
        description: "Diseño fresco con tirantes ajustables, tela transpirable ideal para climas cálidos o vacaciones.",
        thumb: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Sandalias Planas en Cuero Dorado",
        price: 78000,
        delivery: "🛵 Domicilio Gratis en Barranquilla",
        category: "Moda / Calzado",
        keywords: "sandalias, calzado dama, cuero dorado, verano, elegantes",
        description: "Plantilla confort con acabado brillante en cuero sintético de alta resistencia y herraje fino.",
        thumb: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Bolso Wayúu Tejido a Mano Original",
        price: 110000,
        delivery: "📦 Envío Nacional Seguro",
        category: "Moda / Calzado",
        keywords: "bolso, mochila, wayuu, artesania, tejido, la guajira",
        description: "Mochila wayúu original tejida en un hilo por artesanas de La Guajira con diseños geométricos únicos.",
        thumb: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Mundo Mascotas VIP",
    city: "Bucaramanga",
    whatsapp: "+573146789006",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&auto=format&fit=crop&q=80",
    description: "Accesorios premium, camas ortopédicas y snacks saludables para consentir a perros y gatos.",
    address: "Cra 33 # 48-15, Cabecera",
    hours: "Lun - Sáb: 8:00 AM - 7:00 PM",
    paymentMethods: ["Nequi", "Daviplata", "Bancolombia"],
    rating: 4.9,
    ratingCount: 31,
    hasSpot: true,
    boostDays: 4,
    spots: [
      {
        title: "Cama Acolchada Térmica para Perros",
        price: 89000,
        delivery: "🛵 Domicilio en Bucaramanga",
        category: "Mascotas / Paseadores",
        keywords: "cama, perro, mascota, acolchada, lavable, termica",
        description: "Funda lavable con cremallera, base impermeable y espuma viscoelástica para máximo descanso.",
        thumb: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Snack Natural de Pollo Deshidratado",
        price: 28000,
        delivery: "📦 Envíos Nacionales",
        category: "Mascotas / Paseadores",
        keywords: "snack, premios, perro, gato, natural, sin conservantes",
        description: "100% pechuga de pollo deshidratada sin harinas, químicos ni conservantes. Paquete de 150 gramos.",
        thumb: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Arnés Antitirones con Reflectivo LED",
        price: 52000,
        delivery: "🛵 Entrega el Mismo Día",
        category: "Mascotas / Paseadores",
        keywords: "arnes, correa, perro, antitirones, reflectivo, paseo",
        description: "Diseño ergonómico que cuida el cuello de tu mascota, con manija de seguridad y costuras reflectivas.",
        thumb: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Ferretería & Herramientas El Constructor",
    city: "Cali",
    whatsapp: "+573157890007",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&auto=format&fit=crop&q=80",
    description: "Herramientas eléctricas y manuales para construcción, plomería y remodelación del hogar.",
    address: "Calle 15 # 10-44, Centro",
    hours: "Lun - Sáb: 7:30 AM - 6:00 PM",
    paymentMethods: ["Nequi", "Bancolombia", "Daviplata", "Efectivo"],
    rating: 4.8,
    ratingCount: 56,
    hasSpot: true,
    boostDays: 5,
    spots: [
      {
        title: "Taladro Percutor Inalámbrico 20V",
        price: 285000,
        delivery: "📦 Envío Gratis a Ciudades Principales",
        category: "Oficios / Mano de Obra",
        keywords: "taladro, percutor, inalambrico, herramientas, construccion",
        description: "Incluye 2 baterías de litio, cargador rápido y maletín de transporte con set de 24 brocas y puntas.",
        thumb: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Set de Herramientas Mecánicas 120 Pzs",
        price: 195000,
        delivery: "🛵 Domicilio en Cali",
        category: "Oficios / Mano de Obra",
        keywords: "herramientas, llaves, copas, mecanica, taller, cromo vanadio",
        description: "Fabricadas en cromo vanadio de grado profesional. Llaves fijas, rache reversible y copas milimétricas.",
        thumb: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Cinta Métrica Láser Digital 40m",
        price: 95000,
        delivery: "📦 Envíos Contraentrega",
        category: "Oficios / Mano de Obra",
        keywords: "metro, laser, medicion, digital, topografia, obra",
        description: "Precisión milimétrica instantánea, cálculo automático de área y volumen con pantalla retroiluminada.",
        thumb: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Muebles & Estilo Hogar",
    city: "Popayán",
    whatsapp: "+573168901008",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80",
    description: "Carpintería moderna, salas, comedores y decoración minimalista en Popayán.",
    address: "Calle 5 # 14-20, Centro Histórico",
    hours: "Lun - Sáb: 8:30 AM - 6:30 PM",
    paymentMethods: ["Nequi", "Bancolombia", "Daviplata"],
    rating: 4.8,
    ratingCount: 29,
    hasSpot: true,
    boostDays: 3,
    spots: [
      {
        title: "Mesa de Centro Minimalista en Madera Teca",
        price: 320000,
        delivery: "🛵 Transporte Gratis en Popayán",
        category: "Hogar",
        keywords: "mesa, madera, teca, sala, minimalista, muebles, popayan",
        description: "Estructura en madera maciza inmunizada con acabado mate al natural y patas en acero negro mate.",
        thumb: "https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Lámpara de Pie Nórdica con Luz Cálida",
        price: 140000,
        delivery: "📦 Envíos al Valle y Cauca",
        category: "Hogar",
        keywords: "lampara, iluminacion, nordica, sala, estudio, luz calida",
        description: "Trípode en madera clara con pantalla de lino blanco y cable trenzado estilo vintage.",
        thumb: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Set de Cojines Decorativos Terciopelo",
        price: 65000,
        delivery: "🛵 Entrega en 24 Horas",
        category: "Hogar",
        keywords: "cojines, terciopelo, decoracion, sofa, hogar",
        description: "Set x3 cojines de 45x45 cm en tela terciopelo suave con relleno de algodón siliconado antialérgico.",
        thumb: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Cosmética Natural Botánica",
    city: "Eje Cafetero",
    whatsapp: "+573179012009",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80",
    description: "Cuidado de la piel con extractos botánicos puros, café verde de la región y libre de crueldad animal.",
    address: "Avenida Santander # 54-10, Manizales",
    hours: "Lun - Sáb: 9:00 AM - 6:30 PM",
    paymentMethods: ["Nequi", "Daviplata", "Bancolombia"],
    rating: 5.0,
    ratingCount: 71,
    hasSpot: true,
    boostDays: 7,
    spots: [
      {
        title: "Serum Facial Antiedad con Vitamina C",
        price: 68000,
        delivery: "📦 Envíos Gratis por compras > $90.000",
        category: "Belleza / Salud",
        keywords: "serum, vitamina c, acido hialuronico, piel, antiedad, skincare",
        description: "Fórmula de rápida absorción con ácido hialurónico vegetal y vitamina C pura para luminosidad y firmeza.",
        thumb: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Crema Hidratante de Aceite de Café y Cacao",
        price: 45000,
        delivery: "🛵 Domicilios en Pereira y Manizales",
        category: "Belleza / Salud",
        keywords: "crema, cafe, cacao, hidratante, natural, piel seca",
        description: "Nutrición profunda para rostro y cuello con manteca de cacao orgánica y antioxidantes del café.",
        thumb: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Shampoo Sólido Artesanal Sin Sulfatos",
        price: 32000,
        delivery: "📦 Envíos Contraentrega",
        category: "Belleza / Salud",
        keywords: "shampoo solido, sin sulfatos, romero, quijada, artesanal",
        description: "Barra de 100g con romero, quina y aceite de argán para estimular el crecimiento y evitar la caída.",
        thumb: "https://images.unsplash.com/photo-1608248597359-0a69a21235b2?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1608248597359-0a69a21235b2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "MotoPartes & Llantas La 33",
    city: "Medellín",
    whatsapp: "+573180123010",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&auto=format&fit=crop&q=80",
    description: "Repuestos, cascos certificados, llantas sellomáticas y accesorios para motociclistas en Medellín.",
    address: "Calle 33 # 65-18, Laureles",
    hours: "Lun - Sáb: 8:00 AM - 6:30 PM",
    paymentMethods: ["Nequi", "Bancolombia", "Daviplata", "Tarjetas"],
    rating: 4.8,
    ratingCount: 88,
    hasSpot: true,
    boostDays: 6,
    spots: [
      {
        title: "Casco Integral Certificado DOT con Visor Oscuro",
        price: 220000,
        delivery: "🛵 Domicilio Gratis en Medellín",
        category: "Vehículos / Motos",
        keywords: "casco, moto, certificado, dot, visor oscuro, medellin",
        description: "Homologado para la norma colombiana, con visor antiempañante y acolchado desmontable lavable.",
        thumb: "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Kit de Arrastre Reforzado Cadena Dorada",
        price: 160000,
        delivery: "📦 Envíos Contraentrega Nacional",
        category: "Vehículos / Motos",
        keywords: "kit arrastre, cadena, dorada, piñon, catalina, repuestos",
        description: "Fabricado en acero japonés templado de alta resistencia con o-rings que garantizan mayor vida útil.",
        thumb: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Guantes de Protección Térmicos Impermeables",
        price: 75000,
        delivery: "🛵 Entrega en el Valle de Aburrá",
        category: "Vehículos / Motos",
        keywords: "guantes, moto, proteccion, nudillos, impermeable, lluvia",
        description: "Protección rígida en nudillos, membrana contra el agua y dedos táctiles para usar el smartphone.",
        thumb: "https://images.unsplash.com/photo-1558981403-3a03362a98f1?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1558981403-3a03362a98f1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Transportes & Acarreos Express",
    city: "Bogotá",
    whatsapp: "+573191234011",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80",
    description: "Trasteos, fletes y mudanzas en Bogotá, Sabana y a nivel nacional en camiones furgonados seguros.",
    address: "Autopista Norte con Calle 170",
    hours: "Atención 24/7",
    paymentMethods: ["Nequi", "Daviplata", "Bancolombia", "Efectivo"],
    rating: 4.9,
    ratingCount: 110,
    hasSpot: true,
    boostDays: 5,
    spots: [
      {
        title: "Servicio de Mudanzas y Trasteos en Furgón",
        price: 180000,
        delivery: "🚚 Servicio Puerta a Puerta",
        category: "Acarreos y Mudanzas",
        keywords: "mudanza, trasteo, furgon, bogota, fletes, acarreos",
        description: "Personal capacitado para cargue y descargue, cobijas de algodón para proteger muebles y amarres seguros.",
        thumb: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Flete Rápido Urbano para Mercancías",
        price: 90000,
        delivery: "🚚 Entrega Inmediata",
        category: "Acarreos y Mudanzas",
        keywords: "flete, carga, mercancia, camioneta, urbano, entregas",
        description: "Camionetas estacas y furgones para transportar mercancía de comercios, bodegas y locales.",
        thumb: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Embalaje Profesional con Cajas y Vinipel",
        price: 70000,
        delivery: "📦 Materiales Incluidos",
        category: "Acarreos y Mudanzas",
        keywords: "embalaje, cajas, vinipel, plastico burbuja, proteccion muebles",
        description: "Empaque de cristalería, electrodomésticos y obras de arte con plástico burbuja y esquineros reforzados.",
        thumb: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Delicias del Caribe",
    city: "Cartagena",
    whatsapp: "+573202345012",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&auto=format&fit=crop&q=80",
    description: "Pescados frescos, cazuelas y la sazón auténtica de las costas colombianas en Bocagrande.",
    address: "Avenida San Martín # 8-40, Bocagrande",
    hours: "Todos los días: 11:30 AM - 10:30 PM",
    paymentMethods: ["Nequi", "Daviplata", "Tarjetas", "Efectivo"],
    rating: 4.9,
    ratingCount: 82,
    hasSpot: true,
    boostDays: 4,
    spots: [
      {
        title: "Cazuela de Mariscos Gratinada",
        price: 48000,
        delivery: "🛵 Domicilio en Cartagena",
        category: "Comida / Restaurantes",
        keywords: "cazuela, mariscos, camaron, calamar, cartagena, comida de mar",
        description: "Camarón, calamar, pulpo y caracol en reducción de leche de coco gratinada con queso parmesano.",
        thumb: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Posta Negra Cartagenera con Arroz con Coco",
        price: 38000,
        delivery: "🛵 Domicilios Rápidos",
        category: "Comida / Restaurantes",
        keywords: "posta negra, carne, arroz con coco, patacon, cartagena tipico",
        description: "Carne de res tierna marinada en panela, especias criollas, acompañada de arroz con coco frito y patacones.",
        thumb: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Dulces Típicos Costeños Surtidos x12",
        price: 25000,
        delivery: "📦 Envíos a Nivel Nacional",
        category: "Comida / Restaurantes",
        keywords: "dulces tipicos, cocada, arequipe, papaya, cartagena, postres",
        description: "Caja surtida con cocadas de leche, dulce de guandú, arequipe tradicional y dulce de corozo.",
        thumb: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Joyería & Relojería Aurum",
    city: "Bucaramanga",
    whatsapp: "+573213456013",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&auto=format&fit=crop&q=80",
    description: "Oro laminado 18k, plata ley 925 y relojes finos con certificado de garantía y estuche de terciopelo.",
    address: "Calle 35 # 17-10, Centro Joyero",
    hours: "Lun - Sáb: 9:00 AM - 6:30 PM",
    paymentMethods: ["Nequi", "Daviplata", "Tarjetas", "Contraentrega"],
    rating: 4.9,
    ratingCount: 64,
    hasSpot: true,
    boostDays: 7,
    spots: [
      {
        title: "Cadena y Dije en Oro Laminado 18k",
        price: 135000,
        delivery: "📦 Envío Asegurado Gratis",
        category: "Emprendimientos",
        keywords: "oro laminado, cadena, dije, 18k, joyeria, regalo, lujo",
        description: "Triple capa de oro de 18 kilates con broche tipo perico reforzado y garantía de brillo permanente.",
        thumb: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Aretes Candongas en Plata Italiana 925",
        price: 65000,
        delivery: "🛵 Domicilio Rápido",
        category: "Emprendimientos",
        keywords: "aretes, candongas, plata 925, joyeria, mujer",
        description: "Candongas trenzadas en plata de ley 925 italiana, hipoalergénicas y muy ligeras para el uso diario.",
        thumb: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "ElectroHogar Express",
    city: "Barranquilla",
    whatsapp: "+573224567014",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&auto=format&fit=crop&q=80",
    description: "Freidoras de aire, licuadoras, ventiladores y electrodomésticos con garantía de fábrica y entrega rápida.",
    address: "Paseo Bolívar # 40-12, Centro",
    hours: "Lun - Sáb: 8:00 AM - 6:30 PM",
    paymentMethods: ["Nequi", "Daviplata", "Tarjetas"],
    rating: 4.8,
    ratingCount: 50,
    hasSpot: true,
    boostDays: 4,
    spots: [
      {
        title: "Air Fryer Digital Freidora de Aire 5.5L",
        price: 210000,
        delivery: "🛵 Domicilio Gratis en Barranquilla",
        category: "Electrodomésticos",
        keywords: "air fryer, freidora de aire, digital, cocina, saludable",
        description: "Capacidad familiar de 5.5 litros, pantalla táctil con 8 programas preestablecidos y canastilla antiadherente.",
        thumb: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Licuadora de Alta Potencia Vaso de Vidrio",
        price: 130000,
        delivery: "📦 Envíos Contraentrega",
        category: "Electrodomésticos",
        keywords: "licuadora, vaso vidrio, tritura hielo, cocina, jugos",
        description: "Motor potente de 700 watts que tritura hielo, 3 velocidades más función de pulso y cuchillas de 6 aspas.",
        thumb: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Ventilador Silencioso Turbo Pedestal",
        price: 115000,
        delivery: "🛵 Entrega Inmediata",
        category: "Electrodomésticos",
        keywords: "ventilador, turbo, pedestal, silencioso, aire, calor",
        description: "Hélice aerodinámica de 6 aspas con oscilación de 90 grados y motor de bajo consumo eléctrico.",
        thumb: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Llanero Auténtico",
    city: "Meta & Llanos",
    whatsapp: "+573235678015",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&auto=format&fit=crop&q=80",
    description: "Carne a la llanera al carbón, sombreros tradicionales y productos camperos del Llano.",
    address: "Km 3 Vía Restrepo, Villavicencio",
    hours: "Mié - Dom: 10:30 AM - 8:00 PM",
    paymentMethods: ["Nequi", "Daviplata", "Bancolombia", "Efectivo"],
    rating: 4.9,
    ratingCount: 78,
    hasSpot: true,
    boostDays: 5,
    spots: [
      {
        title: "Carne a la Llanera Mamona al Carbón",
        price: 42000,
        delivery: "🛵 Domicilio en Villavicencio",
        category: "Comida / Restaurantes",
        keywords: "carne, mamona, llanera, asado, carbon, villavicencio",
        description: "Plato generoso de carne de ternera asada en vara de leña tradicional con yuca, plátano y guacamole.",
        thumb: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Sombrero Peloeguama Llanero Tradicional",
        price: 120000,
        delivery: "📦 Envíos Nacionales",
        category: "Emprendimientos",
        keywords: "sombrero, llanero, peloeguama, joropo, tradicion",
        description: "Sombrero fino moldeable impermeable con toquilla de cuero y tafilete interior acolchado.",
        thumb: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Queso Siete Cueros Artesanal de Finca",
        price: 24000,
        delivery: "🛵 Entrega en Villavicencio",
        category: "Comida / Restaurantes",
        keywords: "queso, siete cueros, campesino, finca, llanos",
        description: "Queso hilado fresco de 500g elaborado con leche pura de vaca llanera, sal marina y textura deshilable.",
        thumb: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Arte & Selva Viva",
    city: "Amazonas & Leticia",
    whatsapp: "+573246789016",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80",
    description: "Artesanías indígenas amazónicas talladas a mano en maderas nativas y fibras vegetales de la selva.",
    address: "Carrera 11 # 8-15, Leticia",
    hours: "Lun - Sáb: 8:00 AM - 6:00 PM",
    paymentMethods: ["Nequi", "Daviplata", "Bancolombia"],
    rating: 5.0,
    ratingCount: 39,
    hasSpot: true,
    boostDays: 4,
    spots: [
      {
        title: "Escultura Tallada en Palo Sangre Amazónico",
        price: 75000,
        delivery: "📦 Envíos Aéreos a Toda Colombia",
        category: "Juguetes / Artesanías",
        keywords: "artesania, amazonas, palo sangre, madera, delfin, jaguar",
        description: "Pieza única tallada a mano representando la fauna amazónica con madera rojiza de alta densidad.",
        thumb: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Canastos Tejidos en Fibra de Chambira",
        price: 55000,
        delivery: "📦 Envío Nacional",
        category: "Juguetes / Artesanías",
        keywords: "canasto, chambira, fibra natural, tejido indigena, decoracion",
        description: "Canastos multiusos teñidos con tintes naturales de hojas y semillas de la selva por la comunidad Ticuna.",
        thumb: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Miel de Abejas Angelitas 100% Pura 250ml",
        price: 35000,
        delivery: "📦 Envíos Seguros",
        category: "Emprendimientos",
        keywords: "miel, angelitas, pura, amazonas, medicinal, natural",
        description: "Miel medicinal de abejas nativas sin aguijón con propiedades cicatrizantes y antibacterianas.",
        thumb: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Fitness & Nutrición Pro",
    city: "Cali",
    whatsapp: "+573007890017",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80",
    description: "Suplementación deportiva, proteínas limpias, creatina creapure y accesorios para gimnasio.",
    address: "Calle 9 # 44-18, Champagnat",
    hours: "Lun - Sáb: 7:00 AM - 8:00 PM",
    paymentMethods: ["Nequi", "Bancolombia", "Daviplata", "Contraentrega"],
    rating: 4.9,
    ratingCount: 63,
    hasSpot: true,
    boostDays: 6,
    spots: [
      {
        title: "Proteína Whey Aislada 2 Libras Vainilla",
        price: 155000,
        delivery: "🛵 Domicilio Gratis en Cali",
        category: "Belleza / Salud",
        keywords: "proteina, whey, aislada, suplemento, gimnasio, musculo",
        description: "27g de proteína por servicio, cero azúcar y baja en calorías para definición y recuperación muscular.",
        thumb: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Creatina Monohidratada Micronizada 300g",
        price: 95000,
        delivery: "📦 Envíos Nacionales",
        category: "Belleza / Salud",
        keywords: "creatina, monohidratada, fuerza, rendimiento, masa muscular",
        description: "100% pura sin saborizantes, 60 servicios para aumento de fuerza, resistencia y potencia física.",
        thumb: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Banda Elástica de Resistencia Set x5",
        price: 42000,
        delivery: "🛵 Entrega Inmediata",
        category: "Belleza / Salud",
        keywords: "bandas, resistencia, ejercicio, entrenamiento, gluteos, pilates",
        description: "5 niveles de tensión en látex natural con bolsa portátil para entrenar en casa o en el gimnasio.",
        thumb: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Calzado Infantil Pasitos",
    city: "Popayán",
    whatsapp: "+573018901018",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=300&auto=format&fit=crop&q=80",
    description: "Zapatos ergonómicos para bebés, niños y niñas. Diseñados para cuidar sus primeros pasos.",
    address: "Carrera 7 # 3-45, Centro",
    hours: "Lun - Sáb: 9:00 AM - 7:00 PM",
    paymentMethods: ["Nequi", "Daviplata", "Bancolombia"],
    rating: 4.8,
    ratingCount: 36,
    hasSpot: true,
    boostDays: 4,
    spots: [
      {
        title: "Tenis Luces LED para Niños Antideslizantes",
        price: 68000,
        delivery: "🛵 Domicilio en Popayán",
        category: "Moda / Calzado",
        keywords: "tenis, niños, luces led, calzado infantil, comodos",
        description: "Suela con luces recargables al caminar, ajuste con velcro fácil y material transpirable.",
        thumb: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Zapatitos Ergonómicos Bebé Cuero Suave",
        price: 52000,
        delivery: "📦 Envíos Contraentrega",
        category: "Moda / Calzado",
        keywords: "zapatos bebe, primeros pasos, cuero suave, gateo, recien nacido",
        description: "Cuero de badana flexible que permite el libre movimiento de los deditos del bebé sin apretar.",
        thumb: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Botas Pantaneras Infantiles con Diseños",
        price: 45000,
        delivery: "🛵 Entrega en 24 Horas",
        category: "Moda / Calzado",
        keywords: "botas lluvia, pantaneras, niños, impermeables, charcos",
        description: "100% caucho impermeable con forro interior de algodón y divertidos motivos animados.",
        thumb: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Taller Mecánico & Frenos El Pistón",
    city: "Medellín",
    whatsapp: "+573029012019",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300&auto=format&fit=crop&q=80",
    description: "Mantenimiento preventivo, frenos, suspensión y diagnóstico computarizado para vehículos multimarca.",
    address: "Calle 10 # 50-25, Guayabal",
    hours: "Lun - Sáb: 7:30 AM - 6:00 PM",
    paymentMethods: ["Nequi", "Bancolombia", "Daviplata", "Tarjetas"],
    rating: 4.8,
    ratingCount: 95,
    hasSpot: true,
    boostDays: 5,
    spots: [
      {
        title: "Sincronización Electrónica y Cambio de Aceite",
        price: 180000,
        delivery: "🔧 Servicio en Taller",
        category: "Servicios / Talleres",
        keywords: "sincronizacion, cambio aceite, afinacion, motor, medellin",
        description: "Incluye limpieza de inyectores por ultrasonido, cambio de bujías, filtros de aire y aceite sintético.",
        thumb: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Mantenimiento de Frenos Pastillas Cerámicas",
        price: 120000,
        delivery: "🔧 Repuestos y Mano de Obra",
        category: "Servicios / Talleres",
        keywords: "frenos, pastillas, ceramicas, rectificacion discos, seguridad",
        description: "Revisión completa de calipers, cambio de líquido de frenos DOT4 y pastillas cerámicas sin chillidos.",
        thumb: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Diagnóstico con Escáner Computarizado OBD2",
        price: 60000,
        delivery: "🔧 Diagnóstico al Instante",
        category: "Servicios / Talleres",
        keywords: "escaner, testigo motor, check engine, obd2, falla electrica",
        description: "Lectura y borrado de códigos de falla del motor, ABS, Airbag y prueba de sensores en tiempo real.",
        thumb: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  },
  {
    name: "Sonido & Car Audio VIP",
    city: "Bogotá",
    whatsapp: "+573030123020",
    password: "123",
    avatar: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&auto=format&fit=crop&q=80",
    description: "Instalación de radios Android, plantas de sonido, parlantes y alarmas con los mejores acabados.",
    address: "Calle 63 # 24-18, 7 de Agosto",
    hours: "Lun - Sáb: 8:30 AM - 6:30 PM",
    paymentMethods: ["Nequi", "Daviplata", "Tarjetas", "Bancolombia"],
    rating: 4.9,
    ratingCount: 74,
    hasSpot: true,
    boostDays: 7,
    spots: [
      {
        title: "Pantalla Android Táctil 9 Pulgadas CarPlay",
        price: 420000,
        delivery: "🛵 Instalación o Envío Gratis",
        category: "Tecnología",
        keywords: "pantalla android, carplay, radio carro, gps, waze, car audio",
        description: "2GB RAM + 32GB ROM, Apple CarPlay y Android Auto inalámbrico, compatible con mandos de timón.",
        thumb: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Parlantes Componentes 6.5 Pulgadas 300W",
        price: 175000,
        delivery: "📦 Envíos Contraentrega Nacional",
        category: "Tecnología",
        keywords: "parlantes, medios, tweeters, sonido carro, car audio",
        description: "Set de dos vías con crossovers pasivos, tweeters de seda para agudos nítidos y cono de polipropileno.",
        thumb: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80"
        ]
      },
      {
        title: "Cámara de Reversa HD con Visión Nocturna",
        price: 65000,
        delivery: "🛵 Domicilio en Bogotá",
        category: "Tecnología",
        keywords: "camara reversa, parqueo, vision nocturna, hd, angular",
        description: "Gran angular de 170 grados con 8 LEDs infrarrojos para ver con claridad total en la oscuridad.",
        thumb: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
        photos: [
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80"
        ]
      }
    ]
  }
];

let addedStores = 0;
let addedSpots = 0;
const now = Date.now();

for (let i = 0; i < NEW_STORES_DATA.length; i++) {
  const sData = NEW_STORES_DATA[i];
  
  // Si la tienda ya existe con este WhatsApp, buscarla; si no, crearla
  let store = db.stores.find(s => s.whatsapp === sData.whatsapp);
  if (!store) {
    const storeId = `store-test-${now}-${i + 1}`;
    store = {
      id: storeId,
      name: sData.name,
      whatsapp: sData.whatsapp,
      city: sData.city,
      password: sData.password,
      avatar: sData.avatar,
      description: sData.description,
      address: sData.address,
      hours: sData.hours,
      paymentMethods: sData.paymentMethods,
      rating: sData.rating || 4.9,
      ratingCount: sData.ratingCount || 40,
      verified: true,
      hasSpot: Boolean(sData.hasSpot),
      spotExpiresAt: sData.hasSpot ? new Date(now + (sData.boostDays || 5) * 86400000).toISOString() : null,
      boostLevel: sData.hasSpot ? 'platino' : 'none',
      acceptedRules: true,
      createdAt: new Date(now - (i + 1) * 3600000 * 4).toISOString()
    };
    db.stores.push(store);
    addedStores++;
  } else {
    // Actualizar datos
    store.name = sData.name;
    store.city = sData.city;
    store.avatar = sData.avatar;
    store.description = sData.description;
    store.hasSpot = Boolean(sData.hasSpot);
    store.spotExpiresAt = sData.hasSpot ? new Date(now + (sData.boostDays || 5) * 86400000).toISOString() : null;
  }

  // Agregar los 3 spots para esta tienda
  for (let j = 0; j < sData.spots.length; j++) {
    const spotData = sData.spots[j];
    const spotId = `vid-test-${now}-${i + 1}-${j + 1}`;
    
    // Verificar si ya existe spot con este título para esta tienda
    const existingSpot = db.videos.find(v => v.storeId === store.id && v.title === spotData.title);
    if (!existingSpot) {
      const isSpotVip = (j === 0 && store.hasSpot); // El primer spot de tiendas con spot activo es SPOT VIP
      const spotItem = {
        id: spotId,
        storeId: store.id,
        storeName: store.name,
        storeAvatar: store.avatar,
        storeVerified: true,
        hasSpot: isSpotVip,
        spotExpiresAt: isSpotVip ? store.spotExpiresAt : null,
        boostLevel: isSpotVip ? 'platino' : 'none',
        isPermanent: true,
        title: spotData.title,
        description: spotData.description,
        category: spotData.category,
        city: store.city,
        price: spotData.price,
        priceFormatted: spotData.price > 0 ? `$${spotData.price.toLocaleString('es-CO')} COP` : 'Cotización Gratis',
        delivery: spotData.delivery,
        keywords: spotData.keywords,
        promoBadge: isSpotVip ? '🔥 DESTACADO' : (j === 1 ? '⚡ NOVEDAD' : null),
        videoUrl: null,
        thumbnailUrl: spotData.thumb,
        detailPhotos: spotData.photos,
        photos: spotData.photos,
        duration: 15,
        durationLabel: '0:15',
        views: Math.floor(Math.random() * 250) + 40,
        likes: Math.floor(Math.random() * 45) + 5,
        whatsappClicks: Math.floor(Math.random() * 18) + 2,
        savedCount: Math.floor(Math.random() * 12) + 1,
        status: 'active',
        paidPlan: 'photos_5',
        transactionId: `tx_seed_${now}_${i}_${j}`,
        createdAt: new Date(now - (j * 7200000) - (i * 1800000)).toISOString(),
        comments: [],
        storeRating: store.rating,
        storeRatingCount: store.ratingCount
      };
      db.videos.push(spotItem);
      addedSpots++;
    }
  }
}

// Guardar base de datos
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');

console.log(`\n=============================================`);
console.log(`✅ ¡Éxito total!`);
console.log(`   - Tiendas añadidas/verificadas: ${addedStores} (Total actual: ${db.stores.length})`);
console.log(`   - SPOTS creados: ${addedSpots} (Total actual: ${db.videos.length})`);
console.log(`   - Relación exacta: 20 tiendas x 3 spots = 60 spots nuevos.`);
console.log(`=============================================\n`);
