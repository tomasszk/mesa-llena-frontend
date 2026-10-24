/* ==========================================================================
   Cliente HTTP - el único lugar del frontend donde se escribe "fetch"
   --------------------------------------------------------------------------
   Todas las vistas piden datos a través de este archivo. Lo hicimos así por
   tres motivos:

   1) El token se agrega en UN solo lugar. Si mañana cambia cómo se manda la
      autorización, se toca acá y no en cada vista.
   2) Los errores del backend se traducen una sola vez a un mensaje en
      castellano que las vistas pueden mostrar tal cual.
   3) Los fetch quedan centralizados para separar la comunicación HTTP de la
      lógica de las vistas y facilitar futuros cambios.
   ========================================================================== */

import { borrarSesion, leerToken } from './sesion';

// La URL del backend sale de la variable de entorno VITE_API_URL (archivo .env).
// Así no queda "localhost" hardcodeado: si mañana lo subimos a un servidor,
// cambiamos el .env y nada más.
const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:4002';

/**
 * Nombre del evento que avisa que el token dejó de servir.
 *
 * El JWT vence a las 24 horas. Cuando eso pasa, el backend responde 401 a
 * cualquier request. En vez de repetir ese control en cada vista, el cliente
 * avisa una sola vez con un evento de window y App lo escucha: cierra la
 * sesión y manda al login. Es un aviso entre partes de nuestro propio código,
 * no estamos tocando el DOM a mano.
 */
export const EVENTO_SESION_EXPIRADA = 'mesallena:sesion-expirada';

/**
 * Convierte la respuesta de error del backend en un mensaje para la pantalla.
 *
 * Nuestro GlobalExceptionHandler siempre devuelve el mismo cuerpo:
 *   { timestamp, status, error, message }
 * así que leemos "message". Si la respuesta no trae JSON (por ejemplo un 500
 * crudo de Tomcat), armamos un mensaje genérico con el código de estado.
 */
async function mensajeDeError(respuesta) {
  try {
    const cuerpo = await respuesta.json();
    if (cuerpo?.message) return cuerpo.message;
    if (cuerpo?.error) return cuerpo.error;
  } catch {
    // La respuesta no era JSON: seguimos al mensaje por defecto.
  }

  if (respuesta.status === 401) return 'Tenés que iniciar sesión para hacer esto.';
  if (respuesta.status === 403) return 'Tu cuenta no tiene permiso para hacer esto.';
  if (respuesta.status === 404) return 'No encontramos lo que estabas buscando.';
  return `El servidor respondió con un error (${respuesta.status}).`;
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
  // se declara: el navegador tiene que poner el Content-Type él mismo, porque
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
    // el backend está apagado, o es otro puerto, o el CORS no deja pasar.
    throw new Error(
      'No pudimos conectarnos con el servidor. Verificá que el backend esté corriendo en ' +
        URL_API +
        '.',
    );
  }

  // --- Token vencido o inválido ----------------------------------------
  if (respuesta.status === 401 && conToken) {
    borrarSesion();
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    throw new Error('Tu sesión venció. Volvé a iniciar sesión para continuar.');
  }

  if (!respuesta.ok) {
    throw new Error(await mensajeDeError(respuesta));
  }

  // 204 No Content (por ejemplo el DELETE de un producto) no trae cuerpo:
  // si intentáramos parsearlo como JSON reventaría.
  if (respuesta.status === 204) return null;

  return respuesta.json();
}

/* --------------------------------------------------------------------------
   Atajos por método HTTP. Las vistas usan estos, no "pedir" directamente.
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
