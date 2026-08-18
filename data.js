/* ============================================================
   Radar de Productos — datos base
   ============================================================ */

/* Cada rubro con dos lecturas propias:
   explotado  = qué tan saturado está ya en Argentina (alto = mucha competencia)
   proyeccion = potencial de crecimiento y margen (alto = vale entrar)
   La oportunidad es la diferencia entre las dos. Son estimaciones de mercado,
   no datos duros: sirven para priorizar, no para decidir solo con eso. */
const RUBROS_META = [
  { n:"Comederos y bebederos", cat:"Mascotas", explotado:55, proyeccion:88, tend:"subiendo", term:"宠物碗", nota:"Ancla clásica: problema visible y demo perfecta." },
  { n:"Juguetes para perro", cat:"Mascotas", explotado:62, proyeccion:80, tend:"estable", term:"狗玩具", nota:"Recompra por desgaste. Cuidado con la calidad." },
  { n:"Juguetes para gato", cat:"Mascotas", explotado:48, proyeccion:83, tend:"subiendo", term:"猫玩具", nota:"Menos saturado que perro y el dueño gasta igual." },
  { n:"Cepillado y pelo de mascota", cat:"Mascotas", explotado:44, proyeccion:86, tend:"subiendo", term:"宠物梳", nota:"El antes/después es contenido viral asegurado." },
  { n:"Correas y arneses", cat:"Mascotas", explotado:66, proyeccion:74, tend:"estable", term:"宠物牵引绳", nota:"Muy competido, pero el arnés antitirón todavía rinde." },
  { n:"Higiene de mascota", cat:"Mascotas", explotado:40, proyeccion:82, tend:"subiendo", term:"宠物清洁", nota:"Bolsitas y toallitas: el motor de recompra del rubro." },
  { n:"Transporte de mascota", cat:"Mascotas", explotado:42, proyeccion:78, tend:"subiendo", term:"宠物背包", nota:"Voluminoso: calcular el flete antes de enamorarse." },
  { n:"Camas y descanso de mascota", cat:"Mascotas", explotado:58, proyeccion:70, tend:"estable", term:"宠物窝", nota:"Volumen alto, margen bajo por flete." },
  { n:"Ropa para mascota", cat:"Mascotas", explotado:70, proyeccion:62, tend:"bajando", term:"宠物衣服", nota:"Tiene talles: el clavo del rubro." },
  { n:"Fuentes de agua para gatos", cat:"Mascotas", explotado:35, proyeccion:84, tend:"subiendo", term:"猫饮水机", nota:"Nicho en crecimiento. Enchufa: revisar certificación." },
  { n:"Masajeadores de cuello", cat:"Wellness", explotado:45, proyeccion:88, tend:"subiendo", term:"颈椎按摩器", nota:"Demo hipnótica, ticket alto, regalo perfecto." },
  { n:"Pistolas de masaje", cat:"Wellness", explotado:52, proyeccion:82, tend:"estable", term:"筋膜枪", nota:"Costo bajo y ticket alto. Gimnasio y oficina." },
  { n:"Difusores y humidificadores", cat:"Wellness", explotado:55, proyeccion:74, tend:"estable", term:"香薰加湿器", nota:"Video precioso y recompra por esencias." },
  { n:"Almohadas ergonómicas", cat:"Wellness", explotado:42, proyeccion:85, tend:"subiendo", term:"记忆棉枕头", nota:"Dolor real: se paga sin discutir." },
  { n:"Antiestrés y foco", cat:"Wellness", explotado:30, proyeccion:79, tend:"subiendo", term:"减压玩具", nota:"Impulso puro y contenido que se comparte." },
  { n:"Sueño y descanso", cat:"Wellness", explotado:38, proyeccion:80, tend:"subiendo", term:"助眠用品", nota:"Antifaces, ruido blanco. Nicho creciendo fuerte." },
  { n:"Corrección postural", cat:"Salud", explotado:38, proyeccion:84, tend:"subiendo", term:"背部矫正带", nota:"Demo clara. Cuidado con promesas médicas." },
  { n:"Soporte lumbar y cervical", cat:"Salud", explotado:40, proyeccion:80, tend:"estable", term:"护腰带", nota:"Público de trabajo físico, alta intención." },
  { n:"Movilidad y bastones", cat:"Salud", explotado:28, proyeccion:76, tend:"subiendo", term:"助行器", nota:"Adultos mayores: nicho enorme y desatendido." },
  { n:"Compresión y circulación", cat:"Salud", explotado:44, proyeccion:74, tend:"estable", term:"压缩袜", nota:"Recompra natural. Verificar si es producto médico." },
  { n:"Botiquín y primeros auxilios", cat:"Salud", explotado:50, proyeccion:66, tend:"estable", term:"急救包", nota:"Compra por miedo. Ticket bajo, va en kit." },
  { n:"Termómetros y medición", cat:"Salud", explotado:58, proyeccion:60, tend:"bajando", term:"体温计", nota:"Puede caer en producto médico: verificar." },
  { n:"Organización de cocina", cat:"Hogar", explotado:72, proyeccion:74, tend:"estable", term:"厨房收纳", nota:"Rey del video demo. Recompra baja." },
  { n:"Utensilios multifunción", cat:"Hogar", explotado:76, proyeccion:68, tend:"bajando", term:"多功能厨房工具", nota:"Saturadísimo: sólo con ángulo propio." },
  { n:"Termos y botellas", cat:"Hogar", explotado:60, proyeccion:82, tend:"subiendo", term:"保温杯", nota:"Muy argentino. La pantalla de temperatura es el gancho." },
  { n:"Mate y accesorios", cat:"Hogar", explotado:50, proyeccion:88, tend:"subiendo", term:"—", nota:"Demanda local enorme. Personalización = margen." },
  { n:"Cafetería en casa", cat:"Hogar", explotado:48, proyeccion:80, tend:"subiendo", term:"咖啡器具", nota:"Comunidad apasionada, ticket alto, consumibles." },
  { n:"Organización de placard", cat:"Hogar", explotado:64, proyeccion:72, tend:"estable", term:"衣柜收纳", nota:"Set que sube el ticket. Demo simple." },
  { n:"Baño y orden", cat:"Hogar", explotado:62, proyeccion:68, tend:"estable", term:"浴室收纳", nota:"Ticket bajo: obligado a vender en combo." },
  { n:"Limpieza y aspirado", cat:"Hogar", explotado:55, proyeccion:78, tend:"subiendo", term:"手持吸尘器", nota:"Antes/después imbatible. Enchufa." },
  { n:"Quitapelusas y textil", cat:"Hogar", explotado:45, proyeccion:74, tend:"subiendo", term:"去毛球器", nota:"Modelo maquinita y hojita." },
  { n:"Repuestos y consumibles hogar", cat:"Hogar", explotado:35, proyeccion:80, tend:"subiendo", term:"清洁替换", nota:"Lo que hace que vuelvan sin pagar ads." },
  { n:"Deco de pared", cat:"Hogar", explotado:68, proyeccion:62, tend:"estable", term:"墙面装饰", nota:"Muy visual pero frágil en tránsito." },
  { n:"Iluminación LED deco", cat:"Hogar", explotado:58, proyeccion:66, tend:"estable", term:"LED灯带", nota:"Barato de pautar. Enchufa: certificación." },
  { n:"Velas y aromas", cat:"Hogar", explotado:64, proyeccion:60, tend:"bajando", term:"香薰蜡烛", nota:"Recompra buena, pero flete y rotura." },
  { n:"Plantas y macetas", cat:"Jardín", explotado:40, proyeccion:72, tend:"subiendo", term:"花盆", nota:"Nicho apasionado, poco explotado acá." },
  { n:"Riego automático", cat:"Jardín", explotado:30, proyeccion:82, tend:"subiendo", term:"自动滴灌", nota:"Resuelve irse de vacaciones. Muy poco explotado." },
  { n:"Herramientas de jardín", cat:"Jardín", explotado:42, proyeccion:70, tend:"estable", term:"园艺工具", nota:"Alta intención, cero devolución." },
  { n:"Huerta en casa", cat:"Jardín", explotado:32, proyeccion:76, tend:"subiendo", term:"种植箱", nota:"Tendencia sostenida post pandemia." },
  { n:"Setup de escritorio", cat:"Oficina", explotado:52, proyeccion:82, tend:"subiendo", term:"桌面收纳", nota:"Compran por estética. Marca propia fácil." },
  { n:"Soportes y ergonomía", cat:"Oficina", explotado:48, proyeccion:84, tend:"subiendo", term:"笔记本支架", nota:"Liviano, sin variantes, ticket medio." },
  { n:"Cables y organización", cat:"Oficina", explotado:70, proyeccion:62, tend:"estable", term:"理线器", nota:"Satélite ideal, nunca ancla." },
  { n:"Papelería premium", cat:"Oficina", explotado:58, proyeccion:58, tend:"bajando", term:"文具", nota:"Ticket bajo y estacional." },
  { n:"Sillas y apoyos", cat:"Oficina", explotado:55, proyeccion:70, tend:"estable", term:"人体工学", nota:"Voluminoso: flete caro." },
  { n:"Iluminación de escritorio", cat:"Oficina", explotado:56, proyeccion:68, tend:"estable", term:"台灯", nota:"Enchufa: seguridad eléctrica sí o sí." },
  { n:"Organizadores de auto", cat:"Auto", explotado:50, proyeccion:82, tend:"subiendo", term:"车载收纳", nota:"Utilidad pura, público masivo." },
  { n:"Soportes de celular auto", cat:"Auto", explotado:72, proyeccion:66, tend:"bajando", term:"车载手机支架", nota:"Impulso puro, ticket bajo." },
  { n:"Limpieza de auto", cat:"Auto", explotado:48, proyeccion:78, tend:"subiendo", term:"洗车用品", nota:"Antes/después + consumible que se repone." },
  { n:"Seguridad y emergencia auto", cat:"Auto", explotado:40, proyeccion:74, tend:"subiendo", term:"车用应急", nota:"Compra por miedo, alta conversión." },
  { n:"Confort en auto", cat:"Auto", explotado:52, proyeccion:72, tend:"estable", term:"汽车座椅垫", nota:"Cuidado con compatibilidad por modelo." },
  { n:"Accesorios de moto", cat:"Auto", explotado:44, proyeccion:76, tend:"subiendo", term:"摩托车配件", nota:"Comunidad fiel y muy segmentable." },
  { n:"Camping y refugio", cat:"Outdoor", explotado:40, proyeccion:79, tend:"subiendo", term:"户外露营", nota:"Ticket alto, comunidad fiel, estacional." },
  { n:"Cocina outdoor", cat:"Outdoor", explotado:38, proyeccion:78, tend:"subiendo", term:"户外炊具", nota:"Asado + camping: combinación muy argentina." },
  { n:"Mochilas técnicas", cat:"Outdoor", explotado:55, proyeccion:76, tend:"estable", term:"户外背包", nota:"Ticket alto. Textil paga derechos altos." },
  { n:"Hidratación outdoor", cat:"Outdoor", explotado:45, proyeccion:74, tend:"subiendo", term:"户外水壶", nota:"Liviano y fácil de brandear." },
  { n:"Pesca", cat:"Outdoor", explotado:35, proyeccion:72, tend:"estable", term:"钓鱼用品", nota:"Nicho apasionado que gasta sin mirar." },
  { n:"Ciclismo accesorios", cat:"Outdoor", explotado:58, proyeccion:74, tend:"subiendo", term:"自行车配件", nota:"Creciendo con la movilidad urbana." },
  { n:"Trekking y montaña", cat:"Outdoor", explotado:42, proyeccion:70, tend:"estable", term:"登山装备", nota:"Estacional pero de ticket alto." },
  { n:"Bandas y resistencia", cat:"Fitness", explotado:68, proyeccion:70, tend:"estable", term:"阻力带", nota:"Liviano, sin certificación, se vende en kit." },
  { n:"Core y abdominales", cat:"Fitness", explotado:70, proyeccion:64, tend:"bajando", term:"健腹轮", nota:"Muy competido por precio." },
  { n:"Yoga y pilates", cat:"Fitness", explotado:60, proyeccion:72, tend:"estable", term:"瑜伽用品", nota:"Público que recompra por nivel." },
  { n:"Recuperación muscular", cat:"Fitness", explotado:44, proyeccion:80, tend:"subiendo", term:"筋膜球", nota:"Cruza con Wellness: ticket alto." },
  { n:"Medición y wearables", cat:"Fitness", explotado:75, proyeccion:58, tend:"bajando", term:"运动手环", nota:"Competís contra marcas conocidas." },
  { n:"Accesorios de gimnasio", cat:"Fitness", explotado:62, proyeccion:66, tend:"estable", term:"健身配件", nota:"Guantes, straps, muñequeras. Satélites." },
  { n:"Cochecitos y accesorios", cat:"Bebés", explotado:50, proyeccion:84, tend:"subiendo", term:"婴儿车配件", nota:"Compran sin regatear." },
  { n:"Alimentación de bebé", cat:"Bebés", explotado:52, proyeccion:80, tend:"subiendo", term:"婴儿餐具", nota:"Recompra por etapas." },
  { n:"Seguridad del hogar bebé", cat:"Bebés", explotado:44, proyeccion:82, tend:"subiendo", term:"儿童安全", nota:"Compra por miedo: convierte altísimo." },
  { n:"Baño y cambiado", cat:"Bebés", explotado:48, proyeccion:76, tend:"estable", term:"婴儿洗浴", nota:"Recompra buena, ticket medio." },
  { n:"Juguetes de estimulación", cat:"Bebés", explotado:56, proyeccion:74, tend:"estable", term:"婴儿玩具", nota:"Certificación de juguetes obligatoria." },
  { n:"Porteo", cat:"Bebés", explotado:42, proyeccion:78, tend:"subiendo", term:"婴儿背带", nota:"Nicho con comunidad fuerte." },
  { n:"Aparatos de belleza", cat:"Belleza", explotado:72, proyeccion:66, tend:"estable", term:"美容仪", nota:"Sólo aparatos: el cosmético va con ANMAT." },
  { n:"Depilación y afeitado", cat:"Belleza", explotado:70, proyeccion:68, tend:"estable", term:"剃须刀", nota:"Voltra lo tiene entre sus más vendidos." },
  { n:"Cuidado del cabello", cat:"Belleza", explotado:78, proyeccion:60, tend:"bajando", term:"美发工具", nota:"Saturado. Sólo herramientas, no producto." },
  { n:"Manicura", cat:"Belleza", explotado:66, proyeccion:64, tend:"estable", term:"美甲工具", nota:"Kit que sube el ticket. Público fiel." },
  { n:"Organización de cosméticos", cat:"Belleza", explotado:58, proyeccion:66, tend:"estable", term:"化妆品收纳", nota:"Cruza con Hogar. Sin certificación." },
  { n:"Accesorios de audio", cat:"Tecnología", explotado:85, proyeccion:56, tend:"bajando", term:"耳机配件", nota:"Márgenes apretados contra marcas." },
  { n:"Carga y energía", cat:"Tecnología", explotado:80, proyeccion:58, tend:"bajando", term:"充电器", nota:"Enchufa y compite con marcas." },
  { n:"Fotografía móvil", cat:"Tecnología", explotado:55, proyeccion:70, tend:"subiendo", term:"手机摄影", nota:"Creadores de contenido: nicho creciendo." },
  { n:"Smart home", cat:"Tecnología", explotado:58, proyeccion:74, tend:"subiendo", term:"智能家居", nota:"Ticket medio-alto. Todo enchufa." },
  { n:"Almacenamiento y backup", cat:"Tecnología", explotado:72, proyeccion:58, tend:"bajando", term:"存储设备", nota:"Difícil competir con marcas." },
  { n:"Accesorios gamer", cat:"Gaming", explotado:70, proyeccion:66, tend:"estable", term:"电竞配件", nota:"Comunidad enorme, sensible al precio." },
  { n:"Setup gamer deco", cat:"Gaming", explotado:60, proyeccion:72, tend:"subiendo", term:"电竞灯光", nota:"Muy visual, se vende por estética." },
  { n:"Coleccionables gaming", cat:"Gaming", explotado:50, proyeccion:68, tend:"subiendo", term:"游戏周边", nota:"Ojo con licencias y marcas registradas." },
  { n:"Organización de viaje", cat:"Viaje", explotado:48, proyeccion:76, tend:"subiendo", term:"旅行收纳", nota:"Compra por evento, ticket medio." },
  { n:"Valijas y bolsos", cat:"Viaje", explotado:62, proyeccion:70, tend:"estable", term:"行李箱", nota:"Voluminoso. Textil paga derechos altos." },
  { n:"Confort de vuelo", cat:"Viaje", explotado:44, proyeccion:74, tend:"subiendo", term:"旅行颈枕", nota:"Impulso previo al viaje. Buen margen." },
  { n:"Adaptadores y viaje tech", cat:"Viaje", explotado:58, proyeccion:66, tend:"estable", term:"转换插头", nota:"Enchufa: certificación." },
  { n:"Joyería de acero", cat:"Moda", explotado:82, proyeccion:62, tend:"estable", term:"钛钢首饰", nota:"Valor/peso imbatible. Ganás por curaduría." },
  { n:"Relojes", cat:"Moda", explotado:80, proyeccion:56, tend:"bajando", term:"手表", nota:"Ojo con réplicas: infracción marcaria." },
  { n:"Anteojos y sol", cat:"Moda", explotado:74, proyeccion:60, tend:"bajando", term:"太阳镜", nota:"Riesgo de copiar diseños registrados." },
  { n:"Billeteras y marroquinería", cat:"Moda", explotado:68, proyeccion:64, tend:"estable", term:"钱包", nota:"Textil y cuero pagan derechos altos." },
  { n:"Accesorios de pelo", cat:"Moda", explotado:64, proyeccion:60, tend:"estable", term:"发饰", nota:"Ticket bajo, sólo en packs." },
  { n:"Bufandas y abrigo", cat:"Moda", explotado:70, proyeccion:54, tend:"bajando", term:"围巾", nota:"Estacional y con talles." },
  { n:"Juguetes educativos", cat:"Niños", explotado:56, proyeccion:72, tend:"estable", term:"益智玩具", nota:"Certificación obligatoria de seguridad." },
  { n:"Arte y manualidades", cat:"Niños", explotado:48, proyeccion:70, tend:"subiendo", term:"手工玩具", nota:"Recompra por consumibles." },
  { n:"Aire libre para niños", cat:"Niños", explotado:52, proyeccion:68, tend:"estable", term:"儿童户外", nota:"Estacional fuerte." },
  { n:"Organización infantil", cat:"Niños", explotado:44, proyeccion:72, tend:"subiendo", term:"儿童收纳", nota:"Cruza con Hogar, menos competido." },
  { n:"Herramientas manuales", cat:"Herramientas", explotado:62, proyeccion:68, tend:"estable", term:"手动工具", nota:"Alta intención, cero devolución." },
  { n:"Medición y nivelación", cat:"Herramientas", explotado:50, proyeccion:72, tend:"subiendo", term:"测量工具", nota:"Público profesional que paga." },
  { n:"Organización de taller", cat:"Herramientas", explotado:46, proyeccion:74, tend:"subiendo", term:"工具收纳", nota:"Poco explotado en ecommerce local." },
  { n:"Seguridad y protección", cat:"Herramientas", explotado:44, proyeccion:70, tend:"estable", term:"劳保用品", nota:"Compra recurrente de empresas." },
  { n:"Fiesta y eventos", cat:"Eventos", explotado:58, proyeccion:64, tend:"estable", term:"派对用品", nota:"Muy estacional, ticket bajo." },
  { n:"Regalos personalizados", cat:"Eventos", explotado:42, proyeccion:80, tend:"subiendo", term:"定制礼品", nota:"Personalización = margen y difícil de copiar." },
  { n:"Bar y coctelería", cat:"Eventos", explotado:44, proyeccion:76, tend:"subiendo", term:"调酒工具", nota:"Ticket medio-alto, público que regala." },
  { n:"Adultos mayores", cat:"Emergentes", explotado:26, proyeccion:84, tend:"subiendo", term:"老人用品", nota:"Nicho enorme y muy desatendido en Argentina." },
  { n:"Accesibilidad", cat:"Emergentes", explotado:24, proyeccion:78, tend:"subiendo", term:"辅助器具", nota:"Muy poco explotado, alta necesidad real." },
  { n:"Home office ergonómico", cat:"Emergentes", explotado:46, proyeccion:80, tend:"subiendo", term:"居家办公", nota:"Se consolidó, no era moda pasajera." },
  { n:"Sustentables y reutilizables", cat:"Emergentes", explotado:36, proyeccion:76, tend:"subiendo", term:"环保用品", nota:"Tendencia sostenida, público dispuesto a pagar." },
  { n:"Organización de autos eléctricos", cat:"Emergentes", explotado:18, proyeccion:74, tend:"subiendo", term:"电动车配件", nota:"Muy temprano, pero crece rápido." },
  { n:"Creadores de contenido", cat:"Emergentes", explotado:44, proyeccion:82, tend:"subiendo", term:"直播设备", nota:"Explotando con el live commerce." },
  { n:"Otro", cat:"Otro", explotado:50, proyeccion:50, tend:"estable", term:"", nota:"Sin clasificar." }
];

