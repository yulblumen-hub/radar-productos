/* ============================================================
   Radar de Productos — datos base
   ============================================================ */

/* Cada rubro con dos lecturas propias:
   explotado  = qué tan saturado está ya en Argentina (alto = mucha competencia)
   proyeccion = potencial de crecimiento y margen (alto = vale entrar)
   La oportunidad es la diferencia entre las dos. Son estimaciones de mercado,
   no datos duros: sirven para priorizar, no para decidir solo con eso. */
const RUBROS_META = [
  { n:"Mascotas",               explotado:55, proyeccion:88, nota:"Recompra natural y compra emocional. El mejor LTV." },
  { n:"Wellness y Masajes",     explotado:45, proyeccion:86, nota:"Ticket alto, demo hipnótica en video, regalo. Ojo con lo que enchufa." },
  { n:"Bebés y Maternidad",     explotado:50, proyeccion:84, nota:"Compran sin regatear y recompran por etapas del bebé." },
  { n:"Escritorio y Setup",     explotado:52, proyeccion:80, nota:"Público que compra por estética. Marca propia fácil." },
  { n:"Camping y Outdoor",      explotado:40, proyeccion:79, nota:"Estacional pero de ticket alto y comunidad fiel." },
  { n:"Auto y Moto",            explotado:58, proyeccion:78, nota:"Segmentación quirúrgica en Meta y accesorios infinitos." },
  { n:"Salud y Ortopedia",      explotado:38, proyeccion:77, nota:"Resuelve dolor real, se paga sin discutir. Cuidado con lo que sea producto médico." },
  { n:"Cocina y Organización",  explotado:72, proyeccion:74, nota:"El rey del video demo, pero recompra baja: vivís de adquisición." },
  { n:"Bolsos y Mochilas",      explotado:60, proyeccion:73, nota:"Ticket medio-alto y marca propia natural. Textil paga derechos altos." },
  { n:"Limpieza del Hogar",     explotado:55, proyeccion:72, nota:"Antes/después que se vende solo. Consumibles de repuesto." },
  { n:"Fitness y Deporte",      explotado:68, proyeccion:70, nota:"Liviano y sin certificación, pero mucha competencia de precio." },
  { n:"Jardín y Plantas",       explotado:35, proyeccion:70, nota:"Nicho apasionado, poco explotado en ecommerce argentino." },
  { n:"Viaje",                  explotado:48, proyeccion:68, nota:"Compra por evento, ticket medio. Estacional fuerte." },
  { n:"Herramientas",           explotado:62, proyeccion:67, nota:"Alta intención, cero devolución. Comprador que sabe lo que quiere." },
  { n:"Gaming",                 explotado:70, proyeccion:66, nota:"Comunidad enorme pero muy sensible al precio y a la marca." },
  { n:"Belleza y Cuidado",      explotado:78, proyeccion:64, nota:"Saturadísimo y ANMAT si es cosmético. Solo aparatos." },
  { n:"Iluminación y Deco",     explotado:58, proyeccion:63, nota:"Visual y barato de pautar. Casi todo enchufa: seguridad eléctrica." },
  { n:"Joyería y Accesorios",   explotado:82, proyeccion:62, nota:"Relación valor/peso imbatible, pero ganás por curaduría, no por producto." },
  { n:"Audio y Tecnología",     explotado:85, proyeccion:58, nota:"Márgenes apretados y competís contra marcas conocidas." },
  { n:"Juguetes y Juegos",      explotado:66, proyeccion:55, nota:"Certificación obligatoria de seguridad. Muy estacional." },
  { n:"Papelería y Escolar",    explotado:60, proyeccion:48, nota:"Ticket bajo y estacionalidad brutal. Difícil que cierre con ads." },
  { n:"Otro",                   explotado:50, proyeccion:50, nota:"Sin clasificar." }
];
const RUBROS = RUBROS_META.map(r=>r.n);
const metaRubro = n => RUBROS_META.find(r=>r.n===n) || RUBROS_META[RUBROS_META.length-1];
/* Oportunidad: cuánto potencial queda sin tomar. */
const oportunidad = n => { const m=metaRubro(n); return Math.max(0, Math.round(m.proyeccion - m.explotado*0.65)); };

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
  { nombre:"Petcom", tipo:"Importador local", rubro:"Mascotas", pais:"Argentina",
    url:"https://www.petcom.com.ar/mayoristas-petcom/",
    nota:"Importadora mayorista. Juguetes interactivos, comederos, bebederos automáticos, rascadores." },
  { nombre:"Petmarket Distribución", tipo:"Importador local", rubro:"Mascotas", pais:"Argentina",
    url:"https://petmarketdistribucion.com.ar/venta-mayorista/",
    whatsapp:"11 6506-6097",
    nota:"Stock para pet shops al por mayor." },
  { nombre:"DonBodegón Mayorista", tipo:"Importador local", rubro:"Mascotas", pais:"Colombia",
    whatsapp:"+573007170351",
    url:"https://mayorista.donbodegon.com/c/Animales%20y%20Mascotas",
    nota:"⚠️ Es COLOMBIANO (+57), no argentino. Importa de China y vende en Colombia — sirve como referencia de precio, no como proveedor local." },
  { nombre:"MAU", tipo:"Fabricante nacional", rubro:"Mascotas", pais:"Argentina",
    whatsapp:"11 3533-5659",
    url:"https://mau.com.ar/tienda/",
    nota:"Fábrica con +10 años. Abastece pet shops, veterinarias y cadenas. Reposición rápida, sin aduana." },
  { nombre:"Happy Pet", tipo:"Fabricante nacional", rubro:"Mascotas", pais:"Argentina",
    url:"https://www.happypet-accesorios.com.ar/ventas-por-mayor/",
    nota:"500+ artículos: juguetes, ropa, colchones, higiene, accesorios." },
  { nombre:"Que Mona Mascotas", tipo:"Fabricante nacional", rubro:"Mascotas", pais:"Argentina",
    url:"https://www.quemonamascotas.com.ar/mayoristas/",
    nota:"Taller propio, diseños exclusivos. Envíos desde Villa Carlos Paz." },
  { nombre:"M-Once", tipo:"Mayorista local", rubro:"Mascotas", pais:"Argentina",
    url:"https://m-once.com/",
    nota:"Pet shop mayorista en Once. Ideal para ir a ver y tocar producto." },
  { nombre:"1688", tipo:"1688", rubro:"Todos", pais:"China",
    url:"https://www.1688.com/",
    nota:"Mayorista chino, precios reales de fábrica. Requiere login. Agregá 定制 u OEM para marca propia." },
  { nombre:"Alibaba", tipo:"Alibaba", rubro:"Todos", pais:"China",
    url:"https://www.alibaba.com/",
    nota:"Más caro que 1688 pero en inglés y con proveedores acostumbrados a exportar." }
];

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
  { p:"Masajeador de cuello shiatsu con calor", rubro:"Wellness y Masajes", score:86, prov:"1688 (颈椎按摩器) · Alibaba",
    w:"Demo hipnótica en video, ticket alto y es el regalo fácil. Voltra lo tiene entre sus más vendidos." },
  { p:"Pistola de masaje muscular", rubro:"Wellness y Masajes", score:82, prov:"1688 (筋膜枪)",
    w:"Ticket alto con costo bajo. Público de gimnasio y de oficina a la vez." },
  { p:"Aspiradora de mano inalámbrica 3 en 1", rubro:"Limpieza del Hogar", score:80, prov:"1688 (车载吸尘器)",
    w:"El antes/después se vende solo. Ojo: enchufa, necesita seguridad eléctrica." },
  { p:"Carro plegable retráctil multiuso", rubro:"Viaje", score:83, prov:"1688 (折叠购物车)",
    w:"Resuelve un dolor real (cargar el súper) y no lleva electrónica ni certificación." },
  { p:"Soporte de notebook plegable de aluminio", rubro:"Escritorio y Setup", score:84, prov:"1688 (笔记本支架)",
    w:"Liviano, sin variantes, marca propia trivial con grabado. Ticket medio y cero devoluciones." },
  { p:"Saco de boxeo de escritorio antiestrés", rubro:"Escritorio y Setup", score:78, prov:"1688 (减压拳击)",
    w:"Producto de impulso puro con video que se comparte solo. Ticket bajo: venderlo en combo." },
  { p:"Bolsa-manta plegable 2 en 1", rubro:"Camping y Outdoor", score:79, prov:"1688 (户外野餐垫)",
    w:"Dos productos en uno, argumento de venta directo. Liviano y sin talles." },
  { p:"Almohada cervical de memoria", rubro:"Salud y Ortopedia", score:85, prov:"1688 (记忆棉枕头)",
    w:"Resuelve dolor real: se paga sin discutir. Voluminosa, calcular bien el flete." },
  { p:"Corrector de postura ajustable", rubro:"Salud y Ortopedia", score:81, prov:"1688 (背部矫正带)",
    w:"Dolor visible y demo clara. Cuidado con las promesas médicas en el copy." },
  { p:"Cinturón lumbar de soporte", rubro:"Salud y Ortopedia", score:77, prov:"1688 (护腰带)",
    w:"Público de trabajo físico, alta intención. Tiene talles: pocos y bien elegidos." },
  { p:"Comedero antivoracidad", rubro:"Mascotas", score:88, prov:"Petcom · MAU · 1688 (慢食碗)",
    w:"Problema visible, demo perfecta, liviano y sin variantes. El ancla del catálogo." },
  { p:"Cepillo deshedding para perro y gato", rubro:"Mascotas", score:86, prov:"MAU · Happy Pet · 1688 (宠物梳)",
    w:"El antes/después con el pelo suelto es contenido viral asegurado." },
  { p:"Rodillo quitapelos con repuestos", rubro:"Mascotas", score:80, prov:"Happy Pet · 1688 (粘毛器)",
    w:"Modelo maquinita y hojita: el repuesto es la recompra." },
  { p:"Organizador de baúl plegable", rubro:"Auto y Moto", score:82, prov:"1688 (后备箱收纳箱)",
    w:"Utilidad pura, público masivo y fácil de segmentar en Meta." },
  { p:"Aspiradora de auto 12V", rubro:"Auto y Moto", score:76, prov:"1688 (车载吸尘器)",
    w:"Alta intención de compra, pero enchufa: revisar certificación." },
  { p:"Soporte magnético de celular para auto", rubro:"Auto y Moto", score:74, prov:"1688 (车载手机支架)",
    w:"Impulso puro y ticket bajo. Sirve de satélite, no de ancla." },
  { p:"Kit de bandas elásticas de resistencia", rubro:"Fitness y Deporte", score:79, prov:"1688 (阻力带)",
    w:"Liviano, sin certificación, se vende en kit y recompran por nivel." },
  { p:"Rueda abdominal con retorno automático", rubro:"Fitness y Deporte", score:75, prov:"1688 (健腹轮)",
    w:"Demo clara y ticket medio. Rubro competitivo: ganás con contenido." },
  { p:"Termo con pantalla de temperatura", rubro:"Cocina y Organización", score:83, prov:"1688 (智能保温杯)",
    w:"Muy argentino, ticket medio-alto y es regalo. La pantalla es el gancho del video." },
  { p:"Set matero con grabado personalizado", rubro:"Cocina y Organización", score:85, prov:"Proveedor local + grabado láser",
    w:"Demanda enorme, sin talles, y la personalización te da margen y te hace difícil de copiar." },
  { p:"Organizador modular de alacena", rubro:"Cocina y Organización", score:77, prov:"1688 (厨房收纳)",
    w:"Demo de 15 segundos y se vende en sets, que te sube el ticket." },
  { p:"Cortador multifunción de verduras", rubro:"Cocina y Organización", score:70, prov:"1688 (多功能切菜器)",
    w:"El clásico del video demo. Mucha competencia: sólo con ángulo propio." },
  { p:"Bolso térmico plegable", rubro:"Camping y Outdoor", score:76, prov:"1688 (保温袋)",
    w:"Estacional fuerte de verano. Liviano y fácil de brandear." },
  { p:"Silla plegable ultraliviana", rubro:"Camping y Outdoor", score:74, prov:"1688 (折叠椅)",
    w:"Ticket alto y comunidad fiel, pero el volumen encarece el flete." },
  { p:"Regadera automática por goteo", rubro:"Jardín y Plantas", score:81, prov:"1688 (自动滴灌)",
    w:"Nicho apasionado y poco explotado acá. Resuelve el irte de vacaciones." },
  { p:"Guantes de jardinería con garras", rubro:"Jardín y Plantas", score:73, prov:"1688 (园艺手套)",
    w:"Impulso barato con demo simpática. Satélite ideal." },
  { p:"Organizador de cochecito de bebé", rubro:"Bebés y Maternidad", score:84, prov:"1688 (婴儿车挂袋)",
    w:"Compran sin regatear. Liviano, sin talles y con recompra por regalo." },
  { p:"Termómetro infrarrojo sin contacto", rubro:"Bebés y Maternidad", score:72, prov:"1688 (红外体温计)",
    w:"Alta intención pero puede caer en producto médico: verificar antes de traer." },
  { p:"Mochila antirrobo con puerto USB", rubro:"Bolsos y Mochilas", score:80, prov:"1688 (防盗背包)",
    w:"Ticket medio-alto y marca propia natural. Textil paga derechos altos: costear fino." },
  { p:"Lámpara de escritorio con carga inalámbrica", rubro:"Iluminación y Deco", score:71, prov:"1688 (无线充电台灯)",
    w:"Muy visual y barata de pautar, pero enchufa: seguridad eléctrica sí o sí." },
  { p:"Humidificador difusor de aromas", rubro:"Wellness y Masajes", score:75, prov:"1688 (加湿器)",
    w:"Video precioso y recompra por las esencias. Enchufa: revisar certificación." },
  { p:"Afeitadora corporal sumergible", rubro:"Belleza y Cuidado", score:73, prov:"1688 (身体剃须刀)",
    w:"Voltra la tiene entre sus más vendidos. Rubro saturado: entrar sólo con ángulo claro." }
];

