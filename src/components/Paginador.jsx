/* ==========================================================================
   Paginador
   --------------------------------------------------------------------------
   El backend devuelve los listados como Page de Spring, que ademas del
   contenido trae el numero de pagina actual y el total de paginas. Este
   componente usa esos datos para moverse entre paginas.

   Si hay una sola pagina no se renderiza nada: no tiene sentido mostrar
   "pagina 1 de 1".
   ========================================================================== */

function Paginador({ pagina, totalPaginas, alCambiarPagina }) {
  if (!totalPaginas || totalPaginas <= 1) return null;

  const esPrimera = pagina <= 0;
  const esUltima = pagina >= totalPaginas - 1;

  return (
    <nav className="paginador" aria-label="Paginas de resultados">
      <button
        type="button"
        className="boton boton-borde"
        onClick={() => alCambiarPagina(pagina - 1)}
        disabled={esPrimera}
      >
        &larr; Anterior
      </button>

      <span className="texto-chico texto-gris">
        Pagina {pagina + 1} de {totalPaginas}
      </span>

      <button
        type="button"
        className="boton boton-borde"
        onClick={() => alCambiarPagina(pagina + 1)}
        disabled={esUltima}
      >
        Siguiente &rarr;
      </button>
    </nav>
  );
}

export default Paginador;