const RUBROS = RUBROS_META.map(r=>r.n);
const metaRubro = n => RUBROS_META.find(r=>r.n===n) || RUBROS_META[RUBROS_META.length-1];
const MACROS = [...new Set(RUBROS_META.map(r=>r.cat))];
const PESO_TEND = { subiendo:12, estable:0, bajando:-12 };
/* Oportunidad: cuánto potencial queda sin tomar. */
const oportunidad = n => {
  const m = metaRubro(n);
  return Math.max(0, Math.min(100, Math.round(m.proyeccion - m.explotado*0.65 + (PESO_TEND[m.tend]||0))));
};

const ORIGENES = ["China","Argentina (importador)","Argentina (fabricante)","Brasil","India","Otro"];

/* País donde está el proveedor. Puede no coincidir con el origen de la mercadería:
   un mayorista colombiano vende producto chino. */
const PAISES = ["Argentina","China","Colombia","Brasil","India","Estados Unidos","España","Otro"];
const BANDERAS = {
  "Argentina":"🇦🇷","China":"🇨🇳","Colombia":"🇨🇴","Brasil":"🇧🇷",
  "India":"🇮🇳","Estados Unidos":"🇺🇸","España":"🇪🇸","Otro":"🌐"
};

const TIPOS_PROV = ["1688","Alibaba","Mayorista local","Fabricante nacional","Importador local","Otro"];

