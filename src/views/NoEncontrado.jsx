/* ==========================================================================
   404: cualquier direccion que no exista
   --------------------------------------------------------------------------
   Esta ruta esta declarada como path="*" en App, asi que agarra todo lo que no
   coincidio con ninguna ruta anterior. Sin esto, escribir mal una direccion
   dejaria la pantalla en blanco sin ninguna explicacion.
   ========================================================================== */

import { Link } from 'react-router-dom';

function NoEncontrado() {
  return (
    <div className="contenedor">
      <div className="panel centrado" style={{ maxWidth: 520, margin: '3rem auto' }}>
        <div className="vacio-icono" aria-hidden="true">
          {'\u{1F3B2}'}
        </div>
        <h1>Esta pagina no existe</h1>
        <p className="texto-gris">
          La direccion que pusiste no corresponde a ninguna seccion de Mesa Llena.
        </p>
        <Link to="/" className="boton">
          Volver al catalogo
        </Link>
      </div>
    </div>
  );
}

export default NoEncontrado;
