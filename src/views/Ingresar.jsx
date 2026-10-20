/* ==========================================================================
   Ingresar (login)
   --------------------------------------------------------------------------
   Cubre "Autenticacion de usuarios mediante usuario y contrasenia (login)".

   El backend responde con { access_token, role, username }. El token lo
   guardamos en localStorage (lo hace App a traves de alIniciarSesion) y el
   rol nos sirve para saber a donde mandar al usuario: la tienda va al panel
   de administracion, el comprador al catalogo.
   ========================================================================== */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Logo from '../components/Logo';
import { iniciarSesion } from '../api/autenticacion';

function Ingresar({ alIniciarSesion }) {
  const [datos, setDatos] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const navegar = useNavigate();
  const ubicacion = useLocation();

  // Si el usuario llego aca porque quiso entrar a una pagina protegida,
  // RutaProtegida nos dejo anotado a donde queria ir. Despues del login lo
  // devolvemos ahi en vez de al home.
  const volverA = ubicacion.state?.volverA;

  /**
   * A donde mandamos al usuario despues de loguearse.
   *
   * No alcanza con usar "volverA" tal cual: la ruta guardada puede ser de un
   * rol distinto al de la cuenta con la que termino entrando. Por ejemplo,
   * alguien que estaba en /carrito, se le vencio la sesion y despues entro con
   * la cuenta de la tienda: mandarlo de vuelta a /carrito le mostraria la
   * pantalla de "no tenes permiso". En ese caso lo ignoramos y lo llevamos al
   * inicio que corresponde a su rol.
   */
  function destino(rol) {
    const inicio = rol === 'ADMIN' ? '/admin/productos' : '/';

    if (!volverA) return inicio;

    const esRutaDeTienda = volverA.startsWith('/admin');
    const esRutaDeComprador =
      volverA.startsWith('/carrito') || volverA.startsWith('/mis-compras');

    if (rol === 'ADMIN' && esRutaDeComprador) return inicio;
    if (rol === 'USER' && esRutaDeTienda) return inicio;

    return volverA;
  }

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setDatos({ ...datos, [name]: value });
    // Al primer cambio borramos el error anterior: si el usuario esta
    // corrigiendo la contrasenia, el cartel rojo viejo ya no aplica.
    setError('');
  }

  async function enviar(evento) {
    evento.preventDefault();

    setEnviando(true);
    setError('');

    try {
      const respuesta = await iniciarSesion(datos);
      alIniciarSesion(respuesta);

      // replace: true reemplaza el login en el historial, asi el boton de
      // "atras" del navegador no lo trae de vuelta al formulario.
      navegar(destino(respuesta.role), { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor">
      <div className="formulario-centrado panel">
        <div className="centrado" style={{ marginBottom: '1.5rem' }}>
          <Logo tamanio={48} />
          <h1 style={{ marginTop: '.75rem' }}>Ingresar</h1>
          <p className="texto-gris sin-margen">Entra para comprar y ver tus compras.</p>
        </div>

        <Aviso tipo="error">{error}</Aviso>

        <form onSubmit={enviar} noValidate>
          <div className="campo">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={datos.email}
              onChange={alCambiar}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="password">Contrasenia</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={datos.password}
              onChange={alCambiar}
              required
            />
          </div>

          <button
            type="submit"
            className="boton boton-ancho"
            disabled={enviando || !datos.email || !datos.password}
          >
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="centrado texto-chico" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
          No tenes cuenta? <Link to="/registro">Crear una cuenta</Link>
        </p>
      </div>
    </div>
  );
}

export default Ingresar;