const TAGS = ["funcional","impulso","nicho","recompra","demo en video","regalo","liviano","sin variantes"];

const VEREDICTOS = ["evaluar","estrella","potencial","clavo","descartado"];

/* Criterios de scoring — el peso suma 100 */
const CRITERIOS = [
  { k:"margen",       n:"Margen bruto",        d:"¿Deja 65%+ después del costo puesto?", w:25 },
  { k:"competencia",  n:"Competencia baja",    d:"¿Cuántos lo venden ya en ML?",         w:20 },
  { k:"recompra",     n:"Recompra",            d:"¿Vuelve a comprar o es una sola vez?", w:15 },
  { k:"certificacion",n:"Sin certificación",   d:"ANMAT / SENASA / seg. eléctrica = malo", w:15 },
  { k:"logistica",    n:"Liviano y chico",     d:"El flete se paga por volumen",          w:10 },
  { k:"demo",         n:"Demo en video",       d:"¿Se entiende en 15 segundos?",          w:10 },
  { k:"variantes",    n:"Sin talles ni SKUs",  d:"Variantes = stock muerto y devoluciones", w:5 }
];

/* Multiplicador FOB -> costo puesto en Argentina (flete+derechos+IVA+despacho) */
const MULT_PUESTO = 2.2;

/* ---------- Proveedores reales relevados ---------- */
const PROVEEDORES = [
  { nombre:"Petcom", tipo:"Importador local", rubro:"Comederos y bebederos", pais:"Argentina",
    url:"https://www.petcom.com.ar/mayoristas-petcom/",
    nota:"Importadora mayorista. Juguetes interactivos, comederos, bebederos automáticos, rascadores." },
  { nombre:"Petmarket Distribución", tipo:"Importador local", rubro:"Comederos y bebederos", pais:"Argentina",
    url:"https://petmarketdistribucion.com.ar/venta-mayorista/",
    whatsapp:"11 6506-6097",
    nota:"Stock para pet shops al por mayor." },
  { nombre:"DonBodegón Mayorista", tipo:"Importador local", rubro:"Comederos y bebederos", pais:"Colombia",
    whatsapp:"+573007170351",
    url:"https://mayorista.donbodegon.com/c/Animales%20y%20Mascotas",
    nota:"⚠️ Es COLOMBIANO (+57), no argentino. Importa de China y vende en Colombia — sirve como referencia de precio, no como proveedor local." },
  { nombre:"MAU", tipo:"Fabricante nacional", rubro:"Comederos y bebederos", pais:"Argentina",
    whatsapp:"11 3533-5659",
    url:"https://mau.com.ar/tienda/",
    nota:"Fábrica con +10 años. Abastece pet shops, veterinarias y cadenas. Reposición rápida, sin aduana." },
  { nombre:"Happy Pet", tipo:"Fabricante nacional", rubro:"Comederos y bebederos", pais:"Argentina",
    url:"https://www.happypet-accesorios.com.ar/ventas-por-mayor/",
    nota:"500+ artículos: juguetes, ropa, colchones, higiene, accesorios." },
  { nombre:"Que Mona Mascotas", tipo:"Fabricante nacional", rubro:"Comederos y bebederos", pais:"Argentina",
    url:"https://www.quemonamascotas.com.ar/mayoristas/",
    nota:"Taller propio, diseños exclusivos. Envíos desde Villa Carlos Paz." },
  { nombre:"M-Once", tipo:"Mayorista local", rubro:"Comederos y bebederos", pais:"Argentina",
    url:"https://m-once.com/",
    nota:"Pet shop mayorista en Once. Ideal para ir a ver y tocar producto." },
  { nombre:"1688", tipo:"1688", rubro:"Todos", pais:"China",
    url:"https://www.1688.com/",
    nota:"Mayorista chino, precios reales de fábrica. Requiere login. Agregá 定制 u OEM para marca propia." },
  { nombre:"Alibaba", tipo:"Alibaba", rubro:"Todos", pais:"China",
    url:"https://www.alibaba.com/",
    nota:"Más caro que 1688 pero en inglés y con proveedores acostumbrados a exportar." }
];

