/* ==========================================================================
   Alta y modificacion de un producto
   --------------------------------------------------------------------------
   El mismo componente sirve para las dos cosas. Lo que decide el modo es si la
   URL trae un id: /admin/productos/nuevo no lo trae, y
   /admin/productos/7/editar si.

   Este es el unico formulario de toda la aplicacion que NO manda JSON.
   El endpoint de productos recibe multipart/form-data porque junto con los
   datos suben los archivos de las fotos, asi que armamos un FormData.
   Importante: el Content-Type no se pone a mano. Lo tiene que poner el
   navegador, porque necesita agregarle el "boundary" que separa cada parte.
   ========================================================================== */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Aviso from '../../components/Aviso';
import Cargando from '../../components/Cargando';
import { actualizarProducto, crearProducto, obtenerProducto } from '../../api/productos';
import { obtenerCategorias } from '../../api/categorias';
import { imagenBase64, precio } from '../../formato';

const CAMPOS_VACIOS = {
  name: '',
  description: '',
  price: '',
  stock: '',
  discount: '0',
  categoryId: '',
};

// Lo que acepta el <input type="file"> y lo que validamos antes de subir.
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const TAMANIO_MAXIMO = 5 * 1024 * 1024; // 5 MB por foto

function FormularioProducto({ avisar }) {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navegar = useNavigate();

  const [datos, setDatos] = useState(CAMPOS_VACIOS);
  const [categorias, setCategorias] = useState([]);

  // Las fotos nuevas que eligio el usuario (objetos File del navegador).
  const [archivos, setArchivos] = useState([]);
  // Las URL temporales para poder previsualizarlas antes de subirlas.
  const [previsualizaciones, setPrevisualizaciones] = useState([]);
  // Las fotos que el producto ya tenia (solo en modo edicion).
  const [imagenesActuales, setImagenesActuales] = useState([]);

  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(esEdicion);
  const [enviando, setEnviando] = useState(false);

  /* ------------------------------------------------------------------
     Las categorias se necesitan siempre: sin categoria no se puede publicar.
     ------------------------------------------------------------------ */
  useEffect(() => {
    obtenerCategorias()
      .then((pagina) => setCategorias(pagina.content ?? []))
      .catch((e) => setError(e.message));
  }, []);

  /* ------------------------------------------------------------------
     En modo edicion traemos el producto y llenamos el formulario con lo que
     ya tenia cargado.
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!esEdicion) return;

    let cancelado = false;

    obtenerProducto(id)
      .then((producto) => {
        if (cancelado) return;

        setDatos({
          name: producto.name ?? '',
          description: producto.description ?? '',
          price: String(producto.price ?? ''),
          stock: String(producto.stock ?? ''),
          discount: String(producto.discount ?? 0),
          categoryId: String(producto.categoryId ?? ''),
        });
        setImagenesActuales(producto.images ?? []);
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
  }, [id, esEdicion]);

  /* ------------------------------------------------------------------
     Previsualizacion de las fotos elegidas.

     createObjectURL le da al navegador una direccion temporal para mostrar un
     archivo que todavia esta en la maquina del usuario. Esas direcciones
     ocupan memoria hasta que se liberan, asi que la limpieza del useEffect
     las libera cuando cambian los archivos o cuando se cierra la pantalla.
     ------------------------------------------------------------------ */
  useEffect(() => {
    const urls = archivos.map((archivo) => URL.createObjectURL(archivo));
    setPrevisualizaciones(urls);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [archivos]);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setDatos({ ...datos, [name]: value });
    setErrores({ ...errores, [name]: undefined });
    setError('');
  }

  /** Valida las fotos elegidas antes de aceptarlas. */
  function alElegirArchivos(evento) {
    // evento.target.files es una FileList, no un array: la convertimos para
    // poder usar map y filter.
    const elegidos = Array.from(evento.target.files);

    const rechazados = [];
    const aceptados = [];

    for (const archivo of elegidos) {
      if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        rechazados.push(`${archivo.name} no es una imagen (jpg, png, webp o gif)`);
      } else if (archivo.size > TAMANIO_MAXIMO) {
        rechazados.push(`${archivo.name} pesa mas de 5 MB`);
      } else {
        aceptados.push(archivo);
      }
    }

    setArchivos(aceptados);
    setErrores({ ...errores, imagenes: undefined });
    setError(rechazados.length > 0 ? rechazados.join('. ') + '.' : '');
  }

  function quitarArchivo(indice) {
    setArchivos(archivos.filter((_, i) => i !== indice));
  }

  /**
   * Valida los campos. Son las mismas reglas que tienen las anotaciones del
   * ProductRequest en el backend.
   */
  function validar() {
    const nuevos = {};

    if (datos.name.trim() === '') nuevos.name = 'El nombre es obligatorio';
    if (datos.description.trim() === '') nuevos.description = 'La descripcion es obligatoria';

    if (datos.price === '') {
      nuevos.price = 'El precio es obligatorio';
    } else if (Number(datos.price) <= 0) {
      nuevos.price = 'El precio tiene que ser mayor a cero';
    }

    if (datos.stock === '') {
      nuevos.stock = 'El stock es obligatorio';
    } else if (Number(datos.stock) < 0 || !Number.isInteger(Number(datos.stock))) {
      nuevos.stock = 'El stock tiene que ser un numero entero de 0 o mas';
    }

    const descuento = Number(datos.discount === '' ? 0 : datos.discount);
    if (descuento < 0 || descuento > 100) {
      nuevos.discount = 'El descuento va de 0 a 100';
    }

    if (datos.categoryId === '') nuevos.categoryId = 'Elegi una categoria';

    // Al publicar hace falta al menos una foto. Al editar, si no elige fotos
    // nuevas, se quedan las que ya tenia.
    if (!esEdicion && archivos.length === 0) {
      nuevos.imagenes = 'El producto tiene que tener al menos una foto';
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function enviar(evento) {
    evento.preventDefault();

    if (!validar()) return;

    setEnviando(true);
    setError('');

    const cuerpo = {
      name: datos.name.trim(),
      description: datos.description.trim(),
      price: datos.price,
      stock: datos.stock,
      discount: datos.discount === '' ? 0 : datos.discount,
      categoryId: datos.categoryId,
      imagenes: archivos,
    };

    try {
      if (esEdicion) {
        await actualizarProducto(id, cuerpo);
        avisar('exito', 'Guardamos los cambios del producto.');
      } else {
        await crearProducto(cuerpo);
        avisar('exito', 'Publicamos el producto en el catalogo.');
      }

      navegar('/admin/productos');
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  function claseCampo(campo) {
    return `campo ${errores[campo] ? 'campo-invalido' : ''}`;
  }

  if (cargando) {
    return (
      <div className="contenedor">
        <Cargando texto="Cargando el producto..." />
      </div>
    );
  }

  // Cuanto saldria el producto con el descuento puesto, para que la tienda vea
  // el resultado sin tener que guardar primero. Es la misma cuenta que hace
  // getFinalPrice() en el backend.
  const precioFinal =
    datos.price !== '' && Number(datos.price) > 0
      ? (Number(datos.price) * (100 - Number(datos.discount || 0))) / 100
      : null;

  return (
    <div className="contenedor">
      <nav className="migas">
        <Link to="/admin/productos">Productos</Link>
        <span aria-hidden="true">/</span>
        <span className="texto-gris">{esEdicion ? `Editar #${id}` : 'Publicar producto'}</span>
      </nav>

      <div className="encabezado-pagina">
        <div>
          <h1>{esEdicion ? 'Editar producto' : 'Publicar producto'}</h1>
          <p>
            {esEdicion
              ? 'Cambia lo que necesites y guarda. Las fotos solo se reemplazan si subis nuevas.'
              : 'Carga el juego con su descripcion, categoria, precio y al menos una foto.'}
          </p>
        </div>
      </div>

      <Aviso tipo="error" alCerrar={() => setError('')}>
        {error}
      </Aviso>

      {categorias.length === 0 && (
        <Aviso tipo="info">
          Todavia no hay categorias cargadas, y un producto necesita una.{' '}
          <Link to="/admin/categorias">Crea la primera categoria</Link> y volve.
        </Aviso>
      )}

      <form className="panel formulario-producto" onSubmit={enviar} noValidate>
        <div className={claseCampo('name')}>
          <label htmlFor="name">Nombre del juego</label>
          <input
            id="name"
            name="name"
            type="text"
            value={datos.name}
            onChange={alCambiar}
            placeholder="Catan"
          />
          {errores.name && <p className="error-campo">{errores.name}</p>}
        </div>

        <div className={claseCampo('description')}>
          <label htmlFor="description">Descripcion</label>
          <textarea
            id="description"
            name="description"
            value={datos.description}
            onChange={alCambiar}
            placeholder="De que se trata, para cuantos jugadores, cuanto dura una partida..."
          />
          {errores.description && <p className="error-campo">{errores.description}</p>}
        </div>

        <div className={claseCampo('categoryId')}>
          <label htmlFor="categoryId">Categoria</label>
          <select
            id="categoryId"
            name="categoryId"
            value={datos.categoryId}
            onChange={alCambiar}
          >
            <option value="">Elegi una categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.description}
              </option>
            ))}
          </select>
          {errores.categoryId && <p className="error-campo">{errores.categoryId}</p>}
        </div>

        <div className="fila-campos">
          <div className={claseCampo('price')}>
            <label htmlFor="price">Precio de lista</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={datos.price}
              onChange={alCambiar}
              placeholder="0.00"
            />
            {errores.price && <p className="error-campo">{errores.price}</p>}
          </div>

          <div className={claseCampo('stock')}>
            <label htmlFor="stock">Stock</label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={datos.stock}
              onChange={alCambiar}
              placeholder="0"
            />
            {errores.stock ? (
              <p className="error-campo">{errores.stock}</p>
            ) : (
              <p className="ayuda">Con stock 0 el juego aparece como agotado</p>
            )}
          </div>
        </div>

        <div className={claseCampo('discount')}>
          <label htmlFor="discount">Descuento (%)</label>
          <input
            id="discount"
            name="discount"
            type="number"
            min="0"
            max="100"
            step="1"
            value={datos.discount}
            onChange={alCambiar}
          />
          {errores.discount ? (
            <p className="error-campo">{errores.discount}</p>
          ) : (
            precioFinal != null && (
              <p className="ayuda">
                Se publica a <strong>{precio(precioFinal)}</strong>
                {Number(datos.discount) > 0 && ` (${datos.discount}% menos)`}
              </p>
            )
          )}
        </div>

        {/* ---------------- Las fotos ---------------- */}
        <div className={claseCampo('imagenes')}>
          <label htmlFor="imagenes">
            Fotos del producto {esEdicion && <span className="texto-gris">(opcional)</span>}
          </label>
          <input
            id="imagenes"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={alElegirArchivos}
          />
          {errores.imagenes ? (
            <p className="error-campo">{errores.imagenes}</p>
          ) : (
            <p className="ayuda">
              Podes elegir varias a la vez. Hasta 5 MB cada una.
              {esEdicion && ' Si subis fotos nuevas, reemplazan a todas las actuales.'}
            </p>
          )}
        </div>

        {/* Las fotos que ya tenia el producto */}
        {esEdicion && imagenesActuales.length > 0 && archivos.length === 0 && (
          <div className="campo">
            <label>Fotos actuales</label>
            <div className="galeria-chica">
              {imagenesActuales.map((imagen, indice) => (
                <div key={indice} className="galeria-item">
                  <img src={imagenBase64(imagen)} alt="" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Las fotos nuevas que acaba de elegir */}
        {previsualizaciones.length > 0 && (
          <div className="campo">
            <label>
              {esEdicion ? 'Fotos nuevas (reemplazan a las actuales)' : 'Fotos elegidas'}
            </label>
            <div className="galeria-chica">
              {previsualizaciones.map((url, indice) => (
                <div key={url} className="galeria-item">
                  <img src={url} alt="" />
                  <button
                    type="button"
                    className="galeria-quitar"
                    onClick={() => quitarArchivo(indice)}
                    aria-label="Quitar esta foto"
                  >
                    {'✕'}
                  </button>
                  {indice === 0 && <span className="galeria-principal">Principal</span>}
                </div>
              ))}
            </div>
            <p className="ayuda">
              La primera foto es la que se ve en el catalogo y en el carrito.
            </p>
          </div>
        )}

        <div className="formulario-acciones">
          <Link to="/admin/productos" className="boton boton-borde">
            Cancelar
          </Link>
          <button
            type="submit"
            className="boton"
            disabled={enviando || categorias.length === 0}
          >
            {enviando
              ? 'Guardando...'
              : esEdicion
                ? 'Guardar cambios'
                : 'Publicar en el catalogo'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormularioProducto;
