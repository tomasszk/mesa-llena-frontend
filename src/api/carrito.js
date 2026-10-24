/* ==========================================================================
   Carrito  ->  /carts
   --------------------------------------------------------------------------
   Todas estas funciones mandan el token, por dos razones:

   1) El endpoint pide el rol USER (ver SecurityConfig del backend).
   2) El backend NO recibe el id del usuario por la URL: lo saca del token.
      Por eso no hay ninguna función acá que reciba un userId. Es a propósito:
      así nadie puede leer ni modificar el carrito de otra persona cambiando
      un número en la dirección.
   ========================================================================== */

import { eliminar, get, post, put } from './cliente';

/**
 * Devuelve el carrito del usuario logueado.
 * Si todavía no tenía carrito, el backend le crea uno vacío.
 */
export function obtenerCarrito() {
  return get('/carts', true);
}

/**
 * Agrega un producto al carrito.
 *
 * Si el producto ya estaba, el backend no crea otra línea: le suma la cantidad
 * a la que ya había, y valida el stock sobre el TOTAL acumulado.
 */
export function agregarAlCarrito(productId, quantity = 1) {
  return post('/carts/items', { productId, quantity: Number(quantity) }, true);
}

/** Cambia la cantidad de una línea del carrito. */
export function actualizarCantidad(itemId, quantity) {
  return put(`/carts/items/${itemId}`, { quantity: Number(quantity) }, true);
}

/** Saca una línea del carrito. */
export function quitarDelCarrito(itemId) {
  return eliminar(`/carts/items/${itemId}`, true);
}

/** Vacía el carrito completo. */
export function vaciarCarrito() {
  return eliminar('/carts', true);
}
