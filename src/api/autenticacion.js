/* ==========================================================================
   Registro y login  ->  /api/v1/auth
   --------------------------------------------------------------------------
   Son los dos unicos endpoints publicos que reciben datos: no se les puede
   pedir token a alguien que todavia no lo tiene.
   ========================================================================== */

import { post } from './cliente';

/**
 * Registra un comprador nuevo.
 * El backend no acepta que elijamos el rol: todos los registros entran como
 * USER, porque Mesa Llena tiene un unico vendedor (nosotros).
 * Devuelve la misma respuesta que el login, asi queda logueado de una.
 */
export function registrarse({ username, email, password, name, surname }) {
  return post('/api/v1/auth/register', { username, email, password, name, surname });
}

/**
 * Login con email y contrasenia.
 * Devuelve { access_token, role, username }.
 */
export function iniciarSesion({ email, password }) {
  return post('/api/v1/auth/authenticate', { email, password });
}
