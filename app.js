/* ============================================================
   Radar de Productos — lógica
   ============================================================ */
const APP_VER = "v40";
const KEY  = "radar-productos-v1";
const PKEY = "radar-proveedores-v1";
const TKEY = "radar-tiendas-v1";
const FKEY = "radar-favoritos-v1";
const CKEY = "radar-cotizaciones-v1";
const NKEY = "radar-mis-nichos-v1";
const MKEY = "radar-sitios-mudos-v1";
/* Subir esto invalida el cache del worker cuando cambia la lógica de búsqueda. */
const CACHE_BUST = 4;
const SKEY = "radar-settings-v1";
const $  = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
const esc = s => String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const ICO = {
  link:  `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  wa:    `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z"/><path d="M12 2a10 10 0 0 0-8.5 15.28L2 22l4.85-1.46A10 10 0 1 0 12 2zm0 18.3a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-2.88.87.86-2.8-.2-.32A8.3 8.3 0 1 1 12 20.3z"/></svg>`,
  tacho: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`
};

const uid = () => "p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);

let settings  = { mult: MULT_PUESTO };
let seedVer   = 0;
let misProv   = [];   // proveedores propios, con tu calificación
let favoritos = { productos:[], rubros:[], proveedores:[] };
let cotiz     = [];   // pedidos de cotización
let misNichos = [];   // nichos propios: conceptos que cruzan rubros
let comentarios = {};
let soloLectura = false;
let yo = "";

let state = { productos:[], view:"dashboard", q:"", fRubro:"", fVeredicto:"", fPais:"", rubroOrden:"margen", reco:null, qCot:"", fEstadoCot:"", tiendas:[], rubroAbierto:null, qRubro:"", fMacro:"", fMargen:0, qDir:"", fDirCat:"", soloMios:false, fMacroNicho:"", nichoTop:45, qGlobal:"", temp:"mias", nichoAbierto:null, prodAbierto:null, sort:{k:"score",dir:-1}, editing:null };

/* ---------------- persistencia ---------------- */
function load(){
  try{
    const st = localStorage.getItem(SKEY);
    if(st){
      const s = JSON.parse(st);
      settings = {...settings, ...s};
      seedVer  = s.seedVer || 0;
    }
  }catch(e){ /* settings por defecto */ }
  try{
    const mp = localStorage.getItem(PKEY);
    if(mp) misProv = JSON.parse(mp) || [];
    const ff = localStorage.getItem(FKEY);
    if(ff) favoritos = {...favoritos, ...JSON.parse(ff)};
    const cc = localStorage.getItem(CKEY);
    if(cc) cotiz = JSON.parse(cc) || [];
    const nn = localStorage.getItem(NKEY);
    misNichos = nn ? (JSON.parse(nn)||[]) : MIS_NICHOS_SEED.map(n=>({...n, productos:[]}));
    const tt = localStorage.getItem(TKEY);
    state.tiendas = tt ? (JSON.parse(tt)||[]) : TIENDAS_SEED.map(t=>({...t}));
  }catch(e){ state.tiendas = TIENDAS_SEED.map(t=>({...t})); }
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){
      state.productos = JSON.parse(raw).map(migrar);
      refrescarSeed();
      return;
    }
  }catch(e){ console.warn("localStorage ilegible",e); }
  state.productos = SEED.map(p=>migrar({...p}));
  seedVer = SEED_VER;
  save();
}

/* productos viejos: el multiplicador estaba atado al origen. Ahora es un switch propio. */
/* Los productos de ejemplo se guardan en el navegador la primera vez, así que
   una corrección posterior nunca llegaba. Ahora los que no tocaste se
   actualizan solos; los que editaste quedan intactos. */
function formProveedor(rubro){
  const n = prompt("Nombre del proveedor:");
  if(!n || !n.trim()) return;
  const url = prompt("Sitio o link (opcional):") || "";
  sumarProveedor({ n:n.trim(), pais:"Argentina", clase:"Propio", url:url.trim(), rubro });
}

function sumarProveedor(p, nombreSugerido){
  if(!p.n && nombreSugerido) p.n = nombreSugerido;
  const clave = (p.n+"|"+(p.rubro||"")).toLowerCase();
  if(misProv.some(x=>(x.n+"|"+(x.rubro||"")).toLowerCase()===clave)){
    toast("Ya lo tenías en tu lista"); return;
  }
  misProv.push({...p, rating:0, resenas:"", ventas:"", precio:"", nota:"", id:uid()});
  save(); render();
  toast(`${p.n} sumado a tus proveedores`);
}
function borrarProveedor(id){
  const p = misProv.find(x=>x.id===id);
  if(!p || !confirm(`¿Sacar ${p.n} de tu lista?`)) return;
  misProv = misProv.filter(x=>x.id!==id);
  save(); render();
}
function puntuarProveedor(id, n){
  const p = misProv.find(x=>x.id===id);
  if(!p) return;
  p.rating = (p.rating===n ? 0 : n);
  save(); render();
}
function campoProveedor(id, k, v){
  const p = misProv.find(x=>x.id===id);
  if(!p) return;
  p[k]=v; save();
}

/* El mejor proveedor de un rubro: primero calificación, después precio. */
function mejorProveedor(rubro){
  const cands = misProv.filter(p=>p.rubro===rubro && (p.rating || p.precio));
  if(!cands.length) return null;
  return cands.slice().sort((a,b)=>
    (b.rating-a.rating) ||
    ((Number(a.precio)||Infinity)-(Number(b.precio)||Infinity))
  )[0];
}

function refrescarSeed(){
  if(seedVer >= SEED_VER) return;
  let n = 0;
  SEED.forEach(orig=>{
    const i = state.productos.findIndex(p=>p.id === orig.id);
    if(i < 0) return;
    if(state.productos[i].editado) return;      // lo tocaste vos: no se pisa
    state.productos[i] = migrar({...orig});
    n++;
  });
  seedVer = SEED_VER;
  save();
  if(n) setTimeout(()=>toast(`${n} producto${n===1?"":"s"} de ejemplo actualizado${n===1?"":"s"}`), 400);
}

function migrar(p){
  if(p.aplicaMult === undefined) p.aplicaMult = (p.origen === "China");
  if(p.mult === undefined || p.mult === "") p.mult = MULT_PUESTO;
  return p;
}
function save(){
  try{
    localStorage.setItem(KEY, JSON.stringify(state.productos));
    localStorage.setItem(PKEY, JSON.stringify(misProv));
    localStorage.setItem(TKEY, JSON.stringify(state.tiendas));
    localStorage.setItem(FKEY, JSON.stringify(favoritos));
    localStorage.setItem(CKEY, JSON.stringify(cotiz));
    localStorage.setItem(NKEY, JSON.stringify(misNichos));
    localStorage.setItem(SKEY, JSON.stringify({...settings, seedVer}));
  }catch(e){ toast("No se pudo guardar (almacenamiento lleno)"); }
}

/* ---------------- scoring ---------------- */
function score(p){
  const c = p.crit||{};
  let t=0;
  CRITERIOS.forEach(cr=>{ t += ((Number(c[cr.k])||0)/5)*cr.w; });
  return Math.round(t);
}
function scoreColor(s){
  if(s>=75) return "var(--star)";
  if(s>=58) return "var(--acc)";
  if(s>=42) return "var(--warn)";
  return "var(--bad)";
}
function veredictoSugerido(s){
  if(s>=75) return "estrella";
  if(s>=58) return "potencial";
  if(s>=42) return "evaluar";
  return "clavo";
}
/* Arma el link de WhatsApp. Si el número empieza con "+" se respeta tal cual;
   si no, se asume Argentina: se limpia el 0 de área y el 15, y se antepone 549. */
/* El país del proveedor no siempre coincide con el origen de la mercadería. */
/* Al pegar un link: deduce proveedor, país, tipo y origen del dominio,
   y propone un nombre a partir del slug. No sobreescribe lo que ya cargaste. */
function desdeURL(url){
  let host="", slug="";
  try{
    const u = new URL(url);
    host = u.hostname.toLowerCase();
    slug = decodeURIComponent(u.pathname).split("/").filter(Boolean).pop() || "";
  }catch(e){ return null; }
  const dom = DOMINIOS.find(x=>host.includes(x.m));
  const nombre = slug
    .replace(/\.(html?|php|aspx?)$/i,"")
    .replace(/[-_+]/g," ")
    .replace(/\b(offer|producto|product|item|p)\b/gi,"")
    .replace(/\d{6,}/g,"")
    .replace(/\s+/g," ").trim();
  return {
    proveedor: dom ? dom.prov : "",
    paisProv:  dom ? dom.pais : "",
    tipoProv:  dom ? dom.tipo : "",
    origen:    dom ? dom.origen : "",
    whatsapp:  dom && dom.wa ? dom.wa : "",
    provUrl:   host ? `https://${host}/` : "",
    nombre:    nombre ? nombre.charAt(0).toUpperCase()+nombre.slice(1) : "",
    conocido:  !!dom
  };
}

/* Elegir una fuente sin poder romper la vista: si la clase pedida no existe,
   cae a la primera disponible. Que falte un link no puede dejar la app en blanco. */
function fuente(rubro, clase){
  const bs = buscadoresDe(rubro||"Otro");
  return bs.find(b=>b.clase===clase) || bs[0] || { n:"—", url:"#", term:rubro||"" };
}

function paisDe(p){
  if(p.paisProv) return p.paisProv;
  const o = p.origen || "";
  if(o.startsWith("Argentina")) return "Argentina";
  if(PAISES.includes(o)) return o;
  return "Otro";
}
function bandera(pais){ return BANDERAS[pais] || BANDERAS["Otro"]; }

/* Mientras no haya foto, un mosaico estable derivado del rubro:
   mismo rubro, mismo color, así la tabla se lee igual de rápido. */
const IC_MACRO = {
  "Mascotas":"🐾","Wellness":"💆","Salud":"🩺","Hogar":"🏠","Jardín":"🪴","Oficina":"🖥",
  "Auto":"🚗","Outdoor":"⛺","Fitness":"🏋","Bebés":"🍼","Belleza":"💄","Tecnología":"🔌",
  "Gaming":"🎮","Viaje":"🧳","Moda":"👜","Niños":"🧸","Herramientas":"🔧","Eventos":"🎉",
  "Emergentes":"🚀","Otro":"📦"
};
const icoRubro = n => IC_MACRO[metaRubro(n).cat] || "📦";

function tono(txt){
  let h=0; for(let i=0;i<txt.length;i++) h=(h*31+txt.charCodeAt(i))>>>0;
  return h % 360;
}
function nombreConFlecha(nombre){
  const s = String(nombre||"");
  const i = s.lastIndexOf(" ");
  const cabeza = i<0 ? "" : esc(s.slice(0,i+1));
  const cola   = esc(i<0 ? s : s.slice(i+1));
  return `${cabeza}<span class="nowrap">${cola}<span class="flecha">↗</span></span>`;
}

function fotoHTML(p, tam){
  const cls = tam==="lg" ? "foto foto-lg" : "foto";
  if(p.img) return `<span class="${cls}"><img src="${esc(p.img)}" alt="" loading="lazy"
      onerror="this.parentNode.classList.add('rota');this.remove()"><i>${icoRubro(p.rubro)}</i></span>`;
  return `<span class="${cls} vacia" style="--tono:${tono(p.rubro||"Otro")}"><i>${icoRubro(p.rubro)}</i></span>`;
}

function waNumero(tel){
  if(!tel) return "";
  const crudo = String(tel).trim();
  const internacional = crudo.startsWith("+");
  let d = crudo.replace(/\D/g, "");
  if(!d) return "";
  if(internacional) return d;
  if(d.startsWith("54")){
    const resto = d.slice(2);
    return resto.startsWith("9") ? d : "549" + resto;
  }
  if(d.startsWith("0")) d = d.slice(1);          // 011... -> 11...
  d = d.replace(/^(\d{2,4})15/, "$1");           // el 15 del celular
  return "549" + d;
}
function waLink(p){
  const n = waNumero(p.whatsapp);
  if(!n) return "";
  const msg = `Hola! Los contacto por ${p.nombre||"un producto"}. `
            + `¿Me pasan precio mayorista y mínimo de compra? ¿Hacen factura A?`;
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
}

/* costo puesto: el multiplicador es un switch por producto, no depende del origen */
function multDe(p){
  if(!p.aplicaMult) return 1;
  return Number(p.mult) || settings.mult || MULT_PUESTO;
}
function costoPuesto(p){
  return (Number(p.fob)||0) * multDe(p);
}
function margen(p){
  const cp = costoPuesto(p), v = Number(p.venta)||0;
  if(!v || !cp) return null;
  return Math.round(((v-cp)/v)*100);
}

/* ---------------- helpers UI ---------------- */
let toastT;
function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.hidden=false;
  clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,2600);
}
const money = n => (n||n===0) ? "US$ "+Number(n).toLocaleString("es-AR",{maximumFractionDigits:2}) : "—";
function scoreLine(s){
  return `<div class="scoreline"><div class="scorebar"><i style="width:${s}%;background:${scoreColor(s)}"></i></div>
    <b class="num" style="color:${scoreColor(s)};font-size:12.5px">${s}</b></div>`;
}

/* ================= BUSCADOR DE OFERTAS ================= */
/* Esto es lo que el usuario pidió: escribís "tabla para picada" y te trae
   ofertas reales de proveedores, con foto, precio y link directo a la ficha.
   Sin worker sólo alcanzan las tiendas Shopify; con worker, todos. */

const hayCatalogo = () => typeof API_CATALOGO === "string" && API_CATALOGO.length > 8;
const ofertasCache = new Map();

/* Los sitios donde buscar: proveedores verificados + tiendas que espiás. */
function sitiosDeBusqueda(){
  /* En modo Argentina no tiene sentido consultar catálogos chinos. */
  const s = [];
  DIRECTORIO.forEach(p=>{
    if(p.tipo!=="Directorio") s.push({ url:p.url, nombre:p.n, tipo:p.tipo, zona:p.zona });
  });
  PROVEEDORES.filter(p=>p.pais==="Argentina" && p.url).forEach(p=>{
    if(!s.some(x=>x.nombre===p.nombre)) s.push({ url:p.url, nombre:p.nombre, tipo:p.tipo||"Distribuidor", zona:"Argentina" });
  });
  /* Las tiendas espiadas NO son proveedores: son competencia. Van marcadas
     aparte porque sirven para saber a cuánto se vende, no dónde comprar. */
  (state.tiendas||[]).forEach(t=> s.push({ url:t.url, nombre:t.nombre, tipo:"Competencia", zona:"Argentina", competencia:true }));
  return s;
}

const raizDe = u => { try{ return new URL(u).origin; }catch(e){ return u; } };

