/* ==========================================================================
   ChipsCategorias
   --------------------------------------------------------------------------
   Los botones de categoría que van arriba del catálogo.

   Antes la categoría era una opción más adentro del formulario de filtros, y
   había que desplegar un <select> y después apretar "Buscar". Como es el filtro
   que más se usa en una tienda, lo sacamos afuera: se ve de una, se elige de un
   clic y se aplica solo.

   Es un componente controlado: no guarda nada, recibe cuál está elegida y avisa
   al padre cuando cambia.
   ========================================================================== */

/** Un icono para cada categoría, para que se distingan de un vistazo. */
const ICONOS = {
  Estrategia: '♟',        // peón de ajedrez
  Familiar: '\u{1F46A}',       // familia
  Cartas: '\u{1F0CF}',         // comodín
  'Party games': '\u{1F389}',  // fiesta
};

function ChipsCategorias({ categorias, elegida, alElegir }) {
  // Sin categorías no tiene sentido mostrar la barra.
  if (categorias.length === 0) return null;

  return (
    <nav className="chips" aria-label="Filtrar por categoría">
      <button
        type="button"
        className={`chip ${elegida === '' ? 'activo' : ''}`}
        onClick={() => alElegir('')}
      >
        Todos los juegos
      </button>

      {categorias.map((categoria) => {
        const id = String(categoria.id);

        return (
          <button
            key={categoria.id}
            type="button"
            className={`chip ${elegida === id ? 'activo' : ''}`}
            onClick={() => alElegir(id)}
          >
            {ICONOS[categoria.description] && (
              <span aria-hidden="true">{ICONOS[categoria.description]}</span>
            )}
            {categoria.description}
          </button>
        );
      })}
    </nav>
  );
}

export default ChipsCategorias;
