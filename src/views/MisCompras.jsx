/* ==========================================================================
   Mis compras (historial de ordenes)
   --------------------------------------------------------------------------
   Es el listado de ordenes del usuario logueado. El backend lo trae ordenado
   de la mas nueva a la mas vieja y solo devuelve las del dueno del token:
   nadie puede ver las compras de otra persona.
   ========================================================================== */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Cargando from '../components/Cargando';
import Paginador from '../components/Paginador';
import Vacio from '../components/Vacio';
import { obtenerMisOrdenes } from '../api/ordenes';
import { fechaHora, precio } from '../formato';

const POR_PAGINA = 10;

function MisCompras() {
  const [ordenes, setOrdenes] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError('');

    obtenerMisOrdenes({ page: pagina, size: POR_PAGINA })
      .then((respuesta) => {
        if (cancelado) return;
        setOrdenes(respuesta.content ?? []);
        setTotalPaginas(respuesta.totalPages ?? 0);
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
  }, [pagina]);

  if (cargando) {
    return (
      <div className="contenedor">
        <Cargando texto="Buscando tus compras..." />
      </div>
    );
  }

  return (
    <div className="contenedor">
      <div className="encabezado-pagina">
        <div>
          <h1>Mis compras</h1>
          <p>Todas las compras que hiciste en Mesa Llena.</p>
        </div>
      </div>

      <Aviso tipo="error">{error}</Aviso>

      {ordenes.length === 0 && !error ? (
        <Vacio
          icono={'\u{1F4E6}'}
          titulo="Todavia no compraste nada"
          accion={
            <Link to="/" className="boton">
              Ver el catalogo
            </Link>
          }
        >
          Cuando termines una compra te va a quedar registrada aca.
        </Vacio>
      ) : (
        <>
          <ul className="lista-ordenes">
            {ordenes.map((orden) => (
              <li key={orden.id}>
                <Link to={`/mis-compras/${orden.id}`} className="orden panel">
                  <div className="orden-datos">
                    <h3 className="sin-margen">Compra #{orden.id}</h3>
                    <p className="texto-chico texto-gris sin-margen">{fechaHora(orden.date)}</p>
                    <p className="texto-chico sin-margen" style={{ marginTop: '.35rem' }}>
                      {orden.items.length}{' '}
                      {orden.items.length === 1 ? 'producto' : 'productos'}:{' '}
                      <span className="texto-gris">
                        {/* Mostramos los primeros tres nombres como adelanto */}
                        {orden.items
                          .slice(0, 3)
                          .map((item) => item.productName)
                          .join(', ')}
                        {orden.items.length > 3 && ` y ${orden.items.length - 3} mas`}
                      </span>
                    </p>
                  </div>

                  <div className="orden-total">
                    <span className="texto-chico texto-gris">Total</span>
                    <strong>{precio(orden.total)}</strong>
                    <span className="texto-chico" style={{ color: 'var(--turquesa-oscuro)' }}>
                      Ver detalle &rarr;
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <Paginador pagina={pagina} totalPaginas={totalPaginas} alCambiarPagina={setPagina} />
        </>
      )}
    </div>
  );
}

export default MisCompras;
