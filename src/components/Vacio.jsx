/* ==========================================================================
   Vacio: que mostrar cuando no hay nada que mostrar
   --------------------------------------------------------------------------
   Una busqueda sin resultados, un carrito sin productos o un historial sin
   compras no son errores. Son estados normales, y conviene que digan que pasa
   y que puede hacer el usuario, en vez de dejar la pantalla en blanco.
   ========================================================================== */

function Vacio({ icono = '\u{1F4E6}', titulo, children, accion }) {
  return (
    <div className="vacio">
      <div className="vacio-icono" aria-hidden="true">
        {icono}
      </div>
      {titulo && <h3>{titulo}</h3>}
      {children && <p className="sin-margen">{children}</p>}
      {accion && <div style={{ marginTop: '1.25rem' }}>{accion}</div>}
    </div>
  );
}

export default Vacio;