function confiabilidad(base, sitios){
  const s = sitios.find(x=>raizDe(x.url)===raizDe(base));
  return {
    peso: s ? (PESO_TIPO[s.tipo]||50) : 30,
    nombre: s ? s.nombre : raizDe(base).replace(/^https?:\/\//,"").replace(/^www\./,""),
    tipo: s ? s.tipo : "",
    competencia: !!(s && s.competencia)
  };
}

const VACIAS = new Set(["para","con","sin","del","los","las","por","una","uno","que","muy","mas","más"]);

async function buscarOfertas(q){
  const qLimpio = q.trim();
  const clave = q.toLowerCase().trim();
  if(clave.length < 2) return null;
  if(ofertasCache.has(clave)) return ofertasCache.get(clave);

  const sitios = sitiosDeBusqueda();
  const prom = (async ()=>{
    let items = [], consultados = 0, respondieron = 0, descubiertos = [];

    /* Buscando "masajeador de cuello" no sirve que aparezca un peluche sólo
       porque dice "cuello". La regla: la primera palabra —la que nombra el
       producto— tiene que estar sí o sí; las demás son el detalle y alcanza
       con la mitad. Así "tabla picada" encuentra tablas, pero "masajeador de
       cuello" no trae peluches. */
    const relevante = (titulo)=>{
      const t = (titulo||"").toLowerCase();
      const q = qLimpio.toLowerCase();
      if(t.includes(q)) return true;
      const palabras = q.split(/\s+/).filter(w=>w.length>3 && !VACIAS.has(w));
      if(!palabras.length) return true;
      const raiz = palabras[0].replace(/(es|s)$/,"");     /* comedero/comederos */
      if(!t.includes(raiz)) return false;
      if(palabras.length === 1) return true;
      const resto = palabras.slice(1);
      const hallan = resto.filter(w=>t.includes(w.replace(/(es|s)$/,""))).length;
      return hallan >= Math.floor(resto.length/2);
    };

    if(hayCatalogo()){
      /* El worker atiende 20 sitios por consulta y son 35, así que va en tandas.
         Los que ya fallaron van últimos: no tiene sentido gastarles turno. */
      const fallados = new Set(JSON.parse(localStorage.getItem(MKEY) || "[]"));
      const ordenados = [...sitios].sort((x,y)=>
        (fallados.has(raizDe(x.url))?1:0) - (fallados.has(raizDe(y.url))?1:0) ||
        (x.competencia?1:0) - (y.competencia?1:0)
      );
      const tandas = [];
      for(let i=0;i<ordenados.length;i+=20) tandas.push(ordenados.slice(i,i+20));

      const nuevosFallos = new Set(fallados);
      const respuestas = await Promise.all(tandas.map(async t=>{
        const urls = t.map(s=>s.url).join(",");
        try{
          /* descubrir=1: si la lista propia trae poco, el worker sale a buscar
             proveedores nuevos a la red y prueba cuáles se pueden leer. */
          const r = await fetch(`${API_CATALOGO}/buscar?q=${encodeURIComponent(q)}&sitios=${encodeURIComponent(urls)}&descubrir=1&v=${CACHE_BUST}`);
          return await r.json();
        }catch(e){ return null; }
      }));

      respuestas.forEach(j=>{
        if(!j) return;
        items = items.concat(j.resultados || []);
        consultados += j.consultados || 0;
        respondieron += j.respondieron || 0;
        (j.fallaron || []).forEach(u=>nuevosFallos.add(raizDe(u)));
        (j.descubiertos || []).forEach(d=>{
          if(!descubiertos.some(x=>x.base===d.base)) descubiertos.push(d);
        });
      });
      try{ localStorage.setItem(MKEY, JSON.stringify([...nuevosFallos])); }catch(e){}
    }

    if(!items.length){
      /* Sin worker sólo se pueden leer las tiendas Shopify, que son las únicas
         que mandan CORS. El resto queda para cuando esté el proxy. */
      const candidatos = sitios.filter(s=>!sitiosMudos.has(limpiarDominio(s.url)));
      const tandas = await Promise.all(candidatos.map(async s=>{
        consultados++;
        const d = await traerTienda(s.url);
        if(d.error || !d.productos) return [];
        respondieron++;
        return d.productos
          .map(p=>({ ...p, base:s.url, punta:puntaje(p.titulo,q) }))
          .filter(p=>p.punta>0);
      }));
      items = tandas.flat();
    }

    items = items.filter(p=>relevante(p.titulo));

    const conf = items.map(p=>{
      const c = confiabilidad(p.base, sitios);
      return { ...p, prov:c.nombre, provTipo:c.tipo, conf:c.peso, competencia:c.competencia };
    });
    /* Orden: primero cuánto coincide, después confiabilidad, después precio. */
    const orden=(x,y)=> y.punta-x.punta || y.conf-x.conf || (x.precio||1e12)-(y.precio||1e12);
    return {
      q,
      proveedores: conf.filter(p=>!p.competencia).sort(orden),
      competencia: conf.filter(p=>p.competencia).sort(orden),
      descubiertos,
      consultados, respondieron, conWorker:hayCatalogo()
    };
  })();

  ofertasCache.set(clave, prom);
  return prom;
}

function puntaje(titulo, termino){
  const t=String(titulo||"").toLowerCase(), q=termino.toLowerCase().trim();
  if(!q) return 0;
  if(t===q) return 100;
  if(t.startsWith(q)) return 90;
  if(t.includes(q)) return 75;
  const ws=q.split(/\s+/).filter(w=>w.length>2);
  if(!ws.length) return 0;
  const h=ws.filter(w=>t.includes(w)).length;
  return h ? Math.round(h/ws.length*60) : 0;
}

function ofertaHTML(p, i){
  const off = p.antes>p.precio ? Math.round((1-p.precio/p.antes)*100) : 0;
  return `
  <a class="oferta" href="${esc(p.link)}" target="_blank" rel="noopener">
    <span class="of-foto${p.img?"":" vacia"}">
      ${p.img?`<img src="${esc(p.img)}" alt="" loading="lazy" onerror="this.closest('.of-foto').classList.add('vacia');this.remove()">`:""}
      ${off?`<span class="of-off">${off}% off</span>`:""}
    </span>
    <span class="of-cuerpo">
      <span class="of-tit">${esc(p.titulo.slice(0,72))}</span>
      <span class="of-prov">
        <b>${esc(p.prov)}</b>
        ${p.nuevo?`<span class="of-nuevo">de la red</span>`:""}
        ${p.stock===false?`<span class="of-sin">sin stock</span>`:""}
      </span>
      <span class="of-precio">
        <b>${p.precio?pesos(p.precio):`<span class="of-consultar">a consultar</span>`}</b>
        ${p.antes&&p.antes>p.precio?`<s>${pesos(p.antes)}</s>`:""}
      </span>
    </span>
  </a>`;
}

async function pintarOfertas(q){
  const caja = $("#ofertas"); if(!caja) return;
  caja.hidden = false;
  caja.innerHTML = `<div class="of-cargando">
    <span class="of-spin"></span>
    <div><b>Buscando “${esc(q)}”</b>
    <span>en ${sitiosDeBusqueda().length} proveedores · puede tardar unos segundos</span></div>
  </div>`;
  const r = await buscarOfertas(q);
  const sigue = $("#ofertas"); if(!sigue || state.qGlobal.trim()!==q.trim()) return;

  const totales = r ? r.proveedores.length + r.competencia.length : 0;
  if(!r || !totales){
    sigue.innerHTML = `
      <div class="of-vacio">
        <b>Sin ofertas para “${esc(q)}”.</b>
        <p class="hintline">${r && !r.conWorker
          ? `Sólo pude leer ${r.respondieron} de ${r.consultados} proveedores: el resto bloquea al navegador. Con el proxy de catálogos andando (<code>worker/</code>) se consultan todos.`
          : "Probá con una palabra más general."}</p>
      </div>`;
    return;
  }
  const rubroProb = (RUBROS_META.find(r=>q.toLowerCase().includes(r.n.toLowerCase().split(" ")[0])) || {}).n || "";
  const fuentesAR = rubroProb ? buscadoresDe(rubroProb).filter(b=>b.clase==="nacional") : [];

  sigue.innerHTML = `
    <div class="of-cab">
      <h3>“${esc(q)}”</h3>
      <span class="hint">${r.respondieron} de ${r.consultados} fuentes respondieron</span>
      <button class="btn ghost mini" onclick="cerrarOfertas()">✕ cerrar</button>
    </div>

    ${r.proveedores.length ? `
      <div class="of-grupo">
        <div class="of-tit-grupo">🏢 Proveedores <span>${r.proveedores.length} · a estos les comprás</span></div>
        <div class="of-grilla">${r.proveedores.slice(0,18).map(ofertaHTML).join("")}</div>
      </div>`
    : `<div class="of-sinprov">
        <b>Ningún proveedor de tu lista tiene esto.</b>
        <p>De ${r.consultados} fuentes consultadas, ninguna lo vende. No quiere decir que no exista: quiere decir que todavía no tenés al proveedor.</p>
        ${fuentesAR.length?`<div class="of-sinprov-acc">
          ${fuentesAR.slice(0,4).map(f=>`<a class="btn ghost mini" href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.n)} ↗</a>`).join("")}
        </div>`:`<div class="of-sinprov-acc">
          <a class="btn ghost mini" href="https://www.google.com/search?q=${encodeURIComponent("mayorista "+q+" argentina")}" target="_blank" rel="noopener">Buscar mayoristas ↗</a>
          <a class="btn ghost mini" href="https://listado.mercadolibre.com.ar/${encodeURIComponent(q.replace(/\s+/g,"-"))}-por-mayor" target="_blank" rel="noopener">ML por mayor ↗</a>
        </div>`}
      </div>`}

    ${r.descubiertos && r.descubiertos.length ? `
      <div class="of-grupo hallados">
        <div class="of-tit-grupo">✨ Proveedores nuevos encontrados en la red <span>no estaban en tu lista</span></div>
        ${r.descubiertos.map(d=>{
          const host=d.base.replace(/^https?:\/\//,"").replace(/^www\./,"");
          const c=d.contacto||{};
          return `<div class="prov-row real">
            <div class="prov-id"><b>${esc(host)}</b>
              <span class="prov-meta">${d.productos} productos · ${d.coincidencias} coinciden</span>
              ${(c.whatsapp||c.mail||c.instagram)?`<span class="prov-contacto">
                ${c.whatsapp?`<a href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>`:""}
                ${c.mail?`<a href="mailto:${esc(c.mail)}">${esc(c.mail)}</a>`:""}
                ${c.instagram?`<a href="https://instagram.com/${esc(c.instagram)}" target="_blank" rel="noopener">@${esc(c.instagram)}</a>`:""}
              </span>`:""}
            </div>
            <a class="btn ghost mini" href="${esc(d.base)}" target="_blank" rel="noopener">Abrir ↗</a>
            <button class="accbtn" title="Sumarlo a mis proveedores"
              onclick='sumarProveedor(${JSON.stringify({n:"",pais:"Argentina",clase:"Descubierto",url:d.base,rubro:"",whatsapp:(d.contacto||{}).whatsapp||""}).replace(/'/g,"&#39;")}, "${esc(host)}")'>+</button>
          </div>`;}).join("")}
      </div>` : ""}

    ${r.competencia.length ? `
      <details class="of-comp" ${r.proveedores.length?"":"open"}>
        <summary>🎯 A cuánto lo vende la competencia <span>${r.competencia.length} tienda${r.competencia.length===1?"":"s"} · no son proveedores</span></summary>
        <div class="of-grilla">${r.competencia.slice(0,8).map(ofertaHTML).join("")}</div>
        <p class="hintline">Sirve para saber a cuánto podés venderlo, no para comprar.</p>
      </details>` : ""}`;
}

function cerrarOfertas(){
  state.qGlobal = "";
  const h=$("#qHero"); if(h) h.value="";
  const g=$("#qGlobal"); if(g) g.value="";
  render();
}

/* ================= FOTOS REALES =================
   Nada de emojis donde va un producto. La foto sale del catálogo de un
   proveedor de verdad, buscando el nombre en el worker y quedándose con la
   primera imagen. Se guarda en el navegador para no volver a pedirla. */
const FKEY_IMG = "radar-fotos-v1";
let fotoIdx = {};
try{ fotoIdx = JSON.parse(localStorage.getItem(FKEY_IMG) || "{}"); }catch(e){}
const fotoPend = new Set();

function guardarFotos(){
  try{ localStorage.setItem(FKEY_IMG, JSON.stringify(fotoIdx)); }catch(e){}
}

/* El nombre completo casi nunca matchea: "Alfombra de lamer (lick mat)" no
   existe así en ningún catálogo. Probamos del más específico al más general. */
function terminosDeFoto(nombre, rubro){
  const limpio = nombre.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  const palabras = limpio.split(" ").filter(w=>w.length>2);
  const t = [limpio];
  if(palabras.length > 2) t.push(palabras.slice(0,2).join(" "));
  if(palabras.length > 1) t.push(palabras[0]);
  if(rubro) t.push(rubro);
  return [...new Set(t.filter(Boolean))];
}

async function buscarFoto(nombre, rubro){
  const clave = nombre.toLowerCase().trim();
  if(fotoIdx[clave] !== undefined) return fotoIdx[clave];
  if(!hayCatalogo() || fotoPend.has(clave)) return null;
  fotoPend.add(clave);
  try{
    const sitios = sitiosDeBusqueda().slice(0,20).map(s=>s.url).join(",");
    for(const t of terminosDeFoto(nombre, rubro)){
      const r = await fetch(`${API_CATALOGO}/buscar?q=${encodeURIComponent(t)}&sitios=${encodeURIComponent(sitios)}&descubrir=1&v=${CACHE_BUST}`);
      const j = await r.json();
      const con = (j.resultados||[]).find(p=>p.img);
      if(con){ fotoIdx[clave] = con.img; guardarFotos(); return con.img; }
    }
    fotoIdx[clave] = "";                     // "" = buscada y sin resultado
    guardarFotos();
    return "";
  }catch(e){ return null; }
  finally{ fotoPend.delete(clave); }
}

/* Rellena los huecos de foto en paralelo: de a una tardaba medio minuto. */
async function completarFotos(){
  const huecos = $$("[data-foto]").filter(el=>el.dataset.foto && !el.querySelector("img"));
  await Promise.all(huecos.map(async el=>{
    const nombre = el.dataset.foto;
    const url = await buscarFoto(nombre, el.dataset.fotoRubro || "");
    if(!url) return;
    /* Puede haber re-render en el medio: buscamos el hueco otra vez. */
    document.querySelectorAll(`[data-foto="${CSS.escape(nombre)}"]`).forEach(vivo=>{
      vivo.innerHTML = `<img src="${esc(url)}" alt="" loading="lazy" onerror="this.remove()">`;
      vivo.classList.add("con-foto");
    });
  }));
}

/* ================= ORIGEN: ARGENTINA O CHINA =================
   Es un modo, no un filtro más: cambia qué proveedores se ofrecen en toda la
   app. Arrancar comprando en Argentina y recién importar cuando el volumen lo
   justifique es el orden que tiene sentido, así que Argentina es lo primero. */
const OKEY = "radar-origen-v1";
let origenModo = "arg";           // "arg" | "china"

function cargarOrigen(){
  try{ origenModo = localStorage.getItem(OKEY) || "arg"; }catch(e){}
}
function ponerOrigen(m){
  origenModo = m;
  try{ localStorage.setItem(OKEY, m); }catch(e){}
  ofertasCache.clear();
  render();
  if(state.qGlobal && state.qGlobal.trim().length>=2) pintarOfertas(state.qGlobal);
  toast(m==="arg" ? "Comprando en Argentina" : "Importando de China");
}
const esArg = () => origenModo === "arg";

/* ================= FAVORITOS ================= */
const esFav = (tipo, id) => (favoritos[tipo]||[]).includes(id);
function toggleFav(tipo, id){
  favoritos[tipo] ||= [];
  const i = favoritos[tipo].indexOf(id);
  i<0 ? favoritos[tipo].push(id) : favoritos[tipo].splice(i,1);
  save(); render();
}
const totalFav = () => Object.values(favoritos).reduce((s,a)=>s+(a?a.length:0),0);
const btnFav = (tipo,id) => `<button class="fav ${esFav(tipo,id)?"on":""}" title="Favorito"
  onclick="event.stopPropagation();toggleFav('${tipo}','${String(id).replace(/'/g,"\\'")}')">${esFav(tipo,id)?"★":"☆"}</button>`;

/* ================= COTIZACIONES ================= */
/* El eslabón que faltaba: acá el costo deja de ser estimación y pasa a ser
   un número que te pasó un proveedor. De ahí sale el margen real. */
const ESTADOS_COT = ["pedida","respondida","descartada","cerrada"];

function nuevaCotiz(datos){
  cotiz.unshift({
    id: uid(), fecha: new Date().toISOString(),
    proveedor: datos.proveedor||"", rubro: datos.rubro||"", producto: datos.producto||"",
    contacto: datos.contacto||"", estado:"pedida",
    precio:"", minimo:"", plazo:"", factura:"", nota:""
  });
  save();
}
function borrarCotiz(id){
  const c = cotiz.find(x=>x.id===id);
  if(!c || !confirm(`¿Borrar la cotización a ${c.proveedor||"ese proveedor"}?`)) return;
  cotiz = cotiz.filter(x=>x.id!==id); save(); render();
}
function campoCotiz(id,k,v){
  const c = cotiz.find(x=>x.id===id); if(!c) return;
  c[k]=v;
  if(k==="precio" && v) c.estado = c.estado==="pedida" ? "respondida" : c.estado;
  save();
}
const diasCot = f => Math.floor((Date.now()-new Date(f))/86400000);

/* ================= ESPÍA DE TIENDAS ================= */
/* Shopify publica el catálogo entero en /products.json. No hace falta token
   ni proxy: la respuesta viene con CORS abierto. Si la tienda no es Shopify,
   lo decimos y listo. */
const tiendaCache = new Map();

function limpiarDominio(u){
  let s = String(u||"").trim().replace(/\/+$/,"");
  if(!/^https?:\/\//i.test(s)) s = "https://" + s;
  try{ return new URL(s).origin; }catch(e){ return null; }
}

/* Los sitios que no permiten lectura desde el navegador no pueden hacernos
   esperar: 6 segundos y afuera, y no se vuelven a intentar en la sesión. */
const sitiosMudos = new Set();

function conLimite(url, ms=6000){
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), ms);
  return fetch(url, {signal:ctrl.signal}).finally(()=>clearTimeout(t));
}

async function traerTienda(url){
  const base = limpiarDominio(url);
  if(!base) return { error:"La dirección no parece válida." };
  if(sitiosMudos.has(base)) return { error:"Este sitio no permite lectura directa." };
  if(tiendaCache.has(base)) return tiendaCache.get(base);
  const prom = conLimite(`${base}/products.json?limit=250`)
    .then(r=>{
      if(!r.ok) throw new Error("HTTP "+r.status);
      return r.json();
    })
    .then(j=>{
      if(!j || !Array.isArray(j.products)) throw new Error("formato");
      return { productos: j.products.map(normalizarProd) };
    })
    .catch(()=>{
      sitiosMudos.add(base);
      return { error:"No pude leer el catálogo. Tienda Nube y WooCommerce no dejan que el navegador los lea: para esos hace falta el proxy de catálogos." };
    });
  tiendaCache.set(base, prom);
  return prom;
}

function normalizarProd(p){
  const v = (p.variants||[])[0] || {};
  const precio = Number(v.price)||0;
  const antes  = Number(v.compare_at_price)||0;
  return {
    titulo: p.title || "",
    handle: p.handle || "",
    tipo: p.product_type || "",
    precio, antes,
    off: antes>precio ? Math.round((1-precio/antes)*100) : 0,
    stock: v.available !== false,
    publicado: (p.published_at||"").slice(0,10),
    img: ((p.images||[])[0]||{}).src || ""
  };
}

const diasDesde = f => f ? Math.floor((Date.now()-new Date(f))/86400000) : 9999;

function resumirTienda(prods){
  const px = prods.map(p=>p.precio).filter(x=>x>0).sort((a,b)=>a-b);
  const conOff = prods.filter(p=>p.off>0);
  return {
    total: prods.length,
    min: px[0]||0,
    mediana: px[Math.floor(px.length/2)]||0,
    max: px[px.length-1]||0,
    conDescuento: conOff.length,
    offPromedio: conOff.length ? Math.round(conOff.reduce((s,p)=>s+p.off,0)/conOff.length) : 0,
    nuevos: prods.filter(p=>diasDesde(p.publicado)<=45).length
  };
}

/* ================= DATOS DE MERCADO ================= */
/* Le pega al worker (worker/). Sin worker configurado no rompe nada:
   la app sigue mostrando los links de búsqueda de siempre. */
const mercadoCache = new Map();

const hayMercado = () => typeof API_MERCADO === "string" && API_MERCADO.length > 8;

async function traerMercado(q){
  if(!hayMercado() || !q) return null;
  const clave = q.toLowerCase().trim();
  if(mercadoCache.has(clave)) return mercadoCache.get(clave);
  const prom = fetch(`${API_MERCADO}/buscar?q=${encodeURIComponent(q)}`)
    .then(r=>r.ok ? r.json() : Promise.reject(new Error("HTTP "+r.status)))
    .catch(e=>({ error: String(e.message||e) }));
  mercadoCache.set(clave, prom);
  return prom;
}

const pesos = n => (n||n===0)
  ? "$ " + Number(n).toLocaleString("es-AR",{maximumFractionDigits:0})
  : "—";

function mercadoHTML(d){
  if(!d) return "";
  if(d.error) return `<p class="hintline">No pude leer el mercado: ${esc(d.error)}</p>`;
  const sinVentas = !d.hayDatoDeVentas;
  return `
  <div class="mercado">
    <div class="mk-kpis">
      <div><b>${d.publicaciones ?? "—"}</b><span>compitiendo</span></div>
      <div><b>${pesos(d.precioMin)}</b><span>más barato</span></div>
      <div><b style="color:var(--acc)">${pesos(d.precioMediana)}</b><span>precio típico</span></div>
      <div><b>${pesos(d.precioMax)}</b><span>más caro</span></div>
      <div><b>${d.conEnvioGratis ?? "—"}/${d.muestra ?? "—"}</b><span>envío gratis</span></div>
    </div>
    ${d.top && d.top.length ? `
      <div class="panel-h">${sinVentas ? "Primeros resultados" : "Los que más venden"}</div>
      ${d.top.map(t=>`
        <div class="mk-row">
          <a href="${esc(t.link||"#")}" target="_blank" rel="noopener">${esc((t.titulo||"").slice(0,64))}</a>
          <span class="mk-precio">${pesos(t.precio)}</span>
          ${t.vendidos!=null?`<span class="mk-vend">${t.vendidos} vend.</span>`:""}
          ${t.envioGratis?`<span class="tag">envío gratis</span>`:""}
        </div>`).join("")}
      ${sinVentas?`<p class="hintline">Mercado Libre no está devolviendo la cantidad vendida por publicación, así que el orden es el de su buscador, no por ventas.</p>`:""}
    ` : ""}
    <p class="hintline">Datos de Mercado Libre Argentina · ${esc((d.actualizado||"").slice(0,10))}</p>
  </div>`;
}

/* Pinta el panel cuando llega la respuesta. */
async function pintarMercado(sel, q){
  const caja = document.querySelector(sel);
  if(!caja || !hayMercado()) return;
  caja.innerHTML = `<p class="hintline">Consultando Mercado Libre…</p>`;
  const d = await traerMercado(q);
  const sigue = document.querySelector(sel);
  if(sigue) sigue.innerHTML = mercadoHTML(d);
}

