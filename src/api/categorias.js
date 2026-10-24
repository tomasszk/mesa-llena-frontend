/* ==========================================================================
   Categorías  ->  /categories
   --------------------------------------------------------------------------
   El listado es público (lo necesita el filtro del catálogo).
   El alta es solo del ADMIN: la tienda define el árbol de categorías.
   ========================================================================== */

import { get, post } from './cliente';

/**
 * Todas las categorías.
 * El backend devuelve un Page, pero si no le pasamos page y size nos devuelve
 * todo en una sola página. Como son pocas, eso es justo lo que queremos para
 * llenar el <select> de filtros.
 */
export function obtenerCategorias() {
  return get('/categories');
}

/** Alta de una categoría (solo ADMIN). */
export function crearCategoria(description) {
  return post('/categories', { description }, true);
}
