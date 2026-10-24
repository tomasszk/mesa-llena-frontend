/* ==========================================================================
   404: cualquier dirección que no exista
   --------------------------------------------------------------------------
   Esta ruta está declarada como path="*" en App, así que agarra todo lo que no
   coincidió con ninguna ruta anterior. Sin esto, escribir mal una dirección
   dejaría la pantalla en blanco sin ninguna explicación.
   ========================================================================== */

import { Link } from 'react-router-dom';

function NoEncontrado() {
  return (
    <div className="contenedor">
      <div className="panel centrado" style={{ maxWidth: 520, margin: '3rem auto' }}>
        <div className="vacio-icono" aria-hidden="true">
          {'\u{1F3B2}'}
        </div>
        <h1>Esta página no existe</h1>
        <p className="texto-gris">
          La dirección que pusiste no corresponde a ninguna sección de Mesa Llena.
        </p>
        <Link to="/" className="boton">
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}

export default NoEncontrado;