/* ================= CALIENTE DEL DÍA ================= */
/* Determinista por fecha: el mismo para todos ese día, distinto mañana. */
function diaDelAnio(d=new Date()){
  return Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
}
function calienteDeHoy(){
  const hoy = new Date();
  const i = (diaDelAnio(hoy) + hoy.getFullYear()) % CALIENTES.length;
  return CALIENTES[i];
}
function calienteHTML(){
  const c = calienteDeHoy();
  const m = metaRubro(c.rubro);
  const yaEsta = state.productos.some(p=>p.nombre.toLowerCase() === c.p.toLowerCase());
  return `
  <div class="hot">
    <div class="hot-tag">🔥 Caliente de hoy</div>
    <div class="hot-cuerpo">
      <div class="hot-icono">${icoRubro(c.rubro)}</div>
      <div class="hot-txt">
        <h3>${esc(c.p)}</h3>
        <div class="hot-meta">${esc(c.rubro)} · oportunidad del rubro <b>${oportunidad(c.rubro)}</b>/100</div>
        <p>${esc(c.w)}</p>
        <div class="hot-prov"><b>Dónde buscarlo:</b> ${esc(c.prov)}</div>
      </div>
      <div class="hot-score">
        <div class="hot-n" style="color:${scoreColor(c.score)}">${c.score}</div>
        <div class="lbl">score est.</div>
      </div>
    </div>
    <div class="hot-pie">
      ${yaEsta
        ? `<span class="hintline">Ya lo tenés en el radar.</span>`
        : `<button class="btn primary" onclick="nuevoDesdeCaliente()">+ Sumarlo al radar</button>`}
      <span class="hintline">Cambia todos los días</span>
    </div>
  </div>`;
}
function nuevoDesdeCaliente(){
  state.reco = calienteDeHoy();
  nuevoDesdeReco();
}

/* ================= HERO ================= */
/* Las diapositivas salen de datos reales, no de frases sueltas: el candidato
   del día, el rubro de mejor margen y lo último que lanzó una tienda espiada. */
function diapos(){
  const d=[];
  const c=calienteDeHoy();
  d.push({ et:"CANDIDATO DE HOY",
           tx:`<b>${esc(c.p)}</b> — score ${c.score}/100<small>${esc(c.w)}</small>`,
           ir:()=>{ state.reco=c; state.view="dashboard"; render(); } });

  const mejor=[...RUBROS_META].filter(r=>r.n!=="Otro").sort((a,b)=>b.margen-a.margen)[0];
  d.push({ et:"MEJOR MARGEN",
           tx:`<b>${esc(mejor.n)}</b> — ${mejor.margen}% de margen típico<small>${esc(mejor.nota)}</small>`,
           ir:()=>irARubro(mejor.n) });

  const op=[...RUBROS_META].filter(r=>r.n!=="Otro").sort((a,b)=>oportunidad(b.n)-oportunidad(a.n))[0];
  d.push({ et:"MÁS OPORTUNIDAD",
           tx:`<b>${esc(op.n)}</b> — oportunidad ${oportunidad(op.n)}/100<small>${esc(op.nota)}</small>`,
           ir:()=>irARubro(op.n) });

  if(ultimoLanzamiento){
    const l=ultimoLanzamiento;
    d.push({ et:"RECIÉN LANZADO",
             tx:`<b>${esc(l.titulo.slice(0,52))}</b> — ${pesos(l.precio)}<small>${esc(l.tienda)} lo publicó hace ${diasDesde(l.publicado)} días</small>`,
             ir:()=>{ state.view="tiendas"; render(); pintarTiendas(); } });
  }
  const pend=cotiz.filter(c=>c.estado==="pedida" && diasCot(c.fecha)>=4);
  if(pend.length){
    d.push({ et:"TE DEBEN RESPUESTA",
             tx:`<b>${pend.length} cotización${pend.length===1?"":"es"} sin contestar</b><small>Hace más de 4 días. Conviene insistir.</small>`,
             ir:()=>{ state.view="cotizaciones"; render(); } });
  }
  return d;
}

let ultimoLanzamiento = null;
let rotaTimer = null, rotaIdx = 0;

function heroHTML(){
  const ds = diapos();
  return `
  <div class="hero">
    <span class="hero-sello"><i></i>Proveedores verificados en toda Argentina</span>
    <h2>Encontrá el <em>producto</em> que tu negocio necesita.</h2>

    <div class="hero-buscar">
      <span class="lupa">⌕</span>
      <input id="qHero" placeholder="Rubro, producto o proveedor…" value="${esc(state.qGlobal||"")}" autocomplete="off">
      <button class="btn" id="btnHeroBuscar">Buscar</button>
    </div>

    <div class="hero-atajos">
      ${["Mascotas","Wellness","Salud","Auto","Hogar"].map(c=>
        `<button class="atajo" onclick="verMacro('${c}')">${IC_MACRO[c]||""} ${c}</button>`).join("")}
      <button class="atajo" onclick="state.view='rubros';state.rubroOrden='margen';render()">★ Mejores márgenes</button>
    </div>

    <div class="rota">
      <div class="rota-cont" id="rotaCont">
        ${ds.map((d,i)=>`<div class="rota-slide ${i===0?"on":""}" data-i="${i}" onclick="irDiapo(${i})" style="cursor:pointer">
          <span class="rota-et">${d.et}</span><p class="rota-tx">${d.tx}</p></div>`).join("")}
      </div>
      <div class="rota-puntos" id="rotaPuntos">
        ${ds.map((_,i)=>`<button class="${i===0?"on":""}" onclick="mostrarDiapo(${i},true)" aria-label="Ver ${i+1}"></button>`).join("")}
      </div>
    </div>
  </div>`;
}

function mostrarDiapo(i, manual){
  const cont=$("#rotaCont"); if(!cont) return;
  const slides=$$(".rota-slide",cont), puntos=$$("#rotaPuntos button");
  if(!slides.length) return;
  rotaIdx = ((i % slides.length) + slides.length) % slides.length;
  slides.forEach((s,n)=>s.classList.toggle("on", n===rotaIdx));
  puntos.forEach((p,n)=>p.classList.toggle("on", n===rotaIdx));
  if(manual) arrancarRota();
}
function arrancarRota(){
  clearInterval(rotaTimer);
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  rotaTimer = setInterval(()=>{
    if(!$("#rotaCont")){ clearInterval(rotaTimer); return; }
    mostrarDiapo(rotaIdx+1);
  }, 7000);
}
function irDiapo(i){
  const d = diapos()[i];
  if(d && d.ir) d.ir();
}
function verTemp(t){ state.temp=t; render(); }

function verMacro(cat){
  state.view="rubros"; state.fMacro=cat; state.qRubro=""; render();
}

/* ================= VISTAS ================= */

function vDashboard(){
  const ps = state.productos;
  const n = v => ps.filter(p=>p.veredicto===v).length;

  /* top rubros por cantidad + score promedio */
  const porRubro = {};
  ps.forEach(p=>{
    const r = p.rubro||"Otro";
    (porRubro[r] ||= {n:0,sum:0});
    porRubro[r].n++; porRubro[r].sum += score(p);
  });
  const rows = Object.entries(porRubro)
    .map(([r,d])=>({r, n:d.n, avg:Math.round(d.sum/d.n)}))
    .sort((a,b)=> b.avg-a.avg || b.n-a.n);
  const maxN = Math.max(1,...rows.map(r=>r.n));

  const top = [...ps].sort((a,b)=>score(b)-score(a)).slice(0,5);
  const avgGlobal = ps.length ? Math.round(ps.reduce((s,p)=>s+score(p),0)/ps.length) : 0;

  /* La barra mide TU avance, no el inventario de la app: cuántos proveedores
     tenga el directorio no dice nada de tu negocio. */
  const prodNicho   = misNichos.reduce((s,n)=>s+((n.productos||[]).length),0);
  const respondidas = cotiz.filter(c=>Number(c.precio)>0).length;
  const arrancaste  = ps.length || misProv.length || prodNicho || totalFav();

  const buscando = (state.qGlobal||"").trim().length >= 2;

  return `
  ${buscando ? `<div id="ofertas" class="ofertas"></div>` : ""}

  ${heroHTML()}

  ${buscando ? "" : `<div id="ofertas" class="ofertas" hidden></div>`}

  ${arrancaste ? `<div class="numeros">
    <div><b>${ps.length}</b><span>tus productos</span></div>
    <div><b>${misProv.length}</b><span>tus proveedores</span></div>
    <div><b>${prodNicho}</b><span>en tus nichos</span></div>
    <div><b style="color:${respondidas?"var(--acc)":"var(--tx3)"}">${respondidas}</b><span>cotizados</span></div>
    <div><b style="color:${totalFav()?"var(--oro)":"var(--tx3)"}">${totalFav()}</b><span>favoritos</span></div>
    ${ps.length?`<div><b style="color:${scoreColor(avgGlobal)}">${avgGlobal}</b><span>score prom.</span></div>`:""}
  </div>` : `<div class="arranque">
    <b>Todavía no guardaste nada.</b>
    <p>Buscá un producto arriba y guardá lo que te sirva: el proveedor pasa a ser tuyo cuando lo elegís, no antes.</p>
  </div>`}

  <div class="section">${calienteHTML()}</div>

  <div class="section">
    <div class="kpis">
      <div class="kpi"><div class="n">${ps.length}</div><div class="l">Productos</div></div>
      <div class="kpi star"><div class="n">${n("estrella")}</div><div class="l">Estrellas</div></div>
      <div class="kpi good"><div class="n">${n("potencial")}</div><div class="l">Potenciales</div></div>
      <div class="kpi warn"><div class="n">${n("evaluar")}</div><div class="l">Por evaluar</div></div>
      <div class="kpi bad"><div class="n">${n("clavo")+n("descartado")}</div><div class="l">Clavos</div></div>
      <div class="kpi"><div class="n" style="color:${scoreColor(avgGlobal)}">${avgGlobal}</div><div class="l">Score prom.</div></div>
    </div>
  </div>

  <div class="grid2">
    <div class="card">
      <div class="section-h"><h2>Top categorías</h2>
        <span class="hint">${state.temp==="mias" ? "por score de tus productos" : `rubros de ${state.temp}`}</span></div>

      <div class="segmented wrap" style="margin-bottom:12px">
        <button class="${state.temp==="mias"?"on":""}" onclick="verTemp('mias')">Tus productos</button>
        ${TEMPORADAS.map(t=>`<button class="${state.temp===t?"on":""}" onclick="verTemp('${t}')">${
          t===temporadaSur()?"● ":""}${t}</button>`).join("")}
      </div>

      ${state.temp==="mias" ? (rows.length? rows.map(r=>`
        <div class="bar-row" style="cursor:pointer" onclick="irARubro('${esc(r.r).replace(/'/g,"\\'")}')">
          <div class="nm">${esc(r.r)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(r.n/maxN)*100}%;background:${scoreColor(r.avg)}"></div></div>
          <div class="bar-val">${r.n} · <b style="color:${scoreColor(r.avg)}">${r.avg}</b></div>
        </div>`).join("") : `<p class="empty">Cargá productos y acá vas a ver tus rubros.</p>`)
      : (()=>{
          const rs = RUBROS_META.filter(r=>r.temp===state.temp)
            .sort((a,b)=>oportunidad(b.n)-oportunidad(a.n)).slice(0,8);
          const mx = Math.max(...rs.map(r=>oportunidad(r.n)), 1);
          return rs.map(r=>{
            const op=oportunidad(r.n);
            return `<div class="bar-row" style="cursor:pointer" onclick="irARubro('${esc(r.n).replace(/'/g,"\\'")}')">
              <div class="nm">${esc(r.n)}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${(op/mx)*100}%;background:${colorMargen(r.margen)}"></div></div>
              <div class="bar-val">${r.margen}% · <b style="color:${scoreColor(op)}">${op}</b></div>
            </div>`;}).join("");
        })()}

      ${state.temp==="mias" ? `<p class="hintline" style="margin-top:12px">La barra es cantidad de productos; el número en color es el score promedio del rubro.</p>`
        : `<p class="hintline" style="margin-top:12px">La barra es la oportunidad del rubro; a la izquierda del número está el margen típico.</p>`}

      <div class="adelanto">
        <span class="adelanto-et">🌎 Adelanto del hemisferio norte</span>
        <p>Hoy en Argentina es <b>${temporadaSur()}</b> y en Estados Unidos <b>${temporadaNorte()}</b>.
        Lo que allá está explotando ahora es lo que se va a vender acá en seis meses.
        <b>El stock de ${temporadaNorte()} se compra ahora</b>, en pleno ${temporadaSur()}: llega justo y sin competencia.</p>
        <button class="btn ghost mini" onclick="verTemp('${temporadaNorte()}')">Ver los rubros de ${temporadaNorte()} →</button>
      </div>
    </div>

    <div class="card">
      <div class="section-h"><h2>Ranking de productos</h2><span class="hint">los 5 mejores</span></div>
      ${top.length? top.map((p,i)=>`
        <div class="bar-row" style="grid-template-columns:20px 34px 1fr 92px;cursor:pointer" onclick="abrirProducto('${p.id}')">
          <div class="rank">${i+1}</div>
          <span class="rank-foto foto-slot" data-foto="${esc(p.nombre)}" data-foto-rubro="${esc(p.rubro)}">${IC_MACRO[metaRubro(p.rubro).cat]||"📦"}</span>
          <div style="overflow:hidden"><div class="pname" style="font-size:13px">${esc(p.nombre)}</div>
            <div class="psub">${esc(p.rubro)}</div></div>
          <div>${scoreLine(score(p))}</div>
        </div>`).join("") : `<p class="empty">Sin datos todavía</p>`}
    </div>
  </div>

  <div class="section" style="margin-top:14px">
    <div class="card" id="ideaCard">
      <div class="section-h"><h2>🎲 Recomendación analizada</h2>
        <span class="hint">con proveedor, precio de referencia y competencia real</span></div>
      <div id="ideaBox">${recoHTML(state.reco || CALIENTES[(diaDelAnio()*7)%CALIENTES.length])}</div>
    </div>
  </div>`;
}

function exploradorHTML(){
  const pool = CALIENTES.filter(c=>!state.productos.some(p=>p.nombre===c.p));
  const hoy  = state.explorar || pool.slice(0,6);
  return `
  <div class="explorador">
    <div class="of-cab">
      <h3>🎲 Explorar candidatos</h3>
      <span class="hint">productos analizados que todavía no tenés en el radar</span>
      <button class="btn ghost mini" onclick="mezclarExplorar()">↻ Otros seis</button>
    </div>
    <div class="cardgrid">
      ${hoy.map(c=>{
        const m=metaRubro(c.rubro);
        return `<div class="expl">
          <div class="expl-cab">
            <span class="rubro-ic" style="--tono:${tono(m.cat)}">${IC_MACRO[m.cat]||"📦"}</span>
            <div>
              <b>${esc(c.p)}</b>
              <span class="expl-rubro">${esc(c.rubro)}</span>
            </div>
            <span class="expl-score" style="color:${scoreColor(c.score)}">${c.score}</span>
          </div>
          <p class="expl-w">${esc(c.w)}</p>
          <div class="expl-pie">
            <span class="tag">margen ${m.margen}%</span>
            <span class="tag">oport. ${oportunidad(c.rubro)}</span>
            <button class="btn ghost mini" onclick="buscarEsto('${esc(c.p).replace(/'/g,"\\'")}')">Ver ofertas</button>
            <button class="btn primary mini" onclick="nuevoDesdeIdea('${esc(c.p).replace(/'/g,"\\'")}','${esc(c.rubro).replace(/'/g,"\\'")}')">+ Sumar</button>
          </div>
        </div>`;}).join("")}
    </div>
  </div>`;
}
function mezclarExplorar(){
  const pool = CALIENTES.filter(c=>!state.productos.some(p=>p.nombre===c.p));
  state.explorar = [...pool].sort(()=>Math.random()-0.5).slice(0,6);
  render();
}
function buscarEsto(q){
  state.view="dashboard";
  state.qGlobal=q;
  render();                                   /* con qGlobal cargado el bloque sale arriba */
  const h=$("#qHero"); if(h) h.value=q;
  const g=$("#qGlobal"); if(g) g.value=q;
  window.scrollTo({top:0, behavior:"instant"});
  pintarOfertas(q);
}

