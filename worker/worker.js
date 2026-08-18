/**
 * Proxy a la API de Mercado Libre.
 *
 * Existe por dos motivos: la API pide un token OAuth que no puede vivir en una
 * página estática, y el navegador no puede llamarla directo por CORS.
 *
 * El worker guarda el secret, renueva el token solo y cachea las respuestas
 * para no gastar cuota al pedo.
 *
 * Variables (se cargan con `wrangler secret put`, nunca en el código):
 *   ML_CLIENT_ID      · público, el que da Mercado Libre al crear la app
 *   ML_CLIENT_SECRET  · privado, NO se comparte ni se commitea
 *   ORIGEN_PERMITIDO  · ej: https://yulblumen-hub.github.io
 */

const ML   = "https://api.mercadolibre.com";
const SITIO = "MLA";                 // MLA = Argentina
const CACHE_BUSQUEDA = 60 * 30;      // media hora
const TOKEN_MARGEN   = 60 * 5;       // renovar 5 min antes de que venza

let tokenMem = null;                 // { valor, vence }  (vive lo que vive el isolate)

/* ---------------- token ---------------- */

async function obtenerToken(env) {
  const ahora = Math.floor(Date.now() / 1000);
  if (tokenMem && tokenMem.vence - TOKEN_MARGEN > ahora) return tokenMem.valor;

  const r = await fetch(`${ML}/oauth/token`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.ML_CLIENT_ID,
      client_secret: env.ML_CLIENT_SECRET,
    }),
  });

  if (!r.ok) {
    const detalle = await r.text();
    throw new Error(`No se pudo obtener el token (${r.status}): ${detalle.slice(0, 300)}`);
  }

  const j = await r.json();
  tokenMem = { valor: j.access_token, vence: ahora + (j.expires_in || 21600) };
  return tokenMem.valor;
}

async function pedirML(env, ruta) {
  const token = await obtenerToken(env);
  const r = await fetch(`${ML}${ruta}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (r.status === 401) {           // token vencido antes de tiempo: uno más y listo
    tokenMem = null;
    const t2 = await obtenerToken(env);
    return fetch(`${ML}${ruta}`, {
      headers: { authorization: `Bearer ${t2}`, accept: "application/json" },
    });
  }
  return r;
}

/* ---------------- normalización ---------------- */

const mediana = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

function resumirMercado(j) {
  const items = Array.isArray(j.results) ? j.results : [];
  const precios = items.map(i => Number(i.price)).filter(p => p > 0);

  /* sold_quantity no siempre viene: ML lo fue restringiendo.
     Si no está, lo decimos en vez de inventar un número. */
  const conVentas = items.filter(i => Number.isFinite(Number(i.sold_quantity)));
  const hayVentas = conVentas.length > 0;

  const top = (hayVentas
    ? [...conVentas].sort((a, b) => b.sold_quantity - a.sold_quantity)
    : items
  ).slice(0, 5).map(i => ({
    titulo: i.title,
    precio: Number(i.price) || null,
    vendidos: Number.isFinite(Number(i.sold_quantity)) ? Number(i.sold_quantity) : null,
    link: i.permalink || null,
    vendedor: (i.seller && (i.seller.nickname || i.seller.id)) || null,
    envioGratis: !!(i.shipping && i.shipping.free_shipping),
  }));

  return {
    publicaciones: (j.paging && j.paging.total) || items.length,
    muestra: items.length,
    precioMin: precios.length ? Math.min(...precios) : null,
    precioMediana: mediana(precios),
    precioMax: precios.length ? Math.max(...precios) : null,
    moneda: (items[0] && items[0].currency_id) || "ARS",
    conEnvioGratis: items.filter(i => i.shipping && i.shipping.free_shipping).length,
    hayDatoDeVentas: hayVentas,
    top,
  };
}

/* ---------------- CORS ---------------- */

const cors = (env) => ({
  "access-control-allow-origin": env.ORIGEN_PERMITIDO || "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type",
  "vary": "origin",
});

const json = (data, env, status = 200, cacheSeg = 0) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheSeg ? `public, max-age=${cacheSeg}` : "no-store",
      ...cors(env),
    },
  });

/* ---------------- rutas ---------------- */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers: cors(env) });

    if (url.pathname === "/health") {
      return json({ ok: true, configurado: !!(env.ML_CLIENT_ID && env.ML_CLIENT_SECRET) }, env);
    }

    if (url.pathname === "/buscar") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return json({ error: "Falta el parámetro q" }, env, 400);

      const cache = caches.default;
      const clave = new Request(url.toString(), request);
      const cacheado = await cache.match(clave);
      if (cacheado) return cacheado;

      try {
        const r = await pedirML(env, `/sites/${SITIO}/search?q=${encodeURIComponent(q)}&limit=50`);
        if (!r.ok) {
          const detalle = await r.text();
          return json({ error: `Mercado Libre respondió ${r.status}`, detalle: detalle.slice(0, 300) }, env, 502);
        }
        const resumen = resumirMercado(await r.json());
        const resp = json({ q, ...resumen, actualizado: new Date().toISOString() }, env, 200, CACHE_BUSQUEDA);
        ctx.waitUntil(cache.put(clave, resp.clone()));
        return resp;
      } catch (e) {
        return json({ error: String(e.message || e) }, env, 500);
      }
    }

    if (url.pathname === "/trends") {
      try {
        const r = await pedirML(env, `/trends/${SITIO}`);
        if (!r.ok) {
          return json({ error: `Mercado Libre respondió ${r.status}`, disponible: false }, env, 502);
        }
        const j = await r.json();
        return json({ disponible: true, tendencias: (j || []).slice(0, 40) }, env, 200, 3600);
      } catch (e) {
        return json({ error: String(e.message || e), disponible: false }, env, 500);
      }
    }

    return json({ error: "Ruta desconocida", rutas: ["/health", "/buscar?q=", "/trends"] }, env, 404);
  },
};
