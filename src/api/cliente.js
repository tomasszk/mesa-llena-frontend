/* ==========================================================================
   Cliente HTTP - el unico lugar del frontend donde se escribe "fetch"
   --------------------------------------------------------------------------
   Todas las vistas piden datos a traves de este archivo. Lo hicimos asi por
   tres motivos:

   1) El token se agrega en UN solo lugar. Si manana cambia como se manda la
      autorizacion, se toca aca y no en las 11 vistas.
   2) Los errores del backend se traducen una sola vez a un mensaje en
      castellano que las vistas pueden mostrar tal cual.
   3) La profesora aviso que en la tercera entrega todo esto se refactoriza a
      Redux. Teniendo los fetch concentrados aca, ese refactor toca estos
      archivos y no todas las vistas.
   ========================================================================== */

import { borrarSesion, leerToken } from './sesion';

// La URL del backend sale de la variable de entorno VITE_API_URL (archivo .env).
// Asi no queda "localhost" hardcodeado: si manana lo subimos a un servidor,
// cambiamos el .env y nada mas.
const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:4002';

/**
 * Nombre del evento que avisa que el token dejo de servir.
 *
 * El JWT vence a las 24 horas. Cuando eso pasa, el backend responde 401 a
 * cualquier request. En vez de repetir ese control en cada vista, el cliente
 * avisa una sola vez con un evento de window y App lo escucha: cierra la
 * sesion y manda al login. Es un aviso entre partes de nuestro propio codigo,
 * no estamos tocando el DOM a mano.
 */
export const EVENTO_SESION_EXPIRADA = 'mesallena:sesion-expirada';

/**
 * Convierte la respuesta de error del backend en un mensaje para la pantalla.
 *
 * Nuestro GlobalExceptionHandler siempre devuelve el mismo cuerpo:
 *   { timestamp, status, error, message }
 * asi que leemos "message". Si la respuesta no trae JSON (por ejemplo un 500
 * crudo de Tomcat), armamos un mensaje generico con el codigo de estado.
 */
async function mensajeDeError(respuesta) {
  try {
    const cuerpo = await respuesta.json();
    if (cuerpo?.message) return cuerpo.message;
    if (cuerpo?.error) return cuerpo.error;
  } catch {
    // La respuesta no era JSON: seguimos al mensaje por defecto.
  }

  if (respuesta.status === 401) return 'Tenes que iniciar sesion para hacer esto.';
  if (respuesta.status === 403) return 'Tu cuenta no tiene permiso para hacer esto.';
  if (respuesta.status === 404) return 'No encontramos lo que estabas buscando.';
  return `El servidor respondio con un error (${respuesta.status}).`;
}

/**
 * Hace la request y devuelve el JSON ya parseado.
 * Si algo sale mal, lanza un Error con un mensaje listo para mostrar.
 *
 * @param {string} ruta      Por ejemplo "/products" o "/carts/items".
 * @param {object} opciones  method, body y si hace falta mandar el token.
 */
async function pedir(ruta, { metodo = 'GET', cuerpo, conToken = false, esFormulario = false } = {}) {
  // --- Armado de los headers -------------------------------------------
  const headers = {};

  // Cuando mandamos JSON hay que declararlo. Cuando mandamos un FormData NO
  // se declara: el navegador tiene que poner el Content-Type el mismo, porque
  // necesita agregarle el "boundary" que separa cada parte del multipart.
  if (cuerpo && !esFormulario) {
    headers['Content-Type'] = 'application/json';
  }

  // El token viaja en el header Authorization con el prefijo "Bearer ",
  // exactamente igual que como lo mandamos desde Insomnia.
  if (conToken) {
    const token = leerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // --- Armado de las opciones del fetch --------------------------------
  const opciones = { method: metodo, headers };

  if (cuerpo) {
    opciones.body = esFormulario ? cuerpo : JSON.stringify(cuerpo);
  }

  // --- La request -------------------------------------------------------
  let respuesta;
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, opciones);
  } catch {
    // Si el fetch explota antes de recibir respuesta es porque no hubo red:
    // el backend esta apagado, o es otro puerto, o el CORS no deja pasar.
    throw new Error(
      'No pudimos conectarnos con el servidor. Verifica que el backend este corriendo en ' +
        URL_API +
        '.',
    );
  }

  // --- Token vencido o invalido ----------------------------------------
  if (respuesta.status === 401 && conToken) {
    borrarSesion();
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    throw new Error('Tu sesion vencio. Volve a iniciar sesion para continuar.');
  }

  if (!respuesta.ok) {
    throw new Error(await mensajeDeError(respuesta));
  }

  // 204 No Content (por ejemplo el DELETE de un producto) no trae cuerpo:
  // si intentaramos parsearlo como JSON reventaria.
  if (respuesta.status === 204) return null;

  return respuesta.json();
}

/* --------------------------------------------------------------------------
   Atajos por metodo HTTP. Las vistas usan estos, no "pedir" directamente.
   -------------------------------------------------------------------------- */

export function get(ruta, conToken = false) {
  return pedir(ruta, { conToken });
}

export function post(ruta, cuerpo, conToken = false) {
  return pedir(ruta, { metodo: 'POST', cuerpo, conToken });
}

export function put(ruta, cuerpo, conToken = false) {
  return pedir(ruta, { metodo: 'PUT', cuerpo, conToken });
}

export function patch(ruta, cuerpo, conToken = false) {
  return pedir(ruta, { metodo: 'PATCH', cuerpo, conToken });
}

export function eliminar(ruta, conToken = false) {
  return pedir(ruta, { metodo: 'DELETE', conToken });
}

/** POST de un formulario con archivos (multipart/form-data). */
export function postFormulario(ruta, formData, conToken = true) {
  return pedir(ruta, { metodo: 'POST', cuerpo: formData, conToken, esFormulario: true });
}

/** PUT de un formulario con archivos (multipart/form-data). */
export function putFormulario(ruta, formData, conToken = true) {
  return pedir(ruta, { metodo: 'PUT', cuerpo: formData, conToken, esFormulario: true });
}
