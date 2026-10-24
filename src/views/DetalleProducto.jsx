/* ==========================================================================
   Detalle del producto
   --------------------------------------------------------------------------
   Cubre el punto del enunciado: "Al seleccionar alguno de los productos,
   dirigirá al detalle del mismo donde se visualizará la imagen del producto
   junto a su descripción".

   Además de eso muestra la ficha del juego: para cuántos jugadores es, cuánto
   dura una partida, desde qué edad, y una explicación de cómo se juega. Todo
   eso son campos del producto y vienen del backend, igual que el precio: no
   hay ningún dato escrito a mano en el frontend.

   La pantalla se arma alrededor de la foto del juego: la misma imagen se usa
   dos veces, nítida adelante y desenfocada y oscurecida como fondo, y de ella
   sale también el color de los acentos (ver colorDeImagen.js). Así cada juego
   tiene su propia página sin que haya una lista de juegos escrita a mano: uno
   que la tienda publique mañana se va a ver igual de propio.

   El id del producto sale de la URL con useParams: la ruta está declarada
   como /productos/:id, así que useParams() devuelve { id }.
   ========================================================================== */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Cargando from '../components/Cargando';
import TarjetaChica from '../components/TarjetaChica';
import { obtenerProducto, obtenerProductos } from '../api/productos';
import { imagenBase64, precio, primeraImagen } from '../formato';
import { colorDominante, variablesDeTema } from '../colorDeImagen';

/** Cuántos juegos de la misma categoría mostramos abajo del detalle. */
const RELACIONADOS = 4;

