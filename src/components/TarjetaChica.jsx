/* ==========================================================================
   TarjetaChica
   --------------------------------------------------------------------------
   La version compacta de la tarjeta de producto. La usa el detalle para
   mostrar otros juegos de la misma categoria.

   No trae el boton de agregar al carrito a proposito: desde aca lo unico que
   queremos es que el usuario siga mirando. Si le interesa, entra al detalle y
   compra desde ahi.
   ========================================================================== */

import { Link } from 'react-router-dom';
import { precio, primeraImagen } from '../formato';

function TarjetaChica({ producto }) {
  const imagen = primeraImagen(producto);
  const agotado = !producto.available;

  return (
    <Link to={`/productos/${producto.id}`} className="tarjeta-chica">
      <div className="tarjeta-chica-imagen">
        {imagen ? (
          <img src={imagen} alt={producto.name} loading="lazy" />
        ) : (
          <div className="imagen-faltante" aria-hidden="true">
            {'\u{1F3B2}'}
          </div>
        )}

        {agotado && <span className="etiqueta etiqueta-agotado tarjeta-chica-etiqueta">Agotado</span>}
        {!agotado && producto.discount > 0 && (
          <span className="etiqueta etiqueta-oferta tarjeta-chica-etiqueta">
            -{producto.discount}%
          </span>
        )}
      </div>

      <div className="tarjeta-chica-datos">
        <h4>{producto.name}</h4>
        <strong>{precio(producto.finalPrice)}</strong>
      </div>
    </Link>
  );
}

export default TarjetaChica;
