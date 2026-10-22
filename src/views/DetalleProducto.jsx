/* ==========================================================================
   Detalle del producto
   --------------------------------------------------------------------------
   Cubre el punto del enunciado: "Al seleccionar alguno de los productos,
   dirigira al detalle del mismo donde se visualizara la imagen del producto
   junto a su descripcion".

   Ademas de eso muestra la ficha del juego: para cuantos jugadores es, cuanto
   dura una partida, desde que edad, y una explicacion de como se juega. Todo
   eso son campos del producto y vienen del backend, igual que el precio: no
   hay ningun dato escrito a mano en el frontend.

   La pagina se tiñe con los colores de la caja del juego. Ese color tampoco
   esta escrito en una lista: se calcula de la propia foto (ver
   colorDeImagen.js), asi que un juego que la tienda publique manana tambien
   va a tener su pagina tematizada sin tocar codigo.

   El id del producto sale de la URL con useParams: la ruta esta declarada
   como /productos/:id, asi que useParams() devuelve { id }.
   ========================================================================== */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Cargando from '../components/Cargando';
import TarjetaChica from '../components/TarjetaChica';
import { obtenerProducto, obtenerProductos } from '../api/productos';
import { imagenBase64, precio, primeraImagen } from '../formato';
import { colorDominante, variablesDeTema } from '../colorDeImagen';

/** Cuantos juegos de la misma categoria mostramos abajo del detalle. */
const RELACIONADOS = 4;

function DetalleProducto({ usuario, alAgregar }) {
  const { id } = useParams();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Cual de las fotos se esta mirando en grande.
  const [imagenActiva, setImagenActiva] = useState(0);

  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);

  // Otros juegos de la misma categoria, para que el usuario siga mirando.
  const [relacionados, setRelacionados] = useState([]);

  // Los colores sacados de la caja del juego.
  const [tema, setTema] = useState(null);

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
    setTema(null);

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

  /* ------------------------------------------------------------------
     Cuando ya tenemos la foto, le sacamos el color dominante. Es una
     operacion asincronica (el navegador tiene que decodificar la imagen),
     asi que va en su propio efecto y no bloquea el renderizado: la pagina se
     ve igual mientras tanto, solo que todavia sin teñir.
     ------------------------------------------------------------------ */
  const portada = producto ? primeraImagen(producto) : null;

  useEffect(() => {
    let cancelado = false;

    colorDominante(portada).then((color) => {
      if (!cancelado) setTema(variablesDeTema(color));
    });

    return () => {
      cancelado = true;
    };
  }, [portada]);

  /* ------------------------------------------------------------------
     Una vez que sabemos de que categoria es el producto, pedimos otros de la
     misma. Este efecto depende de la categoria y del id, no del objeto
     producto entero: si dependiera del objeto se volveria a ejecutar en cada
     render que lo reemplace, aunque la categoria sea la misma.
     ------------------------------------------------------------------ */
  const categoriaId = producto?.categoryId;

  useEffect(() => {
    if (!categoriaId) {
      setRelacionados([]);
      return;
    }

    let cancelado = false;

    // Pedimos uno de mas, porque uno de los que vuelven es el que ya estamos
    // mirando y lo vamos a descartar.
    obtenerProductos({ categoryId: categoriaId, size: RELACIONADOS + 1 })
      .then((respuesta) => {
        if (cancelado) return;

        const otros = (respuesta.content ?? [])
          .filter((p) => String(p.id) !== String(id))
          .slice(0, RELACIONADOS);

        setRelacionados(otros);
      })
      .catch(() => {
        // Es contenido secundario: si falla, simplemente no mostramos la
        // seccion. No tiene sentido avisarle nada al usuario por esto.
        if (!cancelado) setRelacionados([]);
      });

    return () => {
      cancelado = true;
    };
  }, [categoriaId, id]);

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

  // La ficha del juego. Cada dato se muestra solo si el producto lo tiene
  // cargado, asi un producto sin ficha no deja huecos raros en la pantalla.
  const ficha = [];

  if (producto.minPlayers && producto.maxPlayers) {
    ficha.push({
      icono: '\u{1F465}',
      titulo: 'Jugadores',
      valor:
        producto.minPlayers === producto.maxPlayers
          ? `${producto.minPlayers}`
          : `${producto.minPlayers} a ${producto.maxPlayers}`,
    });
  }

  if (producto.durationMinutes) {
    ficha.push({
      icono: '\u{23F1}',
      titulo: 'Duracion',
      valor: `${producto.durationMinutes} min`,
    });
  }

  if (producto.minAge) {
    ficha.push({
      icono: '\u{1F382}',
      titulo: 'Edad',
      valor: `${producto.minAge}+`,
    });
  }

  ficha.push({
    icono: '\u{1F3F7}',
    titulo: 'Categoria',
    valor: producto.categoryDescription,
  });

  // El style lleva las variables del tema. De ahi para abajo, el CSS las usa.
  return (
    <div className="juego" style={tema}>
      <div className="contenedor">
        <nav className="migas">
          <Link to="/">Catalogo</Link>
          <span aria-hidden="true">/</span>
          <span className="texto-gris">{producto.name}</span>
        </nav>
      </div>

      {/* ---------------- Portada tematizada ---------------- */}
      <section className="juego-portada">
        <div className="contenedor detalle">
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

          <div className="detalle-datos">
            <span className="juego-categoria">{producto.categoryDescription}</span>
            <h1>{producto.name}</h1>

            <p className="juego-bajada">{producto.description}</p>

            <div className="detalle-precio">
              <strong>{precio(producto.finalPrice)}</strong>
              {tieneDescuento && (
                <>
                  <span className="precio-tachado grande">{precio(producto.price)}</span>
                  <span className="juego-ahorro">
                    Ahorras {precio(Number(producto.price) - Number(producto.finalPrice))}
                  </span>
                </>
              )}
            </div>

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
                <p className="texto-chico juego-stock">
                  {producto.stock} unidades disponibles
                </p>
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
                className="boton boton-coral"
                onClick={agregar}
                disabled={agotado || agregando}
              >
                {agotado ? 'Sin stock' : agregando ? 'Agregando...' : 'Agregar al carrito'}
              </button>
            </div>

            {!puedeComprar && !agotado && (
              <p className="texto-chico juego-stock">
                {usuario
                  ? 'Estas usando la cuenta de la tienda, que vende pero no compra.'
                  : 'Vas a necesitar una cuenta para terminar la compra.'}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="contenedor">
        {/* ---------------- Ficha del juego ---------------- */}
        <section className="ficha">
          {ficha.map((dato) => (
            <div key={dato.titulo} className="ficha-dato">
              <span className="ficha-icono" aria-hidden="true">
                {dato.icono}
              </span>
              <span className="ficha-titulo">{dato.titulo}</span>
              <strong className="ficha-valor">{dato.valor}</strong>
            </div>
          ))}
        </section>

        {/* ---------------- Como se juega ---------------- */}
        {producto.howToPlay && (
          <section className="como-se-juega panel">
            <h2>Como se juega</h2>
            <p>{producto.howToPlay}</p>
          </section>
        )}

        {/* ---------------- Otros juegos de la categoria ---------------- */}
        {relacionados.length > 0 && (
          <section className="relacionados">
            <h2>Mas de {producto.categoryDescription}</h2>

            <div className="grilla-chica">
              {relacionados.map((otro) => (
                <TarjetaChica key={otro.id} producto={otro} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default DetalleProducto;
