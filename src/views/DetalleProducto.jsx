/* ==========================================================================
   Detalle del producto
   --------------------------------------------------------------------------
   Cubre el punto del enunciado: "Al seleccionar alguno de los productos,
   dirigira al detalle del mismo donde se visualizara la imagen del producto
   junto a su descripcion".

   El id del producto lo saca de la URL con useParams: la ruta esta declarada
   como /productos/:id, asi que useParams() devuelve { id }.
   ========================================================================== */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Cargando from '../components/Cargando';
import { obtenerProducto } from '../api/productos';
import { imagenBase64, precio } from '../formato';

function DetalleProducto({ usuario, alAgregar }) {
  const { id } = useParams();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Cual de las fotos se esta mirando en grande.
  const [imagenActiva, setImagenActiva] = useState(0);

  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);

  /* ------------------------------------------------------------------
     Se pide el producto cada vez que cambia el id de la URL. Es importante
     que el id este en las dependencias: si el usuario pasa de un producto a
     otro desde un link, el componente no se desmonta, solo cambia el id, y
     sin esto seguiria mostrando el producto anterior.
     ------------------------------------------------------------------ */
  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError('');
    setImagenActiva(0);
    setCantidad(1);

    obtenerProducto(id)
      .then((datos) => {
        if (!cancelado) setProducto(datos);
      })
      .catch((e) => {
        if (!cancelado) {
          setError(e.message);
          setProducto(null);
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  async function agregar() {
    setAgregando(true);
    await alAgregar(producto, cantidad);
    setAgregando(false);
  }

  if (cargando) {
    return (
      <div className="contenedor">
        <Cargando texto="Buscando el juego..." />
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="contenedor">
        <Aviso tipo="error">{error || 'No encontramos este producto.'}</Aviso>
        <Link to="/" className="boton">
          Volver al catalogo
        </Link>
      </div>
    );
  }

  const agotado = !producto.available;
  const tieneDescuento = producto.discount > 0;
  const puedeComprar = usuario?.role === 'USER';

  // Cuanto puede llevar como maximo: el stock, pero nunca menos de 1 para que
  // el <select> no quede vacio.
  const maximo = Math.max(producto.stock, 1);

  return (
    <div className="contenedor">
      <nav className="migas">
        <Link to="/">Catalogo</Link>
        <span aria-hidden="true">/</span>
        <span className="texto-gris">{producto.name}</span>
      </nav>

      <div className="detalle">
        {/* ---------------- Las fotos ---------------- */}
        <div className="detalle-fotos">
          <div className="detalle-foto-grande">
            {producto.images?.length > 0 ? (
              <img src={imagenBase64(producto.images[imagenActiva])} alt={producto.name} />
            ) : (
              <div className="imagen-faltante grande" aria-hidden="true">
                {'\u{1F3B2}'}
              </div>
            )}

            {tieneDescuento && !agotado && (
              <span className="etiqueta etiqueta-oferta detalle-etiqueta">
                {producto.discount}% off
              </span>
            )}
            {agotado && (
              <span className="etiqueta etiqueta-agotado detalle-etiqueta">Agotado</span>
            )}
          </div>

          {/* Las miniaturas solo tienen sentido si hay mas de una foto */}
          {producto.images?.length > 1 && (
            <div className="detalle-miniaturas">
              {producto.images.map((imagen, indice) => (
                <button
                  key={indice}
                  type="button"
                  className={`miniatura ${indice === imagenActiva ? 'activa' : ''}`}
                  onClick={() => setImagenActiva(indice)}
                  aria-label={`Ver foto ${indice + 1} de ${producto.images.length}`}
                >
                  <img src={imagenBase64(imagen)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------------- Los datos y la compra ---------------- */}
        <div className="detalle-datos">
          <span className="etiqueta etiqueta-categoria">{producto.categoryDescription}</span>
          <h1>{producto.name}</h1>

          <div className="detalle-precio">
            <strong>{precio(producto.finalPrice)}</strong>
            {tieneDescuento && (
              <>
                <span className="precio-tachado grande">{precio(producto.price)}</span>
                <span className="texto-chico" style={{ color: 'var(--coral)' }}>
                  Ahorras {precio(Number(producto.price) - Number(producto.finalPrice))}
                </span>
              </>
            )}
          </div>

          <p className="detalle-descripcion">{producto.description}</p>

          <div className="detalle-stock">
            {agotado ? (
              <Aviso tipo="error">
                Este juego esta sin stock por ahora, asi que no se puede agregar al carrito.
              </Aviso>
            ) : producto.stock <= 5 ? (
              <Aviso tipo="info">
                Ultimas {producto.stock} {producto.stock === 1 ? 'unidad' : 'unidades'}.
              </Aviso>
            ) : (
              <p className="texto-chico texto-gris">{producto.stock} unidades disponibles</p>
            )}
          </div>

          <div className="detalle-compra">
            <div className="campo" style={{ marginBottom: 0 }}>
              <label htmlFor="cantidad">Cantidad</label>
              <select
                id="cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                disabled={agotado}
              >
                {/* Un option por cada unidad que haya en stock, hasta 10 para
                    no armar una lista interminable. */}
                {Array.from({ length: Math.min(maximo, 10) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="boton boton-secundario"
              onClick={agregar}
              disabled={agotado || agregando}
            >
              {agotado ? 'Sin stock' : agregando ? 'Agregando...' : 'Agregar al carrito'}
            </button>
          </div>

          {!puedeComprar && !agotado && (
            <p className="texto-chico texto-gris">
              {usuario
                ? 'Estas usando la cuenta de la tienda, que vende pero no compra.'
                : 'Vas a necesitar una cuenta para terminar la compra.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetalleProducto;
