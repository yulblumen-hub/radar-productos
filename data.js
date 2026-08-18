/* ============================================================
   Radar de Productos — datos base
   ============================================================ */

const RUBROS = [
  "Mascotas","Cocina y Organización","Auto y Moto","Fitness",
  "Escritorio y Setup","Bebés y Maternidad","Camping y Outdoor",
  "Belleza y Cuidado","Herramientas","Otro"
];

const ORIGENES = ["China","Argentina (importador)","Argentina (fabricante)","Brasil","India","Otro"];

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
  { nombre:"DonBodegón Mayorista", tipo:"Importador local", rubro:"Mascotas", pais:"Argentina",
    url:"https://mayorista.donbodegon.com/c/Animales%20y%20Mascotas",
    nota:"Importadores directos: bolsos, correas, bozales, juguetes." },
  { nombre:"MAU", tipo:"Fabricante nacional", rubro:"Mascotas", pais:"Argentina",
    url:"https://mau.com.ar/",
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

/* ---------- Productos de arranque ---------- */
const SEED = [
  {
    id:"s1", nombre:"Comedero antivoracidad", rubro:"Mascotas",
    tags:["funcional","demo en video","liviano","sin variantes"],
    proveedor:"Petcom", provUrl:"https://www.petcom.com.ar/mayoristas-petcom/",
    tipoProv:"Importador local", origen:"Argentina (importador)",
    fob:2.5, venta:18, moq:20,
    competidores:[{n:"Genérico ML",u:"",p:"16",v:"500+/mes"}],
    crit:{margen:4,competencia:3,recompra:2,certificacion:5,logistica:4,demo:5,variantes:5},
    veredicto:"estrella",
    notas:"ANCLA del catálogo. El video del perro comiendo despacio se hace solo. Pedir precio a Petcom y MAU y comparar."
  },
  {
    id:"s2", nombre:"Alfombra de lamer (lick mat)", rubro:"Mascotas",
    tags:["funcional","impulso","liviano","sin variantes"],
    proveedor:"MAU", provUrl:"https://mau.com.ar/",
    tipoProv:"Fabricante nacional", origen:"Argentina (fabricante)",
    fob:1.8, venta:12, moq:20,
    competidores:[],
    crit:{margen:5,competencia:4,recompra:2,certificacion:5,logistica:5,demo:5,variantes:5},
    veredicto:"estrella",
    notas:"Satélite perfecto del comedero. Margen altísimo, casi no pesa. Va en todos los bundles."
  },
  {
    id:"s3", nombre:"Juguete dispensador de snacks", rubro:"Mascotas",
    tags:["funcional","nicho","demo en video"],
    proveedor:"MAU", provUrl:"https://mau.com.ar/",
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
    whatsapp:"",
    tipoProv:"Importador local", origen:"Argentina (importador)",
    fob:0.9, venta:6, moq:50,
    competidores:[],
    crit:{margen:3,competencia:2,recompra:5,certificacion:5,logistica:5,demo:2,variantes:5},
    veredicto:"potencial",
    notas:"No es winner por sí solo: es el MOTOR DE RECOMPRA. Suscripción o pack x6 para que vuelvan sin pagar ads."
  },
  {
    id:"s5", nombre:"Cinturón de seguridad para perro (auto)", rubro:"Mascotas",
    tags:["funcional","nicho","regalo","liviano"],
    proveedor:"Happy Pet", provUrl:"https://www.happypet-accesorios.com.ar/ventas-por-mayor/",
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
    tipoProv:"1688", origen:"China",
    fob:2.4, venta:35, moq:2,
    competidores:[],
    crit:{margen:1,competencia:1,recompra:1,certificacion:2,logistica:2,demo:3,variantes:1},
    veredicto:"descartado",
    notas:"CLAVO — queda de recordatorio. Réplica (infracción marcaria) + calzado 35% + DIEM + antidumping + talles con 30-40% de devolución + baneo de Meta y Mercado Pago. Perdés el Business Manager, que vale más que el stock."
  }
];
