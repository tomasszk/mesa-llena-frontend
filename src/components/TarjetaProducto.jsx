/* ==========================================================================
   TarjetaProducto
   --------------------------------------------------------------------------
   Cubre tres puntos del enunciado:

   - "Visualizacion de productos disponibles con fotografia y precio".
   - "Al seleccionar alguno de los productos, dirigira al detalle del mismo":
     toda la tarjeta es un Link al detalle.
   - "En caso de que el producto no tenga stock, debera estar indicado y no se
     podra agregarlo al carrito": si available es false mostramos la cinta de
     AGOTADO y el boton queda deshabilitado.

   Es un componente "tonto": no pide datos ni decide nada. Recibe todo por
   props y avisa para arriba cuando el usuario toca el boton. Eso es el flujo
   unidireccional de React: el padre manda los datos, el hijo avisa los eventos.
   ========================================================================== */

import { Link } from 'react-router-dom';
import { precio, primeraImagen } from '../formato';

function TarjetaProducto({ producto, alAgregar, motivoNoPuedeComprar, agregando }) {
  const imagen = primeraImagen(producto);
  const tieneDescuento = producto.discount > 0;
  const agotado = !producto.available;

  // El click del boton no tiene que abrir el detalle: el boton esta adentro
  // del Link, asi que le cortamos la propagacion del evento.
  function agregar(evento) {
    evento.preventDefault();
    evento.stopPropagation();
    alAgregar(producto);
  }

  return (
    <article className={`tarjeta-producto ${agotado ? 'agotado' : ''}`}>
      <Link to={`/productos/${producto.id}`} className="tarjeta-producto-link">
        <div className="tarjeta-producto-imagen">
          {imagen ? (
            <img src={imagen} alt={producto.name} loading="lazy" />
          ) : (
            // Un producto siempre deberia tener foto (el backend lo exige al
            // darlo de alta), pero si por algun motivo no llega ninguna,
            // mostramos un marcador en vez de una imagen rota.
            <div className="imagen-faltante" aria-hidden="true">
              {'\u{1F3B2}'}
            </div>
          )}

          <div className="tarjeta-producto-etiquetas">
            {tieneDescuento && !agotado && (
              <span className="etiqueta etiqueta-oferta">-{producto.discount}%</span>
            )}
            {agotado && <span className="etiqueta etiqueta-agotado">Agotado</span>}
          </div>
        </div>

        <div className="tarjeta-producto-datos">
          <span className="etiqueta etiqueta-categoria">{producto.categoryDescription}</span>
          <h3 className="tarjeta-producto-nombre">{producto.name}</h3>

          <div className="tarjeta-producto-precio">
            <strong>{precio(producto.finalPrice)}</strong>
            {tieneDescuento && (
              <span className="precio-tachado">{precio(producto.price)}</span>
            )}
          </div>

          {!agotado && producto.stock <= 5 && (
            <span className="etiqueta etiqueta-poco">Quedan {producto.stock}</span>
          )}
        </div>
      </Link>

      <div className="tarjeta-producto-accion">
        <button
          type="button"
          className="boton boton-secundario boton-ancho"
          onClick={agregar}
          disabled={agotado || agregando}
        >
          {agotado ? 'Sin stock' : agregando ? 'Agregando...' : 'Agregar al carrito'}
        </button>

        {/* Al visitante sin cuenta no le escondemos el boton: lo dejamos tocar
            y el padre lo manda al login. Es menos frustrante que no entender
            por que no puede comprar. El motivo lo decide el padre, porque no
            es el mismo para un visitante que para la cuenta de la tienda. */}
        {motivoNoPuedeComprar && !agotado && (
          <p className="texto-chico texto-gris sin-margen centrado" style={{ marginTop: '.4rem' }}>
            {motivoNoPuedeComprar}
          </p>
        )}
      </div>
    </article>
  );
}

export default TarjetaProducto;