function DetalleProducto({ usuario, alAgregar }) {
  const { id } = useParams();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Cuál de las fotos se está mirando en grande.
  const [imagenActiva, setImagenActiva] = useState(0);

  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);

  // Otros juegos de la misma categoría, para que el usuario siga mirando.
  const [relacionados, setRelacionados] = useState([]);

  // Los colores sacados de la caja del juego.
  const [tema, setTema] = useState(null);

  /* ------------------------------------------------------------------
     Se pide el producto cada vez que cambia el id de la URL. Es importante
     que el id esté en las dependencias: si el usuario pasa de un producto a
     otro desde un link, el componente no se desmonta, solo cambia el id, y
     sin esto seguiría mostrando el producto anterior.
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
     operación asincrónica (el navegador tiene que decodificar la imagen),
     así que va en su propio efecto y no bloquea el renderizado: la página se
     ve igual mientras tanto, solo que todavía sin teñir.
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
     Una vez que sabemos de qué categoría es el producto, pedimos otros de la
     misma. Este efecto depende de la categoría y del id, no del objeto
     producto entero: si dependiera del objeto se volvería a ejecutar en cada
     render que lo reemplace, aunque la categoría sea la misma.
     ------------------------------------------------------------------ */
  const categoriaId = producto?.categoryId;

  useEffect(() => {
    if (!categoriaId) {
      setRelacionados([]);
      return;
    }

    let cancelado = false;

    // Pedimos uno de más, porque uno de los que vuelven es el que ya estamos
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
        // sección. No tiene sentido avisarle nada al usuario por esto.
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
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const agotado = !producto.available;
  const tieneDescuento = producto.discount > 0;
  const puedeComprar = usuario?.role === 'USER';

  // Cuánto puede llevar como máximo: el stock, pero nunca menos de 1 para que
  // el <select> no quede vacío.
  const maximo = Math.max(producto.stock, 1);

  // La ficha del juego. Cada dato se muestra solo si el producto lo tiene
  // cargado, así un producto sin ficha no deja huecos raros en la pantalla.
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
      titulo: 'Dura',
      valor: `${producto.durationMinutes} min`,
    });
  }

  if (producto.minAge) {
    ficha.push({ icono: '\u{1F382}', titulo: 'Desde', valor: `${producto.minAge} años` });
  }

  ficha.push({
    icono: '\u{1F3F2}',
    titulo: 'Tipo',
    valor: producto.categoryDescription,
  });

  // El style lleva las variables del tema. De ahí para abajo, el CSS las usa.
  return (
    <div className="juego" style={tema}>
      {/* ================= Portada inmersiva ================= */}
      <section className="juego-hero">
        {/*
          La misma foto, de fondo, desenfocada y oscurecida. Es la forma más
          directa de que cada página tenga su propia identidad sin inventar
          nada: el ambiente sale literalmente del producto.
          aria-hidden porque no aporta información: es la misma imagen que ya
          está al lado, nítida y con su alt.
        */}
        <div className="juego-hero-fondo" aria-hidden="true">
          {portada && <img src={portada} alt="" />}
        </div>

        <div className="contenedor juego-hero-contenido">
          <nav className="migas migas-claras">
            <Link to="/">Catálogo</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/?categoria=${producto.categoryId}`}>
              {producto.categoryDescription}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{producto.name}</span>
          </nav>

          <div className="juego-grilla">
            {/* ---------------- Las fotos ---------------- */}
            <div className="juego-fotos">
              <div className="juego-foto-grande">
                {producto.images?.length > 0 ? (
                  <img src={imagenBase64(producto.images[imagenActiva])} alt={producto.name} />
                ) : (
                  <div className="imagen-faltante grande" aria-hidden="true">
                    {'\u{1F3B2}'}
                  </div>
                )}

                {tieneDescuento && !agotado && (
                  <span className="etiqueta etiqueta-oferta juego-etiqueta">
                    {producto.discount}% off
                  </span>
                )}
                {agotado && (
                  <span className="etiqueta etiqueta-agotado juego-etiqueta">Agotado</span>
                )}
              </div>

              {/* Las miniaturas solo tienen sentido si hay más de una foto */}
              {producto.images?.length > 1 && (
                <div className="juego-miniaturas">
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
            <div className="juego-info">
              <span className="juego-categoria">{producto.categoryDescription}</span>
              <h1>{producto.name}</h1>
              <p className="juego-bajada">{producto.description}</p>

              {/* La ficha, en línea y sobre la foto de fondo */}
              {ficha.length > 0 && (
                <ul className="juego-ficha">
                  {ficha.map((dato) => (
                    <li key={dato.titulo}>
                      <span className="juego-ficha-icono" aria-hidden="true">
                        {dato.icono}
                      </span>
                      <span className="juego-ficha-texto">
                        <small>{dato.titulo}</small>
                        <strong>{dato.valor}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* La caja de compra, en blanco para que se despegue del fondo */}
              <div className="juego-compra">
                <div className="juego-precio">
                  <strong>{precio(producto.finalPrice)}</strong>
                  {tieneDescuento && (
                    <span className="juego-precio-viejo">
                      <span className="precio-tachado">{precio(producto.price)}</span>
                      <span className="juego-ahorro">
                        Ahorras {precio(Number(producto.price) - Number(producto.finalPrice))}
                      </span>
                    </span>
                  )}
                </div>

                <div className="juego-acciones">
                  <div className="campo" style={{ marginBottom: 0 }}>
                    <label htmlFor="cantidad">Cantidad</label>
                    <select
                      id="cantidad"
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                      disabled={agotado}
                    >
                      {/* Un option por cada unidad que haya en stock, hasta 10
                          para no armar una lista interminable. */}
                      {Array.from({ length: Math.min(maximo, 10) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="boton boton-comprar"
                    onClick={agregar}
                    disabled={agotado || agregando}
                  >
                    {agotado ? 'Sin stock' : agregando ? 'Agregando...' : 'Agregar al carrito'}
                  </button>
                </div>

                <p className="juego-nota">
                  {agotado
                    ? 'Por ahora no hay unidades. Volvé a mirar en unos días.'
                    : producto.stock <= 5
                      ? `Últimas ${producto.stock} ${producto.stock === 1 ? 'unidad' : 'unidades'}`
                      : `${producto.stock} unidades disponibles`}
                  {!puedeComprar &&
                    !agotado &&
                    (usuario
                      ? ' · la cuenta de la tienda no compra'
                      : ' · vas a necesitar una cuenta')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="contenedor">
        {/* ================= Cómo se juega ================= */}
        {producto.howToPlay && (
          <section className="como-se-juega">
            <div className="como-se-juega-marca" aria-hidden="true">
              {'⚄'}
            </div>
            <div>
              <h2>Cómo se juega</h2>
              <p>{producto.howToPlay}</p>
            </div>
          </section>
        )}

        {/* ================= Otros de la categoría ================= */}
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
