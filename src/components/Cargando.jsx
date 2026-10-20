/* ==========================================================================
   Cargando
   --------------------------------------------------------------------------
   La profesora lo explico asi: cuando le pedimos algo al backend trabajamos
   con dos factores, la demora y la incertidumbre. No sabemos cuanto tarda ni
   que nos va a responder.

   Por eso toda vista que pide datos maneja tres estados posibles:
   cargando, error, o los datos. Este componente cubre el primero, para que el
   usuario no se quede mirando una pantalla en blanco sin saber si funciona.
   ========================================================================== */

function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="cargando">
      <div className="spinner" aria-hidden="true" />
      <p className="sin-margen">{texto}</p>
    </div>
  );
}

export default Cargando;
