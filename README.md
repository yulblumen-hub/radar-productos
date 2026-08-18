# Radar de Productos

App para relevar y puntuar productos antes de comprar stock.

**En línea:** https://yulblumen-hub.github.io/radar-productos/

## Correr
Abrí `index.html` en el navegador, o entrá al link de arriba. No necesita servidor.

## Datos de mercado (Mercado Libre)
La API de Mercado Libre dejó de ser pública en 2024/25: hoy todo pide token OAuth, que no puede vivir en una página estática. Por eso hay un proxy propio en [`worker/`](worker/) que corre gratis en Cloudflare.

Con el worker conectado, cada producto y cada rubro muestran cuántas publicaciones compiten, el precio mínimo, típico y máximo, cuántas van con envío gratis y las principales publicaciones.

**Sin worker la app anda igual**, sólo que con links a la búsqueda en vez de datos. Para conectarlo, seguí [`worker/README.md`](worker/README.md) y pegá la URL en `API_MERCADO` (`data.js`).

## Autocompletado
Pegá el link del producto y se completan solos proveedor, país, tipo, origen y WhatsApp a partir del dominio, más el nombre desde la URL. Nunca pisa lo que ya cargaste a mano. Los dominios conocidos están en `DOMINIOS` (`data.js`) — sumá los tuyos ahí.

## Fotos
Campo de imagen por producto, con miniatura en la tabla. Sin foto, muestra un mosaico con el ícono y el color del rubro.

## Temas
Claro · Oscuro suave · Oscuro, arriba a la izquierda. Volver a tocar el activo vuelve a seguir al sistema.

## Instalar en el celular
- **Android / Chrome** — botón **⤓ Instalar** arriba, o el menú del navegador → "Instalar app".
- **iPhone / Safari** — Compartir → **Agregar a inicio**. El botón ⤓ te muestra los pasos.

Una vez instalada anda offline: el service worker cachea todo el caparazón.

## Deploy
GitHub Pages sobre `main`. Cada push publica:

```
git add -A && git commit -m "..." && git push
```

Si tocás archivos cacheados, subí `VERSION` en `sw.js` para invalidar el cache viejo.

## Qué hace
- **Dashboard** — 🔥 **Caliente de hoy** (candidato distinto cada día, con su score, rubro y dónde buscarlo), KPIs, top de categorías, ranking y recomendación al azar.
- **Productos** — tabla ordenable y filtrable. Costo puesto, margen y score calculados solos. Cada fila termina en tres botones: **abrir el producto**, **WhatsApp con el proveedor** (con el mensaje ya escrito) y **eliminar**. Los dos primeros quedan apagados hasta que cargues el dato.

### WhatsApp
Cargá el teléfono en el producto. Se asume Argentina: se limpian el 0 de área y el 15, y se antepone 549. Para otro país escribilo con `+` adelante y se respeta tal cual. El mensaje que abre ya trae las dos preguntas obligatorias: precio mayorista, mínimo de compra y factura A.
- **Rubros** — 22 rubros con dos medidores: **Explotado** (competencia que ya hay) y **Proyección** (potencial). La **Oportunidad** combina las dos y ordena la grilla. Tocá uno y te filtra los productos de ese rubro.
- **Proveedores** — los relevados, con bandera del país, link y WhatsApp. Marca cuáles ya estás usando.

### País del proveedor
Va con bandera bajo el nombre en la tabla, y hay filtro por país. **No es lo mismo que el origen de la mercadería**: un mayorista colombiano vende producto chino. Cuando difieren, la tabla aclara "llega de …".
- **Nichos** — mascotas / cocina / auto, con ancla, satélites y recompra.

## Scoring (0-100)
| Criterio | Peso |
|---|---|
| Margen bruto | 25 |
| Competencia baja | 20 |
| Recompra | 15 |
| Sin certificación | 15 |
| Liviano y chico | 10 |
| Demo en video | 10 |
| Sin talles ni SKUs | 5 |

Veredicto sugerido: ≥75 estrella · ≥58 potencial · ≥42 evaluar · <42 clavo.

## Costo puesto
`costo × multiplicador`. El multiplicador es un **switch por producto**, no depende del origen:

- **Encendido** — el costo que cargaste es de origen (FOB) y se le suma flete + derechos + IVA + despacho. El factor es editable producto por producto.
- **Apagado** — el costo que cargaste ya es el puesto acá (típico de mayorista local).

El valor por defecto (×2.2) se cambia desde la barra de la vista Productos y lo heredan los productos nuevos. Los productos ya cargados migran solos: los de origen China arrancan con el switch encendido, el resto apagado.

## Productos de ejemplo
Se guardan en el navegador la primera vez. Para que una corrección posterior llegue, `SEED_VER` en `data.js` se sube y al abrir la app se refrescan **solo los que no editaste** — los que tocaste quedan como los dejaste (llevan `editado: true`).

## Eliminar
Desde el ícono 🗑 de cada fila, o con el botón Eliminar dentro del producto. Ambos piden confirmación.

## Compartir con el socio
⚠️ **Los datos son por dispositivo.** Viven en el `localStorage` del navegador de cada uno: la app es pública, pero lo que cargás vos no lo ve nadie más.

Para pasarse datos hoy: **Exportar** baja un JSON y **Importar** lo mergea por `id` (actualiza los que ya existen, agrega los nuevos).

Para que los dos editen lo mismo en vivo hace falta backend (Supabase). Es el próximo paso.

## Archivos
- `index.html` — estructura
- `styles.css` — estilos
- `data.js` — rubros, criterios, proveedores, nichos, ideas y productos de arranque
- `app.js` — lógica, scoring, vistas, modal, export/import
- `sync.sh` — copia la app al dir del preview local (solo para desarrollo)


## Nota sobre el origen compartido
`yulblumen-hub.github.io` es el mismo origen que tus otras apps de Pages, así que comparten `localStorage`. Las claves de esta arrancan con `radar-` para no pisarse con `g2tm` ni el resto. El service worker sí está aislado por ruta (`/radar-productos/`).