/* ---------- Ideas para el botón 🎲 ---------- */
const IDEAS = [
  { p:"Comedero antivoracidad", r:"Mascotas", w:"Problema visible (el perro come rápido y vomita), demo perfecta en video, liviano, sin talles." },
  { p:"Alfombra de lamer (lick mat)", r:"Mascotas", w:"Ticket bajo, margen alto, se vende pegada al comedero. Contenido viral asegurado." },
  { p:"Cepillo deshedding", r:"Mascotas", w:"El antes/después en video vende solo. Utilidad clarísima." },
  { p:"Juguete dispensador de snacks", r:"Mascotas", w:"Funcional (entretiene al perro solo), impulso, y hay fabricante nacional." },
  { p:"Cinturón de seguridad para perro en auto", r:"Mascotas", w:"Nicho + seguridad + regalo. Poca competencia en Argentina." },
  { p:"Portabolsitas para correa", r:"Mascotas", w:"Satélite ideal: nadie lo busca solo, todos lo suman al carrito." },
  { p:"Cortauñas con luz LED", r:"Mascotas", w:"Resuelve un miedo real (cortar de más). Margen alto, ticket bajo." },
  { p:"Organizador de baúl plegable", r:"Auto y Moto", w:"Utilidad pura, demo simple, público masivo." },
  { p:"Soporte de celular magnético para auto", r:"Auto y Moto", w:"Impulso puro, ticket bajo, recompra por regalo." },
  { p:"Kit de limpieza de tapizados", r:"Auto y Moto", w:"Antes/después en video + consumible que se repone." },
  { p:"Organizador modular de alacena", r:"Cocina y Organización", w:"Demo de 15 segundos, se vende en sets (sube el ticket)." },
  { p:"Cortador multifunción de verduras", r:"Cocina y Organización", w:"El clásico del video demo. Ojo: mucha competencia." },
  { p:"Bandas elásticas de resistencia", r:"Fitness", w:"Liviano, sin certificación, se vende en kit, recompra por niveles." },
  { p:"Soporte de monitor con cajón", r:"Escritorio y Setup", w:"Ticket medio, público que compra por estética, marca propia fácil." },
  { p:"Rodillo quitapelos con repuestos", r:"Mascotas", w:"El repuesto es la recompra. Modelo de maquinita y hojita." }
];

/* Subir esto cuando se corrijan los productos de arranque: los que el usuario
   no editó se refrescan solos, los que tocó quedan como los dejó. */
const SEED_VER = 2;

/* ---------- Productos de arranque ---------- */
const SEED = [
  {
    id:"s1", nombre:"Comedero antivoracidad", rubro:"Mascotas",
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
    id:"s2", nombre:"Alfombra de lamer (lick mat)", rubro:"Mascotas",
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
    id:"s3", nombre:"Juguete dispensador de snacks", rubro:"Mascotas",
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
    id:"s4", nombre:"Bolsitas biodegradables (pack)", rubro:"Mascotas",
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
    id:"s5", nombre:"Cinturón de seguridad para perro (auto)", rubro:"Mascotas",
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
