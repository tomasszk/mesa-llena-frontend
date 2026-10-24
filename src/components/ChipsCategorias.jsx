/* ==========================================================================
   ChipsCategorias
   --------------------------------------------------------------------------
   Los botones de categoria que van arriba del catalogo.

   Antes la categoria era una opcion mas adentro del formulario de filtros, y
   habia que desplegar un <select> y despues apretar "Buscar". Como es el filtro
   que mas se usa en una tienda, lo sacamos afuera: se ve de una, se elige de un
   clic y se aplica solo.

   Es un componente controlado: no guarda nada, recibe cual esta elegida y avisa
   al padre cuando cambia.
   ========================================================================== */

/** Un icono para cada categoria, para que se distingan de un vistazo. */
const ICONOS = {
  Estrategia: '♟',        // peon de ajedrez
  Familiar: '\u{1F46A}',       // familia
  Cartas: '\u{1F0CF}',         // comodin
  'Party games': '\u{1F389}',  // fiesta
};

function ChipsCategorias({ categorias, elegida, alElegir }) {
  // Sin categorias no tiene sentido mostrar la barra.
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
