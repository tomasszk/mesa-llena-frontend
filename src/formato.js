/* ==========================================================================
   Funciones de formato
   --------------------------------------------------------------------------
   Cosas que se repiten en varias vistas: mostrar un precio, armar el src de
   una imagen, mostrar una fecha. Las ponemos acá para escribirlas una vez.
   ========================================================================== */

/**
 * Muestra un número como precio en pesos: 15990.5 -> "$ 15.990,50"
 *
 * Los precios llegan del backend como BigDecimal, que en el JSON aparece como
 * número o como string según el caso, así que lo convertimos antes de formatear.
 */
export function precio(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return '$ 0,00';

  return numero.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Primeros caracteres del Base64 de cada formato, y el MIME que le corresponde.
 *
 * Todo archivo empieza con unos bytes fijos que lo identifican (los "magic
 * numbers"): un PNG arranca con 89 50 4E 47, un JPEG con FF D8 FF, etc. Como
 * Base64 codifica de a bloques de 3 bytes, esos primeros bytes siempre producen
 * el mismo prefijo de texto, y alcanza con comparar strings para saber qué es.
 */
const FIRMAS = [
  ['iVBORw0KGgo', 'image/png'],
  ['/9j/', 'image/jpeg'],
  ['R0lGOD', 'image/gif'],
  ['UklGR', 'image/webp'],
];

/**
 * Arma el src de un <img> a partir de una imagen en Base64.
 *
 * El backend guarda las fotos como Blob en MySQL y las devuelve codificadas en
 * Base64 (ver ProductResponse.toBase64). Para mostrarlas no hace falta pedir
 * otro endpoint: se las pasa directo al navegador como "data URL".
 *
 * El tipo hay que declararlo bien. Una data URL necesita un MIME concreto
 * ("image/png"), no un comodín como "image/*": con el comodín el navegador no
 * sabe qué está recibiendo y la imagen queda sin cargar. Como el backend guarda
 * el Blob sin recordar de que formato era, lo deducimos del contenido.
 *
 * Devuelve null si el producto no tiene foto, así la vista puede decidir qué
 * mostrar en su lugar.
 */
export function imagenBase64(base64) {
  if (!base64) return null;

  const firma = FIRMAS.find(([prefijo]) => base64.startsWith(prefijo));

  // Si no reconocemos la firma, JPEG es la apuesta más segura: es el formato
  // más común en fotos de producto.
  const tipo = firma ? firma[1] : 'image/jpeg';

  return `data:${tipo};base64,${base64}`;
}

/** Primera imagen de un producto, o null si no tiene ninguna. */
export function primeraImagen(producto) {
  if (!producto?.images || producto.images.length === 0) return null;
  return imagenBase64(producto.images[0]);
}

/**
 * Fecha y hora de una orden: "14/09/2026, 19:32"
 * El backend manda un LocalDateTime, que en JSON llega como
 * "2026-09-14T19:32:05.123".
 */
export function fechaHora(valor) {
  if (!valor) return '';

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);

  return fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Cantidad total de unidades en el carrito (para el contador del navbar). */
export function unidadesEnCarrito(carrito) {
  if (!carrito?.items) return 0;
  return carrito.items.reduce((suma, item) => suma + item.quantity, 0);
}
