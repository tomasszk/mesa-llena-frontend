/* ==========================================================================
   Sesion del usuario (localStorage)
   --------------------------------------------------------------------------
   El backend es STATELESS: no guarda sesiones en memoria. Lo unico que nos
   devuelve al registrarnos o loguearnos es un token de JWT, y ese token es el
   que tenemos que mandar en cada request siguiente.

   Como el token tiene que sobrevivir a un F5, no alcanza con guardarlo en un
   estado de React (que se borra al recargar). Lo guardamos en localStorage,
   tal como lo explico la profesora en la clase del 05/10.
   ========================================================================== */

// Las claves con las que guardamos en localStorage. Estan en constantes para
// no escribir el string a mano en cada lugar y equivocarnos en una letra.
const CLAVE_TOKEN = 'jwtToken';
const CLAVE_USUARIO = 'usuario';

/**
 * Guarda la sesion despues de un login o un registro exitoso.
 * Recibe la AuthenticationResponse del backend, que trae tres cosas:
 *   access_token -> el JWT
 *   role         -> USER o ADMIN
 *   username     -> el nombre de usuario
 */
export function guardarSesion(respuesta) {
  localStorage.setItem(CLAVE_TOKEN, respuesta.access_token);
  localStorage.setItem(
    CLAVE_USUARIO,
    JSON.stringify({ username: respuesta.username, role: respuesta.role }),
  );
}

/** Devuelve el token guardado, o null si no hay nadie logueado. */
export function leerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

/**
 * Devuelve { username, role } del usuario logueado, o null si no hay sesion.
 * Si por algun motivo lo guardado no es un JSON valido, limpiamos todo y
 * devolvemos null: preferimos pedir login de nuevo antes que romper la app.
 */
export function leerUsuario() {
  const token = localStorage.getItem(CLAVE_TOKEN);
  const guardado = localStorage.getItem(CLAVE_USUARIO);

  if (!token || !guardado) return null;

  try {
    const usuario = JSON.parse(guardado);
    return { ...usuario, token };
  } catch {
    borrarSesion();
    return null;
  }
}

/** Cierra la sesion: saca el token y los datos del usuario de localStorage. */
export function borrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

/** true si el usuario logueado es la tienda (ADMIN). */
export function esAdmin(usuario) {
  return usuario?.role === 'ADMIN';
}

/** true si el usuario logueado es un comprador (USER). */
export function esComprador(usuario) {
  return usuario?.role === 'USER';
}
