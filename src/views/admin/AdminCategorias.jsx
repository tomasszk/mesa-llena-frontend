/* ==========================================================================
   Panel de la tienda: categorias
   --------------------------------------------------------------------------
   Las categorias las define la tienda: son las que despues usa el filtro del
   catalogo y las que se eligen al publicar un producto.

   El backend no tiene endpoint para modificar ni borrar una categoria, y tiene
   sentido: si se borrara una categoria que ya tiene productos, esos productos
   quedarian huerfanos. Asi que desde aca se listan y se crean nuevas.
   ========================================================================== */

import { useEffect, useState } from 'react';
import Aviso from '../../components/Aviso';
import Cargando from '../../components/Cargando';
import Vacio from '../../components/Vacio';
import { crearCategoria, obtenerCategorias } from '../../api/categorias';

function AdminCategorias({ avisar }) {
  const [categorias, setCategorias] = useState([]);
  const [descripcion, setDescripcion] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    obtenerCategorias()
      .then((pagina) => {
        if (!cancelado) setCategorias(pagina.content ?? []);
      })
      .catch((e) => {
        if (!cancelado) setError(e.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  async function crear(evento) {
    evento.preventDefault();

    const texto = descripcion.trim();

    if (texto === '') {
      setError('Escribi el nombre de la categoria.');
      return;
    }

    // El backend rechaza las categorias repetidas con una excepcion propia.
    // Lo chequeamos aca tambien para avisar sin tener que ir y volver.
    const repetida = categorias.some(
      (categoria) => categoria.description.toLowerCase() === texto.toLowerCase(),
    );

    if (repetida) {
      setError(`Ya existe la categoria "${texto}".`);
      return;
    }

    setEnviando(true);
    setError('');

    try {
      const nueva = await crearCategoria(texto);
      setCategorias([...categorias, nueva]);
      setDescripcion('');
      avisar('exito', `Creaste la categoria ${nueva.description}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor">
      <div className="encabezado-pagina">
        <div>
          <h1>Categorias</h1>
          <p>Con estas categorias se clasifican los juegos del catalogo.</p>
        </div>
      </div>

      <Aviso tipo="error" alCerrar={() => setError('')}>
        {error}
      </Aviso>

      <div className="dos-columnas">
        <form className="panel" onSubmit={crear}>
          <h2>Nueva categoria</h2>

          <div className="campo">
            <label htmlFor="descripcion">Nombre</label>
            <input
              id="descripcion"
              type="text"
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                setError('');
              }}
              placeholder="Estrategia, Familiares, Party..."
            />
          </div>

          <button
            type="submit"
            className="boton boton-ancho"
            disabled={enviando || descripcion.trim() === ''}
          >
            {enviando ? 'Creando...' : 'Crear categoria'}
          </button>
        </form>

        <div className="panel">
          <h2>
            Categorias existentes{' '}
            <span className="texto-gris texto-chico">({categorias.length})</span>
          </h2>

          {cargando ? (
            <Cargando texto="Cargando categorias..." />
          ) : categorias.length === 0 ? (
            <Vacio icono={'\u{1F3F7}'} titulo="Todavia no hay categorias">
              Crea la primera con el formulario de al lado.
            </Vacio>
          ) : (
            <ul className="lista-categorias">
              {categorias.map((categoria) => (
                <li key={categoria.id}>
                  <span className="etiqueta etiqueta-categoria">{categoria.description}</span>
                  <span className="texto-chico texto-gris">#{categoria.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCategorias;
