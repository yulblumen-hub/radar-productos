/* ============================================================
   Radar de Productos — lógica
   ============================================================ */
const APP_VER = "v9";
const KEY  = "radar-productos-v1";
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

let settings = { mult: MULT_PUESTO };
let seedVer  = 0;

let state = { productos:[], view:"dashboard", q:"", fRubro:"", fVeredicto:"", fPais:"", rubroOrden:"op", sort:{k:"score",dir:-1}, editing:null };

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
const IC_RUBRO = {
  "Mascotas":"🐾","Wellness y Masajes":"💆","Bebés y Maternidad":"🍼","Escritorio y Setup":"🖥",
  "Camping y Outdoor":"⛺","Auto y Moto":"🚗","Salud y Ortopedia":"🩺","Cocina y Organización":"🍳",
  "Bolsos y Mochilas":"🎒","Limpieza del Hogar":"🧽","Fitness y Deporte":"🏋","Jardín y Plantas":"🪴",
  "Viaje":"🧳","Herramientas":"🔧","Gaming":"🎮","Belleza y Cuidado":"💄","Iluminación y Deco":"💡",
  "Joyería y Accesorios":"💍","Audio y Tecnología":"🎧","Juguetes y Juegos":"🧸","Papelería y Escolar":"✏️","Otro":"📦"
};
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
      onerror="this.parentNode.classList.add('rota');this.remove()"><i>${IC_RUBRO[p.rubro]||"📦"}</i></span>`;
  return `<span class="${cls} vacia" style="--tono:${tono(p.rubro||"Otro")}"><i>${IC_RUBRO[p.rubro]||"📦"}</i></span>`;
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
      <div class="hot-icono">${IC_RUBRO[c.rubro]||"📦"}</div>
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
  const c = calienteDeHoy();
  openModal(null);
  state.editing.nombre = c.p;
  state.editing.rubro  = RUBROS.includes(c.rubro) ? c.rubro : "Otro";
  state.editing.notas  = c.w;
  renderModal();
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

  return `
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
      <div class="section-h"><h2>Top categorías</h2><span class="hint">por score promedio</span></div>
      ${rows.length? rows.map(r=>`
        <div class="bar-row">
          <div class="nm">${esc(r.r)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(r.n/maxN)*100}%;background:${scoreColor(r.avg)}"></div></div>
          <div class="bar-val">${r.n} · <b style="color:${scoreColor(r.avg)}">${r.avg}</b></div>
        </div>`).join("") : `<p class="empty">Sin datos todavía</p>`}
      <p class="hintline" style="margin-top:12px">La barra es cantidad de productos; el número en color es el score promedio del rubro.</p>
    </div>

    <div class="card">
      <div class="section-h"><h2>Ranking de productos</h2><span class="hint">los 5 mejores</span></div>
      ${top.length? top.map((p,i)=>`
        <div class="bar-row" style="grid-template-columns:20px 1fr 92px;cursor:pointer" onclick="openModal('${p.id}')">
          <div class="rank">${i+1}</div>
          <div style="overflow:hidden"><div class="pname" style="font-size:13px">${esc(p.nombre)}</div>
            <div class="psub">${esc(p.rubro)}</div></div>
          <div>${scoreLine(score(p))}</div>
        </div>`).join("") : `<p class="empty">Sin datos todavía</p>`}
    </div>
  </div>

  <div class="section" style="margin-top:14px">
    <div class="card" id="ideaCard">
      <div class="section-h"><h2>🎲 Recomendación al azar</h2>
        <span class="hint">tocá "Tirame uno" arriba para otra</span></div>
      <div id="ideaBox"><p class="hintline">Dale al botón 🎲 y te tiro un producto con el porqué.</p></div>
    </div>
  </div>`;
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
      return `<tr onclick="openModal('${p.id}')">
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