function vProductos(){
  let ps = state.productos.filter(p=>{
    const q = state.q.toLowerCase();
    const hit = !q || [p.nombre,p.rubro,p.proveedor,p.notas,p.url,paisDe(p),(p.tags||[]).join(" ")]
      .join(" ").toLowerCase().includes(q);
    return hit
      && (!state.fRubro || p.rubro===state.fRubro)
      && (!state.fVeredicto || p.veredicto===state.fVeredicto)
      && (!state.fPais || paisDe(p)===state.fPais);
  });
  const {k,dir} = state.sort;
  ps.sort((a,b)=>{
    const val = p => k==="score" ? score(p) : k==="margen" ? (margen(p)??-1)
              : k==="venta" ? (Number(p.venta)||0) : String(p[k]||"").toLowerCase();
    const A=val(a), B=val(b);
    return (A<B?-1:A>B?1:0)*dir;
  });

  const opt=(arr,sel)=>arr.map(o=>`<option value="${esc(o)}" ${o===sel?"selected":""}>${esc(o)}</option>`).join("");
  const th=(key,label,cls="")=>`<th class="${cls}" onclick="setSort('${key}')">${label}${state.sort.k===key?(dir>0?" ▲":" ▼"):""}</th>`;

  return `
  <div class="toolbar">
    <input class="input" id="q" placeholder="Buscar producto, proveedor, nota…" value="${esc(state.q)}">
    <select class="input" id="fRubro"><option value="">Todos los rubros</option>${opt(RUBROS,state.fRubro)}</select>
    <select class="input" id="fVeredicto"><option value="">Todos los estados</option>${opt(VEREDICTOS,state.fVeredicto)}</select>
    <select class="input" id="fPais"><option value="">Todos los países</option>${PAISES.map(x=>`<option value="${esc(x)}" ${x===state.fPais?"selected":""}>${bandera(x)} ${esc(x)}</option>`).join("")}</select>
    <label class="input" style="display:flex;align-items:center;gap:7px;cursor:default">
      <span style="color:var(--tx3);font-size:12.5px;white-space:nowrap">Multiplicador ×</span>
      <input type="number" id="multDefault" step="0.05" min="1" value="${settings.mult}"
             style="width:56px;background:transparent;border:0;color:var(--acc);font:inherit;font-weight:700;outline:none">
    </label>
  </div>

  ${exploradorHTML()}

  ${ps.length? `
  <div class="tablewrap"><table>
    <thead><tr>
      ${th("nombre","Producto")}
      ${th("rubro","Rubro")}
      <th>Proveedor</th>
      ${th("venta","Venta","num")}
      <th class="num">Costo puesto</th>
      ${th("margen","Margen","num")}
      ${th("score","Score")}
      <th>Estado</th>
      <th></th>
    </tr></thead>
    <tbody>${ps.map(p=>{
      const m=margen(p), s=score(p);
      return `<tr onclick="abrirProducto('${p.id}')">
        <td><div class="celda-prod">
            ${fotoHTML(p)}
            <div class="celda-txt">
              <div class="pname">${p.url
                ? `<a href="${esc(p.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Abrir el producto">${nombreConFlecha(p.nombre)}</a>`
                : esc(p.nombre)}</div>
              <div class="psub">${(p.tags||[]).slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>
            </div></div></td>
        <td style="color:var(--tx2)">${esc(p.rubro||"—")}</td>
        <td>${p.provUrl?`<a href="${esc(p.provUrl)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(p.proveedor||"link")}</a>`:esc(p.proveedor||"—")}
            <div class="psub"><span class="pais"><span class="bandera">${bandera(paisDe(p))}</span>${esc(paisDe(p))}</span>
              ${p.origen && !p.origen.startsWith(paisDe(p)) ? `<span class="psub2">· llega de ${esc(p.origen)}</span>` : ""}</div></td>
        <td class="num">${money(p.venta)}</td>
        <td class="num" style="color:var(--tx2)">${money(costoPuesto(p))}${p.aplicaMult?`<span class="multmini">×${multDe(p)}</span>`:""}</td>
        <td class="num" style="color:${m==null?"var(--tx3)":m>=65?"var(--acc)":m>=45?"var(--warn)":"var(--bad)"}">${m==null?"—":m+"%"}</td>
        <td style="min-width:110px">${scoreLine(s)}</td>
        <td><span class="pill ${esc(p.veredicto||"evaluar")}">${esc(p.veredicto||"evaluar")}</span></td>
        <td>${btnFav("productos",p.id)}</td>
        <td class="acciones" onclick="event.stopPropagation()">
          ${p.url
            ? `<a class="accbtn" href="${esc(p.url)}" target="_blank" rel="noopener" title="Abrir el producto">${ICO.link}</a>`
            : `<button class="accbtn off" title="Falta el link — tocá para cargarlo" onclick="pedirDato('${p.id}','url')">${ICO.link}</button>`}
          ${waLink(p)
            ? `<a class="accbtn wa" href="${esc(waLink(p))}" target="_blank" rel="noopener" title="WhatsApp con ${esc(p.proveedor||"el proveedor")}">${ICO.wa}</a>`
            : `<button class="accbtn off" title="Falta el WhatsApp — tocá para cargarlo" onclick="pedirDato('${p.id}','whatsapp')">${ICO.wa}</button>`}
          <button class="accbtn del" title="Eliminar" onclick="borrarProducto('${p.id}')">${ICO.tacho}</button>
        </td>
      </tr>`;}).join("")}</tbody>
  </table></div>
  <p class="hintline" style="margin-top:10px"><span class="ver">${APP_VER}</span> · ${ps.length} producto${ps.length===1?"":"s"} · Costo puesto = costo × multiplicador, activable por producto (defecto ×${settings.mult}). Tocá una fila para editar.</p>
  ` : `<div class="empty"><div class="big">🔍</div>No hay productos con esos filtros.</div>`}`;
}

const ORDENES = [
  { k:"margen",n:"Mejor margen" },
  { k:"op",    n:"Oportunidad" },
  { k:"tend",  n:"Tendencia" },
  { k:"exp+",  n:"Más explotados" },
  { k:"exp-",  n:"Menos explotados" },
  { k:"az",    n:"A → Z" },
  { k:"za",    n:"Z → A" }
];
const PESO_ORD = { subiendo:2, estable:1, bajando:0 };

function ordenarRubros(arr, k){
  const c=[...arr];
  if(k==="margen") return c.sort((a,b)=> b.margen-a.margen || oportunidad(b.n)-oportunidad(a.n));
  if(k==="az")   return c.sort((a,b)=>a.n.localeCompare(b.n,"es"));
  if(k==="za")   return c.sort((a,b)=>b.n.localeCompare(a.n,"es"));
  if(k==="exp+") return c.sort((a,b)=>b.explotado-a.explotado);
  if(k==="exp-") return c.sort((a,b)=>a.explotado-b.explotado);
  if(k==="tend") return c.sort((a,b)=> (PESO_ORD[b.tend]-PESO_ORD[a.tend]) || b.proyeccion-a.proyeccion);
  return c.sort((a,b)=>oportunidad(b.n)-oportunidad(a.n));
}

const FLECHA_TEND = { subiendo:"▲", estable:"—", bajando:"▼" };
const COLOR_TEND  = { subiendo:"var(--acc)", estable:"var(--tx3)", bajando:"var(--bad)" };

function vRubros(){
  const mios={};
  state.productos.forEach(p=>{
    const r=p.rubro||"Otro";
    (mios[r] ||= {n:0,sum:0,estrellas:0});
    mios[r].n++; mios[r].sum+=score(p);
    if(p.veredicto==="estrella") mios[r].estrellas++;
  });

  const q=(state.qRubro||"").toLowerCase();
  let base = RUBROS_META.filter(m=>{
    if(m.n==="Otro" && !mios["Otro"]) return false;
    if(state.fMacro && m.cat!==state.fMacro) return false;
    if(state.fMargen && m.margen < state.fMargen) return false;
    if(q && !(m.n+" "+m.cat+" "+m.nota).toLowerCase().includes(q)) return false;
    return true;
  });
  base = ordenarRubros(base, state.rubroOrden||"margen");

  return `
  <div class="section-h">
    <h2>Rubros</h2>
    <span class="hint">${base.length} de ${RUBROS_META.length} · tocá uno para ver proveedores</span>
  </div>

  <div class="toolbar">
    <input class="input" id="qRubro" placeholder="Buscar rubro…" value="${esc(state.qRubro||"")}">
    <select class="input" id="fMacro">
      <option value="">Todas las categorías</option>
      ${MACROS.map(c=>`<option value="${esc(c)}" ${c===state.fMacro?"selected":""}>${IC_MACRO[c]||""} ${esc(c)}</option>`).join("")}
    </select>
    <select class="input" id="fMargen">
      <option value="0">Cualquier margen</option>
      <option value="70" ${state.fMargen==70?"selected":""}>70% o más</option>
      <option value="60" ${state.fMargen==60?"selected":""}>60% o más</option>
      <option value="50" ${state.fMargen==50?"selected":""}>50% o más</option>
    </select>
    <div class="segmented wrap">
      ${ORDENES.map(o=>`<button class="${(state.rubroOrden||"margen")===o.k?"on":""}" onclick="setOrdenRubro('${o.k}')">${o.n}</button>`).join("")}
    </div>
  </div>

  <div class="rubrogrid">
  ${base.map(f=>{
    const op=oportunidad(f.n), mio=mios[f.n];
    const cOp  = op>=55?"var(--acc)":op>=38?"var(--warn)":"var(--bad)";
    const cExp = f.explotado>=70?"var(--bad)":f.explotado>=50?"var(--warn)":"var(--acc)";
    const cPro = f.proyeccion>=78?"var(--acc)":f.proyeccion>=60?"var(--warn)":"var(--bad)";
    const abierto = state.rubroAbierto===f.n;
    return `
    <div class="rubro ${mio?"tiene":""} ${abierto?"abierto":""}">
      <div class="rubro-top" onclick="abrirRubro('${esc(f.n).replace(/'/g,"\\'")}')">
        <span class="rubro-ic" style="--tono:${tono(f.cat)}">${IC_MACRO[f.cat]||"📦"}</span>
        <div class="rubro-id">
          <h3>${esc(f.n)}</h3>
          <div class="rubro-sub">${esc(f.cat)} · <span style="color:${COLOR_TEND[f.tend]}">${FLECHA_TEND[f.tend]} ${f.tend}</span>${mio?` · <b style="color:var(--acc)">${mio.n} tuyo${mio.n===1?"":"s"}</b>`:""}</div>
        </div>
        ${btnFav("rubros",f.n)}
        <div class="rubro-margen"><b style="color:${colorMargen(f.margen)}">${f.margen}%</b><span>margen</span></div>
      </div>
      <div class="rubro-op-linea">
        <div class="op-barra"><i style="width:${op}%;background:${cOp}"></i></div>
        <b style="color:${cOp}">${op}</b><span>oportunidad</span>
      </div>
      <div class="rubro-mini">
        <span>saturación <b style="color:${cExp}">${f.explotado}</b></span>
        <span>proyección <b style="color:${cPro}">${f.proyeccion}</b></span>
      </div>
      <p class="rubro-nota">${esc(f.nota)}</p>
      ${abierto ? panelRubro(f) : `
      <div class="rubro-pie">
        <button class="btn ghost mini" onclick="abrirRubro('${esc(f.n).replace(/'/g,"\\'")}')">Proveedores y competencia</button>
        ${mio?`<button class="btn ghost mini" onclick="verRubro('${esc(f.n).replace(/'/g,"\\'")}')">Ver mis ${mio.n}</button>`:""}
      </div>`}
    </div>`;}).join("")}
  </div>

  ${base.length?"":`<div class="empty"><div class="big">🔍</div>Ningún rubro con ese filtro.</div>`}

  <p class="hintline" style="margin-top:16px">
    <b>Explotado</b>: competencia que ya hay en Argentina. <b>Proyección</b>: potencial de crecimiento y margen.
    <b>Oportunidad</b> combina ambas con la tendencia. Son estimaciones para priorizar, no datos duros:
    validá siempre contra Mercado Libre antes de comprar.
  </p>`;
}

/* Proveedores del rubro: búsquedas reales, no una lista inventada. */
function panelRubro(f){
  const bs = buscadoresDe(f.n);
  const provs = esArg() ? bs.filter(b=>b.clase==="nacional") : [];
  const impo  = esArg() ? [] : bs.filter(b=>b.clase==="importar");
  const comp  = bs.filter(b=>b.clase==="competencia");
  /* Sólo proveedores directos: las plataformas ya van en su propia sección. */
  const dir = PROVEEDORES.filter(p=>
    p.tipo!=="1688" && p.tipo!=="Alibaba" && p.pais!=="China" &&
    ((p.rubros||[]).includes(f.cat) || p.rubro===f.cat)
  );
  const fila = b => `
    <div class="prov-row">
      <div class="prov-id">
        <b>${esc(b.n)}</b>
        <span class="prov-meta">${bandera(b.pais)} ${esc(b.pais)} · mín. ${esc(b.minimo)} · ${esc(b.idioma)}</span>
      </div>
      <a class="btn ghost mini" href="${esc(b.url)}" target="_blank" rel="noopener">Buscar “${esc(b.term)}” ↗</a>
      <button class="accbtn" title="Sumarlo a mis proveedores"
        onclick='sumarProveedor(${JSON.stringify({n:b.n,pais:b.pais,clase:b.clase,url:b.url,rubro:f.n}).replace(/'/g,"&#39;")})'>+</button>
    </div>`;
  const dirRubro = provsDeRubro(f.n).concat(
    PROVEEDORES.filter(p=>(p.rubros||[]).includes(f.cat) && p.pais==="Argentina")
      .map(p=>({n:p.nombre,url:p.url,tipo:p.tipo,zona:p.pais,nota:p.nota,whatsapp:p.whatsapp,rubros:[f.cat]}))
  );
  const mios = misProv.filter(p=>p.rubro===f.n);

  const filaDir = p => `
    <div class="prov-row real">
      <div class="prov-id">
        <b>${esc(p.n)}</b>
        <span class="prov-meta">${esc(p.tipo)} · ${esc(p.zona)}${p.nota?` — ${esc(p.nota)}`:""}</span>
      </div>
      <a class="btn ghost mini" href="${esc(p.url)}" target="_blank" rel="noopener">Abrir ↗</a>
      ${p.whatsapp?`<a class="accbtn wa" href="https://wa.me/${waNumero(p.whatsapp)}" target="_blank" rel="noopener">${ICO.wa}</a>`:""}
      <button class="accbtn" title="Pedirle cotización"
        onclick='formCotiz(${JSON.stringify({proveedor:p.n,rubro:f.n}).replace(/'/g,"&#39;")})'>◍</button>
      <button class="accbtn" title="Sumarlo a mis proveedores"
        onclick='sumarProveedor(${JSON.stringify({n:p.n,pais:"Argentina",clase:p.tipo,url:p.url,rubro:f.n}).replace(/'/g,"&#39;")})'>+</button>
    </div>`;

  return `
  <div class="rubro-panel">
    ${esArg()?`<div class="panel-h">🏢 Proveedores reales <span class="hint">${dirRubro.length} verificados para ${esc(f.cat)} · los abrí uno por uno</span></div>`:""}
    ${!esArg() ? "" : dirRubro.length ? dirRubro.map(filaDir).join("")
      : `<p class="hintline">Todavía no relevé proveedores de <b>${esc(f.cat)}</b>. Usá las búsquedas de abajo y sumá los que encuentres con el +.</p>`}
    <div class="rubro-pie" style="margin:8px 0 0;padding-top:8px">
      <button class="btn ghost mini" onclick="formProveedor('${esc(f.n).replace(/'/g,"\\'")}')">+ Agregar un proveedor que conozcas</button>
    </div>

    ${mios.length?`<div class="panel-h">⭐ Tuyos en este rubro</div>
      ${mios.map(p=>`<div class="prov-row">
        <div class="prov-id"><b>${esc(p.n)}</b>
          <span class="prov-meta">${estrellasHTML(p.rating)}${p.precio?` · US$ ${esc(p.precio)}`:""}${p.resenas?` · ${esc(p.resenas)}`:""}</span></div>
        ${p.url?`<a class="btn ghost mini" href="${esc(p.url)}" target="_blank" rel="noopener">Abrir ↗</a>`:""}
      </div>`).join("")}`:""}

    <div class="panel-h">🔎 Buscar más <span class="hint">para encontrar los que todavía no están en la lista</span></div>
    ${provs.map(fila).join("")}
    <div class="prov-row zona">
      <div class="prov-id"><b>Zona mayorista</b>
        <span class="prov-meta">${esc(zonaDe(f.cat))} · ir un día y volver con diez listas de precios</span></div>
    </div>
    <div class="panel-h">💰 Precio de venta y competencia <span class="hint">margen típico del rubro: <b style="color:${colorMargen(f.margen)}">${f.margen}%</b></span></div>
    <div id="mkRubro-${esc(f.n).replace(/[^a-zA-Z0-9]/g,"")}"></div>
    ${comp.map(fila).join("")}
    ${dir.length?`<div class="panel-h">✅ Verificados por mí <span class="hint">los abrí y confirmé uno por uno</span></div>
      ${dir.map(p=>`<div class="prov-row">
        <div class="prov-id"><b>${esc(p.nombre)}</b>
          <span class="prov-meta">${bandera(p.pais)} ${esc(p.pais)} · ${esc(p.tipo)}</span></div>
        <a class="btn ghost mini" href="${esc(p.url)}" target="_blank" rel="noopener">Abrir ↗</a>
        ${p.whatsapp?`<a class="accbtn wa" href="https://wa.me/${waNumero(p.whatsapp)}" target="_blank" rel="noopener">${ICO.wa}</a>`:""}
      </div>`).join("")}`:""}
    ${esArg()?"":`<div class="panel-h">🇨🇳 Importar directo <span class="hint">término: <code>${esc(f.term||f.n)}</code></span></div>`}
    ${impo.map(fila).join("")}
    <div class="rubro-pie">
      <button class="btn ghost mini" onclick="abrirRubro(null)">Cerrar</button>
      <button class="btn primary mini" onclick="nuevoEnRubro('${esc(f.n).replace(/'/g,"\\'")}')">+ Producto en este rubro</button>
    </div>
  </div>`;
}

/* un handler global por proveedor para las estrellas del listado */
function instalarHandlersEstrellas(){
  misProv.forEach(p=>{ window["puntuarProv_"+p.id] = n => puntuarProveedor(p.id, n); });
}

function setOrdenRubro(k){ state.rubroOrden=k; render(); }
function abrirRubro(n){
  state.rubroAbierto = (state.rubroAbierto===n ? null : n);
  render();
  if(n && hayMercado()) pintarMercado("#mkRubro-"+n.replace(/[^a-zA-Z0-9]/g,""), n);
}
function verRubro(n){ state.view="productos"; state.fRubro=n; state.q=""; render(); }
function nuevoEnRubro(n){ openModal(null); state.editing.rubro=n; renderModal(); }

const estrellasHTML = (n, onclick) => [1,2,3,4,5].map(i=>
  `<span class="est ${i<=n?"on":""}" ${onclick?`onclick="${onclick}(${i})"`:""}>★</span>`).join("");

/* score 0-100 y estrellas 1-5 son la misma nota en dos escalas */
const aEstrellas = s => Math.max(1, Math.min(5, Math.round(s/20)));

function vProveedores(){
  /* Una sola lista. Antes estaban partidos en "verificados" y "directorio",
     que era una división mía y no le servía a nadie. */
  const todos = [
    ...PROVEEDORES.filter(p=>p.tipo!=="1688" && p.tipo!=="Alibaba").map(p=>({
      n:p.nombre, url:p.url, tipo:p.tipo, zona:p.pais, nota:p.nota,
      whatsapp:p.whatsapp, rubros:p.rubros||[p.rubro], pais:p.pais })),
    ...DIRECTORIO.map(p=>({ ...p, pais:"Argentina" })),
  ];
  const mios = new Set(misProv.map(p=>(p.url||"").replace(/\/$/,"")));
  const q = (state.qDir||"").toLowerCase();
  const lista = todos.filter(p=>
    (!state.fDirCat || (p.rubros||[]).includes(state.fDirCat)) &&
    (!state.soloMios || mios.has((p.url||"").replace(/\/$/,""))) &&
    (!q || (p.n+" "+(p.nota||"")+" "+p.tipo+" "+p.zona+" "+(p.rubros||[]).join(" ")).toLowerCase().includes(q)));

  const cats = MACROS.filter(c=>todos.some(p=>(p.rubros||[]).includes(c)));

  return `
  <div class="section-h"><h2>Proveedores</h2>
    <span class="hint">preguntá siempre: «¿me hacés factura A?» y «¿cuál es el mínimo?»</span></div>

  <div class="toolbar">
    <input class="input" id="qDir" placeholder="Buscar proveedor…" value="${esc(state.qDir||"")}">
    <select class="input" id="fDirCat">
      <option value="">Todas las categorías</option>
      ${cats.map(c=>`<option value="${esc(c)}" ${c===state.fDirCat?"selected":""}>${IC_MACRO[c]||""} ${esc(c)} (${todos.filter(p=>(p.rubros||[]).includes(c)).length})</option>`).join("")}
    </select>
    <div class="segmented">
      <button class="${state.soloMios?"":"on"}" onclick="state.soloMios=false;render()">Todos ${todos.length}</button>
      <button class="${state.soloMios?"on":""}" onclick="state.soloMios=true;render()">★ Los míos ${misProv.length}</button>
    </div>
  </div>

  ${lista.length ? `<div class="cardgrid">${lista.map(p=>{
    const esMio = mios.has((p.url||"").replace(/\/$/,""));
    return `<div class="minicard prov-card ${esMio?"mio":""}">
      <h3><span class="bandera bandera-lg">${p.pais==="Colombia"?"🇨🇴":"🇦🇷"}</span>${esc(p.n)} ${btnFav("proveedores",p.n)}</h3>
      <div class="meta">${esc(p.tipo)} · ${esc(p.zona)}</div>
      <p>${esc(p.nota||"")}</p>
      <p style="margin-top:8px">${(p.rubros||[]).slice(0,3).map(r=>`<span class="tag">${IC_MACRO[r]||""} ${esc(r)}</span>`).join("")}</p>
      <div class="prov-card-pie">
        <a href="${esc(p.url)}" target="_blank" rel="noopener">Abrir ↗</a>
        ${p.whatsapp?`<a href="https://wa.me/${waNumero(p.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>`:""}
        <button class="btn ghost mini" onclick='sumarProveedor(${JSON.stringify({n:"",pais:"Argentina",clase:"",url:"",rubro:""}).replace(/'/g,"&#39;")})' hidden></button>
        ${esMio
          ? `<span class="mio-tag">★ tuyo</span>`
          : `<button class="btn ghost mini" onclick='sumarProveedor(${JSON.stringify({n:p.n,pais:p.pais,clase:p.tipo,url:p.url,rubro:(p.rubros||[])[0]||"",whatsapp:p.whatsapp||""}).replace(/'/g,"&#39;")})'>+ Es mío</button>`}
      </div>
    </div>`;}).join("")}</div>`
  : `<div class="empty">${state.soloMios
      ? `<div class="big">★</div>Todavía no marcaste ninguno como tuyo.<br><span class="hintline">Tocá «+ Es mío» en el que te sirva.</span>`
      : "Ninguno con ese filtro."}</div>`}

  <div class="bloque" style="margin-top:22px">
    <div class="bloque-h">
      <h3>🌐 Plataformas para importar</h3>
      <span class="hint">no son fábricas: son buscadores de fábricas</span>
    </div>
    <div class="cardgrid">${PLATAFORMAS.filter(p=>p.clase==="plataforma").map(p=>`
      <div class="minicard">
        <h3><span class="bandera bandera-lg">🇨🇳</span>${esc(p.n)}</h3>
        <div class="meta">mín. ${esc(p.minimo)} · ${esc(p.idioma)}</div>
        <p>${esc(p.nota)}</p>
      </div>`).join("")}</div>
    <p class="hintline" style="margin-top:10px">Para buscar en una: andá a <b>Rubros</b>, abrí el rubro y usá los links — llevan el término correcto en chino.</p>
  </div>`;
}

/* Barra con etiqueta y valor. Vivía adentro de vRubros, así que la ficha de
   producto no la veía. */
const medidor = (v,color,etq)=>`
  <div class="med"><div class="med-top"><span>${etq}</span><b style="color:${color}">${v}</b></div>
  <div class="med-track"><i style="width:${v}%;background:${color}"></i></div></div>`;

/* Un tono por macro-categoría, para que las burbujas del mapa se distingan. */
const COLOR_MACRO = {};
MACROS.forEach(c=>COLOR_MACRO[c]=tono(c));

function empaquetar(items, ancho, alto){
  const GAP=4, puestos=[];
  const cx=ancho/2, cy=alto/2;
  items.forEach((it,idx)=>{
    const r=it.r;
    if(idx===0){ puestos.push({...it,x:cx,y:cy}); return; }
    let ang=0, rad=r+items[0].r+GAP, x=cx, y=cy, chocado=true, iter=0;
    while(chocado && iter<20000){
      x = cx + Math.cos(ang)*rad;
      y = cy + Math.sin(ang)*rad;
      chocado = x-r<GAP || x+r>ancho-GAP || y-r<GAP || y+r>alto-GAP
             || puestos.some(p=>Math.hypot(p.x-x, p.y-y) < p.r + r + GAP);
      ang += Math.max(0.02, 5/rad);
      if(ang >= Math.PI*2){ ang=0; rad+=5; }
      iter++;
    }
    if(!chocado) puestos.push({...it,x,y});
  });
  return puestos;
}

function vNichos(){
  const cuantos = state.nichoTop||45;
  const arr = RUBROS_META
    .filter(m=>m.n!=="Otro")
    .filter(m=>!state.fMacroNicho || m.cat===state.fMacroNicho)
    .map(m=>({...m, op:oportunidad(m.n)}))
    .sort((a,b)=>b.op-a.op)
    .slice(0,cuantos);

  const W=1000, H=760;
  const rMin=19, rMax=52;
  const min=Math.min(...arr.map(x=>x.op)), max=Math.max(...arr.map(x=>x.op));
  const burbujas = arr.map(m=>({
    ...m,
    r: rMin + (max===min?0.5:(m.op-min)/(max-min)) * (rMax-rMin)
  }));
  const puestos = empaquetar(burbujas, W, H);

  return `
  <div class="section-h"><h2>Mapa de nichos</h2>
    <span class="hint">el tamaño es la oportunidad · tocá una burbuja para abrir el rubro</span></div>

  <div class="toolbar">
    <select class="input" id="fMacroNicho">
      <option value="">Todas las categorías</option>
      ${MACROS.filter(c=>c!=="Otro").map(c=>`<option value="${esc(c)}" ${c===state.fMacroNicho?"selected":""}>${IC_MACRO[c]||""} ${esc(c)}</option>`).join("")}
    </select>
    <div class="segmented">
      ${[25,45,80].map(n=>`<button class="${cuantos===n?"on":""}" onclick="setNichoTop(${n})">Top ${n}</button>`).join("")}
    </div>
  </div>

  <div class="mapa card">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mapa de nichos por oportunidad">
      ${puestos.map(b=>{
        const t=COLOR_MACRO[b.cat]||200;
        const chico=b.r<26;
        return `<g class="burbuja" onclick="irARubro('${esc(b.n).replace(/'/g,"\\'")}')">
          <title>${esc(b.n)} — oportunidad ${b.op} · explotado ${b.explotado} · proyección ${b.proyeccion}</title>
          <circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="${b.r.toFixed(1)}"
                  fill="hsl(${t} 62% 45% / .26)" stroke="hsl(${t} 62% 52%)" stroke-width="1.5"/>
          <text x="${b.x.toFixed(1)}" y="${(b.y - (chico?0:5)).toFixed(1)}" class="b-num">${b.op}</text>
          ${chico?"":`<text x="${b.x.toFixed(1)}" y="${(b.y+11).toFixed(1)}" class="b-txt">${esc(b.n.length>16?b.n.slice(0,15)+"…":b.n)}</text>`}
        </g>`;}).join("")}
    </svg>
  </div>

  <div class="leyenda">
    ${MACROS.filter(c=>c!=="Otro").map(c=>`<span class="lg"><i style="background:hsl(${COLOR_MACRO[c]} 62% 52%)"></i>${IC_MACRO[c]||""} ${esc(c)}</span>`).join("")}
  </div>

  <div class="cardgrid" style="margin-top:18px">
  ${NICHOS.map((n,i)=>`
    <div class="minicard nicho" style="border-left-color:${scoreColor(n.score)}">
      <div class="rank">#${i+1} de los evaluados a fondo</div>
      <h3>${esc(n.nombre)}</h3>
      <div class="meta">${esc(n.veredicto)}</div>
      ${scoreLine(n.score)}
      <p>${esc(n.resumen)}</p>
      <ul class="pros">${n.pros.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <ul class="contras">${n.contras.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <p style="margin-top:11px;font-size:12.5px">
        <b style="color:var(--tx)">Ancla:</b> ${esc(n.ancla)}<br>
        <b style="color:var(--tx)">Satélites:</b> ${esc(n.satelites)}<br>
        <b style="color:var(--tx)">Recompra:</b> ${esc(n.recompra)}</p>
    </div>`).join("")}
  </div>

  <div class="card" style="margin-top:18px">
    <div class="section-h"><h2>La arquitectura</h2></div>
    <p style="font-size:13.5px;color:var(--tx2);margin:0 0 10px">
      <b style="color:var(--tx)">Ancla</b> (1-2): trae el tráfico, la gente lo busca. →
      <b style="color:var(--tx)">Satélites</b> (5-15): nadie los busca solos, se venden pegados y ahí está el margen. →
      <b style="color:var(--tx)">Recompra</b>: hace que vuelvan sin pagar ads de nuevo.</p>
    <p style="font-size:13.5px;color:var(--warn);margin:0">
      La primera venta da cerca de cero después del costo de pauta. Ganás en la segunda y la tercera —
      por eso el nicho con recompra no es un detalle, es la condición para que exista el negocio.</p>
  </div>`;
}
function setNichoTop(n){ state.nichoTop=n; render(); }
function irARubro(n){ state.view="rubros"; state.rubroAbierto=n; state.qRubro=n; render(); }

function vTiendas(){
  return `
  <div class="section-h"><h2>Tiendas</h2>
    <span class="hint">catálogo, precios y lanzamientos de tiendas que ya venden lo que querés vender</span></div>

  <div class="toolbar">
    <input class="input" id="nuevaTienda" placeholder="Pegá la dirección de una tienda: mitienda.com.ar">
    <button class="btn primary" id="btnAddTienda">+ Espiar</button>
    <button class="btn ghost" id="btnRefrescarT">↻ Actualizar</button>
  </div>

  <div id="tiendasBox">
    ${state.tiendas.map(t=>`<div class="tienda card" id="tienda-${t.id}">
      <div class="tienda-h">
        <div>
          <h3>${esc(t.nombre)}</h3>
          <a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.url.replace(/^https?:\/\//,""))} ↗</a>
          ${t.nota?`<p class="rubro-nota">${esc(t.nota)}</p>`:""}
        </div>
        <button class="accbtn del" onclick="borrarTienda('${t.id}')">${ICO.tacho}</button>
      </div>
      <div class="tienda-body"><p class="hintline">Leyendo el catálogo…</p></div>
    </div>`).join("")}
  </div>

  ${state.tiendas.length?"":`<div class="empty"><div class="big">🕵</div>
    Sumá una tienda que venda lo que te interesa.<br>
    <span class="hintline">Funciona con tiendas Shopify — que es lo que usa la mayoría de las marcas de este estilo.</span></div>`}

  <p class="hintline" style="margin-top:14px">
    Los datos salen del catálogo público de cada tienda. Sirve para ver qué ticket manejan,
    con cuánto descuento trabajan y sobre todo <b>qué lanzaron hace poco</b>: eso es lo que les está funcionando ahora.
  </p>`;
}

function tiendaHTML(t, d){
  if(d.error) return `<p class="hintline" style="color:var(--warn)">${esc(d.error)}</p>`;
  const r = resumirTienda(d.productos);
  const nuevos = [...d.productos].sort((a,b)=>(b.publicado||"").localeCompare(a.publicado||"")).slice(0,8);
  return `
  <div class="mk-kpis" style="margin:12px 0 4px">
    <div><b>${r.total}</b><span>productos</span></div>
    <div><b style="color:var(--acc)">${pesos(r.mediana)}</b><span>ticket típico</span></div>
    <div><b>${pesos(r.min)}</b><span>el más barato</span></div>
    <div><b>${pesos(r.max)}</b><span>el más caro</span></div>
    <div><b>${r.conDescuento}/${r.total}</b><span>con descuento</span></div>
    <div><b>${r.offPromedio}%</b><span>off promedio</span></div>
    <div><b style="color:${r.nuevos?"var(--warn)":"var(--tx3)"}">${r.nuevos}</b><span>nuevos 45 días</span></div>
  </div>
  <div class="panel-h">Lo último que publicaron</div>
  <div class="lanzamientos">
    ${nuevos.map(p=>{
      const dias = diasDesde(p.publicado);
      return `<div class="lanz">
        <span class="foto">${p.img?`<img src="${esc(p.img)}" alt="" loading="lazy" onerror="this.remove()">`:""}</span>
        <div class="lanz-txt">
          <div class="pname">${esc(p.titulo.slice(0,58))}</div>
          <div class="psub">${p.publicado} · hace ${dias} día${dias===1?"":"s"}${p.tipo?` · ${esc(p.tipo)}`:""}${p.stock?"":" · sin stock"}</div>
        </div>
        <div class="lanz-precio">
          <b>${pesos(p.precio)}</b>
          ${p.off?`<span class="off">${p.off}% off</span>`:""}
        </div>
        <button class="accbtn" title="Sumarlo al radar"
          onclick='sumarDesdeTienda(${JSON.stringify({t:p.titulo,precio:p.precio,img:p.img}).replace(/'/g,"&#39;")})'>+</button>
      </div>`;}).join("")}
  </div>`;
}

async function pintarTiendas(){
  for(const t of state.tiendas){
    const caja = document.querySelector(`#tienda-${t.id} .tienda-body`);
    if(!caja) continue;
    const d = await traerTienda(t.url);
    const sigue = document.querySelector(`#tienda-${t.id} .tienda-body`);
    if(sigue) sigue.innerHTML = tiendaHTML(t, d);
    if(d.productos && d.productos.length){
      const ult=[...d.productos].sort((a,b)=>(b.publicado||"").localeCompare(a.publicado||""))[0];
      if(ult && (!ultimoLanzamiento || (ult.publicado||"") > (ultimoLanzamiento.publicado||"")))
        ultimoLanzamiento = {...ult, tienda:t.nombre};
    }
  }
}

