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
async function leerWoo(base) {
  for (const ruta of ["/wp-json/wc/store/v1/products", "/wp-json/wc/store/products"]) {
    const j = await traer(`${base}${ruta}?per_page=100`);
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

/* Tienda Nube: no expone API abierta, pero el buscador devuelve HTML legible */
async function leerTiendaNube(base, q) {
  if (!q) return null;
  const html = await traer(`${base}/search/?q=${encodeURIComponent(q)}`, "text");
  if (!html || !/tiendanube|nuvemshop/i.test(html)) return null;
  const items = [];
  const re = /<a[^>]+href="([^"]*\/productos\/[^"]+)"[^>]*>[\s\S]{0,600}?<img[^>]+(?:data-src|src)="([^"]+)"[\s\S]{0,600}?\$\s*([\d.,]+)/gi;
  let m;
  while ((m = re.exec(html)) && items.length < 40) {
    const link = m[1].startsWith("http") ? m[1] : base + m[1];
    items.push({
      titulo: limpiar(decodeURIComponent(link.split("/productos/")[1] || "").replace(/-/g, " ")),
      precio: Number(String(m[3]).replace(/\./g, "").replace(",", ".")) || 0,
      antes: 0,
      stock: true,
      img: m[2].startsWith("//") ? "https:" + m[2] : m[2],
      link,
      tipo: "",
      publicado: "",
    });
  }
  return items.length ? items : null;
}

async function leerCatalogo(base, q) {
  return (
    (await leerShopify(base)) ||
    (await leerWoo(base)) ||
    (await leerTiendaNube(base, q)) ||
    null
  );
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

    if (url.pathname === "/health") return json({ ok: true, version: 2 });

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

      const items = tandas.flatMap((t) => t.items).sort((a, b) => b.punta - a.punta || a.precio - b.precio);
      const resp = json(
        {
          q,
          resultados: items.slice(0, 60),
          consultados: tandas.length,
          respondieron: tandas.filter((t) => t.ok).length,
          fallaron: tandas.filter((t) => !t.ok).map((t) => t.base),
        },
        200,
        3600
      );
      ctx.waitUntil(cache.put(clave, resp.clone()));
      return resp;
    }

    return json({ error: "Ruta desconocida", rutas: ["/health", "/catalogo?url=", "/buscar?q=&sitios="] }, 404);
  },
};
