/* ==========================================================================
   Registro
   --------------------------------------------------------------------------
   Cubre "Registro de usuarios (debe solicitar un nombre de usuario, mail,
   contrasenia, nombre y apellido)".

   Los cinco campos son los que pide el RegisterRequest del backend. No hay
   campo de rol: todos los registros entran como comprador (USER), porque
   Mesa Llena tiene un unico vendedor, que somos nosotros. El rol lo asigna el
   servicio del backend, no el formulario; si lo dejaramos elegir, cualquiera
   podria registrarse como ADMIN y manejar el catalogo.

   La validacion la hacemos en los dos lados: aca para avisarle al usuario al
   instante, y en el backend con las anotaciones de Jakarta Validation porque
   es la que de verdad protege los datos.
   ========================================================================== */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Logo from '../components/Logo';
import { registrarse } from '../api/autenticacion';

const CAMPOS_VACIOS = {
  name: '',
  surname: '',
  username: '',
  email: '',
  password: '',
  repetirPassword: '',
};

function Registro({ alIniciarSesion }) {
  const [datos, setDatos] = useState(CAMPOS_VACIOS);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const navegar = useNavigate();

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setDatos({ ...datos, [name]: value });

    // Sacamos el error de ese campo en particular mientras lo esta corrigiendo.
    setErrores({ ...errores, [name]: undefined });
    setError('');
  }

  /**
   * Valida los campos antes de molestar al backend.
   * Las reglas son las mismas que tienen las anotaciones del RegisterRequest,
   * para que el usuario no se entere recien al apretar el boton.
   */
  function validar() {
    const nuevos = {};

    if (datos.name.trim() === '') nuevos.name = 'El nombre es obligatorio';
    if (datos.surname.trim() === '') nuevos.surname = 'El apellido es obligatorio';
    if (datos.username.trim() === '') nuevos.username = 'El nombre de usuario es obligatorio';

    if (datos.email.trim() === '') {
      nuevos.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      nuevos.email = 'Revisa el email, no tiene un formato valido';
    }

    if (datos.password === '') {
      nuevos.password = 'La contrasenia es obligatoria';
    } else if (datos.password.length < 6) {
      nuevos.password = 'Tiene que tener al menos 6 caracteres';
    }

    if (datos.repetirPassword !== datos.password) {
      nuevos.repetirPassword = 'Las dos contrasenias tienen que ser iguales';
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function enviar(evento) {
    evento.preventDefault();

    if (!validar()) return;

    setEnviando(true);
    setError('');

    try {
      // El backend devuelve el token igual que en el login, asi que el usuario
      // queda logueado de una y no tiene que ingresar sus datos dos veces.
      const respuesta = await registrarse({
        username: datos.username.trim(),
        email: datos.email.trim(),
        password: datos.password,
        name: datos.name.trim(),
        surname: datos.surname.trim(),
      });

      alIniciarSesion(respuesta);
      navegar('/', { replace: true });
    } catch (e) {
      // Aca cae, por ejemplo, "Ya existe un usuario con ese email".
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  /** Para no repetir la clase del campo invalido en los seis campos. */
  function claseCampo(campo) {
    return `campo ${errores[campo] ? 'campo-invalido' : ''}`;
  }

  return (
    <div className="contenedor">
      <div className="formulario-centrado panel">
        <div className="centrado" style={{ marginBottom: '1.5rem' }}>
          <Logo tamanio={48} />
          <h1 style={{ marginTop: '.75rem' }}>Crear cuenta</h1>
          <p className="texto-gris sin-margen">
            Con la cuenta podes armar tu carrito y seguir tus compras.
          </p>
        </div>

        <Aviso tipo="error">{error}</Aviso>

        <form onSubmit={enviar} noValidate>
          <div className="fila-campos">
            <div className={claseCampo('name')}>
              <label htmlFor="name">Nombre</label>
              <input id="name" name="name" type="text" value={datos.name} onChange={alCambiar} />
              {errores.name && <p className="error-campo">{errores.name}</p>}
            </div>

            <div className={claseCampo('surname')}>
              <label htmlFor="surname">Apellido</label>
              <input
                id="surname"
                name="surname"
                type="text"
                value={datos.surname}
                onChange={alCambiar}
              />
              {errores.surname && <p className="error-campo">{errores.surname}</p>}
            </div>
          </div>

          <div className={claseCampo('username')}>
            <label htmlFor="username">Nombre de usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={datos.username}
              onChange={alCambiar}
            />
            {errores.username && <p className="error-campo">{errores.username}</p>}
          </div>

          <div className={claseCampo('email')}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={datos.email}
              onChange={alCambiar}
            />
            {errores.email && <p className="error-campo">{errores.email}</p>}
          </div>

          <div className="fila-campos">
            <div className={claseCampo('password')}>
              <label htmlFor="password">Contrasenia</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={datos.password}
                onChange={alCambiar}
              />
              {errores.password ? (
                <p className="error-campo">{errores.password}</p>
              ) : (
                <p className="ayuda">Minimo 6 caracteres</p>
              )}
            </div>

            <div className={claseCampo('repetirPassword')}>
              <label htmlFor="repetirPassword">Repetir contrasenia</label>
              <input
                id="repetirPassword"
                name="repetirPassword"
                type="password"
                autoComplete="new-password"
                value={datos.repetirPassword}
                onChange={alCambiar}
              />
              {errores.repetirPassword && (
                <p className="error-campo">{errores.repetirPassword}</p>
              )}
            </div>
          </div>

          <button type="submit" className="boton boton-ancho" disabled={enviando}>
            {enviando ? 'Creando la cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="centrado texto-chico" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
          Ya tenes cuenta? <Link to="/ingresar">Ingresar</Link>
        </p>
      </div>
    </div>
  );
}

export default Registro;