function agregarTienda(url){
  const base = limpiarDominio(url);
  if(!base){ toast("Dirección inválida"); return; }
  if(state.tiendas.some(t=>t.url===base)){ toast("Ya la estabas espiando"); return; }
  const nombre = base.replace(/^https?:\/\//,"").replace(/^www\./,"").split(".")[0];
  state.tiendas.push({ id:uid(), nombre: nombre.charAt(0).toUpperCase()+nombre.slice(1), url:base, nota:"" });
  save(); render(); pintarTiendas();
}
function borrarTienda(id){
  const t = state.tiendas.find(x=>x.id===id);
  if(!t || !confirm(`¿Dejar de espiar ${t.nombre}?`)) return;
  state.tiendas = state.tiendas.filter(x=>x.id!==id);
  save(); render(); pintarTiendas();
}
function sumarDesdeTienda(p){
  openModal(null);
  state.editing.nombre = p.t;
  state.editing.img    = p.img || "";
  state.editing.notas  = `Visto en una tienda a ${pesos(p.precio)} (precio de venta al público, en pesos).`;
  renderModal();
}

/* ================= COTIZACIONES (vista) ================= */
function vCotizaciones(){
  const q=(state.qCot||"").toLowerCase();
  const lista = cotiz.filter(c=>
    (!state.fEstadoCot || c.estado===state.fEstadoCot) &&
    (!q || (c.proveedor+" "+c.producto+" "+c.rubro+" "+c.nota).toLowerCase().includes(q)));
  const n = e => cotiz.filter(c=>c.estado===e).length;
  const conPrecio = cotiz.filter(c=>Number(c.precio)>0);

  return `
  <div class="section-h"><h2>Cotizaciones</h2>
    <span class="hint">acá el costo deja de ser una estimación mía y pasa a ser el número que te pasó un proveedor</span></div>

  <div class="numeros">
    <div><b>${cotiz.length}</b><span>pedidas</span></div>
    <div><b style="color:var(--warn)">${n("pedida")}</b><span>esperando</span></div>
    <div><b style="color:var(--acc)">${n("respondida")}</b><span>respondidas</span></div>
    <div><b>${conPrecio.length}</b><span>con precio</span></div>
    <div><b style="color:var(--tx3)">${n("descartada")}</b><span>descartadas</span></div>
  </div>

  <div class="toolbar">
    <input class="input" id="qCot" placeholder="Buscar proveedor o producto…" value="${esc(state.qCot||"")}">
    <select class="input" id="fEstadoCot">
      <option value="">Todos los estados</option>
      ${ESTADOS_COT.map(e=>`<option value="${e}" ${e===state.fEstadoCot?"selected":""}>${e}</option>`).join("")}
    </select>
    <button class="btn primary" id="btnNuevaCot">+ Pedir cotización</button>
  </div>

  ${lista.length ? `
  <div class="tablewrap"><table>
    <thead><tr>
      <th>Proveedor</th><th>Producto</th><th class="num">Precio US$</th><th class="num">Mínimo</th>
      <th>Plazo</th><th>Factura</th><th>Estado</th><th>Días</th><th></th>
    </tr></thead>
    <tbody>${lista.map(c=>{
      const d = diasCot(c.fecha);
      const tarde = c.estado==="pedida" && d>=4;
      return `<tr>
        <td><div class="pname">${esc(c.proveedor||"—")}</div>
            <div class="psub">${esc(c.rubro||"")}${c.contacto?` · ${esc(c.contacto)}`:""}</div></td>
        <td style="color:var(--tx2)">${esc(c.producto||"—")}</td>
        <td class="num"><input class="input mini" type="number" step="0.01" value="${esc(c.precio)}"
              onchange="campoCotiz('${c.id}','precio',this.value);render()"></td>
        <td class="num"><input class="input mini" value="${esc(c.minimo)}" placeholder="50 u."
              onchange="campoCotiz('${c.id}','minimo',this.value)"></td>
        <td><input class="input mini" value="${esc(c.plazo)}" placeholder="15 días"
              onchange="campoCotiz('${c.id}','plazo',this.value)"></td>
        <td><select class="input mini" onchange="campoCotiz('${c.id}','factura',this.value)">
              ${["","A","B","no factura"].map(f=>`<option ${f===c.factura?"selected":""}>${f}</option>`).join("")}
            </select></td>
        <td><select class="input mini" onchange="campoCotiz('${c.id}','estado',this.value);render()">
              ${ESTADOS_COT.map(e=>`<option ${e===c.estado?"selected":""}>${e}</option>`).join("")}
            </select></td>
        <td class="num" style="color:${tarde?"var(--warn)":"var(--tx3)"}">${d}${tarde?" ⏰":""}</td>
        <td><button class="accbtn del" onclick="borrarCotiz('${c.id}')">${ICO.tacho}</button></td>
      </tr>`;}).join("")}</tbody>
  </table></div>
  <p class="hintline" style="margin-top:10px">Al cargar el precio pasa sola a «respondida». A los 4 días sin respuesta te avisa con ⏰ — ahí conviene insistir.</p>
  ` : `<div class="empty"><div class="big">◍</div>
      Ninguna cotización todavía.<br>
      <span class="hintline">Pedí una desde acá, o desde el botón de WhatsApp de cualquier proveedor.</span></div>`}`;
}

function formCotiz(pre){
  const p = pre || {};
  const proveedor = p.proveedor || prompt("¿A qué proveedor le pedís?");
  if(!proveedor) return;
  const producto = p.producto || prompt("¿Por qué producto?") || "";
  nuevaCotiz({ proveedor, producto, rubro:p.rubro||"", contacto:p.contacto||"" });
  state.view="cotizaciones"; render();
  toast("Cotización anotada");
}

/* ================= FAVORITOS (vista) ================= */
function vFavoritos(){
  const prods = state.productos.filter(p=>esFav("productos",p.id));
  const rubs  = RUBROS_META.filter(r=>esFav("rubros",r.n));
  const provs = DIRECTORIO.filter(p=>esFav("proveedores",p.n));
  if(!prods.length && !rubs.length && !provs.length)
    return `<div class="empty"><div class="big">★</div>
      Todavía no marcaste favoritos.<br>
      <span class="hintline">Tocá la estrella en cualquier producto, rubro o proveedor.</span></div>`;
  return `
  <div class="section-h"><h2>Favoritos</h2><span class="hint">lo que marcaste para tener a mano</span></div>
  ${rubs.length?`<div class="bloque"><div class="bloque-h"><h3>◈ Rubros</h3></div>
    <div class="cardgrid">${rubs.map(r=>`
      <div class="minicard" onclick="irARubro('${esc(r.n).replace(/'/g,"\\'")}')" style="cursor:pointer">
        <h3>${IC_MACRO[r.cat]||""} ${esc(r.n)} ${btnFav("rubros",r.n)}</h3>
        <div class="meta">margen <b style="color:${colorMargen(r.margen)}">${r.margen}%</b> · oportunidad ${oportunidad(r.n)}</div>
        <p>${esc(r.nota)}</p>
      </div>`).join("")}</div></div>`:""}
  ${prods.length?`<div class="bloque"><div class="bloque-h"><h3>◧ Productos</h3></div>
    <div class="cardgrid">${prods.map(p=>`
      <div class="minicard" onclick="abrirProducto('${p.id}')" style="cursor:pointer">
        <h3>${esc(p.nombre)} ${btnFav("productos",p.id)}</h3>
        <div class="meta">${esc(p.rubro)} · score ${score(p)}</div>
      </div>`).join("")}</div></div>`:""}
  ${provs.length?`<div class="bloque"><div class="bloque-h"><h3>◑ Proveedores</h3></div>
    <div class="cardgrid">${provs.map(p=>`
      <div class="minicard">
        <h3><span class="bandera bandera-lg">🇦🇷</span>${esc(p.n)} ${btnFav("proveedores",p.n)}</h3>
        <div class="meta">${esc(p.tipo)} · ${esc(p.zona)}</div>
        <p>${esc(p.nota)}</p>
        <p style="margin-top:9px"><a href="${esc(p.url)}" target="_blank" rel="noopener">Abrir ↗</a></p>
      </div>`).join("")}</div></div>`:""}`;
}

/* ================= BÚSQUEDA GLOBAL ================= */
function buscarTodo(q){
  const s=q.toLowerCase().trim();
  if(s.length<2) return null;
  const cabe = (...xs)=>xs.join(" ").toLowerCase().includes(s);
  return {
    productos: state.productos.filter(p=>cabe(p.nombre,p.rubro,p.proveedor,p.notas||"")).slice(0,6),
    rubros: RUBROS_META.filter(r=>r.n!=="Otro" && cabe(r.n,r.cat,r.nota)).slice(0,6),
    proveedores: DIRECTORIO.filter(p=>cabe(p.n,p.nota,p.tipo,p.zona,p.rubros.join(" "))).slice(0,6),
    mios: misProv.filter(p=>cabe(p.n,p.rubro||"")).slice(0,4),
    tiendas: state.tiendas.filter(t=>cabe(t.nombre,t.url)).slice(0,3)
  };
}

function pintarBusqueda(){
  const caja=$("#resGlobal"); if(!caja) return;
  const q=state.qGlobal||"";
  const btn=$("#limpiarQ"); if(btn) btn.hidden = !q;
  if(q.trim().length<2){ caja.hidden=true; caja.innerHTML=""; return; }
  const r=buscarTodo(q);
  const total=Object.values(r).reduce((s,a)=>s+a.length,0);
  if(!total){
    caja.hidden=false;
    caja.innerHTML=`<p class="hintline">Nada con “${esc(q)}”.</p>`;
    return;
  }
  const grupo=(tit,items,fn)=> items.length ? `
    <div class="rg-grupo"><div class="rg-tit">${tit} · ${items.length}</div>${items.map(fn).join("")}</div>` : "";
  caja.hidden=false;
  caja.innerHTML =
    grupo("Productos", r.productos, p=>`
      <div class="rg-item" onclick="cerrarBusqueda();abrirProducto('${p.id}')">
        ${fotoHTML(p)}<div class="rg-txt"><b>${esc(p.nombre)}</b><span>${esc(p.rubro)}</span></div>
        <span class="rg-tag">score ${score(p)}</span></div>`) +
    grupo("Rubros", r.rubros, x=>`
      <div class="rg-item" onclick="cerrarBusqueda();irARubro('${esc(x.n).replace(/'/g,"\\'")}')">
        <span class="rubro-ic" style="--tono:${tono(x.cat)};width:34px;height:34px;font-size:16px">${IC_MACRO[x.cat]||"📦"}</span>
        <div class="rg-txt"><b>${esc(x.n)}</b><span>${esc(x.cat)}</span></div>
        <span class="rg-tag" style="color:${colorMargen(x.margen)}">${x.margen}% margen</span></div>`) +
    grupo("Proveedores", r.proveedores, p=>`
      <div class="rg-item" onclick="cerrarBusqueda();window.open('${esc(p.url)}','_blank')">
        <span class="rubro-ic" style="--tono:150;width:34px;height:34px;font-size:15px">🏢</span>
        <div class="rg-txt"><b>${esc(p.n)}</b><span>${esc(p.tipo)} · ${esc(p.zona)}</span></div>
        <span class="rg-tag">${esc(p.rubros[0]||"")}</span></div>`) +
    grupo("Tuyos", r.mios, p=>`
      <div class="rg-item" onclick="cerrarBusqueda();state.view='proveedores';render()">
        <span class="rubro-ic" style="--tono:45;width:34px;height:34px;font-size:15px">⭐</span>
        <div class="rg-txt"><b>${esc(p.n)}</b><span>${esc(p.rubro||"")}</span></div>
        <span class="rg-tag">${p.rating}★</span></div>`) +
    grupo("Tiendas", r.tiendas, t=>`
      <div class="rg-item" onclick="cerrarBusqueda();state.view='tiendas';render();pintarTiendas()">
        <span class="rubro-ic" style="--tono:200;width:34px;height:34px;font-size:15px">◎</span>
        <div class="rg-txt"><b>${esc(t.nombre)}</b><span>${esc(t.url)}</span></div></div>`);
}
function cerrarBusqueda(){
  state.qGlobal="";
  const i=$("#qGlobal"); if(i) i.value="";
  pintarBusqueda();
}

/* ================= FICHA DE PRODUCTO ================= */
/* El modal sirve para cargar datos, no para leerlos: queda chico y tapa todo.
   Al tocar un producto se abre su ficha completa, con la foto grande, el
   desglose del score, sus proveedores y el mercado. */

function abrirProducto(id){ state.prodAbierto = id; state.view = "producto"; render(); window.scrollTo(0,0); }

function vProducto(){
  const p = state.productos.find(x=>x.id===state.prodAbierto);
  if(!p) return `<div class="empty"><div class="big">◻</div>Ese producto ya no está.</div>`;
  const m = metaRubro(p.rubro);
  const s = score(p), mg = margen(p);
  const cots = cotiz.filter(c=>(c.producto||"").toLowerCase()===p.nombre.toLowerCase());

  return `
  <button class="btn ghost mini" onclick="state.view='productos';render()">← Productos</button>

  <div class="ficha">
    <div class="ficha-foto foto-slot" data-foto="${esc(p.nombre)}" data-foto-rubro="${esc(p.rubro)}">
      ${p.img?`<img src="${esc(p.img)}" alt="">`:IC_MACRO[m.cat]||"📦"}
    </div>

    <div class="ficha-cuerpo">
      <div class="ficha-cab">
        <div>
          <h2>${esc(p.nombre)}</h2>
          <div class="ficha-meta">
            <span class="tag">${IC_MACRO[m.cat]||""} ${esc(p.rubro)}</span>
            <span class="pill ${esc(p.veredicto||"evaluar")}">${esc(p.veredicto||"evaluar")}</span>
            ${btnFav("productos",p.id)}
          </div>
        </div>
        <div class="ficha-score">
          <b style="color:${scoreColor(s)}">${s}</b>
          <span>score</span>
          ${estrellasHTML(Math.max(1,Math.round(s/20)))}
        </div>
      </div>

      <div class="ficha-nums">
        <div><b>${money(p.fob)}</b><span>costo</span></div>
        <div><b>${money(costoPuesto(p))}</b><span>puesto acá${p.aplicaMult?` ×${multDe(p)}`:""}</span></div>
        <div><b>${money(p.venta)}</b><span>venta</span></div>
        <div><b style="color:${mg==null?"var(--tx3)":mg>=65?"var(--acc)":mg>=45?"var(--warn)":"var(--bad)"}">${mg==null?"—":mg+"%"}</b><span>margen</span></div>
        ${p.moq?`<div><b>${esc(p.moq)}</b><span>mínimo</span></div>`:""}
      </div>

      <div class="ficha-acc">
        <button class="btn primary" onclick="openModal('${p.id}')">Editar datos</button>
        ${p.url?`<a class="btn ghost" href="${esc(p.url)}" target="_blank" rel="noopener">Ver el producto ↗</a>`:""}
        ${p.provUrl?`<a class="btn ghost" href="${esc(p.provUrl)}" target="_blank" rel="noopener">Proveedor ↗</a>`:""}
        ${p.whatsapp?`<a class="btn ghost" href="https://wa.me/${waNumero(p.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>`:""}
        <button class="btn ghost" onclick="llevarANicho('${p.id}')">◈ Llevar a un nicho</button>
        <button class="btn ghost" onclick='formCotiz(${JSON.stringify({proveedor:p.proveedor||"", producto:p.nombre, rubro:p.rubro}).replace(/'/g,"&#39;")})'>Pedir cotización</button>
      </div>
    </div>
  </div>

  <div class="grid2" style="margin-top:18px">
    <div class="card">
      <div class="section-h"><h2>De dónde sale el ${s}</h2><span class="hint">criterio por criterio</span></div>
      ${CRITERIOS.map(c=>{
        const v = Number((p.crit||{})[c.k])||0;
        return `<div class="bar-row" style="grid-template-columns:150px 1fr 54px">
          <div class="nm">${esc(c.n)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(v/5)*100}%;background:${scoreColor(v*20)}"></div></div>
          <div class="bar-val">${v}/5 <span style="opacity:.5">·${c.w}</span></div>
        </div>`;}).join("")}
      <p class="hintline" style="margin-top:10px">El número chico es cuánto pesa ese criterio en el total.</p>
    </div>

    <div class="card">
      <div class="section-h"><h2>El rubro</h2>
        <span class="hint">${esc(m.cat)} · ${esc(m.tend)}</span></div>
      ${medidor(m.margen, colorMargen(m.margen), "Margen bruto típico")}
      ${medidor(m.explotado, scoreColor(100-m.explotado), "Explotado")}
      ${medidor(m.proyeccion, scoreColor(m.proyeccion), "Proyección")}
      <p class="rubro-nota" style="margin-top:10px">${esc(m.nota)}</p>
      <button class="btn ghost mini" style="margin-top:10px" onclick="irARubro('${esc(p.rubro).replace(/'/g,"\\'")}')">Ver proveedores del rubro →</button>
    </div>
  </div>

  ${p.notas?`<div class="card" style="margin-top:14px">
    <div class="section-h"><h2>Tus notas</h2></div>
    <p style="font-size:13.5px;color:var(--tx2);white-space:pre-wrap;margin:0">${esc(p.notas)}</p>
  </div>`:""}

  ${(p.competidores||[]).length?`<div class="card" style="margin-top:14px">
    <div class="section-h"><h2>Competidores anotados</h2></div>
    ${p.competidores.map(c=>`<div class="prov-row">
      <div class="prov-id"><b>${esc(c.n||"—")}</b>
        <span class="prov-meta">${c.p?`precio ${esc(c.p)}`:""}${c.v?` · ${esc(c.v)}`:""}</span></div>
    </div>`).join("")}
  </div>`:""}

  ${cots.length?`<div class="card" style="margin-top:14px">
    <div class="section-h"><h2>Cotizaciones pedidas</h2></div>
    ${cots.map(c=>`<div class="prov-row">
      <div class="prov-id"><b>${esc(c.proveedor)}</b>
        <span class="prov-meta">${esc(c.estado)}${c.precio?` · US$ ${esc(c.precio)}`:""}${c.minimo?` · mín ${esc(c.minimo)}`:""}</span></div>
    </div>`).join("")}
  </div>`:""}

  <div class="card" style="margin-top:14px">
    <div class="section-h"><h2>El mercado hoy</h2></div>
    <div id="mkFicha">${hayCatalogo()?`<p class="hintline">Consultando…</p>`:`<p class="hintline">Conectá el proxy de catálogos para ver precios reales.</p>`}</div>
  </div>`;
}

/* ================= MIS NICHOS ================= */
/* Un nicho propio cruza rubros: lo que lo define es el concepto, no la
   categoría. Por eso guarda sus propias búsquedas, que son las que después
   alimentan las recomendaciones. */

function nichoPorId(id){ return misNichos.find(n=>n.id===id); }

function vMisNichos(){
  const abierto = state.nichoAbierto ? nichoPorId(state.nichoAbierto) : null;
  if(abierto) return detalleNicho(abierto);

  return `
  <div class="section-h"><h2>Mis nichos</h2>
    <span class="hint">tus conceptos, no categorías: lo que une los productos es la idea</span></div>

  <div class="toolbar">
    <button class="btn primary" id="btnNuevoNicho">+ Crear un nicho</button>
  </div>

  ${misNichos.length ? `<div class="cardgrid">${misNichos.map(n=>{
    const prods = n.productos||[];
    const conPrecio = prods.filter(p=>p.precio);
    const prom = conPrecio.length ? Math.round(conPrecio.reduce((s,p)=>s+p.precio,0)/conPrecio.length) : 0;
    return `<div class="nicho-card" onclick="abrirMiNicho('${n.id}')">
      <div class="nicho-cab">
        <span class="nicho-emoji">${esc(n.emoji||"◈")}</span>
        <div>
          <h3>${esc(n.nombre)}</h3>
          <div class="meta">${(n.rubros||[]).join(" · ")||"sin rubros"}</div>
        </div>
      </div>
      <p class="nicho-concepto">${esc(n.concepto||"")}</p>
      <div class="nicho-tiras">
        ${prods.slice(0,4).map(p=>`<span class="nicho-mini">${p.img?`<img src="${esc(p.img)}" alt="" loading="lazy">`:"◻"}</span>`).join("")}
        ${prods.length>4?`<span class="nicho-mini mas">+${prods.length-4}</span>`:""}
        ${!prods.length?`<span class="hintline">Todavía sin productos</span>`:""}
      </div>
      <div class="nicho-pie">
        <span>${prods.length} producto${prods.length===1?"":"s"}</span>
        ${prom?`<span>ticket promedio <b>${pesos(prom)}</b></span>`:""}
      </div>
    </div>`;}).join("")}</div>`
  : `<div class="empty"><div class="big">◈</div>
      Todavía no armaste ninguno.<br>
      <span class="hintline">Un nicho propio es un concepto: «Hogar con mensajes», «Perro en el auto». Lo que lo define no es el rubro sino la idea.</span></div>`}`;
}

function detalleNicho(n){
  const prods = n.productos||[];
  const conPrecio = prods.filter(p=>p.precio);
  const prom = conPrecio.length ? Math.round(conPrecio.reduce((s,p)=>s+p.precio,0)/conPrecio.length) : 0;
  const margenes = (n.rubros||[]).map(r=>{
    const m = RUBROS_META.find(x=>x.cat===r);
    return m ? m.margen : null;
  }).filter(Boolean);
  const margenProm = margenes.length ? Math.round(margenes.reduce((a,b)=>a+b,0)/margenes.length) : null;

  return `
  <button class="btn ghost mini" onclick="abrirMiNicho(null)">← Mis nichos</button>

  <div class="nicho-hero">
    <span class="nicho-emoji grande">${esc(n.emoji||"◈")}</span>
    <div>
      <h2>${esc(n.nombre)}</h2>
      <p class="nicho-concepto">${esc(n.concepto||"")}</p>
      ${n.publico?`<p class="nicho-publico"><b>Le vendés a:</b> ${esc(n.publico)}</p>`:""}
    </div>
    <div class="nicho-nums">
      <div><b>${prods.length}</b><span>productos</span></div>
      ${prom?`<div><b>${pesos(prom)}</b><span>ticket prom.</span></div>`:""}
      ${margenProm?`<div><b style="color:${colorMargen(margenProm)}">${margenProm}%</b><span>margen típico</span></div>`:""}
    </div>
  </div>

  <div class="section-h"><h2>Buscar para este nicho</h2>
    <span class="hint">tocá una y te trae proveedores reales; el + suma el producto al nicho</span></div>
  <div class="chips" style="margin-bottom:8px">
    ${(n.busquedas||[]).map(b=>`<span class="chip" onclick="buscarParaNicho('${n.id}','${esc(b).replace(/'/g,"\\'")}')">${esc(b)}</span>`).join("")}
    <span class="chip" onclick="agregarBusqueda('${n.id}')">+ otra búsqueda</span>
    <span class="chip" onclick="traerDeMisProductos('${n.id}')">◧ traer de mis productos</span>
  </div>
  <div id="nichoOfertas"></div>

  ${prods.length?`
    <div class="section-h" style="margin-top:22px"><h2>Productos del nicho</h2>
      <span class="hint">los que fuiste guardando</span></div>
    <div class="of-grilla">${prods.map((p,i)=>`
      <div class="oferta">
        <span class="of-foto${p.img?"":" vacia"}">${p.img?`<img src="${esc(p.img)}" alt="" loading="lazy">`:""}</span>
        <span class="of-cuerpo">
          <span class="of-tit">${esc((p.titulo||"").slice(0,64))}</span>
          <span class="of-prov"><b>${esc(p.prov||"")}</b></span>
          <span class="of-precio">
            <b>${p.precio?pesos(p.precio):`<span class="of-consultar">a consultar</span>`}</b>
          </span>
          <span class="nicho-acc">
            ${p.link?`<a class="btn ghost mini" href="${esc(p.link)}" target="_blank" rel="noopener">Ver ↗</a>`:""}
            <button class="accbtn del" onclick="quitarDeNicho('${n.id}',${i})">${ICO.tacho}</button>
          </span>
        </span>
      </div>`).join("")}</div>`:""}

  <div class="rubro-pie" style="margin-top:20px">
    <button class="btn ghost mini" onclick="editarNicho('${n.id}')">Editar concepto</button>
    <button class="btn danger ghost mini" onclick="borrarNicho('${n.id}')">Eliminar nicho</button>
  </div>`;
}

/* Puente entre las dos listas: un producto del radar se lleva a un nicho, y
   desde el nicho se pueden traer los que ya tenés cargados. */
function elegirNicho(titulo){
  if(!misNichos.length){
    if(!confirm("Todavía no tenés nichos. ¿Creás uno ahora?")) return null;
    crearNicho();
    return misNichos[0] || null;
  }
  if(misNichos.length === 1) return misNichos[0];
  const lista = misNichos.map((n,i)=>`${i+1}. ${n.emoji||"◈"} ${n.nombre}`).join("\n");
  const r = prompt(`${titulo}\n\n${lista}\n\nEscribí el número:`);
  if(!r) return null;
  return misNichos[Number(r)-1] || null;
}

function llevarANicho(prodId){
  const p = state.productos.find(x=>x.id===prodId);
  if(!p) return;
  const n = elegirNicho(`¿A qué nicho llevás "${p.nombre}"?`);
  if(!n) return;
  (n.productos ||= []);
  if(n.productos.some(x=>x.titulo===p.nombre)){ toast("Ya estaba en ese nicho"); return; }
  n.productos.push({
    titulo: p.nombre, precio: Number(p.venta)||0, img: p.img||"",
    link: p.url||p.provUrl||"", prov: p.proveedor||"", deProducto: p.id
  });
  save(); render(); toast(`Sumado a ${n.nombre}`);
}

function traerDeMisProductos(nichoId){
  const n = nichoPorId(nichoId); if(!n) return;
  const libres = state.productos.filter(p=>!(n.productos||[]).some(x=>x.titulo===p.nombre));
  if(!libres.length){ toast("No te quedan productos para sumar"); return; }
  const lista = libres.map((p,i)=>`${i+1}. ${p.nombre}`).join("\n");
  const r = prompt(`¿Cuál sumás a "${n.nombre}"?\n\n${lista}\n\nEscribí el número:`);
  if(!r) return;
  const p = libres[Number(r)-1];
  if(!p) return;
  (n.productos ||= []).push({
    titulo: p.nombre, precio: Number(p.venta)||0, img: p.img||"",
    link: p.url||p.provUrl||"", prov: p.proveedor||"", deProducto: p.id
  });
  save(); render(); toast(`Sumado a ${n.nombre}`);
}

function abrirMiNicho(id){ state.nichoAbierto = id; render(); }

function crearNicho(){
  const nombre = prompt("Nombre del nicho:\n\nEjemplos: «Hogar con mensajes», «Perro en el auto», «Mate de regalo»");
  if(!nombre || !nombre.trim()) return;
  const concepto = prompt("¿Cuál es el concepto? ¿Qué une a estos productos?") || "";
  const emoji = prompt("Un emoji que lo represente:") || "◈";
  misNichos.unshift({ id:uid(), nombre:nombre.trim(), emoji:emoji.trim().slice(0,2),
                      concepto, publico:"", rubros:[], busquedas:[], productos:[] });
  save(); render(); toast("Nicho creado");
}
function editarNicho(id){
  const n = nichoPorId(id); if(!n) return;
  const nombre = prompt("Nombre:", n.nombre); if(nombre===null) return;
  n.nombre = nombre.trim() || n.nombre;
  n.concepto = prompt("Concepto:", n.concepto||"") ?? n.concepto;
  n.publico  = prompt("¿A quién le vendés?", n.publico||"") ?? n.publico;
  save(); render();
}
function borrarNicho(id){
  const n = nichoPorId(id); if(!n) return;
  if(!confirm(`¿Eliminar el nicho "${n.nombre}"? Se pierden sus ${(n.productos||[]).length} productos guardados.`)) return;
  misNichos = misNichos.filter(x=>x.id!==id);
  state.nichoAbierto = null; save(); render(); toast("Nicho eliminado");
}
function agregarBusqueda(id){
  const n = nichoPorId(id); if(!n) return;
  const q = prompt("¿Qué producto buscás para este nicho?");
  if(!q || !q.trim()) return;
  (n.busquedas ||= []).push(q.trim());
  save(); render();
  buscarParaNicho(id, q.trim());
}

async function buscarParaNicho(id, q){
  const caja = $("#nichoOfertas"); if(!caja) return;
  caja.innerHTML = `<div class="of-cargando">
    <span class="of-spin"></span>
    <div><b>Buscando “${esc(q)}”</b>
    <span>en ${sitiosDeBusqueda().length} proveedores · puede tardar unos segundos</span></div>
  </div>`;
  const r = await buscarOfertas(q);
  const sigue = $("#nichoOfertas"); if(!sigue) return;
  const items = r ? r.proveedores : [];
  if(!items.length){
    sigue.innerHTML = `<div class="of-vacio"><b>Sin resultados para “${esc(q)}”.</b>
      <p class="hintline">Probá con una palabra más general.</p></div>`;
    return;
  }
  sigue.innerHTML = `
    <div class="of-grupo">
      <div class="of-tit-grupo">🔎 “${esc(q)}” <span>${items.length} opciones · el + lo guarda en el nicho</span></div>
      <div class="of-grilla">${items.map((p,i)=>`
        <div class="oferta">
          <a class="of-foto${p.img?"":" vacia"}" href="${esc(p.link)}" target="_blank" rel="noopener">
            ${p.img?`<img src="${esc(p.img)}" alt="" loading="lazy">`:""}
          </a>
          <span class="of-cuerpo">
            <span class="of-tit">${esc((p.titulo||"").slice(0,64))}</span>
            <span class="of-prov"><b>${esc(p.prov)}</b>${p.nuevo?`<span class="of-nuevo">de la red</span>`:""}</span>
            <span class="of-precio">
              <b>${p.precio?pesos(p.precio):`<span class="of-consultar">a consultar</span>`}</b>
            </span>
            <span class="nicho-acc">
              <a class="btn ghost mini" href="${esc(p.link)}" target="_blank" rel="noopener">Ver ↗</a>
              <button class="accbtn" title="Sumarlo al nicho"
                onclick='sumarANicho("${id}", ${JSON.stringify({titulo:p.titulo,precio:p.precio,img:p.img,link:p.link,prov:p.prov}).replace(/'/g,"&#39;")})'>+</button>
            </span>
          </span>
        </div>`).join("")}</div>
    </div>`;
}

function sumarANicho(id, p){
  const n = nichoPorId(id); if(!n) return;
  (n.productos ||= []);
  if(n.productos.some(x=>x.link===p.link)){ toast("Ya estaba en el nicho"); return; }
  n.productos.push(p);
  save(); toast(`Sumado a ${n.nombre}`);
  const cont = $("#nichoOfertas") ? $("#nichoOfertas").innerHTML : null;
  render();
  if(cont && $("#nichoOfertas")) $("#nichoOfertas").innerHTML = cont;
}
function quitarDeNicho(id, i){
  const n = nichoPorId(id); if(!n) return;
  n.productos.splice(i,1); save(); render();
}

/* ================= RENDER ================= */
function render(){
  instalarHandlersEstrellas();
  $$(".snav[data-view]").forEach(t=>t.classList.toggle("active", t.dataset.view===state.view));
  ["btnNuevo"].forEach(id=>{ const b=$("#"+id); if(b) b.hidden = soloLectura; });
  const cf=$("#cuentaFav"); if(cf) cf.textContent = totalFav() || "";
  const co=$("#conmutaOrigen");
  if(co) co.innerHTML = `
    <button class="${esArg()?"on":""}" onclick="ponerOrigen('arg')" title="Proveedores argentinos: sin aduana y con factura">🇦🇷 Argentina</button>
    <button class="${esArg()?"":"on"}" onclick="ponerOrigen('china')" title="Importar directo: más margen, pero capital y 90 días">🇨🇳 China</button>`;
  const vp=$("#verPie");    if(vp) vp.textContent = APP_VER;
  const v = state.view;
  /* Si una vista falla, se muestra el error en su lugar: una excepción no puede
     dejar la app entera en blanco. */
  try{
  $("#app").innerHTML =
      v==="dashboard"   ? vDashboard()
    : v==="productos"   ? vProductos()
    : v==="rubros"      ? vRubros()
    : v==="cotizaciones"? vCotizaciones()
    : v==="producto"    ? vProducto()
    : v==="misnichos"   ? vMisNichos()
    : v==="favoritos"   ? vFavoritos()
    : v==="tiendas"     ? vTiendas()
    : v==="proveedores" ? vProveedores()
    :                     vNichos();
  }catch(err){
    console.error("Falló la vista", v, err);
    $("#app").innerHTML = `
      <div class="empty">
        <div class="big">⚠️</div>
        <b>Se rompió la vista “${esc(v)}”.</b>
        <p class="hintline" style="margin-top:8px">${esc(String(err && err.message || err))}</p>
        <p style="margin-top:14px">
          <button class="btn ghost" onclick="state.view='dashboard';render()">Ir al inicio</button>
          <button class="btn ghost" onclick="location.reload()">Recargar</button>
        </p>
      </div>`;
    return;
  }

  if(v==="tiendas"){
    pintarTiendas();
    const inp=$("#nuevaTienda");
    $("#btnAddTienda").onclick = ()=>{ agregarTienda(inp.value); inp.value=""; };
    inp.onkeydown = e=>{ if(e.key==="Enter"){ agregarTienda(inp.value); inp.value=""; } };
    $("#btnRefrescarT").onclick = ()=>{ tiendaCache.clear(); render(); pintarTiendas(); toast("Actualizando…"); };
  }
  if(v==="dashboard"){
    const qh=$("#qHero");
    if(qh){
      let debounce;
      const lanzar=(yaMismo)=>{
        state.qGlobal = qh.value;
        const g=$("#qGlobal"); if(g) g.value = qh.value;
        pintarBusqueda();
        clearTimeout(debounce);
        const q = qh.value.trim();
        if(q.length < 2){ const c=$("#ofertas"); if(c){ c.hidden=true; c.innerHTML=""; } return; }
        /* la búsqueda pega contra catálogos externos: no en cada tecla */
        debounce = setTimeout(()=>{
          pintarOfertas(q);
          $("#ofertas").scrollIntoView({behavior:"smooth",block:"start"});
        }, yaMismo ? 0 : 550);
      };
      qh.oninput = ()=>lanzar(false);
      qh.onkeydown = e=>{ if(e.key==="Enter") lanzar(true); };
      const b=$("#btnHeroBuscar"); if(b) b.onclick = ()=>lanzar(true);
    }
    arrancarRota();
    completarFotos();
  }
  if(v==="producto"){
    completarFotos();
    const p = state.productos.find(x=>x.id===state.prodAbierto);
    if(p && hayMercado()) pintarMercado("#mkFicha", p.nombre);
  }
  if(v==="misnichos"){
    const b=$("#btnNuevoNicho"); if(b) b.onclick = crearNicho;
  }
  if(v==="cotizaciones"){
    const q=$("#qCot");
    if(q) q.oninput=e=>{ state.qCot=e.target.value; render(); const n=$("#qCot"); n.focus(); n.setSelectionRange(n.value.length,n.value.length); };
    const fe=$("#fEstadoCot"); if(fe) fe.onchange=e=>{ state.fEstadoCot=e.target.value; render(); };
    const nb=$("#btnNuevaCot"); if(nb) nb.onclick=()=>formCotiz();
  }
  if(v==="proveedores"){
    const q=$("#qDir");
    if(q) q.oninput=e=>{ state.qDir=e.target.value; render(); const n=$("#qDir"); n.focus(); n.setSelectionRange(n.value.length,n.value.length); };
    const fc=$("#fDirCat"); if(fc) fc.onchange=e=>{ state.fDirCat=e.target.value; render(); };
  }
  if(v==="rubros"){
    const q=$("#qRubro");
    if(q){ q.oninput=e=>{ state.qRubro=e.target.value; render(); const n=$("#qRubro"); n.focus(); n.setSelectionRange(n.value.length,n.value.length); }; }
    const fm=$("#fMacro"); if(fm) fm.onchange=e=>{ state.fMacro=e.target.value; render(); };
    const fg=$("#fMargen"); if(fg) fg.onchange=e=>{ state.fMargen=Number(e.target.value)||0; render(); };
  }
  if(v==="nichos"){
    const fn=$("#fMacroNicho"); if(fn) fn.onchange=e=>{ state.fMacroNicho=e.target.value; render(); };
  }
  if(v==="productos"){
    const q=$("#q");
    q.oninput = e=>{ state.q=e.target.value; render(); q.focus(); q.setSelectionRange(q.value.length,q.value.length); };
    $("#fRubro").onchange     = e=>{ state.fRubro=e.target.value; render(); };
    $("#fVeredicto").onchange = e=>{ state.fVeredicto=e.target.value; render(); };
    $("#fPais").onchange      = e=>{ state.fPais=e.target.value; render(); };
    $("#multDefault").onchange = e=>{
      const v = Number(e.target.value);
      if(!v || v < 1){ toast("El multiplicador tiene que ser 1 o más"); e.target.value = settings.mult; return; }
      settings.mult = v; save(); render();
      toast(`Multiplicador por defecto ×${v}`);
    };
  }
}
function setSort(k){
  state.sort = state.sort.k===k ? {k,dir:-state.sort.dir} : {k,dir:k==="score"||k==="margen"||k==="venta"?-1:1};
  render();
}

/* ================= MODAL ================= */
function openModal(id){
  const p = id ? state.productos.find(x=>x.id===id) : null;
  state.editing = p ? {...p, crit:{...p.crit}, tags:[...(p.tags||[])], competidores:(p.competidores||[]).map(c=>({...c}))}
                    : { id:null, nombre:"", rubro:"Mascotas", tags:[], proveedor:"", provUrl:"", url:"", whatsapp:"", paisProv:"Argentina", img:"",
                        tipoProv:"Mayorista local", origen:"Argentina (importador)",
                        fob:"", venta:"", moq:"", competidores:[], veredicto:"evaluar", notas:"",
                        aplicaMult:true, mult:settings.mult,
                        crit:Object.fromEntries(CRITERIOS.map(c=>[c.k,3])) };
  $("#modalTitle").textContent = p ? "Editar producto" : "Nuevo producto";
  $("#btnDelete").hidden = !p;
  renderModal();
  $("#modalBack").hidden = false;
}
function closeModal(){ $("#modalBack").hidden = true; state.editing=null; }

/* Propone el mejor proveedor del rubro entre los que guardaste:
   primero calificación, y a igual nota, el más barato. */
function mejorProvHTML(e){
  const m = mejorProveedor(e.rubro);
  if(m){
    const ya = (e.proveedor||"").toLowerCase()===m.n.toLowerCase();
    return `<div class="mejorprov">
      <div>
        <b>${esc(m.n)}</b> <span class="estrellas">${estrellasHTML(m.rating)}</span>
        <div class="hintline">${bandera(m.pais)} ${esc(m.pais)}${m.precio?` · US$ ${esc(m.precio)}`:""}${m.resenas?` · ${esc(m.resenas)}`:""}</div>
      </div>
      ${ya ? `<span class="hintline">Ya es el de este producto</span>`
           : `<button class="btn ghost mini" id="usarMejor">Usar este</button>`}
    </div>`;
  }
  const p = fuente(e.rubro, esArg() ? "nacional" : "importar");
  return `<div class="mejorprov vacio">
    <div><span class="hintline">Todavía no guardaste proveedores de este rubro, así que no puedo elegir el mejor.</span>
      <div style="margin-top:5px"><a href="${esc(p.url)}" target="_blank" rel="noopener">Buscar “${esc(p.term)}” en ${esc(p.n)} ↗</a></div></div>
    <button class="btn ghost mini" onclick="irARubro('${esc(e.rubro||"Otro").replace(/'/g,"\\'")}')">Ver el rubro</button>
  </div>`;
}

function scoreBoxHTML(e){
  const s = score(e), m = margen(e);
  return `<div><div class="big" style="color:${scoreColor(s)}">${s}</div><div class="lbl">Score</div></div>
    <div><div class="big" style="font-size:24px;color:${m==null?"var(--tx3)":m>=65?"var(--acc)":m>=45?"var(--warn)":"var(--bad)"}">${m==null?"—":m+"%"}</div><div class="lbl">Margen</div></div>
    <div><div class="big" style="font-size:24px;color:var(--tx2)">${money(costoPuesto(e))}</div><div class="lbl">Costo puesto</div></div>
    <div style="flex:1;text-align:right">
      <div class="lbl" style="margin-bottom:5px">Sugerido</div>
      <span class="pill ${veredictoSugerido(s)}">${veredictoSugerido(s)}</span>
    </div>`;
}

/* actualiza score/margen/labels en el lugar, sin re-renderizar el modal
   (si re-renderizamos se pierde el foco al tipear y se corta el drag del slider) */
function refreshScore(){
  const e = state.editing; if(!e) return;
  const box = $("#scoreBox"); if(box) box.innerHTML = scoreBoxHTML(e);
  CRITERIOS.forEach(c=>{
    const v = $(`[data-v="${c.k}"]`);
    if(v){ const n = Number(e.crit[c.k])||3; v.textContent = n; v.style.color = scoreColor(n*20); }
  });
  const sug = $("#useSug"); if(sug) sug.textContent = `Usar sugerido (${veredictoSugerido(score(e))})`;
  const fh = $("#fobHint");
  if(fh) fh.textContent = e.aplicaMult ? "costo de origen (FOB)" : "costo ya puesto acá";
  const mh = $("#multHint");
  if(mh) mh.textContent = e.aplicaMult
    ? `flete + derechos + IVA + despacho — costo puesto ${money(costoPuesto(e))}`
    : "apagado: el costo que cargaste ya es el puesto acá";
}

function renderModal(){
  const e = state.editing;
  const opt=(arr,sel)=>arr.map(o=>`<option value="${esc(o)}" ${o===sel?"selected":""}>${esc(o)}</option>`).join("");
  const s = score(e);

  $("#modalBody").innerHTML = `
    <div class="frow one"><div class="field">
      <label>Producto</label>
      <input class="input" data-f="nombre" value="${esc(e.nombre)}" placeholder="Ej: comedero antivoracidad">
    </div></div>

    <div class="frow">
      <div class="field"><label>Rubro</label><select class="input" data-f="rubro">${opt(RUBROS,e.rubro)}</select></div>
      <div class="field"><label>Origen</label><select class="input" data-f="origen">${opt(ORIGENES,e.origen)}</select></div>
    </div>

    <div class="frow">
      <div class="field"><label>Proveedor</label><input class="input" data-f="proveedor" value="${esc(e.proveedor)}" placeholder="Nombre"></div>
      <div class="field"><label>País del proveedor</label>
        <select class="input" data-f="paisProv">${PAISES.map(x=>`<option value="${esc(x)}" ${x===paisDe(e)?"selected":""}>${bandera(x)} ${esc(x)}</option>`).join("")}</select></div>
    </div>

    <div class="frow">
      <div class="field"><label>Tipo</label><select class="input" data-f="tipoProv">${opt(TIPOS_PROV,e.tipoProv)}</select></div>
      <div class="field"><label>&nbsp;</label><div class="hintline" style="padding-top:9px">Dónde está el proveedor, que puede no ser de dónde viene la mercadería.</div></div>
    </div>

    <div class="frow one"><div class="field">
      <label>Foto</label>
      <div class="fotoedit">
        <span id="fotoPrev">${fotoHTML(e,"lg")}</span>
        <input class="input" data-f="img" value="${esc(e.img||"")}" placeholder="Pegá la URL de la imagen">
      </div>
      <div class="hintline">Botón derecho sobre la foto en el sitio del proveedor → "Copiar dirección de la imagen".</div>
    </div></div>

    <div class="frow one"><div class="field">
      <label>Link del producto</label>
      <input class="input" data-f="url" value="${esc(e.url||"")}" placeholder="https://… la ficha exacta del producto">
      <div class="hintline">La publicación puntual. Es el que abrís desde la tabla.</div>
      <div class="hintline aviso" id="autoAviso" hidden></div>
    </div></div>

    <div class="frow one"><div class="field">
      <label>El mercado hoy</label>
      <div id="mkProd">${hayMercado()
        ? `<p class="hintline">Consultando Mercado Libre…</p>`
        : `<div class="mercado vacio"><p class="hintline">Todavía no está conectada la API de Mercado Libre.
             Mientras tanto: <a href="${esc(fuente(e.rubro,"competencia").url)}" target="_blank" rel="noopener">ver la competencia a mano ↗</a>.
             Para conectarla, seguí <code>worker/README.md</code>.</p></div>`}</div>
    </div></div>

    <div class="frow one"><div class="field">
      <label>Mejor proveedor para este rubro</label>
      <div id="mejorProv">${mejorProvHTML(e)}</div>
    </div></div>

    <div class="frow one"><div class="field">
      <label>WhatsApp del proveedor</label>
      <input class="input" data-f="whatsapp" value="${esc(e.whatsapp||"")}" placeholder="11 6506-6097">
      <div class="hintline" id="waHint">${e.whatsapp
        ? (waNumero(e.whatsapp) ? `Abre wa.me/${waNumero(e.whatsapp)} con el mensaje ya escrito` : "No pude leer el número")
        : "Se asume Argentina. Para otro país, escribilo con + adelante."}</div>
    </div></div>

    <div class="frow one"><div class="field">
      <label>Link del proveedor</label>
      <input class="input" data-f="provUrl" value="${esc(e.provUrl)}" placeholder="https://… el sitio o catálogo">
    </div></div>

    <div class="frow" style="grid-template-columns:1fr 1fr 1fr">
      <div class="field"><label>Costo US$</label><input class="input" type="number" step="0.01" data-f="fob" value="${esc(e.fob)}">
        <div class="hintline" id="fobHint">${e.aplicaMult?"costo de origen (FOB)":"costo ya puesto acá"}</div></div>
      <div class="field"><label>Venta US$</label><input class="input" type="number" step="0.01" data-f="venta" value="${esc(e.venta)}"></div>
      <div class="field"><label>Mínimo</label><input class="input" type="number" data-f="moq" value="${esc(e.moq)}"></div>
    </div>

    <div class="multbox">
      <label class="sw"><input type="checkbox" id="swMult" ${e.aplicaMult?"checked":""}><span></span></label>
      <div class="txt">
        <b>Aplicar multiplicador de importación</b>
        <small id="multHint">${e.aplicaMult
          ? `flete + derechos + IVA + despacho — costo puesto ${money(costoPuesto(e))}`
          : "apagado: el costo que cargaste ya es el puesto acá"}</small>
      </div>
      <input type="number" id="multVal" step="0.05" min="1" value="${esc(e.mult ?? settings.mult)}" ${e.aplicaMult?"":"disabled"}>
    </div>

    <div class="scorebox" id="scoreBox">${scoreBoxHTML(e)}</div>

    <div class="criterios">
      <label style="display:block;font-size:11.5px;font-weight:650;color:var(--tx3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:11px">Criterios (1 = mal, 5 = excelente)</label>
      ${CRITERIOS.map(c=>`
        <div class="crit">
          <label>${esc(c.n)} <small>${esc(c.d)} · peso ${c.w}</small></label>
          <input type="range" min="1" max="5" step="1" data-c="${c.k}" value="${Number(e.crit[c.k])||3}">
          <div class="v" data-v="${c.k}" style="color:${scoreColor((Number(e.crit[c.k])||3)*20)}">${Number(e.crit[c.k])||3}</div>
        </div>`).join("")}
    </div>

    <div class="frow one"><div class="field">
      <label>Etiquetas</label>
      <div class="chips">${TAGS.map(t=>`<span class="chip ${e.tags.includes(t)?"on":""}" data-tag="${esc(t)}">${esc(t)}</span>`).join("")}</div>
    </div></div>

    <div class="frow one"><div class="field">
      <label>Competidores directos</label>
      <div id="competList">${(e.competidores||[]).map((c,i)=>`
        <div class="compet">
          <input class="input" data-comp="${i}" data-ck="n" value="${esc(c.n)}" placeholder="Vendedor / publicación">
          <input class="input sm" data-comp="${i}" data-ck="p" value="${esc(c.p)}" placeholder="Precio">
          <input class="input sm" data-comp="${i}" data-ck="v" value="${esc(c.v)}" placeholder="Ventas">
          <button class="iconbtn" data-delcomp="${i}">✕</button>
        </div>`).join("")}</div>
      <button class="btn ghost" id="addComp" style="margin-top:5px">+ Competidor</button>
    </div></div>

    <div class="frow">
      <div class="field"><label>Estado</label><select class="input" data-f="veredicto">${opt(VEREDICTOS,e.veredicto)}</select></div>
      <div class="field"><label>&nbsp;</label>
        <button class="btn ghost" id="useSug" style="width:100%">Usar sugerido (${veredictoSugerido(s)})</button></div>
    </div>

    <div class="frow one"><div class="field">
      <label>Notas</label>
      <textarea data-f="notas" placeholder="Por qué sí, por qué no, qué preguntar al proveedor…">${esc(e.notas)}</textarea>
    </div></div>`;

  /* bindings */
  $$("[data-f]",$("#modalBody")).forEach(el=>{
    el.oninput = el.onchange = ()=>{
      e[el.dataset.f] = el.value;
      if(["fob","venta"].includes(el.dataset.f)) refreshScore(); // in-place: no perder el foco
      if(el.dataset.f === "rubro"){
        const mp=$("#mejorProv"); if(mp) mp.innerHTML = mejorProvHTML(e);
      }
      if(el.dataset.f === "img"){
        const pv = $("#fotoPrev"); if(pv) pv.innerHTML = fotoHTML(e,"lg");
      }
      if(el.dataset.f === "url") autocompletar(el.value);
      if(el.dataset.f === "whatsapp"){
        const h = $("#waHint");
        if(h) h.textContent = e.whatsapp
          ? (waNumero(e.whatsapp) ? `Abre wa.me/${waNumero(e.whatsapp)} con el mensaje ya escrito` : "No pude leer el número")
          : "Se asume Argentina. Para otro país, escribilo con + adelante.";
      }
    };
  });
  $$("[data-c]",$("#modalBody")).forEach(el=>{
    el.oninput = ()=>{ e.crit[el.dataset.c]=Number(el.value); refreshScore(); };
  });
  $$("[data-tag]",$("#modalBody")).forEach(el=>{
    el.onclick = ()=>{
      const t=el.dataset.tag, i=e.tags.indexOf(t);
      i<0 ? e.tags.push(t) : e.tags.splice(i,1);
      renderModal();
    };
  });
  $$("[data-comp]",$("#modalBody")).forEach(el=>{
    el.oninput = ()=>{ e.competidores[+el.dataset.comp][el.dataset.ck] = el.value; };
  });
  $$("[data-delcomp]",$("#modalBody")).forEach(el=>{
    el.onclick = ()=>{ e.competidores.splice(+el.dataset.delcomp,1); renderModal(); };
  });
  if(hayMercado() && (e.nombre||"").trim().length>3) pintarMercado("#mkProd", e.nombre);

  const usarMejor = $("#usarMejor");
  if(usarMejor) usarMejor.onclick = ()=>{
    const m = mejorProveedor(e.rubro);
    if(!m) return;
    e.proveedor = m.n; e.provUrl = m.url||""; e.paisProv = m.pais||e.paisProv;
    ["proveedor","provUrl","paisProv"].forEach(k=>{
      const el=$(`[data-f="${k}"]`); if(el){ el.value=e[k]; el.classList.add("autollenado"); }
    });
    $("#mejorProv").innerHTML = mejorProvHTML(e);
    toast("Proveedor aplicado");
  };

  $("#swMult").onchange = ev=>{
    e.aplicaMult = ev.target.checked;
    $("#multVal").disabled = !e.aplicaMult;
    refreshScore();
  };
  $("#multVal").oninput = ev=>{ e.mult = ev.target.value; refreshScore(); };

  $("#addComp").onclick = ()=>{ (e.competidores ||= []).push({n:"",u:"",p:"",v:""}); renderModal(); };
  $("#useSug").onclick  = ()=>{
    e.veredicto = veredictoSugerido(score(e));
    const sel = $('[data-f="veredicto"]'); if(sel) sel.value = e.veredicto;
  };
}

/* ================= ACCIONES ================= */
function saveProducto(){
  const e = state.editing;
  if(!e.nombre.trim()){ toast("Poné un nombre"); return; }
  ["fob","venta","moq"].forEach(k=> e[k] = e[k]==="" ? "" : Number(e[k]));
  e.mult = Number(e.mult) || settings.mult;
  if(e.id){
    e.editado = true;                      // a partir de acá es tuyo, no se pisa
    const i = state.productos.findIndex(p=>p.id===e.id);
    state.productos[i] = e;
  }else{
    e.id = uid();
    state.productos.unshift(e);
  }
  save(); closeModal(); render(); toast("Guardado");
}
function deleteProducto(){
  const e = state.editing;
  if(!e?.id) return;
  if(!confirm(`¿Eliminar "${e.nombre}"?`)) return;
  state.productos = state.productos.filter(p=>p.id!==e.id);
  save(); closeModal(); render(); toast("Eliminado");
}
/* Un botón apagado no puede ser un callejón sin salida: abre el producto
   con el campo que falta enfocado. */
/* Rellena solo lo que está vacío: nunca pisa lo que cargaste a mano. */
function autocompletar(url){
  const e = state.editing;
  if(!e || !url || url.length < 12) return;
  const d = desdeURL(url);
  if(!d) return;
  const campos = ["proveedor","paisProv","tipoProv","origen","whatsapp","provUrl","nombre"];
  /* En un producto nuevo, los valores por defecto cuentan como vacíos: si no,
     "Mayorista local" o "Argentina" bloquean la corrección del dominio.
     En uno ya cargado sólo se completa lo que está realmente en blanco. */
  const DEF = { proveedor:"", paisProv:"Argentina", tipoProv:"Mayorista local",
                origen:"Argentina (importador)", whatsapp:"", provUrl:"", nombre:"" };
  const nuevo = !e.id;
  const libre = {};
  campos.forEach(k=>{
    const actual = (e[k]||"").toString().trim();
    libre[k] = !actual || (nuevo && actual === DEF[k]);
  });
  let tocados = [];
  campos.forEach(k=>{
    if(!d[k] || !libre[k]) return;
    e[k] = d[k]; tocados.push(k);
  });
  if(!tocados.length) return;
  /* repintar solo los inputs afectados, sin re-renderizar (perderíamos el foco) */
  tocados.forEach(k=>{
    const el = $(`[data-f="${k}"]`);
    if(!el) return;
    el.value = e[k];                       // sirve igual para input y para select
    el.classList.add("autollenado");
  });
  const aviso = $("#autoAviso");
  if(aviso){
    aviso.textContent = d.conocido
      ? `Completado desde ${d.proveedor}: ${tocados.length} campo${tocados.length===1?"":"s"}`
      : `Dominio nuevo — completé lo que pude (${tocados.length})`;
    aviso.hidden = false;
    setTimeout(()=>{ aviso.hidden = true; $$(".autollenado").forEach(x=>x.classList.remove("autollenado")); }, 3500);
  }
}

function pedirDato(id, campo){
  openModal(id);
  /* el modal recién se muestra: hasta que el navegador no recalcula el layout,
     un campo adentro no puede tomar foco. Un turno de macrotask alcanza. */
  setTimeout(()=>{
    const el = $(`[data-f="${campo}"]`);
    if(!el) return;
    el.scrollIntoView({block:"center", behavior:"smooth"});
    el.focus({preventScroll:true});
    el.classList.add("resaltado");
    setTimeout(()=>el.classList.remove("resaltado"), 2200);
  }, 40);
}

function borrarProducto(id){
  const p = state.productos.find(x=>x.id===id);
  if(!p) return;
  if(!confirm(`¿Eliminar "${p.nombre}"?`)) return;
  state.productos = state.productos.filter(x=>x.id!==id);
  save(); render(); toast("Eliminado");
}
function exportar(){
  const blob = new Blob([JSON.stringify(state.productos,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `radar-productos-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(a.href);
  toast("Exportado — pasale el archivo a tu socio");
}
function importar(file){
  const rd = new FileReader();
  rd.onload = ()=>{
    try{
      const arr = JSON.parse(rd.result);
      if(!Array.isArray(arr)) throw new Error("formato");
      const ids = new Set(state.productos.map(p=>p.id));
      let nuevos=0, act=0;
      arr.forEach(p=>{
        if(!p || !p.nombre) return;
        if(p.id && ids.has(p.id)){
          state.productos[state.productos.findIndex(x=>x.id===p.id)] = p; act++;
        }else{
          p.id ||= uid(); state.productos.push(p); nuevos++;
        }
      });
      save(); render(); toast(`${nuevos} nuevos · ${act} actualizados`);
    }catch(err){ toast("Archivo inválido"); }
  };
  rd.readAsText(file);
}
function randomIdea(){
  state.reco = CALIENTES[Math.floor(Math.random()*CALIENTES.length)];
  if(state.view!=="dashboard"){ state.view="dashboard"; render(); return; }
  const box = $("#ideaBox");
  if(box) box.innerHTML = recoHTML(state.reco);
}

