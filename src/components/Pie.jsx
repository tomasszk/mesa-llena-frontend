/* ==========================================================================
   Pie de página
   ========================================================================== */

import Logo from './Logo';

function Pie() {
  return (
    <footer className="pie">
      <div className="contenedor pie-interior">
        <div>
          <Logo tamanio={32} />
          <p className="texto-chico sin-margen" style={{ marginTop: '.5rem' }}>
            Juegos de mesa para jugar en serio.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Pie;
