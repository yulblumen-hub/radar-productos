# radar-ml · proxy de Mercado Libre

La API de Mercado Libre dejó de ser pública: todo pide token OAuth. Un token no puede
vivir en una página estática (cualquiera lo lee), y encima el navegador no puede llamar
a `api.mercadolibre.com` por CORS. Este worker resuelve las dos cosas: guarda el secret,
renueva el token solo cada 6 horas y le habla a la app por HTTPS con CORS.

Corre en el plan gratis de Cloudflare (100.000 pedidos por día). Las búsquedas se cachean
media hora, así que el gasto real es mínimo.

## Puesta en marcha

**1. Crear la aplicación en Mercado Libre** — https://developers.mercadolibre.com.ar/devcenter

- "Crear aplicación"
- *Redirect URI*: `https://yulblumen-hub.github.io/radar-productos/`
- Permisos: sólo lectura (`read`)
- Anotá el **App ID** (ese es el `client_id`) y el **Secret Key**

**2. Desplegar el worker**

```bash
npm install -g wrangler
wrangler login
wrangler secret put ML_CLIENT_ID
wrangler secret put ML_CLIENT_SECRET
wrangler deploy
```

`wrangler secret put` te pide el valor por teclado y lo guarda cifrado en Cloudflare:
no queda en el repo ni en el historial de la terminal.

**3. Enchufarlo a la app**

`wrangler deploy` te devuelve una URL tipo `https://radar-ml.TU-USUARIO.workers.dev`.
Ponela en `data.js`:

```js
const API_MERCADO = "https://radar-ml.TU-USUARIO.workers.dev";
```

Commit, push, y la app empieza a mostrar datos de mercado sola.

## Probarlo

```bash
curl "https://radar-ml.TU-USUARIO.workers.dev/health"
```

```bash
curl "https://radar-ml.TU-USUARIO.workers.dev/buscar?q=comedero+antivoracidad"
```

## Rutas

| Ruta | Qué devuelve |
|---|---|
| `/health` | Si el worker está vivo y con credenciales cargadas |
| `/buscar?q=` | Publicaciones compitiendo, precio mínimo/mediano/máximo, cuántas con envío gratis y las 5 principales |
| `/trends` | Búsquedas más populares del sitio, si Mercado Libre las expone con este token |

## Lo que todavía no está verificado

El código no se pudo probar contra la API real porque hace falta un token, y el token
sale de tu cuenta. Dos cosas a confirmar en el primer `curl`:

- **`sold_quantity`** — ML fue restringiendo la cantidad vendida por publicación. Si no
  viene, la respuesta trae `hayDatoDeVentas: false` y la app lo dice en lugar de inventar
  un número.
- **`/trends`** — puede requerir permisos que una app de sólo lectura no tenga. Si no
  está disponible, devuelve `disponible: false` y la app esconde esa sección.