/* Tarjeta completa: imagen, rubro, estrellas paralelas al score,
   proveedor sugerido y dónde mirar precio y competencia. */
function recoHTML(c){
  const est   = aEstrellas(c.score);
  const m     = metaRubro(c.rubro);
  const prov  = fuente(c.rubro, esArg() ? "nacional" : "importar");
  const compe = fuente(c.rubro, "competencia");
  const mio   = mejorProveedor(c.rubro);
  const yaEsta= state.productos.some(p=>p.nombre.toLowerCase()===c.p.toLowerCase());
  return `
  <div class="reco">
    <div class="reco-img" style="--tono:${tono(m.cat)}"><span>${IC_MACRO[m.cat]||"📦"}</span></div>
    <div class="reco-cuerpo">
      <h3>${esc(c.p)}</h3>
      <div class="reco-rubro">
        <span class="tag">${IC_MACRO[m.cat]||""} ${esc(c.rubro)}</span>
        <span class="tag">${esc(m.cat)}</span>
        <span class="tag" style="color:${COLOR_TEND[m.tend]}">${FLECHA_TEND[m.tend]} ${m.tend}</span>
      </div>
      <div class="reco-nota">
        <span class="estrellas grande">${estrellasHTML(est)}</span>
        <b style="color:${scoreColor(c.score)}">${est}/5</b>
        <span class="hintline" style="margin:0">· score ${c.score}/100 — la misma nota en dos escalas</span>
      </div>
      <p class="reco-w">${esc(c.w)}</p>
      <div class="reco-datos">
        <div>
          <span class="lbl">Proveedor sugerido</span>
          ${mio
            ? `<b>${esc(mio.n)}</b> <span class="hintline">de los tuyos · ${mio.rating}★${mio.precio?` · US$ ${esc(mio.precio)}`:""}</span>`
            : `<a href="${esc(prov.url)}" target="_blank" rel="noopener">${esc(prov.n)}: buscar “${esc(prov.term)}” ↗</a>`}
          <div class="hintline">${esc(c.prov)}</div>
        </div>
        <div>
          <span class="lbl">Precio de venta y competencia</span>
          <a href="${esc(compe.url)}" target="_blank" rel="noopener">Ver en Mercado Libre ↗</a>
          <div class="hintline">Mirá los 5 primeros: si venden mucho hay demanda, y su precio es tu techo.</div>
        </div>
      </div>
    </div>
    <div class="reco-pie">
      ${yaEsta ? `<span class="hintline">Ya está en tu radar.</span>`
               : `<button class="btn primary" onclick="nuevoDesdeReco()">+ Sumarlo al radar</button>`}
      <button class="btn ghost" onclick="randomIdea()">🎲 Otro</button>
    </div>
  </div>`;
}

