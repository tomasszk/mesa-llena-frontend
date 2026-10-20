/* ==========================================================================
   Detalle de una compra
   --------------------------------------------------------------------------
   Sirve para dos cosas: es el comprobante que se ve apenas termina el
   checkout, y es el detalle al que se entra despues desde "Mis compras".

   Los precios que se muestran aca son los que tenia el producto EN EL MOMENTO
   de la compra, no los de hoy. El backend los congela en el OrderItem cuando
   se hace el checkout, justamente para que una orden vieja no cambie de total
   si manana cambiamos el precio del juego.

   El cartel verde de "compra confirmada" aparece solo cuando venimos del
   checkout. Eso lo sabemos por el state que nos manda la vista del carrito al
   navegar hasta aca: si alguien entra a esta direccion mas tarde, no hay state
   y el cartel no se muestra.
   ========================================================================== */

import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Cargando from '../components/Cargando';
import { obtenerOrden } from '../api/ordenes';
import { fechaHora, precio } from '../formato';

function DetalleCompra() {
  const { id } = useParams();
  const ubicacion = useLocation();

  const recienComprada = ubicacion.state?.recienComprada === true;

  const [orden, setOrden] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError('');

    obtenerOrden(id)
      .then((datos) => {
        if (!cancelado) setOrden(datos);
      })
      .catch((e) => {
        if (!cancelado) setError(e.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  if (cargando) {
    return (
      <div className="contenedor">
        <Cargando texto="Buscando la compra..." />
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="contenedor">
        {/* Si la orden es de otra persona el backend responde 404, no 403: asi
            no le confirma a nadie que esa compra existe. */}
        <Aviso tipo="error">{error || 'No encontramos esta compra.'}</Aviso>
        <Link to="/mis-compras" className="boton">
          Volver a mis compras
        </Link>
      </div>
    );
  }

  // Cuantas unidades se compraron en total (no cuantas lineas).
  const unidades = orden.items.reduce((suma, item) => suma + item.quantity, 0);

  return (
    <div className="contenedor">
      <nav className="migas">
        <Link to="/mis-compras">Mis compras</Link>
        <span aria-hidden="true">/</span>
        <span className="texto-gris">Compra #{orden.id}</span>
      </nav>

      {recienComprada && (
        <div className="comprobante-exito">
          <div className="comprobante-icono" aria-hidden="true">
            {'✓'}
          </div>
          <div>
            <h2 className="sin-margen">Listo, tu compra esta confirmada</h2>
            <p className="sin-margen">
              Ya descontamos el stock de cada juego y te guardamos la compra en tu historial.
            </p>
          </div>
        </div>
      )}

      <div className="encabezado-pagina">
        <div>
          <h1>Compra #{orden.id}</h1>
          <p>
            {fechaHora(orden.date)} &middot; {unidades}{' '}
            {unidades === 1 ? 'unidad' : 'unidades'}
          </p>
        </div>

        <Link to="/" className="boton boton-borde">
          Seguir comprando
        </Link>
      </div>

      <div className="panel">
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th className="numero">Precio unitario</th>
                <th className="numero">Descuento</th>
                <th className="numero">Cantidad</th>
                <th className="numero">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orden.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {/* El producto puede haber sido dado de baja despues de la
                        compra. El nombre quedo guardado en la orden, asi que la
                        compra se sigue viendo bien igual. */}
                    <Link to={`/productos/${item.productId}`}>{item.productName}</Link>
                  </td>
                  <td className="numero">{precio(item.unitPrice)}</td>
                  <td className="numero">
                    {item.discount > 0 ? (
                      <span className="etiqueta etiqueta-oferta">-{item.discount}%</span>
                    ) : (
                      <span className="texto-gris">&mdash;</span>
                    )}
                  </td>
                  <td className="numero">{item.quantity}</td>
                  <td className="numero">
                    <strong>{precio(item.subtotal)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="resumen-total" style={{ marginTop: '1rem' }}>
          <span>Total de la compra</span>
          <strong>{precio(orden.total)}</strong>
        </div>
      </div>
    </div>
  );
}

export default DetalleCompra;