/* Proxy propio a la API de Mercado Libre (carpeta worker/).
   Vacío = la app funciona igual, sólo que con links en vez de datos. */
const API_MERCADO = "";

/* ---------- Plataformas (proveedores masivos) ----------
   No son fábricas: son buscadores de fábricas. El link se arma con el término
   del rubro, así que lleva a una búsqueda real, no a una home genérica. */
const PLATAFORMAS = [
  { n:"1688", pais:"China", clase:"plataforma", minimo:"1-50 u.", idioma:"chino",
    url:t=>`https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(t)}`,
    nota:"Precio real de fábrica, el más barato. Necesita login y agente de compras." },
  { n:"Alibaba", pais:"China", clase:"plataforma", minimo:"50-500 u.", idioma:"inglés",
    url:t=>`https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(t)}`,
    nota:"Más caro que 1688 pero en inglés y con proveedores acostumbrados a exportar." },
  { n:"AliExpress", pais:"China", clase:"plataforma", minimo:"1 u.", idioma:"español",
    url:t=>`https://es.aliexpress.com/w/wholesale-${encodeURIComponent(t)}.html`,
    nota:"Ideal para pedir muestras sueltas y ver el producto antes de comprometerse." },
  { n:"Made-in-China", pais:"China", clase:"plataforma", minimo:"100+ u.", idioma:"inglés",
    url:t=>`https://www.made-in-china.com/productSearch?word=${encodeURIComponent(t)}`,
    nota:"Fábricas verificadas, más orientado a industria que a reventa." },
  { n:"Global Sources", pais:"China", clase:"plataforma", minimo:"100+ u.", idioma:"inglés",
    url:t=>`https://www.globalsources.com/searchList/products?keyWord=${encodeURIComponent(t)}`,
    nota:"Fábricas con auditoría. Sirve para chequear si un proveedor es serio." },
  { n:"DHgate", pais:"China", clase:"plataforma", minimo:"1-10 u.", idioma:"inglés",
    url:t=>`https://www.dhgate.com/wholesale/search.do?searchkey=${encodeURIComponent(t)}`,
    nota:"Cantidades chicas. Precio intermedio entre AliExpress y Alibaba." },
  { n:"Mercado Libre", pais:"Argentina", clase:"competencia", minimo:"—", idioma:"español",
    url:t=>`https://listado.mercadolibre.com.ar/${encodeURIComponent(String(t).replace(/\s+/g,"-"))}`,
    nota:"No es proveedor: es dónde mirás precio de venta y cuánta competencia hay." },
  { n:"Mercado Libre · por mayor", pais:"Argentina", clase:"competencia", minimo:"—", idioma:"español",
    url:t=>`https://listado.mercadolibre.com.ar/${encodeURIComponent(String(t).replace(/\s+/g,"-"))}-por-mayor`,
    nota:"Para encontrar importadores argentinos que ya traen ese producto." }
];

