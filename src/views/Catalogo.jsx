/* ==========================================================================
   Catalogo (home)
   --------------------------------------------------------------------------
   Es la vista publica: se puede mirar sin tener cuenta, igual que en cualquier
   e-commerce. Para comprar si hace falta loguearse.

   Cubre del enunciado:
   - "Visualizacion de productos disponibles con fotografia y precio".
   - "Busqueda y filtrado de productos por categoria, precio, etc."
   - "Opcion para anadir productos al carrito".
   ========================================================================== */

import { useEffect, useState } from 'react';
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
  categoryId: '',
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

  // --- Que le pedimos al backend ---
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [pagina, setPagina] = useState(0);

  // --- Los tres estados de cualquier pedido al backend ---
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Cual producto se esta agregando, para deshabilitar solo ese boton.
  const [agregandoId, setAgregandoId] = useState(null);

  /* ------------------------------------------------------------------
     Las categorias se piden UNA sola vez, cuando el componente se monta.
     Por eso el array de dependencias va vacio: [].
     Las usamos para llenar el <select> del filtro.
     ------------------------------------------------------------------ */
  useEffect(() => {
    obtenerCategorias()
      .then((pagina) => setCategorias(pagina.content ?? []))
      .catch(() => {
        // Si fallan las categorias el catalogo igual funciona: simplemente el
        // filtro por categoria queda sin opciones. No vale la pena romper
        // toda la pantalla por eso.
        setCategorias([]);
      });
  }, []);

  /* ------------------------------------------------------------------
     Los productos se vuelven a pedir cada vez que cambian los filtros o la
     pagina. Eso es lo que dice el array de dependencias: [filtros, pagina].

     El flag "cancelado" evita un problema clasico: si el usuario cambia el
     filtro dos veces rapido, podrian volver las dos respuestas y la primera
     (mas lenta) pisar a la segunda. Con esto, cuando el efecto se vuelve a
     ejecutar, la respuesta vieja se descarta.
     ------------------------------------------------------------------ */
  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError('');

    obtenerProductos({ ...filtros, page: pagina, size: POR_PAGINA })
      .then((respuesta) => {
        if (cancelado) return;

        // El backend devuelve un Page de Spring: los productos vienen adentro
        // de "content", no en la raiz de la respuesta.
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
  }, [filtros, pagina]);

  /** Cuando se aplican filtros nuevos, volvemos a la primera pagina. */
  function aplicarFiltros(filtrosNuevos) {
    setFiltros(filtrosNuevos);
    setPagina(0);
  }

  function cambiarPagina(paginaNueva) {
    setPagina(paginaNueva);
    // Al cambiar de pagina subimos la pantalla, si no el usuario queda
    // mirando el medio de la lista nueva.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Agregar al carrito. La funcion que hace el trabajo vive en App (porque
   * tiene que actualizar el contador del navbar); aca solo marcamos que boton
   * esta ocupado mientras va y vuelve la request.
   */
  async function agregar(producto) {
    setAgregandoId(producto.id);
    await alAgregar(producto);
    setAgregandoId(null);
  }

  /**
   * Si la cuenta no puede comprar, por que. Devuelve null cuando si puede,
   * asi la tarjeta no muestra ningun aviso.
   *   - Sin sesion      -> le falta una cuenta.
   *   - Cuenta de tienda -> /carts pide el rol USER, la tienda no compra.
   */
  const motivoNoPuedeComprar = !usuario
    ? 'Necesitas una cuenta para comprar'
    : usuario.role !== 'USER'
      ? 'La cuenta de la tienda no compra'
      : null;

  return (
    <div className="contenedor">
      <section className="portada">
        <h1>Juegos de mesa para jugar en serio</h1>
        <p>
          Estrategia, familiares, party games y clasicos. Elegi el tuyo y que no quede nadie
          afuera de la mesa.
        </p>
      </section>

      <Filtros
        categorias={categorias}
        alAplicar={aplicarFiltros}
        cantidadResultados={cargando ? null : totalProductos}
        cargando={cargando}
      />

      <Aviso tipo="error">{error}</Aviso>

      {/* Los tres estados posibles: cargando, sin resultados, o la lista */}
      {cargando ? (
        <Cargando texto="Buscando juegos..." />
      ) : productos.length === 0 && !error ? (
        <Vacio icono={'\u{1F50D}'} titulo="No encontramos juegos con esos filtros">
          Probá con otra categoria, ampliá el rango de precios o limpiá la busqueda.
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
