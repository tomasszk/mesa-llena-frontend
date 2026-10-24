/* ==========================================================================
   Catálogo (home)
   --------------------------------------------------------------------------
   Es la vista pública: se puede mirar sin tener cuenta, igual que en cualquier
   e-commerce. Para comprar sí hace falta loguearse.

   Cubre del enunciado:
   - "Visualización de productos disponibles con fotografía y precio".
   - "Búsqueda y filtrado de productos por categoría, precio, etc."
   - "Opción para añadir productos al carrito".
   ========================================================================== */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChipsCategorias from '../components/ChipsCategorias';
import Filtros from '../components/Filtros';
import TarjetaProducto from '../components/TarjetaProducto';
import Paginador from '../components/Paginador';
import Aviso from '../components/Aviso';
import Cargando from '../components/Cargando';
import Vacio from '../components/Vacio';
import { obtenerProductos } from '../api/productos';
import { obtenerCategorias } from '../api/categorias';

const POR_PAGINA = 12;

const SIN_FILTROS = {
  search: '',
  minPrice: '',
  maxPrice: '',
  onlyAvailable: false,
};

function Catalogo({ usuario, alAgregar }) {
  // --- Datos que mostramos ---
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalProductos, setTotalProductos] = useState(null);

  // --- Qué le pedimos al backend ---
  /*
   * La categoría elegida vive en la URL y no en un useState.
   *
   * Es el filtro que más se usa, y teniéndolo en la dirección pasan tres
   * cosas que con un estado común no: se puede compartir o guardar el link de
   * una categoría, el botón de atrás del navegador funciona como uno espera,
   * y otras pantallas pueden linkear directo a una categoría (lo hace la miga
   * de pan del detalle del producto).
   */
  const [parametros, setParametros] = useSearchParams();
  const categoriaId = parametros.get('categoria') ?? '';

  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [pagina, setPagina] = useState(0);

  // --- Los tres estados de cualquier pedido al backend ---
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Cuál producto se está agregando, para deshabilitar solo ese botón.
  const [agregandoId, setAgregandoId] = useState(null);

  /* ------------------------------------------------------------------
     Las categorías se piden UNA sola vez, cuando el componente se monta.
     Por eso el array de dependencias va vacío: [].
     ------------------------------------------------------------------ */
  useEffect(() => {
    obtenerCategorias()
      .then((pagina) => setCategorias(pagina.content ?? []))
      .catch(() => {
        // Si fallan las categorías el catálogo igual funciona: simplemente no
        // se ven los chips. No vale la pena romper toda la pantalla por eso.
        setCategorias([]);
      });
  }, []);

  /* ------------------------------------------------------------------
     Los productos se vuelven a pedir cada vez que cambia algún filtro o la
     página. Eso es lo que dice el array de dependencias.

     El flag "cancelado" evita un problema clásico: si el usuario cambia el
     filtro dos veces rápido, podrían volver las dos respuestas y la primera
     (más lenta) pisar a la segunda. Con esto, cuando el efecto se vuelve a
     ejecutar, la respuesta vieja se descarta.
     ------------------------------------------------------------------ */
  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError('');

    obtenerProductos({ ...filtros, categoryId: categoriaId, page: pagina, size: POR_PAGINA })
      .then((respuesta) => {
        if (cancelado) return;

        // El backend devuelve un Page de Spring: los productos vienen adentro
        // de "content", no en la raíz de la respuesta.
        setProductos(respuesta.content ?? []);
        setTotalPaginas(respuesta.totalPages ?? 0);
        setTotalProductos(respuesta.totalElements ?? 0);
      })
      .catch((e) => {
        if (cancelado) return;
        setError(e.message);
        setProductos([]);
        setTotalProductos(null);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [filtros, categoriaId, pagina]);

  /** Al cambiar cualquier filtro volvemos a la primera página. */
  function aplicarFiltros(filtrosNuevos) {
    setFiltros(filtrosNuevos);
    setPagina(0);
  }

  function elegirCategoria(id) {
    // replace: true para no llenar el historial con un paso por cada chip que
    // el usuario toca mientras curiosea.
    setParametros(id ? { categoria: id } : {}, { replace: true });
    setPagina(0);
  }

  function cambiarPagina(paginaNueva) {
    setPagina(paginaNueva);
    // Al cambiar de página subimos la pantalla, si no el usuario queda
    // mirando el medio de la lista nueva.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Agregar al carrito. La función que hace el trabajo vive en App (porque
   * tiene que actualizar el contador del navbar); acá solo marcamos qué botón
   * está ocupado mientras va y vuelve la request.
   */
  async function agregar(producto) {
    setAgregandoId(producto.id);
    await alAgregar(producto);
    setAgregandoId(null);
  }

  /**
   * Si la cuenta no puede comprar, por qué. Devuelve null cuando sí puede,
   * así la tarjeta no muestra ningún aviso.
   *   - Sin sesión       -> le falta una cuenta.
   *   - Cuenta de tienda -> /carts pide el rol USER, la tienda no compra.
   */
  const motivoNoPuedeComprar = !usuario
    ? 'Necesitás una cuenta para comprar'
    : usuario.role !== 'USER'
      ? 'La cuenta de la tienda no compra'
      : null;

  const nombreCategoria = categorias.find((c) => String(c.id) === categoriaId)?.description;

  return (
    <div className="contenedor">
      <section className="portada">
        <div className="portada-texto">
          <span className="portada-sello">Juegos de mesa</span>
          <h1>
            Que no quede nadie
            <br />
            afuera de la mesa
          </h1>
          <p>
            Estrategia, familiares, party games y clásicos de toda la vida. Elegí el tuyo y
            armá la próxima partida.
          </p>
        </div>

        {/* Decoración: un dado y dos fichas, puro adorno */}
        <div className="portada-adorno" aria-hidden="true">
          <span className="adorno-dado">{'⚄'}</span>
          <span className="adorno-ficha adorno-ficha-1">{'⬢'}</span>
          <span className="adorno-ficha adorno-ficha-2">{'⬢'}</span>
        </div>
      </section>

      <ChipsCategorias
        categorias={categorias}
        elegida={categoriaId}
        alElegir={elegirCategoria}
      />

      <Filtros alAplicar={aplicarFiltros} cargando={cargando} />

      <Aviso tipo="error">{error}</Aviso>

      {/* Cuántos resultados hay, y de qué categoría */}
      {!cargando && totalProductos != null && (
        <p className="resumen-resultados">
          {totalProductos === 0
            ? 'Ningún juego coincide con la búsqueda'
            : `${totalProductos} ${totalProductos === 1 ? 'juego' : 'juegos'}`}
          {nombreCategoria && <span className="texto-gris"> en {nombreCategoria}</span>}
        </p>
      )}

      {/* Los tres estados posibles: cargando, sin resultados, o la lista */}
      {cargando ? (
        <Cargando texto="Buscando juegos..." />
      ) : productos.length === 0 && !error ? (
        <Vacio icono={'\u{1F50D}'} titulo="No encontramos juegos con esos filtros">
          Probá con otra categoría, ampliá el rango de precios o limpiá la búsqueda.
        </Vacio>
      ) : (
        <>
          <div className="grilla-productos">
            {productos.map((producto) => (
              <TarjetaProducto
                key={producto.id}
                producto={producto}
                alAgregar={agregar}
                motivoNoPuedeComprar={motivoNoPuedeComprar}
                agregando={agregandoId === producto.id}
              />
            ))}
          </div>

          <Paginador
            pagina={pagina}
            totalPaginas={totalPaginas}
            alCambiarPagina={cambiarPagina}
          />
        </>
      )}
    </div>
  );
}

export default Catalogo;