/* Devuelve los links de búsqueda reales de un rubro. */
function buscadoresDe(rubroNombre){
  const m = metaRubro(rubroNombre);
  const chino = m.term && m.term !== "-" ? m.term : rubroNombre;
  return PLATAFORMAS.map(p=>({
    n:p.n, pais:p.pais, clase:p.clase, minimo:p.minimo, idioma:p.idioma, nota:p.nota,
    term: p.pais==="Argentina" ? rubroNombre : chino,
    url: p.url(p.pais==="Argentina" ? rubroNombre : chino)
  }));
}

/* Dominios conocidos: al pegar un link se completa proveedor, país y tipo. */
const DOMINIOS = [
  { m:"1688.com",        prov:"1688",                    pais:"China",     tipo:"1688",              origen:"China" },
  { m:"alibaba.com",     prov:"Alibaba",                 pais:"China",     tipo:"Alibaba",           origen:"China" },
  { m:"aliexpress.",     prov:"AliExpress",              pais:"China",     tipo:"Alibaba",           origen:"China" },
  { m:"taobao.com",      prov:"Taobao",                  pais:"China",     tipo:"Otro",              origen:"China" },
  { m:"made-in-china",   prov:"Made-in-China",           pais:"China",     tipo:"Otro",              origen:"China" },
  { m:"mau.com.ar",      prov:"MAU",                     pais:"Argentina", tipo:"Fabricante nacional", origen:"Argentina (fabricante)", wa:"11 3533-5659" },
  { m:"petcom.com.ar",   prov:"Petcom",                  pais:"Argentina", tipo:"Importador local",  origen:"Argentina (importador)" },
  { m:"happypet-",       prov:"Happy Pet",               pais:"Argentina", tipo:"Fabricante nacional", origen:"Argentina (fabricante)" },
  { m:"quemonamascotas", prov:"Que Mona Mascotas",       pais:"Argentina", tipo:"Fabricante nacional", origen:"Argentina (fabricante)" },
  { m:"petmarketdistrib",prov:"Petmarket Distribución",  pais:"Argentina", tipo:"Importador local",  origen:"Argentina (importador)", wa:"11 6506-6097" },
  { m:"m-once.com",      prov:"M-Once",                  pais:"Argentina", tipo:"Mayorista local",   origen:"Argentina (importador)" },
  { m:"donbodegon",      prov:"DonBodegón Mayorista",    pais:"Colombia",  tipo:"Importador local",  origen:"China", wa:"+573007170351" },
  { m:"mercadolibre.com.ar", prov:"Mercado Libre",       pais:"Argentina", tipo:"Otro",              origen:"Argentina (importador)" },
  { m:"voltra.com.ar",   prov:"Voltra (referencia)",     pais:"Argentina", tipo:"Otro",              origen:"China" },
  { m:"tiendanube.com",  prov:"",                        pais:"Argentina", tipo:"Otro",              origen:"Argentina (importador)" }
];

