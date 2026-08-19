# radar-catalogos · proxy de catálogos

Los proveedores publican su catálogo en abierto, pero **sin cabeceras CORS**, así que
el navegador no puede leerlo. Este worker lo lee por HTTP —donde CORS no aplica— y se
lo devuelve a la app.

**No necesita credenciales de nada.** Se despliega y anda.

## Qué resuelve

Buscás "tabla para picada" y la app te devuelve las ofertas reales de todos los
proveedores cargados: foto del producto, precio, si hay stock y el link directo a la
ficha. Ordenadas por qué tan bien coinciden y por precio. Sin pasar por Google.

Lee tres plataformas:

| Plataforma | Cómo | CORS propio |
|---|---|---|
| Shopify | `/products.json` | sí (anda sin worker) |
| WooCommerce | Store API (`/wp-json/wc/store/v1/products`) | no |
| Tienda Nube | buscador HTML | no |

## Deploy automático desde GitHub (hacelo una vez y listo)

Conectando el worker al repo, cada `git push` lo actualiza solo y no hay que volver
a copiar código nunca más.

En **dash.cloudflare.com** → tu worker `radar-catalogos` → **Settings** → **Build** →
**Connect GitHub**:

- Repositorio: `yulblumen-hub/radar-productos`
- Rama: `main`
- **Root directory**: `worker`  ← importante, si no no encuentra el `wrangler.toml`
- Deploy command: `npx wrangler deploy`

Desde ahí, cada push publica la versión nueva.

## Desplegarlo a mano (la primera vez, o si no querés conectar GitHub)

Todo desde el navegador, en **dash.cloudflare.com**:

1. **Workers & Pages** → **Create** → **Start with Hello World!** → **Get started**
2. Nombre: `radar-catalogos` → **Deploy**
3. **Edit code** → borrar todo → pegar el contenido de `worker.js` → **Deploy**
4. Copiar la URL que te queda: `https://radar-catalogos.TU-USUARIO.workers.dev`

Después pegá esa URL en `data.js`:

```js
const API_CATALOGO = "https://radar-catalogos.TU-USUARIO.workers.dev";
```

Commit, push, y la búsqueda empieza a traer resultados reales.

## Probarlo

```bash
curl "https://radar-catalogos.TU-USUARIO.workers.dev/health"
```

```bash
curl "https://radar-catalogos.TU-USUARIO.workers.dev/catalogo?url=https://mau.com.ar"
```

## Costo

Plan gratis de Cloudflare: 100.000 pedidos por día. Los catálogos se cachean 6 horas
y las búsquedas 1 hora, así que el uso real es una fracción de eso.

## Rutas

| Ruta | Qué hace |
|---|---|
| `/health` | Confirma que está vivo |
| `/catalogo?url=` | Catálogo completo y normalizado de un proveedor |
| `/buscar?q=&sitios=` | Busca el término en varios proveedores a la vez y ordena por coincidencia y precio |
