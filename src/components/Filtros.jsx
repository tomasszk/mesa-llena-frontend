/* ==========================================================================
   Filtros del catalogo
   --------------------------------------------------------------------------
   Cubre el punto "Busqueda y filtrado de productos por categoria, precio, etc."

   El filtrado lo hace el BACKEND, no el frontend: este formulario arma los
   parametros y se los manda a GET /products, que los traduce a la query de
   JPA. No nos traemos todos los productos para filtrarlos aca, porque eso
   dejaria de funcionar en cuanto el catalogo crezca.

   El componente guarda su propio borrador en estado local y recien cuando el
   usuario aprieta "Buscar" avisa al padre. Asi no mandamos una request por
   cada letra que escribe.
   ========================================================================== */

import { useState } from 'react';

const FILTROS_VACIOS = {
  search: '',
  categoryId: '',
  minPrice: '',
  maxPrice: '',
  onlyAvailable: false,
};

function Filtros({ categorias, alAplicar, cantidadResultados, cargando }) {
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);

  /**
   * Un solo handler para todos los campos: usa el atributo name del input
   * para saber que parte del estado tiene que cambiar. Asi no escribimos
   * cinco funciones casi iguales.
   */
  function alCambiar(evento) {
    const { name, value, type, checked } = evento.target;
    setBorrador({ ...borrador, [name]: type === 'checkbox' ? checked : value });
  }

  function buscar(evento) {
    // Sin esto el navegador recarga la pagina entera al mandar el formulario
    // y perdemos todo el estado de React.
    evento.preventDefault();

    // Si el usuario puso un minimo mayor que el maximo, los damos vuelta en
    // lugar de devolverle una lista vacia sin explicacion.
    const min = borrador.minPrice;
    const max = borrador.maxPrice;
    const hayQueDarVuelta = min !== '' && max !== '' && Number(min) > Number(max);

    alAplicar(hayQueDarVuelta ? { ...borrador, minPrice: max, maxPrice: min } : borrador);
  }

  function limpiar() {
    setBorrador(FILTROS_VACIOS);
    alAplicar(FILTROS_VACIOS);
  }

  // Para saber si mostrar el boton de limpiar: hay algun filtro puesto?
  const hayFiltros =
    borrador.search !== '' ||
    borrador.categoryId !== '' ||
    borrador.minPrice !== '' ||
    borrador.maxPrice !== '' ||
    borrador.onlyAvailable;

  return (
    <form className="filtros panel" onSubmit={buscar}>
      <div className="filtros-grilla">
        <div className="campo filtro-busqueda">
          <label htmlFor="search">Buscar</label>
          <input
            id="search"
            name="search"
            type="search"
            placeholder="Nombre o descripcion del juego"
            value={borrador.search}
            onChange={alCambiar}
          />
        </div>

        <div className="campo">
          <label htmlFor="categoryId">Categoria</label>
          <select
            id="categoryId"
            name="categoryId"
            value={borrador.categoryId}
            onChange={alCambiar}
          >
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.description}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="minPrice">Precio desde</label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={borrador.minPrice}
            onChange={alCambiar}
          />
        </div>

        <div className="campo">
          <label htmlFor="maxPrice">Precio hasta</label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Sin limite"
            value={borrador.maxPrice}
            onChange={alCambiar}
          />
        </div>
      </div>

      <div className="filtros-pie">
        <label className="checkbox">
          <input
            name="onlyAvailable"
            type="checkbox"
            checked={borrador.onlyAvailable}
            onChange={alCambiar}
          />
          Solo con stock disponible
        </label>

        <div className="filtros-botones">
          {hayFiltros && (
            <button type="button" className="boton boton-borde" onClick={limpiar}>
              Limpiar
            </button>
          )}
          <button type="submit" className="boton" disabled={cargando}>
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {cantidadResultados != null && (
        <p className="texto-chico texto-gris sin-margen" style={{ marginTop: '.75rem' }}>
          {cantidadResultados === 0
            ? 'Ningun juego coincide con la busqueda'
            : `${cantidadResultados} ${cantidadResultados === 1 ? 'juego' : 'juegos'} en el catalogo`}
        </p>
      )}
    </form>
  );
}

export default Filtros;
