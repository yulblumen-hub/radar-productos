/**
 * Proxy de catálogos.
 *
 * Existe por una sola razón: los proveedores publican su catálogo en abierto,
 * pero sin cabeceras CORS, así que el navegador no puede leerlo. Este worker
 * lo lee por HTTP —donde CORS no aplica— y se lo devuelve a la app.
 *
 * No necesita credenciales de nada. Se despliega y anda.
 *
 * Rutas:
 *   /catalogo?url=https://proveedor.com     → catálogo normalizado
 *   /buscar?q=tabla+picada                  → busca en todos los proveedores a la vez
 *   /health
 */

const CACHE_CATALOGO = 60 * 60 * 6;   // 6 h: un catálogo mayorista no cambia cada hora
const TIMEOUT = 9000;

/* ---------- utilidades ---------- */

const UA = "Mozilla/5.0 (compatible; RadarDeProductos/1.0)";

async function traer(url, tipo = "json") {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/json,text/html" },
      signal: ctrl.signal,
      cf: { cacheTtl: CACHE_CATALOGO, cacheEverything: true },
    });
    if (!r.ok) return null;
    return tipo === "json" ? await r.json() : await r.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const limpiar = (s) =>
  String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const origen = (u) => {
  try {
    return new URL(/^https?:\/\//i.test(u) ? u : "https://" + u).origin;
  } catch {
    return null;
  }
};

/* ---------- lectores por plataforma ---------- */

/* Shopify: /products.json, abierto y con CORS propio */
async function leerShopify(base) {
  const j = await traer(`${base}/products.json?limit=250`);
  if (!j || !Array.isArray(j.products)) return null;
  return j.products.map((p) => {
    const v = (p.variants || [])[0] || {};
    return {
      titulo: p.title || "",
      precio: Number(v.price) || 0,
      antes: Number(v.compare_at_price) || 0,
      stock: v.available !== false,
      img: ((p.images || [])[0] || {}).src || "",
      link: `${base}/products/${p.handle}`,
      tipo: p.product_type || "",
      publicado: (p.published_at || "").slice(0, 10),
    };
  });
}

/* WooCommerce: Store API pública, sin token pero sin CORS */
async function leerWoo(base, q) {
  const filtro = q ? `&search=${encodeURIComponent(q)}` : "";
  for (const ruta of ["/wp-json/wc/store/v1/products", "/wp-json/wc/store/products"]) {
    const j = await traer(`${base}${ruta}?per_page=100${filtro}`);
    if (!Array.isArray(j) || !j.length) continue;
    return j.map((p) => {
      const pr = p.prices || {};
      const menor = Number(pr.price) || 0;
      /* Woo devuelve los precios en la menor unidad: 156410 con 2 decimales = 1564,10 */
      const div = Math.pow(10, Number(pr.currency_minor_unit ?? 2));
      return {
        titulo: limpiar(p.name),
        precio: menor / div,
        antes: Number(pr.regular_price) ? Number(pr.regular_price) / div : 0,
        stock: p.is_in_stock !== false,
        img: ((p.images || [])[0] || {}).src || "",
        link: p.permalink || base,
        tipo: ((p.categories || [])[0] || {}).name || "",
        publicado: "",
      };
    });
  }
  return null;
}

/* Tienda Nube: no expone API, pero cada producto viene como JSON-LD dentro
   del HTML. Es la misma data que le da a Google, así que es confiable. */
function leerJsonLd(html, base) {
  const bloques = html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || [];
  const items = [];
  for (const b of bloques) {
    const cuerpo = b.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    let d;
    try { d = JSON.parse(cuerpo); } catch { continue; }
    for (const p of (Array.isArray(d) ? d : [d])) {
      if (!p || p["@type"] !== "Product") continue;
      const of = Array.isArray(p.offers) ? p.offers[0] : p.offers || {};
      const link = of.url || (p.mainEntityOfPage || {})["@id"] || base;
      items.push({
        titulo: limpiar(p.name),
        precio: Number(of.price) || 0,
        antes: 0,
        stock: !of.availability || /InStock/i.test(of.availability),
        img: typeof p.image === "string" ? p.image : (p.image || [])[0] || "",
        link,
        tipo: ((p.brand || {}).name) || "",
        publicado: "",
      });
    }
  }
  return items;
}

async function leerTiendaNube(base, q) {
  /* Con término busca; sin término trae el listado general. */
  const rutas = q ? [`/search/?q=${encodeURIComponent(q)}`, "/productos/"] : ["/productos/"];
  for (const ruta of rutas) {
    const html = await traer(base + ruta, "text");
    if (!html) continue;
    const items = leerJsonLd(html, base);
    if (items.length) return items;
  }
  return null;
}

async function leerCatalogo(base, q) {
  return (
    (await leerShopify(base)) ||
    (await leerWoo(base, q)) ||
    (await leerTiendaNube(base, q)) ||
    null
  );
}

/* ---------- descubrimiento ----------
   Cuando la lista propia no alcanza, salimos a buscar proveedores nuevos a la
   red. DuckDuckGo devuelve HTML sin pedir clave, así que no hace falta
   contratar ninguna API. De los dominios que aparecen probamos cuáles tienen
   catálogo legible: los que sirven se devuelven para sumarlos a la lista. */

const RUIDO = /mercadolibre|mercadolibre|facebook|instagram|youtube|tiktok|pinterest|wikipedia|amazon|aliexpress|alibaba|google|linkedin|twitter|blogspot|wordpress\.com|olx|tiendanube\.com$|shopify\.com$/i;

async function buscarEnLaRed(q, max = 8) {
  const consulta = `${q} por mayor argentina`;
  const html = await traer(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(consulta)}`, "text");
  if (!html) return [];

  const dominios = [];
  const re = /uddg=([^&"]+)/g;
  let m;
  while ((m = re.exec(html)) && dominios.length < 40) {
    let dir;
    try { dir = decodeURIComponent(m[1]); } catch { continue; }
    const base = origen(dir);
    if (!base) continue;
    const host = base.replace(/^https?:\/\//, "");
    if (RUIDO.test(host)) continue;
    if (!dominios.includes(base)) dominios.push(base);
  }
  return dominios.slice(0, max);
}

/* ---------- contacto ----------
   Si el precio dice "a consultar", lo único que sirve es poder escribirle.
   Casi todos publican el WhatsApp en la portada: lo sacamos de ahí. */
async function contactoDe(base) {
  const html = await traer(base, "text");
  if (!html) return null;
  const uno = (re) => { const m = html.match(re); return m ? m[1] : null; };
  const wa = uno(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)\+?(\d{10,15})/i);
  const tel = uno(/tel:\+?(\d[\d\s\-]{7,16})/i);
  const mail = uno(/mailto:([^"?\s<>]+@[^"?\s<>]+)/i);
  const ig = uno(/instagram\.com\/([A-Za-z0-9_.]{3,30})/i);
  if (!wa && !tel && !mail && !ig) return null;
  return {
    whatsapp: wa || null,
    tel: tel ? tel.replace(/\s+/g, "") : null,
    mail: mail || null,
    instagram: ig && !/^(p|reel|explore|accounts)$/i.test(ig) ? ig : null,
  };
}

/* ---------- búsqueda ---------- */

/* Puntaje simple y explicable: título que arranca con el término manda,
   después coincidencia completa, después por palabra suelta. */
function puntuar(titulo, termino) {
  const t = titulo.toLowerCase();
  const q = termino.toLowerCase().trim();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 75;
  const palabras = q.split(/\s+/).filter((w) => w.length > 2);
  if (!palabras.length) return 0;
  const halladas = palabras.filter((w) => t.includes(w)).length;
  return halladas ? Math.round((halladas / palabras.length) * 60) : 0;
}

/* ---------- respuesta ---------- */

const cors = () => ({
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type",
});

const json = (data, status = 200, seg = 0) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": seg ? `public, max-age=${seg}` : "no-store",
      ...cors(),
    },
  });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors() });

    if (url.pathname === "/health") return json({ ok: true, version: 4, lee: ["Shopify","WooCommerce","TiendaNube"], descubre: true });

    /* Un catálogo suelto */
    if (url.pathname === "/catalogo") {
      const base = origen(url.searchParams.get("url") || "");
      if (!base) return json({ error: "Falta o es inválido el parámetro url" }, 400);

      const cache = caches.default;
      const clave = new Request(url.toString());
      const hit = await cache.match(clave);
      if (hit) return hit;

      const prods = await leerCatalogo(base, url.searchParams.get("q") || "");
      if (!prods) return json({ base, productos: [], error: "No pude leer el catálogo de este sitio." }, 200, 600);

      const resp = json({ base, productos: prods, total: prods.length }, 200, CACHE_CATALOGO);
      ctx.waitUntil(cache.put(clave, resp.clone()));
      return resp;
    }

    if (url.pathname === "/contacto") {
      const base = origen(url.searchParams.get("url") || "");
      if (!base) return json({ error: "Falta o es inválido el parámetro url" }, 400);
      const c = await contactoDe(base);
      return json({ base, contacto: c }, 200, CACHE_CATALOGO);
    }

    /* Búsqueda federada: varios proveedores a la vez */
    if (url.pathname === "/buscar") {
      const q = (url.searchParams.get("q") || "").trim();
      const sitios = (url.searchParams.get("sitios") || "").split(",").map((s) => origen(s)).filter(Boolean);
      if (!q) return json({ error: "Falta q" }, 400);
      if (!sitios.length) return json({ error: "Falta sitios" }, 400);

      const cache = caches.default;
      const clave = new Request(url.toString());
      const hit = await cache.match(clave);
      if (hit) return hit;

      const tandas = await Promise.all(
        sitios.slice(0, 20).map(async (base) => {
          const prods = await leerCatalogo(base, q);
          if (!prods) return { base, ok: false, items: [] };
          const items = prods
            .map((p) => ({ ...p, base, punta: puntuar(p.titulo, q) }))
            .filter((p) => p.punta > 0);
          return { base, ok: true, items, catalogo: prods.length };
        })
      );

      let items = tandas.flatMap((t) => t.items);
      let descubiertos = [];

      /* Si la lista propia trae poco, salimos a buscar afuera. */
      if (url.searchParams.get("descubrir") === "1" && items.length < 12) {
        const conocidos = new Set(sitios);
        const candidatos = (await buscarEnLaRed(q)).filter((b) => !conocidos.has(b));
        const probados = await Promise.all(
          candidatos.map(async (base) => {
            const prods = await leerCatalogo(base, q);
            if (!prods || !prods.length) return null;
            const suyos = prods
              .map((p) => ({ ...p, base, punta: puntuar(p.titulo, q), nuevo: true }))
              .filter((p) => p.punta > 0);
            if (!suyos.length) return null;
            const contacto = await contactoDe(base);
            return { base, items: suyos, catalogo: prods.length, contacto };
          })
        );
        probados.filter(Boolean).forEach((r) => {
          items = items.concat(r.items);
          descubiertos.push({
            base: r.base, productos: r.catalogo,
            coincidencias: r.items.length, contacto: r.contacto,
          });
        });
      }

      items.sort((a, b) => b.punta - a.punta || a.precio - b.precio);
      const resp = json(
        {
          q,
          resultados: items.slice(0, 60),
          consultados: tandas.length,
          respondieron: tandas.filter((t) => t.ok).length,
          fallaron: tandas.filter((t) => !t.ok).map((t) => t.base),
          descubiertos,
        },
        200,
        3600
      );
      ctx.waitUntil(cache.put(clave, resp.clone()));
      return resp;
    }

    return json({ error: "Ruta desconocida", rutas: ["/health", "/catalogo?url=", "/buscar?q=&sitios=&descubrir=1", "/contacto?url="] }, 404);
  },
};