/* ---------- Nichos evaluados ---------- */
const NICHOS = [
  {
    nombre:"Mascotas", score:88, veredicto:"El mejor LTV de los tres",
    resumen:"Impulso emocional + utilidad real + recompra. Es el único que se sostiene sin pagar ads todos los meses.",
    pros:["Compra por identidad, no por precio","Accesorios infinitos → el catálogo crece solo",
          "Recompra natural (bolsitas, toallitas, repuestos)","Fácil y barato de segmentar en Meta",
          "Mayoristas nacionales con stock, sin esperar 90 días"],
    contras:["Snacks y alimento van con registro SENASA — evitalos","Rubro con competencia establecida: ganás por curaduría y contenido"],
    ancla:"Comedero antivoracidad + alfombra de lamer",
    satelites:"Juguete dispensador, cortauñas con luz, portabolsitas, cinturón de auto, rodillo quitapelos",
    recompra:"Bolsitas biodegradables, toallitas, repuestos de rodillo"
  },
  {
    nombre:"Cocina y Organización", score:74, veredicto:"El rey del video demo",
    resumen:"Problema visible, solución en 15 segundos. Impulso puro y de los más baratos de pautar.",
    pros:["Demo en video convierte como pocos rubros","Ticket bajo pero volumen alto",
          "Producto liviano y sin variantes","Sin certificaciones si no enchufa"],
    contras:["Recompra baja: vivís de adquisición permanente","Margen se erosiona rápido cuando te copian",
             "Todo lo que enchufa a 220 necesita seguridad eléctrica"],
    ancla:"Organizador modular o utensilio multifunción",
    satelites:"Complementos del mismo sistema, repuestos, sets",
    recompra:"Baja — compensar con bundles y ticket alto"
  },
  {
    nombre:"Auto y Moto", score:71, veredicto:"Público masivo y fácil de segmentar",
    resumen:"Comprador que vuelve por accesorios, ticket medio y altísima intención de compra.",
    pros:["Segmentación en Meta muy precisa","Comprador vuelve por más accesorios",
          "Ticket medio que banca el costo de adquisición","Compra por impulso y por utilidad a la vez"],
    contras:["Cuidado con todo lo que enchufe o sea eléctrico","Algunos ítems son voluminosos → flete caro",
             "Compatibilidad por modelo puede generar devoluciones"],
    ancla:"Organizador de baúl, soporte de celular, luces LED interiores",
    satelites:"Fundas, cargadores, aromatizantes, kits de limpieza",
    recompra:"Media — consumibles de limpieza y aromatizantes"
  }
];

/* ---------- Caliente del día ----------
   Candidatos con la lógica de Voltra: genérico chino rebrandeable, funcional,
   ticket medio-alto y demo clara en video. El de hoy sale de la fecha. */
