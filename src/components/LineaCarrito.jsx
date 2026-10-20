/* ==========================================================================
   LineaCarrito: una fila del carrito
   --------------------------------------------------------------------------
   Cubre "Gestion del carrito de compras, con la posibilidad de agregar,
   eliminar o modificar productos": desde aca se cambia la cantidad y se
   elimina la linea.

   El subtotal no lo calculamos aca: lo calcula el backend y nos lo manda en
   la CartItemResponse. Es importante que la plata la calcule un solo lado,
   porque si el frontend hiciera su propia cuenta podria mostrar un total
   distinto al que se va a cobrar.
   ========================================================================== */

import { precio, imagenBase64 } from '../formato';

function LineaCarrito({ item, alCambiarCantidad, alQuitar, ocupado }) {
  const imagen = imagenBase64(item.image);

  // No dejamos subir la cantidad mas alla del stock: el backend lo rechazaria
  // igual, pero es mejor frenarlo antes de que el usuario toque el boton.
  const puedeSumar = item.quantity < item.stock;
  const puedeRestar = item.quantity > 1;

  // Si entre que agrego el producto y ahora bajo el stock, se lo avisamos:
  // el checkout iba a fallar y conviene que lo sepa antes.
  const excedeStock = item.quantity > item.stock;

  return (
    <li className={`linea-carrito ${excedeStock ? 'linea-con-problema' : ''}`}>
      <div className="linea-carrito-imagen">
        {imagen ? (
          <img src={imagen} alt={item.productName} />
        ) : (
          <div className="imagen-faltante" aria-hidden="true">
            {'\u{1F3B2}'}
          </div>
        )}
      </div>

      <div className="linea-carrito-datos">
        <h3 className="sin-margen">{item.productName}</h3>
        <p className="texto-chico texto-gris sin-margen">
          {precio(item.unitPrice)} por unidad
          {item.discount > 0 && (
            <span className="etiqueta etiqueta-oferta" style={{ marginLeft: '.5rem' }}>
              -{item.discount}%
            </span>
          )}
        </p>

        {excedeStock && (
          <p className="error-campo">
            Solo quedan {item.stock} unidades. Baja la cantidad para poder comprar.
          </p>
        )}
      </div>

      <div className="linea-carrito-cantidad">
        <button
          type="button"
          className="boton boton-borde boton-chico"
          onClick={() => alCambiarCantidad(item, item.quantity - 1)}
          disabled={ocupado || !puedeRestar}
          aria-label={`Quitar una unidad de ${item.productName}`}
        >
          &minus;
        </button>

        <span className="linea-carrito-numero">{item.quantity}</span>

        <button
          type="button"
          className="boton boton-borde boton-chico"
          onClick={() => alCambiarCantidad(item, item.quantity + 1)}
          disabled={ocupado || !puedeSumar}
          aria-label={`Agregar una unidad de ${item.productName}`}
          title={puedeSumar ? '' : 'No hay mas stock de este producto'}
        >
          +
        </button>
      </div>

      <div className="linea-carrito-subtotal numero">
        <strong>{precio(item.subtotal)}</strong>
      </div>

      <div className="linea-carrito-quitar">
        <button
          type="button"
          className="boton boton-peligro boton-chico"
          onClick={() => alQuitar(item)}
          disabled={ocupado}
        >
          Quitar
        </button>
      </div>
    </li>
  );
}

export default LineaCarrito;
