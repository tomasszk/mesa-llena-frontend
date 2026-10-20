/* ==========================================================================
   Checkout y ordenes  ->  /orders
   --------------------------------------------------------------------------
   Igual que el carrito: el usuario sale del token, nunca de la URL.
   ========================================================================== */

import { get, post } from './cliente';

/**
 * Checkout del carrito. No recibe nada porque el backend ya sabe de quien es
 * el carrito (lo saca del token).
 *
 * Del otro lado, en una sola transaccion, el backend: valida que el carrito no
 * este vacio, revalida el stock de cada linea, congela el precio y el descuento
 * de cada producto, calcula el total, descuenta el stock y vacia el carrito.
 * Si una linea falla, no se descuenta el stock de ninguna.
 *
 * Devuelve la OrderResponse con el detalle de la compra.
 */
export function hacerCheckout() {
  return post('/orders/checkout', undefined, true);
}

/** Historial de compras del usuario logueado (el Page de Spring). */
export function obtenerMisOrdenes({ page = 0, size = 10 } = {}) {
  return get(`/orders/my?page=${page}&size=${size}`, true);
}

/**
 * Detalle de una orden propia.
 * Si el id es de la orden de otra persona, el backend responde 404 y no 403:
 * asi no le confirma a nadie que esa orden existe.
 */
export function obtenerOrden(id) {
  return get(`/orders/${id}`, true);
}
