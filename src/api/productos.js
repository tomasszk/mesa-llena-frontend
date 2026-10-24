/* ==========================================================================
   Catálogo y gestión de productos  ->  /products
   --------------------------------------------------------------------------
   Los GET son públicos: se puede mirar el catálogo sin estar registrado.
   El alta, la modificación, el stock, el descuento y la baja son solo del
   ADMIN, y por eso esas funciones mandan el token (conToken = true).
   ========================================================================== */

import { eliminar, get, patch, postFormulario, putFormulario } from './cliente';

/**
 * Catálogo con filtros y paginado.
 *
 * Solo manda al backend los filtros que el usuario realmente completo: si
 * mandáramos minPrice vacío, Spring no podría convertir "" a BigDecimal y
 * tendríamos un 400. Por eso vamos agregando parámetros de a uno.
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

/** Detalle de un producto: imágenes, descripción, precio y disponibilidad. */
export function obtenerProducto(id) {
  return get(`/products/${id}`);
}

/**
 * Agrega al formulario los datos de la ficha del juego.
 *
 * Los campos vacíos no se mandan: en el backend son opcionales, y si
 * mandáramos un string vacío Spring no podría convertirlo a Integer y la
 * request fallaría con un 400.
 */
function agregarFicha(formulario, ficha) {
  if (!ficha) return;

  for (const [campo, valor] of Object.entries(ficha)) {
    if (valor !== '' && valor != null) formulario.append(campo, valor);
  }
}

/**
 * Alta de un producto (solo ADMIN).
 *
 * Este endpoint es el único que NO recibe JSON: recibe multipart/form-data,
 * porque junto con los datos del producto suben los archivos de las fotos.
 * Por eso armamos un FormData en vez de un objeto.
 *
 * Importante: el campo se llama "images" (en plural) y se agrega una vez por
 * cada archivo. Así lo recibe la List<MultipartFile> del ProductRequest.
 */
export function crearProducto({ name, description, price, stock, discount, categoryId,
  imagenes, ficha }) {
  const formulario = new FormData();
  formulario.append('name', name);
  formulario.append('description', description);
  formulario.append('price', price);
  formulario.append('stock', stock);
  formulario.append('discount', discount ?? 0);
  formulario.append('categoryId', categoryId);

  agregarFicha(formulario, ficha);

  for (const archivo of imagenes) {
    formulario.append('images', archivo);
  }

  return postFormulario('/products', formulario);
}

/**
 * Modificación de un producto (solo ADMIN).
 *
 * En el backend todos los campos del ProductUpdateRequest son opcionales: se
 * actualiza solo lo que llega. Aprovechamos eso para no mandar las fotos si el
 * admin no eligió fotos nuevas, y así no le borramos las que ya tenía.
 */
export function actualizarProducto(
  id,
  { name, description, price, stock, discount, categoryId, imagenes, ficha },
) {
  const formulario = new FormData();
  formulario.append('name', name);
  formulario.append('description', description);
  formulario.append('price', price);
  formulario.append('stock', stock);
  formulario.append('discount', discount ?? 0);
  formulario.append('categoryId', categoryId);

  agregarFicha(formulario, ficha);

  // Si no hay archivos nuevos no mandamos el campo: el backend interpreta
  // "images == null" como "dejale las fotos que ya tenía".
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

/** Gestión de descuentos sobre un producto individual (solo ADMIN). */
export function actualizarDescuento(id, discount) {
  return patch(`/products/${id}/discount`, { discount: Number(discount) }, true);
}

/**
 * Baja de un producto (solo ADMIN).
 * En el backend es una baja lógica (active = false): el producto desaparece
 * del catálogo pero las órdenes viejas que lo incluyen siguen intactas.
 */
export function eliminarProducto(id) {
  return eliminar(`/products/${id}`, true);
}
