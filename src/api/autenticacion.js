/* ==========================================================================
   Registro y login  ->  /api/v1/auth
   --------------------------------------------------------------------------
   Son los dos únicos endpoints públicos que reciben datos: no se les puede
   pedir token a alguien que todavía no lo tiene.
   ========================================================================== */

import { post } from './cliente';

/**
 * Registra un comprador nuevo.
 * El backend no acepta que elijamos el rol: todos los registros entran como
 * USER, porque Mesa Llena tiene un único vendedor (nosotros).
 * Devuelve la misma respuesta que el login, así queda logueado de una.
 */
export function registrarse({ username, email, password, name, surname }) {
  return post('/api/v1/auth/register', { username, email, password, name, surname });
}

/**
 * Login con email y contraseña.
 * Devuelve { access_token, role, username }.
 */
export function iniciarSesion({ email, password }) {
  return post('/api/v1/auth/authenticate', { email, password });
}
