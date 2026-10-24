/* ==========================================================================
   Filtros del catalogo
   --------------------------------------------------------------------------
   Junto con ChipsCategorias cubre el punto "Busqueda y filtrado de productos
   por categoria, precio, etc." del enunciado. Aca van la busqueda por texto,
   el rango de precios y la disponibilidad; la categoria quedo afuera, en los
   chips de arriba, porque es el filtro que mas se usa.

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
  minPrice: '',
  maxPrice: '',
  onlyAvailable: false,
};

function Filtros({ alAplicar, cargando }) {
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);

  /**
   * Un solo handler para todos los campos: usa el atributo name del input
   * para saber que parte del estado tiene que cambiar. Asi no escribimos
   * cuatro funciones casi iguales.
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
    const { minPrice: min, maxPrice: max } = borrador;
    const alReves = min !== '' && max !== '' && Number(min) > Number(max);

    alAplicar(alReves ? { ...borrador, minPrice: max, maxPrice: min } : borrador);
  }

  function limpiar() {
    setBorrador(FILTROS_VACIOS);
    alAplicar(FILTROS_VACIOS);
  }

  const hayFiltros =
    borrador.search !== '' ||
    borrador.minPrice !== '' ||
    borrador.maxPrice !== '' ||
    borrador.onlyAvailable;

  return (
    <form className="filtros panel" onSubmit={buscar}>
      <div className="filtros-grilla">
        <div className="campo filtro-busqueda">
          <label htmlFor="search">Buscar un juego</label>
          <input
            id="search"
            name="search"
            type="search"
            placeholder="Nombre o descripción"
            value={borrador.search}
            onChange={alCambiar}
          />
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
            placeholder="Sin límite"
            value={borrador.maxPrice}
            onChange={alCambiar}
          />
        </div>

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

      <label className="checkbox">
        <input
          name="onlyAvailable"
          type="checkbox"
          checked={borrador.onlyAvailable}
          onChange={alCambiar}
        />
        Mostrar solo los que tienen stock
      </label>
    </form>
  );
}

export default Filtros;
