/* ==========================================================================
   RutaProtegida
   --------------------------------------------------------------------------
   Envuelve a las vistas que no son públicas. Hace dos controles:

   1) Si no hay nadie logueado, redirige al login. Se guarda a dónde quería ir
      el usuario, así después de loguearse vuelve ahí y no al home.
   2) Si hay alguien logueado pero con el rol equivocado (un comprador
      intentando entrar al panel de la tienda), le avisa que no tiene permiso.

   Esto es solo para la experiencia de uso: la seguridad de verdad está en el
   backend. Aunque alguien escriba /admin/productos a mano en la barra de
   direcciones, los endpoints le van a responder 403 porque su token dice USER.
   ========================================================================== */

import { Link, Navigate, useLocation } from 'react-router-dom';

function RutaProtegida({ usuario, rol, children }) {
  const ubicacion = useLocation();

  // --- Control 1: ¿hay sesión? ---
  if (!usuario) {
    return <Navigate to="/ingresar" state={{ volverA: ubicacion.pathname }} replace />;
  }

  // --- Control 2: ¿el rol alcanza? ---
  if (rol && usuario.role !== rol) {
    return (
      <div className="contenedor">
        <div className="panel centrado" style={{ maxWidth: 520, margin: '3rem auto' }}>
          <div className="vacio-icono" aria-hidden="true">
            {'\u{1F512}'}
          </div>
          <h2>No tenés permiso para entrar acá</h2>
          <p className="texto-gris">
            {rol === 'ADMIN'
              ? 'Esta sección es del panel de la tienda. Tu cuenta es de comprador.'
              : 'Esta sección es para cuentas de comprador. Estás usando la cuenta de la tienda, que vende pero no compra.'}
          </p>
          <Link to="/" className="boton">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

export default RutaProtegida;