const CALIENTES = [
  { p:"Masajeador de cuello shiatsu con calor", rubro:"Masajeadores de cuello", score:86, prov:"1688 (颈椎按摩器) · Alibaba",
    w:"Demo hipnótica en video, ticket alto y es el regalo fácil. Voltra lo tiene entre sus más vendidos." },
  { p:"Pistola de masaje muscular", rubro:"Masajeadores de cuello", score:82, prov:"1688 (筋膜枪)",
    w:"Ticket alto con costo bajo. Público de gimnasio y de oficina a la vez." },
  { p:"Aspiradora de mano inalámbrica 3 en 1", rubro:"Limpieza y aspirado", score:80, prov:"1688 (车载吸尘器)",
    w:"El antes/después se vende solo. Ojo: enchufa, necesita seguridad eléctrica." },
  { p:"Carro plegable retráctil multiuso", rubro:"Organización de viaje", score:83, prov:"1688 (折叠购物车)",
    w:"Resuelve un dolor real (cargar el súper) y no lleva electrónica ni certificación." },
  { p:"Soporte de notebook plegable de aluminio", rubro:"Setup de escritorio", score:84, prov:"1688 (笔记本支架)",
    w:"Liviano, sin variantes, marca propia trivial con grabado. Ticket medio y cero devoluciones." },
  { p:"Saco de boxeo de escritorio antiestrés", rubro:"Setup de escritorio", score:78, prov:"1688 (减压拳击)",
    w:"Producto de impulso puro con video que se comparte solo. Ticket bajo: venderlo en combo." },
  { p:"Bolsa-manta plegable 2 en 1", rubro:"Camping y refugio", score:79, prov:"1688 (户外野餐垫)",
    w:"Dos productos en uno, argumento de venta directo. Liviano y sin talles." },
  { p:"Almohada cervical de memoria", rubro:"Corrección postural", score:85, prov:"1688 (记忆棉枕头)",
    w:"Resuelve dolor real: se paga sin discutir. Voluminosa, calcular bien el flete." },
  { p:"Corrector de postura ajustable", rubro:"Corrección postural", score:81, prov:"1688 (背部矫正带)",
    w:"Dolor visible y demo clara. Cuidado con las promesas médicas en el copy." },
  { p:"Cinturón lumbar de soporte", rubro:"Corrección postural", score:77, prov:"1688 (护腰带)",
    w:"Público de trabajo físico, alta intención. Tiene talles: pocos y bien elegidos." },
  { p:"Comedero antivoracidad", rubro:"Comederos y bebederos", score:88, prov:"Petcom · MAU · 1688 (慢食碗)",
    w:"Problema visible, demo perfecta, liviano y sin variantes. El ancla del catálogo." },
  { p:"Cepillo deshedding para perro y gato", rubro:"Comederos y bebederos", score:86, prov:"MAU · Happy Pet · 1688 (宠物梳)",
    w:"El antes/después con el pelo suelto es contenido viral asegurado." },
  { p:"Rodillo quitapelos con repuestos", rubro:"Comederos y bebederos", score:80, prov:"Happy Pet · 1688 (粘毛器)",
    w:"Modelo maquinita y hojita: el repuesto es la recompra." },
  { p:"Organizador de baúl plegable", rubro:"Organizadores de auto", score:82, prov:"1688 (后备箱收纳箱)",
    w:"Utilidad pura, público masivo y fácil de segmentar en Meta." },
  { p:"Aspiradora de auto 12V", rubro:"Organizadores de auto", score:76, prov:"1688 (车载吸尘器)",
    w:"Alta intención de compra, pero enchufa: revisar certificación." },
  { p:"Soporte magnético de celular para auto", rubro:"Organizadores de auto", score:74, prov:"1688 (车载手机支架)",
    w:"Impulso puro y ticket bajo. Sirve de satélite, no de ancla." },
  { p:"Kit de bandas elásticas de resistencia", rubro:"Bandas y resistencia", score:79, prov:"1688 (阻力带)",
    w:"Liviano, sin certificación, se vende en kit y recompran por nivel." },
  { p:"Rueda abdominal con retorno automático", rubro:"Bandas y resistencia", score:75, prov:"1688 (健腹轮)",
    w:"Demo clara y ticket medio. Rubro competitivo: ganás con contenido." },
  { p:"Termo con pantalla de temperatura", rubro:"Organización de cocina", score:83, prov:"1688 (智能保温杯)",
    w:"Muy argentino, ticket medio-alto y es regalo. La pantalla es el gancho del video." },
  { p:"Set matero con grabado personalizado", rubro:"Organización de cocina", score:85, prov:"Proveedor local + grabado láser",
    w:"Demanda enorme, sin talles, y la personalización te da margen y te hace difícil de copiar." },
  { p:"Organizador modular de alacena", rubro:"Organización de cocina", score:77, prov:"1688 (厨房收纳)",
    w:"Demo de 15 segundos y se vende en sets, que te sube el ticket." },
  { p:"Cortador multifunción de verduras", rubro:"Organización de cocina", score:70, prov:"1688 (多功能切菜器)",
    w:"El clásico del video demo. Mucha competencia: sólo con ángulo propio." },
  { p:"Bolso térmico plegable", rubro:"Camping y refugio", score:76, prov:"1688 (保温袋)",
    w:"Estacional fuerte de verano. Liviano y fácil de brandear." },
  { p:"Silla plegable ultraliviana", rubro:"Camping y refugio", score:74, prov:"1688 (折叠椅)",
    w:"Ticket alto y comunidad fiel, pero el volumen encarece el flete." },
  { p:"Regadera automática por goteo", rubro:"Riego automático", score:81, prov:"1688 (自动滴灌)",
    w:"Nicho apasionado y poco explotado acá. Resuelve el irte de vacaciones." },
  { p:"Guantes de jardinería con garras", rubro:"Riego automático", score:73, prov:"1688 (园艺手套)",
    w:"Impulso barato con demo simpática. Satélite ideal." },
  { p:"Organizador de cochecito de bebé", rubro:"Cochecitos y accesorios", score:84, prov:"1688 (婴儿车挂袋)",
    w:"Compran sin regatear. Liviano, sin talles y con recompra por regalo." },
  { p:"Termómetro infrarrojo sin contacto", rubro:"Cochecitos y accesorios", score:72, prov:"1688 (红外体温计)",
    w:"Alta intención pero puede caer en producto médico: verificar antes de traer." },
  { p:"Mochila antirrobo con puerto USB", rubro:"Mochilas técnicas", score:80, prov:"1688 (防盗背包)",
    w:"Ticket medio-alto y marca propia natural. Textil paga derechos altos: costear fino." },
  { p:"Lámpara de escritorio con carga inalámbrica", rubro:"Iluminación LED deco", score:71, prov:"1688 (无线充电台灯)",
    w:"Muy visual y barata de pautar, pero enchufa: seguridad eléctrica sí o sí." },
  { p:"Humidificador difusor de aromas", rubro:"Masajeadores de cuello", score:75, prov:"1688 (加湿器)",
    w:"Video precioso y recompra por las esencias. Enchufa: revisar certificación." },
  { p:"Afeitadora corporal sumergible", rubro:"Depilación y afeitado", score:73, prov:"1688 (身体剃须刀)",
    w:"Voltra la tiene entre sus más vendidos. Rubro saturado: entrar sólo con ángulo claro." }
];

/* ---------- Ideas para el botón 🎲 ---------- */
const IDEAS = [
  { p:"Comedero antivoracidad", r:"Comederos y bebederos", w:"Problema visible (el perro come rápido y vomita), demo perfecta en video, liviano, sin talles." },
  { p:"Alfombra de lamer (lick mat)", r:"Comederos y bebederos", w:"Ticket bajo, margen alto, se vende pegada al comedero. Contenido viral asegurado." },
  { p:"Cepillo deshedding", r:"Comederos y bebederos", w:"El antes/después en video vende solo. Utilidad clarísima." },
  { p:"Juguete dispensador de snacks", r:"Comederos y bebederos", w:"Funcional (entretiene al perro solo), impulso, y hay fabricante nacional." },
  { p:"Cinturón de seguridad para perro en auto", r:"Comederos y bebederos", w:"Nicho + seguridad + regalo. Poca competencia en Argentina." },
  { p:"Portabolsitas para correa", r:"Comederos y bebederos", w:"Satélite ideal: nadie lo busca solo, todos lo suman al carrito." },
  { p:"Cortauñas con luz LED", r:"Comederos y bebederos", w:"Resuelve un miedo real (cortar de más). Margen alto, ticket bajo." },
  { p:"Organizador de baúl plegable", r:"Organizadores de auto", w:"Utilidad pura, demo simple, público masivo." },
  { p:"Soporte de celular magnético para auto", r:"Organizadores de auto", w:"Impulso puro, ticket bajo, recompra por regalo." },
  { p:"Kit de limpieza de tapizados", r:"Organizadores de auto", w:"Antes/después en video + consumible que se repone." },
  { p:"Organizador modular de alacena", r:"Organización de cocina", w:"Demo de 15 segundos, se vende en sets (sube el ticket)." },
  { p:"Cortador multifunción de verduras", r:"Organización de cocina", w:"El clásico del video demo. Ojo: mucha competencia." },
  { p:"Bandas elásticas de resistencia", r:"Bandas y resistencia", w:"Liviano, sin certificación, se vende en kit, recompra por niveles." },
  { p:"Soporte de monitor con cajón", r:"Setup de escritorio", w:"Ticket medio, público que compra por estética, marca propia fácil." },
  { p:"Rodillo quitapelos con repuestos", r:"Comederos y bebederos", w:"El repuesto es la recompra. Modelo de maquinita y hojita." }
];

