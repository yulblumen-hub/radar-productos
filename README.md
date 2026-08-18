# Radar de Productos

App para relevar y puntuar productos antes de comprar stock.

**En línea:** https://yulblumen-hub.github.io/radar-productos/

## Correr
Abrí `index.html` en el navegador, o entrá al link de arriba. No necesita servidor.

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
- **Dashboard** — KPIs, top de categorías por score, ranking de productos, recomendación al azar.
- **Productos** — tabla ordenable y filtrable. Costo puesto, margen y score calculados solos. El nombre abre el link directo del producto (↗) cuando lo cargaste; el de la columna Proveedor va al sitio del proveedor.
- **Rubros** — score promedio y estrellas por categoría.
- **Proveedores** — los relevados, con link. Marca cuáles ya estás usando.
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
