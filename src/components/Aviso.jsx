/* ==========================================================================
   Aviso: el cartelito de error / exito / informacion
   --------------------------------------------------------------------------
   Lo usamos en todas las vistas para mostrarle al usuario que paso. Siempre
   mostramos el mensaje que vino del backend, no uno inventado: si el backend
   dice "Stock insuficiente para Catan. Disponible: 2, solicitado: 5", el
   usuario lee exactamente eso.
   ========================================================================== */

const ICONOS = {
  error: '⚠',   // triangulo de atencion
  exito: '✓',   // tilde
  info: 'ℹ',    // i de informacion
};

/**
 * @param {string} tipo     'error' | 'exito' | 'info'
 * @param {string} children El mensaje a mostrar
 * @param {function} alCerrar  Si viene, muestra la X para cerrar el aviso
 */
function Aviso({ tipo = 'info', children, alCerrar }) {
  // Si no hay mensaje no renderizamos nada: asi las vistas pueden escribir
  // {error && <Aviso .../>} o directamente <Aviso>{error}</Aviso>.
  if (!children) return null;

  return (
    <div className={`aviso aviso-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <span aria-hidden="true">{ICONOS[tipo]}</span>
      <span>{children}</span>

      {alCerrar && (
        <button type="button" className="aviso-cerrar" onClick={alCerrar} aria-label="Cerrar aviso">
          &times;
        </button>
      )}
    </div>
  );
}

export default Aviso;
