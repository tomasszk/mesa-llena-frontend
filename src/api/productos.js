/* ==========================================================================
   Catalogo y gestion de productos  ->  /products
   --------------------------------------------------------------------------
   Los GET son publicos: se puede mirar el catalogo sin estar registrado.
   El alta, la modificacion, el stock, el descuento y la baja son solo del
   ADMIN, y por eso esas funciones mandan el token (conToken = true).
   ========================================================================== */

import { eliminar, get, patch, postFormulario, putFormulario } from './cliente';

/**
 * Catalogo con filtros y paginado.
 *
 * Solo manda al backend los filtros que el usuario realmente completo: si
 * mandaramos minPrice vacio, Spring no podria convertir "" a BigDecimal y
 * tendriamos un 400. Por eso vamos agregando parametros de a uno.
 *
 * Devuelve el Page de Spring: { content, totalElements, totalPages, number, ... }
 */
export function obtenerProductos({
  page = 0,
  size = 12,
  categoryId,
  minPrice,
  maxPrice,
  onlyAvailable,
  search,
} = {}) {
  const parametros = new URLSearchParams();
  parametros.set('page', page);
  parametros.set('size', size);

  if (categoryId) parametros.set('categoryId', categoryId);
  if (minPrice !== '' && minPrice != null) parametros.set('minPrice', minPrice);
  if (maxPrice !== '' && maxPrice != null) parametros.set('maxPrice', maxPrice);
  if (onlyAvailable) parametros.set('onlyAvailable', 'true');
  if (search && search.trim() !== '') parametros.set('search', search.trim());

  return get(`/products?${parametros.toString()}`);
}

/** Detalle de un producto: imagenes, descripcion, precio y disponibilidad. */
export function obtenerProducto(id) {
  return get(`/products/${id}`);
}

/**
 * Alta de un producto (solo ADMIN).
 *
 * Este endpoint es el unico que NO recibe JSON: recibe multipart/form-data,
 * porque junto con los datos del producto suben los archivos de las fotos.
 * Por eso armamos un FormData en vez de un objeto.
 *
 * Importante: el campo se llama "images" (en plural) y se agrega una vez por
 * cada archivo. Asi lo recibe la List<MultipartFile> del ProductRequest.
 */
export function crearProducto({ name, description, price, stock, discount, categoryId, imagenes }) {
  const formulario = new FormData();
  formulario.append('name', name);
  formulario.append('description', description);
  formulario.append('price', price);
  formulario.append('stock', stock);
  formulario.append('discount', discount ?? 0);
  formulario.append('categoryId', categoryId);

  for (const archivo of imagenes) {
    formulario.append('images', archivo);
  }

  return postFormulario('/products', formulario);
}

/**
 * Modificacion de un producto (solo ADMIN).
 *
 * En el backend todos los campos del ProductUpdateRequest son opcionales: se
 * actualiza solo lo que llega. Aprovechamos eso para no mandar las fotos si el
 * admin no eligio fotos nuevas, y asi no le borramos las que ya tenia.
 */
export function actualizarProducto(
  id,
  { name, description, price, stock, discount, categoryId, imagenes },
) {
  const formulario = new FormData();
  formulario.append('name', name);
  formulario.append('description', description);
  formulario.append('price', price);
  formulario.append('stock', stock);
  formulario.append('discount', discount ?? 0);
  formulario.append('categoryId', categoryId);

  // Si no hay archivos nuevos no mandamos el campo: el backend interpreta
  // "images == null" como "dejale las fotos que ya tenia".
  if (imagenes && imagenes.length > 0) {
    for (const archivo of imagenes) {
      formulario.append('images', archivo);
    }
  }

  return putFormulario(`/products/${id}`, formulario);
}

/** Manejo del stock de un producto (solo ADMIN). */
export function actualizarStock(id, stock) {
  return patch(`/products/${id}/stock`, { stock: Number(stock) }, true);
}

/** Gestion de descuentos sobre un producto individual (solo ADMIN). */
export function actualizarDescuento(id, discount) {
  return patch(`/products/${id}/discount`, { discount: Number(discount) }, true);
}

/**
 * Baja de un producto (solo ADMIN).
 * En el backend es una baja logica (active = false): el producto desaparece
 * del catalogo pero las ordenes viejas que lo incluyen siguen intactas.
 */
export function eliminarProducto(id) {
  return eliminar(`/products/${id}`, true);
}
