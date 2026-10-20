/* ==========================================================================
   Funciones de formato
   --------------------------------------------------------------------------
   Cosas que se repiten en varias vistas: mostrar un precio, armar el src de
   una imagen, mostrar una fecha. Las ponemos aca para escribirlas una vez.
   ========================================================================== */

/**
 * Muestra un numero como precio en pesos: 15990.5 -> "$ 15.990,50"
 *
 * Los precios llegan del backend como BigDecimal, que en el JSON aparece como
 * numero o como string segun el caso, asi que lo convertimos antes de formatear.
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
 * Arma el src de un <img> a partir de una imagen en Base64.
 *
 * El backend guarda las fotos como Blob en MySQL y las devuelve codificadas en
 * Base64 (ver ProductResponse.toBase64). Para mostrarlas no hace falta pedir
 * otro endpoint: se las pasa directo al navegador como "data URL".
 *
 * Devuelve null si el producto no tiene foto, asi la vista puede decidir que
 * mostrar en su lugar.
 */
export function imagenBase64(base64) {
  if (!base64) return null;
  return `data:image/*;base64,${base64}`;
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
