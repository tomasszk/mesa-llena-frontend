/* ==========================================================================
   Logo de Mesa Llena
   --------------------------------------------------------------------------
   Esta hecho como SVG dentro del componente (y no como un .png) para que se
   vea nitido en cualquier tamanio y para poder pintarlo con las variables de
   la paleta.

   Si mas adelante queremos usar el archivo del logo que disenamos aparte,
   se reemplaza el <svg> por un <img src={logo} /> y se toca SOLO este archivo:
   el resto de la aplicacion usa <Logo /> y no se entera del cambio.
   ========================================================================== */

/** El meeple: la fichita de madera clasica de los juegos de mesa. */
const MEEPLE =
  'M12 2.2c-2 0-3.6 1.6-3.6 3.6 0 .9.3 1.7.9 2.3-1.9.5-3.7 1.1-5.3 1.8' +
  '-1.4.6-2 1.4-2 2.3 0 .9.7 1.6 1.6 1.6.3 0 .6-.1.9-.2l2.6-1.1c.3-.1.6.1.5.4' +
  'l-1.9 7c-.2.7.3 1.4 1.1 1.4h10.4c.8 0 1.3-.7 1.1-1.4l-1.9-7c-.1-.3.2-.5.5-.4' +
  'l2.6 1.1c.3.1.6.2.9.2.9 0 1.6-.7 1.6-1.6 0-.9-.6-1.7-2-2.3-1.6-.7-3.4-1.3-5.3-1.8' +
  '.6-.6.9-1.4.9-2.3 0-2-1.6-3.6-3.6-3.6z';

function Logo({ conTexto = true, tamanio = 38 }) {
  return (
    <span className="logo">
      <svg
        className="logo-marca"
        width={tamanio}
        height={tamanio}
        viewBox="0 0 48 48"
        role="img"
        aria-label="Mesa Llena"
      >
        {/* La baldosa de fondo, en el azul profundo de la marca */}
        <rect x="0" y="0" width="48" height="48" rx="12" fill="var(--azul)" />

        {/* Tres meeples: el del medio adelante y mas grande, como en el logo */}
        <g transform="translate(5 13) scale(0.72)">
          <path d={MEEPLE} fill="var(--turquesa)" />
        </g>
        <g transform="translate(29 13) scale(0.72)">
          <path d={MEEPLE} fill="var(--coral)" />
        </g>
        <g transform="translate(14 10) scale(0.88)">
          <path d={MEEPLE} fill="var(--amarillo)" />
        </g>
      </svg>

      {conTexto && (
        <span className="logo-texto">
          Mesa <span className="logo-texto-acento">Llena</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