function nuevoDesdeReco(){
  const c = state.reco || calienteDeHoy();
  openModal(null);
  state.editing.nombre = c.p;
  state.editing.rubro  = RUBROS.includes(c.rubro) ? c.rubro : "Otro";
  state.editing.notas  = c.w;
  const mio = mejorProveedor(c.rubro);
  if(mio){
    state.editing.proveedor = mio.n;
    state.editing.provUrl   = mio.url||"";
    state.editing.paisProv  = mio.pais||"Argentina";
  }
  renderModal();
}

/* ================= INIT ================= */
load();
render();

$$(".snav[data-view]").forEach(t=> t.onclick = ()=>{
  state.view = t.dataset.view;
  cerrarBusqueda();
  render();
  $("#side").classList.remove("abierta");
  window.scrollTo(0,0);
});

/* menú lateral en pantallas chicas */
$("#abrirSide").onclick  = e=>{ e.stopPropagation(); $("#side").classList.add("abierta"); };
$("#cerrarSide").onclick = ()=> $("#side").classList.remove("abierta");
document.addEventListener("click", e=>{
  const side = $("#side");
  if(side.classList.contains("abierta") && !side.contains(e.target)) side.classList.remove("abierta");
});

/* búsqueda global */
$("#qGlobal").oninput   = e=>{ state.qGlobal = e.target.value; pintarBusqueda(); };
$("#qGlobal").onkeydown = e=>{ if(e.key==="Escape") cerrarBusqueda(); };
$("#limpiarQ").onclick  = ()=>{ cerrarBusqueda(); $("#qGlobal").focus(); };
$("#btnNuevo").onclick  = ()=> openModal(null);
$("#btnSave").onclick   = saveProducto;
$("#btnCancel").onclick = closeModal;
$("#modalClose").onclick= closeModal;
$("#btnDelete").onclick = deleteProducto;
$("#btnExport").onclick = exportar;
$("#btnRandom").onclick = randomIdea;
$("#btnImport").onclick = ()=> $("#fileInput").click();
$("#fileInput").onchange= e=>{ if(e.target.files[0]) importar(e.target.files[0]); e.target.value=""; };
$("#modalBack").onclick = e=>{ if(e.target.id==="modalBack") closeModal(); };
document.addEventListener("keydown", e=>{ if(e.key==="Escape" && !$("#modalBack").hidden) closeModal(); });


