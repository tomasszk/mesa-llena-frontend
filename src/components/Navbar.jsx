/* ==========================================================================
   Navbar
   --------------------------------------------------------------------------
   La barra de arriba cambia según quién esté mirando:

   - Visitante sin cuenta -> solo el catálogo, más "Ingresar" y "Crear cuenta".
   - Comprador (USER)     -> catálogo, carrito con el contador y "Mis compras".
   - Tienda (ADMIN)       -> catálogo y el panel de administración.

   El ADMIN no ve el carrito a propósito: en el backend /carts y /orders piden
   el rol USER, porque la tienda vende, no compra. Si le mostráramos el carrito,
   el botón le daría un 403.
   ========================================================================== */

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { unidadesEnCarrito } from '../formato';

function Navbar({ usuario, carrito, alCerrarSesion }) {
  // Estado local del menú desplegable en pantallas chicas.
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navegar = useNavigate();

  const esAdmin = usuario?.role === 'ADMIN';
  const esComprador = usuario?.role === 'USER';
  const unidades = unidadesEnCarrito(carrito);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  function salir() {
    cerrarMenu();

    // Primero navegamos y después cerramos la sesión. Si lo hiciéramos al
    // revés y el usuario estuviera parado en una vista protegida, por un
    // instante quedaría sin sesión en una ruta que no puede ver, y
    // RutaProtegida lo mandaría al login guardando esa ruta como "volver a".
    navegar('/');
    alCerrarSesion();
  }

  return (
    <header className="navbar">
      <div className="contenedor navbar-interior">
        <Link to="/" className="navbar-logo" onClick={cerrarMenu}>
          <Logo />
        </Link>

        {/* Botón del menú: solo se ve en pantallas chicas (ver App.css) */}
        <button
          type="button"
          className="navbar-hamburguesa"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-expanded={menuAbierto}
          aria-label="Abrir menú"
        >
          {menuAbierto ? '✕' : '☰'}
        </button>

        <nav className={`navbar-menu ${menuAbierto ? 'abierto' : ''}`}>
          <NavLink to="/" className="navbar-link" onClick={cerrarMenu} end>
            Catálogo
          </NavLink>

          {esComprador && (
            <>
              <NavLink to="/carrito" className="navbar-link" onClick={cerrarMenu}>
                Carrito
                {unidades > 0 && <span className="navbar-contador">{unidades}</span>}
              </NavLink>
              <NavLink to="/mis-compras" className="navbar-link" onClick={cerrarMenu}>
                Mis compras
              </NavLink>
            </>
          )}

          {esAdmin && (
            <>
              <NavLink to="/admin/productos" className="navbar-link" onClick={cerrarMenu}>
                Productos
              </NavLink>
              <NavLink to="/admin/categorias" className="navbar-link" onClick={cerrarMenu}>
                Categorías
              </NavLink>
              <NavLink to="/admin/usuarios" className="navbar-link" onClick={cerrarMenu}>
                Usuarios
              </NavLink>
            </>
          )}

          <div className="navbar-sesion">
            {usuario ? (
              <>
                <span className="navbar-usuario">
                  {usuario.username}
                  <span className={`etiqueta ${esAdmin ? 'etiqueta-admin' : 'etiqueta-user'}`}>
                    {esAdmin ? 'Tienda' : 'Comprador'}
                  </span>
                </span>
                <button type="button" className="boton boton-borde boton-chico" onClick={salir}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/ingresar" className="boton boton-borde boton-chico" onClick={cerrarMenu}>
                  Ingresar
                </Link>
                <Link to="/registro" className="boton boton-chico" onClick={cerrarMenu}>
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
