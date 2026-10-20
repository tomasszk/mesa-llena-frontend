/* ==========================================================================
   Panel de la tienda: productos
   --------------------------------------------------------------------------
   Cubre los puntos de "Gestion de Productos" del enunciado:
   - alta de la publicacion con una o mas fotos (en FormularioProducto),
   - modificacion de la publicacion,
   - manejo del stock,
   - gestion de descuentos sobre productos individuales,
   - baja del producto.

   El stock y el descuento se editan desde la misma tabla porque son las dos
   cosas que la tienda cambia mas seguido, y el backend tiene un endpoint
   dedicado para cada una (PATCH /products/{id}/stock y /discount). No hace
   falta abrir el formulario completo para tocar un numero.
   ========================================================================== */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Aviso from '../../components/Aviso';
import Cargando from '../../components/Cargando';
import Paginador from '../../components/Paginador';
import Vacio from '../../components/Vacio';
import {
  actualizarDescuento,
  actualizarStock,
  eliminarProducto,
  obtenerProductos,
} from '../../api/productos';
import { precio, primeraImagen } from '../../formato';

const POR_PAGINA = 15;

function AdminProductos({ avisar }) {
  const [productos, setProductos] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalProductos, setTotalProductos] = useState(0);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  /**
   * Que celda se esta editando: { id, campo, valor }.
   * Dejamos editar una sola a la vez para que no queden tres inputs abiertos
   * y el usuario pierda de vista cual guardo y cual no.
   */
  const [edicion, setEdicion] = useState(null);

  // Se incrementa despues de cada cambio para volver a pedir el listado.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError('');

    obtenerProductos({ page: pagina, size: POR_PAGINA })
      .then((respuesta) => {
        if (cancelado) return;
        setProductos(respuesta.content ?? []);
        setTotalPaginas(respuesta.totalPages ?? 0);
        setTotalProductos(respuesta.totalElements ?? 0);
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
  }, [pagina, version]);

  /** Reemplaza un producto en la lista sin volver a pedir todo el listado. */
  function reemplazar(actualizado) {
    setProductos(productos.map((p) => (p.id === actualizado.id ? actualizado : p)));
  }

  function empezarEdicion(producto, campo) {
    setEdicion({
      id: producto.id,
      campo,
      valor: campo === 'stock' ? producto.stock : producto.discount,
    });
  }

  /** Guarda la celda que se estaba editando. */
  async function guardarEdicion() {
    const { id, campo, valor } = edicion;

    // Validamos los mismos limites que valida el backend, para avisarle al
    // usuario antes de mandar una request que ya sabemos que va a fallar.
    const numero = Number(valor);

    if (valor === '' || Number.isNaN(numero) || numero < 0) {
      setError(
        campo === 'stock'
          ? 'El stock tiene que ser un numero de 0 o mas.'
          : 'El descuento tiene que ser un numero entre 0 y 100.',
      );
      return;
    }

    if (campo === 'discount' && numero > 100) {
      setError('El descuento no puede superar el 100%.');
      return;
    }

    setOcupado(true);
    setError('');

    try {
      const actualizado =
        campo === 'stock'
          ? await actualizarStock(id, numero)
          : await actualizarDescuento(id, numero);

      reemplazar(actualizado);
      setEdicion(null);
      avisar('exito', campo === 'stock' ? 'Stock actualizado.' : 'Descuento actualizado.');
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  /** Baja del producto. En el backend es una baja logica. */
  async function borrar(producto) {
    const confirmado = window.confirm(
      `Dar de baja "${producto.name}"?\n\n` +
        'Va a dejar de aparecer en el catalogo y se va a quitar de los carritos. ' +
        'Las compras ya hechas no se tocan.',
    );
    if (!confirmado) return;

    setOcupado(true);
    setError('');

    try {
      await eliminarProducto(producto.id);
      avisar('exito', `Diste de baja ${producto.name}.`);

      // Si era el ultimo producto de la pagina, retrocedemos una pagina para
      // no quedar mirando una tabla vacia.
      if (productos.length === 1 && pagina > 0) {
        setPagina(pagina - 1);
      } else {
        setVersion(version + 1);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="contenedor">
      <div className="encabezado-pagina">
        <div>
          <h1>Productos</h1>
          <p>
            {totalProductos} {totalProductos === 1 ? 'producto publicado' : 'productos publicados'}{' '}
            en Mesa Llena.
          </p>
        </div>

        <Link to="/admin/productos/nuevo" className="boton">
          + Publicar producto
        </Link>
      </div>

      <Aviso tipo="error" alCerrar={() => setError('')}>
        {error}
      </Aviso>

      {cargando ? (
        <Cargando texto="Cargando los productos..." />
      ) : productos.length === 0 ? (
        <Vacio
          icono={'\u{1F3B2}'}
          titulo="Todavia no hay productos publicados"
          accion={
            <Link to="/admin/productos/nuevo" className="boton">
              Publicar el primero
            </Link>
          }
        >
          Carga un juego con su foto, su precio y su categoria para que aparezca en el catalogo.
        </Vacio>
      ) : (
        <>
          <div className="panel">
            <div className="tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Producto</th>
                    <th>Categoria</th>
                    <th className="numero">Precio</th>
                    <th className="numero">Descuento</th>
                    <th className="numero">Precio final</th>
                    <th className="numero">Stock</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {productos.map((producto) => {
                    const imagen = primeraImagen(producto);
                    const editandoStock =
                      edicion?.id === producto.id && edicion.campo === 'stock';
                    const editandoDescuento =
                      edicion?.id === producto.id && edicion.campo === 'discount';

                    return (
                      <tr key={producto.id}>
                        <td>
                          <div className="miniatura-tabla">
                            {imagen ? (
                              <img src={imagen} alt="" />
                            ) : (
                              <div className="imagen-faltante" aria-hidden="true">
                                {'\u{1F3B2}'}
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          <Link to={`/productos/${producto.id}`}>
                            <strong>{producto.name}</strong>
                          </Link>
                          <br />
                          <span className="texto-chico texto-gris">#{producto.id}</span>
                        </td>

                        <td>
                          <span className="etiqueta etiqueta-categoria">
                            {producto.categoryDescription}
                          </span>
                        </td>

                        <td className="numero">{precio(producto.price)}</td>

                        {/* ---- Descuento editable ---- */}
                        <td className="numero">
                          {editandoDescuento ? (
                            <div className="edicion-celda">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={edicion.valor}
                                onChange={(e) =>
                                  setEdicion({ ...edicion, valor: e.target.value })
                                }
                                onFocus={(e) => e.target.select()}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="boton boton-secundario boton-chico"
                                onClick={guardarEdicion}
                                disabled={ocupado}
                              >
                                {'✓'}
                              </button>
                              <button
                                type="button"
                                className="boton boton-borde boton-chico"
                                onClick={() => setEdicion(null)}
                                disabled={ocupado}
                              >
                                {'✕'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="boton-texto"
                              onClick={() => empezarEdicion(producto, 'discount')}
                              title="Editar el descuento"
                            >
                              {producto.discount > 0 ? `${producto.discount}%` : 'sin descuento'}
                            </button>
                          )}
                        </td>

                        <td className="numero">
                          <strong>{precio(producto.finalPrice)}</strong>
                        </td>

                        {/* ---- Stock editable ---- */}
                        <td className="numero">
                          {editandoStock ? (
                            <div className="edicion-celda">
                              <input
                                type="number"
                                min="0"
                                value={edicion.valor}
                                onChange={(e) =>
                                  setEdicion({ ...edicion, valor: e.target.value })
                                }
                                onFocus={(e) => e.target.select()}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="boton boton-secundario boton-chico"
                                onClick={guardarEdicion}
                                disabled={ocupado}
                              >
                                {'✓'}
                              </button>
                              <button
                                type="button"
                                className="boton boton-borde boton-chico"
                                onClick={() => setEdicion(null)}
                                disabled={ocupado}
                              >
                                {'✕'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="boton-texto"
                              onClick={() => empezarEdicion(producto, 'stock')}
                              title="Editar el stock"
                            >
                              {producto.stock === 0 ? (
                                <span className="etiqueta etiqueta-agotado">Agotado</span>
                              ) : (
                                producto.stock
                              )}
                            </button>
                          )}
                        </td>

                        <td>
                          <div className="celda-acciones">
                            <Link
                              to={`/admin/productos/${producto.id}/editar`}
                              className="boton boton-borde boton-chico"
                            >
                              Editar
                            </Link>
                            <button
                              type="button"
                              className="boton boton-peligro boton-chico"
                              onClick={() => borrar(producto)}
                              disabled={ocupado}
                            >
                              Dar de baja
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Paginador pagina={pagina} totalPaginas={totalPaginas} alCambiarPagina={setPagina} />
        </>
      )}
    </div>
  );
}

export default AdminProductos;