/* ================= TEMA ================= */
(function(){
  const TKEY="radar-tema";
  const botones=$$("[data-tema]");
  if(!botones.length) return;
  const pintar=()=>{
    let t=null; try{ t=localStorage.getItem(TKEY); }catch(e){}
    botones.forEach(b=>b.classList.toggle("on", b.dataset.tema===t));
  };
  botones.forEach(b=>{
    b.onclick=()=>{
      const t=b.dataset.tema;
      let actual=null; try{ actual=localStorage.getItem(TKEY); }catch(e){}
      if(actual===t){                       // volver a seguir al sistema
        document.documentElement.removeAttribute("data-theme");
        try{ localStorage.removeItem(TKEY); }catch(e){}
      }else{
        document.documentElement.setAttribute("data-theme",t);
        try{ localStorage.setItem(TKEY,t); }catch(e){}
      }
      pintar();
    };
  });
  pintar();
})();

/* ================= INSTALACIÓN (PWA) ================= */
(function(){
  if("serviceWorker" in navigator){
    /* Cuando el service worker nuevo toma el control, recargamos una sola vez.
       Sin esto la primera visita después de un deploy sigue mostrando lo viejo. */
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", ()=>{
      if(recargando) return;
      recargando = true;
      location.reload();
    });
    addEventListener("load", ()=>{
      navigator.serviceWorker.register("sw.js")
        .then(reg=>{
          reg.update();                                   // buscar versión nueva ya
          setInterval(()=>reg.update(), 60*60*1000);      // y una vez por hora
        })
        .catch(()=>{});
    });
  }

  const btn = $("#btnInstalar");
  if(!btn) return;

  const yaInstalada = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  let prompt_ = null;

  addEventListener("beforeinstallprompt", ev=>{
    ev.preventDefault();
    prompt_ = ev;
    btn.hidden = yaInstalada;
  });

  addEventListener("appinstalled", ()=>{ btn.hidden = true; prompt_ = null; toast("Instalada"); });

  /* iOS no dispara beforeinstallprompt: mostramos las instrucciones */
  if(esIOS && !yaInstalada) btn.hidden = false;

  btn.onclick = async ()=>{
    if(prompt_){
      prompt_.prompt();
      const { outcome } = await prompt_.userChoice;
      if(outcome === "accepted") btn.hidden = true;
      prompt_ = null;
      return;
    }
    $("#iosBack").hidden = false;
  };

  $("#iosClose").onclick = ()=> $("#iosBack").hidden = true;
  $("#iosBack").onclick  = e=>{ if(e.target.id === "iosBack") $("#iosBack").hidden = true; };
})();
