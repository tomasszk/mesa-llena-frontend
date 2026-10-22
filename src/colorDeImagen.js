/* ==========================================================================
   Color dominante de una imagen
   --------------------------------------------------------------------------
   Sirve para que la pagina de cada juego se tiña con los colores de su propia
   caja: Catan queda rojizo, Azul queda celeste, Dixit violeta.

   Lo importante es de donde sale ese color: NO esta escrito a mano en una
   lista de juegos. Se calcula de la foto que el producto tiene en la base, asi
   que cuando la tienda publique un juego nuevo la pagina se va a tematizar
   sola, sin que nadie toque el codigo.

   Sobre el canvas: lo usamos como herramienta de calculo, no para dibujar en
   pantalla. El canvas nunca se agrega al documento; se crea en memoria, se
   pinta la imagen adentro para poder leerle los pixeles, y lo unico que sale
   de aca es un string con un color. Ese color despues entra como estado de
   React, que es quien decide que se ve. No estamos manipulando el DOM a mano.
   ========================================================================== */

/** A que tamanio reducimos la imagen antes de leerla. */
const MUESTRA = 64;

/** En cuantos tonos dividimos la rueda de color. */
const CAJONES = 24;

/**
 * Que parte del borde descartamos.
 *
 * Las fotos de producto suelen tener la caja en el centro y fondo alrededor.
 * Si midieramos la imagen entera ganaria casi siempre el fondo, que es lo que
 * mas superficie ocupa y justamente lo que menos identifica al juego.
 */
const BORDE = 0.21;

/** Saturacion minima para que un pixel cuente: abajo de esto es un gris. */
const SATURACION_MINIMA = 0.3;

/** Presencia minima de un tono para considerarlo, sobre el total util. */
const PRESENCIA_MINIMA = 0.04;

/** Convierte un color RGB a HSL, para poder razonar en saturacion y brillo. */
function aHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h, s, l };
}

/**
 * Devuelve el color que identifica a la imagen como { h, s, l }, o null si no
 * se pudo leer (imagen rota, o un formato que el navegador no entiende).
 *
 * No busca el color que mas superficie ocupa, sino el mas VIVIDO de los que
 * tienen presencia real. En la caja de un juego, el color que uno recuerda
 * casi nunca es el que mas espacio ocupa: el carton, la madera o el cielo del
 * fondo ganarian siempre, y todas las cajas terminarian del mismo marron.
 * Por eso el puntaje de cada tono es su saturacion al cuadrado por la raiz de
 * cuanto aparece: premia lo vivo sin dejar que gane un detalle de dos pixeles.
 */
export function colorDominante(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const imagen = new Image();

    imagen.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = MUESTRA;
        canvas.height = MUESTRA;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(imagen, 0, 0, MUESTRA, MUESTRA);

        const { data } = ctx.getImageData(0, 0, MUESTRA, MUESTRA);

        const peso = new Array(CAJONES).fill(0);
        const suma_s = new Array(CAJONES).fill(0);
        const suma_l = new Array(CAJONES).fill(0);
        let utiles = 0;

        const desde = Math.floor(MUESTRA * BORDE);
        const hasta = MUESTRA - desde;

        for (let y = desde; y < hasta; y++) {
          for (let x = desde; x < hasta; x++) {
            const i = (y * MUESTRA + x) * 4;

            if (data[i + 3] < 200) continue; // pixel transparente

            const { h, s, l } = aHsl(data[i], data[i + 1], data[i + 2]);

            // Los casi blancos, casi negros y los grises no aportan identidad.
            if (l < 0.15 || l > 0.9 || s < SATURACION_MINIMA) continue;

            const cajon = Math.min(CAJONES - 1, Math.floor(h * CAJONES));
            peso[cajon] += 1;
            suma_s[cajon] += s;
            suma_l[cajon] += l;
            utiles += 1;
          }
        }

        if (utiles === 0) {
          resolve(null); // imagen sin color definido (una foto en blanco y negro)
          return;
        }

        let elegido = -1;
        let mejorPuntaje = 0;

        for (let c = 0; c < CAJONES; c++) {
          if (peso[c] < utiles * PRESENCIA_MINIMA) continue;

          const saturacionMedia = suma_s[c] / peso[c];
          const puntaje = saturacionMedia * saturacionMedia * Math.sqrt(peso[c] / utiles);

          if (puntaje > mejorPuntaje) {
            mejorPuntaje = puntaje;
            elegido = c;
          }
        }

        if (elegido < 0) {
          resolve(null);
          return;
        }

        resolve({
          h: Math.round((elegido + 0.5) * (360 / CAJONES)), // centro del cajon
          s: Math.round((suma_s[elegido] / peso[elegido]) * 100),
          l: Math.round((suma_l[elegido] / peso[elegido]) * 100),
        });
      } catch {
        // getImageData falla si la imagen viene de otro dominio sin permiso.
        // No es nuestro caso (las fotos llegan en Base64), pero si pasara
        // preferimos quedarnos sin color antes que romper la pantalla.
        resolve(null);
      }
    };

    imagen.onerror = () => resolve(null);
    imagen.src = src;
  });
}

/**
 * Arma las variables de CSS de la pagina de un juego a partir de ese color.
 *
 * Se devuelven como objeto de estilo para pasarselo a un elemento con
 * style={...}. React escribe las variables y el CSS las usa; no tocamos
 * clases ni nodos a mano.
 */
export function variablesDeTema(color) {
  if (!color) return undefined;

  // Saturacion y luminosidad acotadas: una caja muy estridente no puede
  // romper la legibilidad del texto que va encima.
  const s = Math.min(Math.max(color.s, 35), 72);

  return {
    '--juego-fuerte': `hsl(${color.h} ${s}% 22%)`,
    '--juego-medio': `hsl(${color.h} ${s}% 38%)`,
    '--juego-suave': `hsl(${color.h} ${Math.min(s, 55)}% 95%)`,
    '--juego-borde': `hsl(${color.h} ${Math.min(s, 55)}% 86%)`,
  };
}