/* Subir esto cuando se corrijan los productos de arranque: los que el usuario
   no editó se refrescan solos, los que tocó quedan como los dejó. */
const SEED_VER = 3;

/* ---------- Productos de arranque ---------- */
const SEED = [
  {
    id:"s1", nombre:"Comedero antivoracidad", rubro:"Comederos y bebederos",
    tags:["funcional","demo en video","liviano","sin variantes"],
    proveedor:"Petcom", provUrl:"https://www.petcom.com.ar/mayoristas-petcom/",
    url:"https://www.petcom.com.ar/alimentacion-y-bebederos/bowls-clasicos-y-ergonomicos/",
    paisProv:"Argentina",
    tipoProv:"Importador local", origen:"Argentina (importador)",
    fob:2.5, venta:18, moq:20,
    competidores:[{n:"Genérico ML",u:"",p:"16",v:"500+/mes"}],
    crit:{margen:4,competencia:3,recompra:2,certificacion:5,logistica:4,demo:5,variantes:5},
    veredicto:"estrella",
    notas:"ANCLA del catálogo. El video del perro comiendo despacio se hace solo. El link va a la CATEGORÍA de bowls de Petcom — no encontré la ficha del antivoracidad puntual, pedila por WhatsApp. Comparar con MAU."
  },
  {
    id:"s2", nombre:"Alfombra de lamer (lick mat)", rubro:"Comederos y bebederos",
    tags:["funcional","impulso","liviano","sin variantes"],
    proveedor:"MAU", provUrl:"https://mau.com.ar/tienda/",
    whatsapp:"11 3533-5659", paisProv:"Argentina",
    tipoProv:"Fabricante nacional", origen:"Argentina (fabricante)",
    fob:1.8, venta:12, moq:20,
    competidores:[],
    crit:{margen:5,competencia:4,recompra:2,certificacion:5,logistica:5,demo:5,variantes:5},
    veredicto:"estrella",
    notas:"Satélite perfecto del comedero. Margen altísimo, casi no pesa. No lo encontré en el catálogo online de MAU: preguntar por WhatsApp si lo fabrican."
  },
  {
    id:"s3", nombre:"Juguete dispensador de snacks", rubro:"Juguetes para perro",
    tags:["funcional","nicho","demo en video"],
    proveedor:"MAU", provUrl:"https://mau.com.ar/tienda/",
    url:"https://mau.com.ar/producto/rueda-tipo-neumatico-interactivo-dog-food-grande/",
    whatsapp:"11 3533-5659", paisProv:"Argentina",
    tipoProv:"Fabricante nacional", origen:"Argentina (fabricante)",
    fob:3.2, venta:20, moq:20,
    competidores:[],
    crit:{margen:4,competencia:3,recompra:3,certificacion:5,logistica:4,demo:5,variantes:4},
    veredicto:"potencial",
    notas:"Entretiene al perro solo — argumento de venta fuerte para dueños que trabajan fuera."
  },
  {
    id:"s4", nombre:"Bolsitas biodegradables (pack)", rubro:"Higiene de mascota",
    tags:["funcional","recompra","liviano","sin variantes"],
    proveedor:"DonBodegón Mayorista", provUrl:"https://mayorista.donbodegon.com/c/Animales%20y%20Mascotas",
    whatsapp:"+573007170351", paisProv:"Colombia",
    tipoProv:"Importador local", origen:"China",
    fob:0.9, venta:6, moq:50,
    competidores:[],
    crit:{margen:3,competencia:2,recompra:5,certificacion:5,logistica:5,demo:2,variantes:5},
    veredicto:"potencial",
    notas:"⚠️ El proveedor es COLOMBIANO: sirve de referencia de precio, no para comprar. Buscar equivalente argentino. No es winner por sí solo: es el MOTOR DE RECOMPRA. Suscripción o pack x6 para que vuelvan sin pagar ads."
  },
  {
    id:"s5", nombre:"Cinturón de seguridad para perro (auto)", rubro:"Transporte de mascota",
    tags:["funcional","nicho","regalo","liviano"],
    proveedor:"MAU", provUrl:"https://mau.com.ar/tienda/",
    url:"https://mau.com.ar/producto/correa-cinturon-de-seguridad-regulable/",
    whatsapp:"11 3533-5659", paisProv:"Argentina",
    tipoProv:"Fabricante nacional", origen:"Argentina (fabricante)",
    fob:2.1, venta:15, moq:20,
    competidores:[],
    crit:{margen:4,competencia:4,recompra:1,certificacion:5,logistica:5,demo:4,variantes:4},
    veredicto:"evaluar",
    notas:"Poca competencia en Argentina. Ángulo de seguridad + multa por llevar mascota suelta."
  },
  {
    id:"s6", nombre:"Zapatillas réplica estilo Yeezy", rubro:"Otro",
    tags:["impulso"],
    proveedor:"温州浙曜商贸有限公司 (1688)",
    url:"https://detail.1688.com/offer/722744469572.html",
    provUrl:"https://www.1688.com/",
    tipoProv:"1688", origen:"China", paisProv:"China",
    fob:2.4, venta:35, moq:2,
    competidores:[],
    crit:{margen:1,competencia:1,recompra:1,certificacion:2,logistica:2,demo:3,variantes:1},
    veredicto:"descartado",
    notas:"CLAVO — queda de recordatorio. Réplica (infracción marcaria) + calzado 35% + DIEM + antidumping + talles con 30-40% de devolución + baneo de Meta y Mercado Pago. Perdés el Business Manager, que vale más que el stock."
  }
];
