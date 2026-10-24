/* ==========================================================================
   Administración de cuentas  ->  /users
   --------------------------------------------------------------------------
   Todo este módulo es exclusivo del ADMIN. Cubre el requerimiento del
   enunciado: "Administración de cuentas de usuario, incluyendo la asignación
   de permisos".
   ========================================================================== */

import { get, patch } from './cliente';

/** Listado de cuentas. Nunca devuelve contraseñas. */
export function obtenerUsuarios({ page = 0, size = 20 } = {}) {
  return get(`/users?page=${page}&size=${size}`, true);
}

/** Detalle de una cuenta. */
export function obtenerUsuario(id) {
  return get(`/users/${id}`, true);
}

/**
 * Asignación de permisos: cambia el rol de una cuenta entre USER y ADMIN.
 * El backend no deja que un admin se cambie el rol a sí mismo, para que no
 * quede la tienda sin ningún administrador.
 */
export function cambiarRol(id, role) {
  return patch(`/users/${id}/role`, { role }, true);
}
