/* ==========================================================================
   App: el componente padre de toda la aplicacion
   --------------------------------------------------------------------------
   Aca viven las dos cosas que necesitan varias vistas a la vez:

   - usuario: quien esta logueado y con que rol.
   - carrito: el carrito del comprador, para que el contador del navbar y la
     vista del carrito muestren siempre lo mismo.

   Las vistas no guardan estas dos cosas por su cuenta: las reciben por props
   desde aca. Ese es el flujo unidireccional de React, el componente padre
   manda los datos hacia abajo y los hijos avisan hacia arriba cuando pasa algo.

   (En la tercera entrega este estado compartido se reemplaza por Redux. Por eso
   esta concentrado en un solo componente y no desparramado por las vistas.)
   ========================================================================== */

import { useCallback, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Pie from './components/Pie';
import RutaProtegida from './components/RutaProtegida';

import Catalogo from './views/Catalogo';
import DetalleProducto from './views/DetalleProducto';
import Ingresar from './views/Ingresar';
import Registro from './views/Registro';
import Carrito from './views/Carrito';
import MisCompras from './views/MisCompras';
import DetalleCompra from './views/DetalleCompra';
import NoEncontrado from './views/NoEncontrado';
import AdminProductos from './views/admin/AdminProductos';
import FormularioProducto from './views/admin/FormularioProducto';
import AdminCategorias from './views/admin/AdminCategorias';
import AdminUsuarios from './views/admin/AdminUsuarios';

import { EVENTO_SESION_EXPIRADA } from './api/cliente';
import { borrarSesion, guardarSesion, leerUsuario } from './api/sesion';
import { agregarAlCarrito, obtenerCarrito } from './api/carrito';

function App() {
  /**
   * El estado del usuario arranca leyendo localStorage.
   * Le pasamos la funcion (sin parentesis) en lugar del resultado para que
   * React la ejecute una sola vez, en el primer render, y no en cada uno.
   *
   * Esto es lo que hace que la sesion sobreviva a un F5.
   */
  const [usuario, setUsuario] = useState(leerUsuario);

  const [carrito, setCarrito] = useState(null);

  // Cartelito flotante para confirmarle al usuario lo que acaba de pasar.
  const [aviso, setAviso] = useState(null);

  const navegar = useNavigate();

  /** Muestra el cartelito flotante. tipo: 'exito' | 'error' | 'info' */
  const avisar = useCallback((tipo, texto) => {
    // Le ponemos la hora como clave para que, si el usuario agrega dos veces
    // el mismo producto, React vuelva a montar el cartel y se reinicie la
    // animacion en vez de dejarlo quieto.
    setAviso({ tipo, texto, clave: Date.now() });
  }, []);

  /** Vuelve a pedir el carrito al backend y refresca el estado. */
  const refrescarCarrito = useCallback(async () => {
    try {
      setCarrito(await obtenerCarrito());
    } catch {
      // Si falla no rompemos la pantalla: el carrito queda como estaba y el
      // usuario lo va a ver cuando entre a /carrito, que si muestra el error.
    }
  }, []);

  /* ------------------------------------------------------------------
     El cartelito flotante se cierra solo a los 4 segundos.
     El return del useEffect es la limpieza: si aparece otro aviso antes de
     que se cumpla el tiempo, cancelamos el temporizador anterior para que no
     cierre el aviso nuevo.
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!aviso) return;

    const temporizador = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  /* ------------------------------------------------------------------
     Cada vez que cambia el usuario, recalculamos el carrito.
     Solo los compradores tienen carrito: el backend le responde 403 al ADMIN
     porque la tienda vende, no compra.
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (usuario?.role !== 'USER') {
      setCarrito(null);
      return;
    }
    refrescarCarrito();
  }, [usuario, refrescarCarrito]);

  /* ------------------------------------------------------------------
     El token vence a las 24 horas. Cuando el cliente HTTP recibe un 401
     avisa con un evento, y nosotros cerramos la sesion y mandamos al login
     una sola vez para toda la aplicacion.
     ------------------------------------------------------------------ */
  useEffect(() => {
    function alExpirarSesion() {
      setUsuario(null);
      setCarrito(null);
      avisar('info', 'Tu sesion vencio. Volve a ingresar.');
      navegar('/ingresar');
    }

    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirarSesion);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirarSesion);
  }, [navegar, avisar]);

  /** Login o registro exitoso: guardamos el token y actualizamos el estado. */
  function alIniciarSesion(respuesta) {
    guardarSesion(respuesta);
    setUsuario(leerUsuario());
  }

  /** Cerrar sesion: se borra el token y el carrito deja de mostrarse. */
  function alCerrarSesion() {
    borrarSesion();
    setUsuario(null);
    setCarrito(null);
    avisar('info', 'Cerraste la sesion.');
  }

  /**
   * Agregar un producto al carrito.
   *
   * Esta aca y no en cada vista porque lo usan el catalogo y el detalle del
   * producto, y las dos tienen que dejar el contador del navbar actualizado.
   * El backend devuelve el carrito completo despues de agregar, asi que con
   * esa respuesta ya refrescamos todo.
   */
  async function agregarProducto(producto, cantidad = 1) {
    // Un visitante sin cuenta no puede comprar: lo mandamos a loguearse.
    if (!usuario) {
      avisar('info', 'Inicia sesion para agregar productos al carrito.');
      navegar('/ingresar', { state: { volverA: `/productos/${producto.id}` } });
      return;
    }

    // La tienda no compra en su propio negocio.
    if (usuario.role !== 'USER') {
      avisar('error', 'La cuenta de la tienda no puede comprar. Entra con una cuenta de comprador.');
      return;
    }

    try {
      const carritoActualizado = await agregarAlCarrito(producto.id, cantidad);
      setCarrito(carritoActualizado);
      avisar(
        'exito',
        cantidad === 1
          ? `Agregaste ${producto.name} al carrito.`
          : `Agregaste ${cantidad} unidades de ${producto.name} al carrito.`,
      );
    } catch (error) {
      // El mensaje viene del backend: por ejemplo "Stock insuficiente para
      // Catan. Disponible: 2, solicitado: 5".
      avisar('error', error.message);
    }
  }

  return (
    <div className="pagina">
      <Navbar usuario={usuario} carrito={carrito} alCerrarSesion={alCerrarSesion} />

      <main>
        <Routes>
          {/* ---------------- Publico ---------------- */}
          <Route
            path="/"
            element={<Catalogo usuario={usuario} alAgregar={agregarProducto} />}
          />
          <Route
            path="/productos/:id"
            element={<DetalleProducto usuario={usuario} alAgregar={agregarProducto} />}
          />
          <Route path="/ingresar" element={<Ingresar alIniciarSesion={alIniciarSesion} />} />
          <Route path="/registro" element={<Registro alIniciarSesion={alIniciarSesion} />} />

          {/* ---------------- Solo compradores (USER) ---------------- */}
          <Route
            path="/carrito"
            element={
              <RutaProtegida usuario={usuario} rol="USER">
                <Carrito carrito={carrito} setCarrito={setCarrito} avisar={avisar} />
              </RutaProtegida>
            }
          />
          <Route
            path="/mis-compras"
            element={
              <RutaProtegida usuario={usuario} rol="USER">
                <MisCompras />
              </RutaProtegida>
            }
          />
          <Route
            path="/mis-compras/:id"
            element={
              <RutaProtegida usuario={usuario} rol="USER">
                <DetalleCompra />
              </RutaProtegida>
            }
          />

          {/* ---------------- Solo la tienda (ADMIN) ---------------- */}
          <Route
            path="/admin/productos"
            element={
              <RutaProtegida usuario={usuario} rol="ADMIN">
                <AdminProductos avisar={avisar} />
              </RutaProtegida>
            }
          />
          <Route
            path="/admin/productos/nuevo"
            element={
              <RutaProtegida usuario={usuario} rol="ADMIN">
                <FormularioProducto avisar={avisar} />
              </RutaProtegida>
            }
          />
          <Route
            path="/admin/productos/:id/editar"
            element={
              <RutaProtegida usuario={usuario} rol="ADMIN">
                <FormularioProducto avisar={avisar} />
              </RutaProtegida>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <RutaProtegida usuario={usuario} rol="ADMIN">
                <AdminCategorias avisar={avisar} />
              </RutaProtegida>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <RutaProtegida usuario={usuario} rol="ADMIN">
                <AdminUsuarios usuario={usuario} avisar={avisar} />
              </RutaProtegida>
            }
          />

          {/* Cualquier direccion que no exista cae aca */}
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>

      <Pie />

      {/* El cartelito flotante de confirmacion / error */}
      {aviso && (
        <div key={aviso.clave} className={`flotante flotante-${aviso.tipo}`} role="status">
          {aviso.texto}
        </div>
      )}
    </div>
  );
}

export default App;