function vRubros(){
  const mios={};
  state.productos.forEach(p=>{
    const r=p.rubro||"Otro";
    (mios[r] ||= {n:0,sum:0,estrellas:0,items:[]});
    mios[r].n++; mios[r].sum+=score(p); mios[r].items.push(p);
    if(p.veredicto==="estrella") mios[r].estrellas++;
  });

  const filas = RUBROS_META
    .filter(m=>m.n!=="Otro" || mios["Otro"])
    .map(m=>({...m, op:oportunidad(m.n), mio:mios[m.n]||null}))
    .sort((a,b)=> (state.rubroOrden==="mios" ? (b.mio?b.mio.n:0)-(a.mio?a.mio.n:0) : 0) || b.op-a.op);

  const medidor = (v, color, etiqueta) => `
    <div class="med">
      <div class="med-top"><span>${etiqueta}</span><b style="color:${color}">${v}</b></div>
      <div class="med-track"><i style="width:${v}%;background:${color}"></i></div>
    </div>`;

  return `
  <div class="section-h">
    <h2>Rubros</h2>
    <span class="hint">ordenados por oportunidad — cuánto potencial queda sin tomar</span>
    <span class="spacer"></span>
    <div class="segmented">
      <button class="${state.rubroOrden!=="mios"?"on":""}" onclick="setOrdenRubro('op')">Oportunidad</button>
      <button class="${state.rubroOrden==="mios"?"on":""}" onclick="setOrdenRubro('mios')">Los míos</button>
    </div>
  </div>

  <div class="rubrogrid">
  ${filas.map(f=>{
    const cOp   = f.op>=45 ? "var(--acc)" : f.op>=30 ? "var(--warn)" : "var(--bad)";
    const cExp  = f.explotado>=70 ? "var(--bad)" : f.explotado>=50 ? "var(--warn)" : "var(--acc)";
    const cProy = f.proyeccion>=78 ? "var(--acc)" : f.proyeccion>=60 ? "var(--warn)" : "var(--bad)";
    return `
    <div class="rubro ${f.mio?"tiene":""}" onclick="verRubro('${esc(f.n)}')">
      <div class="rubro-top">
        <span class="rubro-ic" style="--tono:${tono(f.n)}">${IC_RUBRO[f.n]||"📦"}</span>
        <div class="rubro-id">
          <h3>${esc(f.n)}</h3>
          <div class="rubro-sub">${f.mio ? `${f.mio.n} tuyo${f.mio.n===1?"":"s"} · score ${Math.round(f.mio.sum/f.mio.n)}${f.mio.estrellas?` · ${f.mio.estrellas}★`:""}` : "sin productos todavía"}</div>
        </div>
        <div class="rubro-op" title="Oportunidad = proyección menos saturación">
          <b style="color:${cOp}">${f.op}</b><span>oport.</span>
        </div>
      </div>
      ${medidor(f.explotado,  cExp,  "Explotado")}
      ${medidor(f.proyeccion, cProy, "Proyección")}
      <p class="rubro-nota">${esc(f.nota)}</p>
    </div>`;}).join("")}
  </div>

  <p class="hintline" style="margin-top:14px">
    <b>Explotado</b>: cuánta competencia ya hay en Argentina. <b>Proyección</b>: potencial de crecimiento y margen.
    <b>Oportunidad</b> combina las dos. Son estimaciones de mercado para priorizar por dónde empezar, no datos duros —
    validá siempre contra Mercado Libre antes de comprar.
  </p>`;
}

function setOrdenRubro(k){ state.rubroOrden = k; render(); }
function verRubro(n){ state.view="productos"; state.fRubro=n; state.q=""; render(); }

function vProveedores(){
  const usados = {};
  state.productos.forEach(p=>{ if(p.proveedor) usados[p.proveedor]=(usados[p.proveedor]||0)+1; });
  return `
  <div class="section-h"><h2>Proveedores relevados</h2>
    <span class="hint">preguntá siempre: «¿me hacés factura A?» y «¿cuál es el mínimo?»</span></div>
  <div class="cardgrid">${PROVEEDORES.map(v=>`
    <div class="minicard">
      <h3><span class="bandera bandera-lg">${bandera(v.pais)}</span>${esc(v.nombre)}</h3>
      <div class="meta">${esc(v.tipo)} · <b style="color:${v.pais==="Argentina"?"var(--acc)":"var(--warn)"}">${esc(v.pais)}</b> · ${esc(v.rubro)}${usados[v.nombre]?` · <b style="color:var(--acc)">${usados[v.nombre]} producto${usados[v.nombre]===1?"":"s"}</b>`:""}</div>
      <p>${esc(v.nota)}</p>
      <p style="margin-top:9px"><a href="${esc(v.url)}" target="_blank" rel="noopener">Abrir sitio ↗</a>
        ${v.whatsapp?` · <a href="https://wa.me/${waNumero(v.whatsapp)}" target="_blank" rel="noopener">WhatsApp ↗</a>`:""}</p>
    </div>`).join("")}</div>`;
}

function vNichos(){
  return `
  <div class="section-h"><h2>Nichos evaluados</h2>
    <span class="hint">buscamos funcionales: que vendan por utilidad, con recompra</span></div>
  <div class="cardgrid" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">
  ${NICHOS.map((n,i)=>`
    <div class="minicard nicho" style="border-left-color:${scoreColor(n.score)}">
      <div class="rank">#${i+1}</div>
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
    </div>`).join("")}</div>

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

/* ================= RENDER ================= */
function render(){
  $$(".tab").forEach(t=>t.classList.toggle("active", t.dataset.view===state.view));
  const v = state.view;
  $("#app").innerHTML =
      v==="dashboard"   ? vDashboard()
    : v==="productos"   ? vProductos()
    : v==="rubros"      ? vRubros()
    : v==="proveedores" ? vProveedores()
    :                     vNichos();

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
  const i = IDEAS[Math.floor(Math.random()*IDEAS.length)];
  if(state.view!=="dashboard"){ state.view="dashboard"; render(); }
  const box = $("#ideaBox");
  if(box) box.innerHTML = `
    <h3 style="font-size:17px;margin-bottom:4px">${esc(i.p)}</h3>
    <div class="meta" style="font-size:12px;color:var(--tx3);margin-bottom:9px">${esc(i.r)}</div>
    <p style="font-size:13.5px;color:var(--tx2);margin:0 0 13px">${esc(i.w)}</p>
    <button class="btn primary" onclick="nuevoDesdeIdea('${esc(i.p).replace(/'/g,"\\'")}','${esc(i.r)}')">+ Agregarlo al radar</button>`;
}
function nuevoDesdeIdea(nombre, rubro){
  openModal(null);
  state.editing.nombre = nombre;
  state.editing.rubro  = RUBROS.includes(rubro) ? rubro : "Otro";
  renderModal();
}

/* ================= INIT ================= */
load();
render();

$$(".tab").forEach(t=> t.onclick = ()=>{ state.view=t.dataset.view; render(); });
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
