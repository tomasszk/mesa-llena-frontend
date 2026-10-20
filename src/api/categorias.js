/* ==========================================================================
   Categorias  ->  /categories
   --------------------------------------------------------------------------
   El listado es publico (lo necesita el filtro del catalogo).
   El alta es solo del ADMIN: la tienda define el arbol de categorias.
   ========================================================================== */

import { get, post } from './cliente';

/**
 * Todas las categorias.
 * El backend devuelve un Page, pero si no le pasamos page y size nos devuelve
 * todo en una sola pagina. Como son pocas, eso es justo lo que queremos para
 * llenar el <select> de filtros.
 */
export function obtenerCategorias() {
  return get('/categories');
}

/** Alta de una categoria (solo ADMIN). */
export function crearCategoria(description) {
  return post('/categories', { description }, true);
}
