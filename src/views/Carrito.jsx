/* ==========================================================================
   Carrito y checkout
   --------------------------------------------------------------------------
   Cubre del enunciado:
   - "Gestion del carrito de compras, con la posibilidad de agregar, eliminar o
     modificar productos".
   - "Realizar el checkout del carrito con el correspondiente calculo
     automatico del total de la compra".
   - "Una vez realizado el checkout (sin procesamiento de pago), se descontara
     el stock de dicho producto. Se debera validar si cuenta con el stock
     correspondiente".

   Una decision importante: el total NO se calcula en el frontend. Lo calcula
   el backend y nosotros mostramos lo que nos manda. Si cada lado hiciera su
   propia cuenta, podriamos mostrar un total distinto al que se cobra.

   Cada operacion del carrito (cambiar cantidad, quitar, vaciar) devuelve el
   carrito completo ya actualizado, asi que con esa respuesta refrescamos la
   pantalla sin pedir los datos otra vez.
   ========================================================================== */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Cargando from '../components/Cargando';
import LineaCarrito from '../components/LineaCarrito';
import Vacio from '../components/Vacio';
import {
  actualizarCantidad,
  obtenerCarrito,
  quitarDelCarrito,
  vaciarCarrito,
} from '../api/carrito';
import { hacerCheckout } from '../api/ordenes';
import { precio } from '../formato';

function Carrito({ carrito, setCarrito, avisar }) {
  // Carga inicial: la hacemos aca aunque App ya tenga el carrito, para que la
  // vista funcione tambien cuando alguien entra directo a /carrito por URL.
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // "ocupado" bloquea los botones mientras hay una operacion en curso, para
  // que el usuario no dispare dos cambios encima del mismo item.
  const [ocupado, setOcupado] = useState(false);
  const [procesandoCompra, setProcesandoCompra] = useState(false);

  const navegar = useNavigate();

  const recargar = useCallback(async () => {
    setCarrito(await obtenerCarrito());
  }, [setCarrito]);

  useEffect(() => {
    let cancelado = false;

    obtenerCarrito()
      .then((datos) => {
        if (!cancelado) setCarrito(datos);
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
  }, [setCarrito]);

  /** Cambia la cantidad de una linea. */
  async function cambiarCantidad(item, cantidadNueva) {
    // Si baja a cero, lo que quiere es sacar el producto. El backend no acepta
    // cantidad 0 (@Min(1)), asi que lo tratamos como un "quitar".
    if (cantidadNueva < 1) {
      quitar(item);
      return;
    }

    setOcupado(true);
    setError('');

    try {
      setCarrito(await actualizarCantidad(item.id, cantidadNueva));
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  /** Saca una linea del carrito. */
  async function quitar(item) {
    setOcupado(true);
    setError('');

    try {
      setCarrito(await quitarDelCarrito(item.id));
      avisar('info', `Sacaste ${item.productName} del carrito.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  /** Vacia el carrito completo. */
  async function vaciar() {
    // Es una accion destructiva, asi que pedimos confirmacion.
    if (!window.confirm('Seguro que queres vaciar el carrito?')) return;

    setOcupado(true);
    setError('');

    try {
      setCarrito(await vaciarCarrito());
      avisar('info', 'Vaciaste el carrito.');
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  /**
   * Checkout.
   *
   * No le mandamos nada al backend: el carrito y el usuario los saca del token.
   * Del otro lado todo pasa en una sola transaccion, asi que o se hace la
   * compra entera o no se hace nada.
   *
   * Si falla por stock (porque entre que armo el carrito y aprieta el boton
   * otra persona se llevo las ultimas unidades), recargamos el carrito: asi el
   * usuario ve el stock actualizado y puede ajustar la cantidad.
   */
  async function comprar() {
    setProcesandoCompra(true);
    setError('');

    try {
      const orden = await hacerCheckout();

      // El carrito quedo vacio del lado del backend; lo reflejamos aca.
      setCarrito({ ...carrito, items: [], total: 0 });

      // Lo llevamos al detalle de la compra. El state le avisa a esa vista
      // que venimos de comprar, para que muestre el cartel de confirmacion.
      navegar(`/mis-compras/${orden.id}`, { state: { recienComprada: true } });
    } catch (e) {
      setError(e.message);
      await recargar().catch(() => {});
    } finally {
      setProcesandoCompra(false);
    }
  }

  /* ---------------------------------------------------------------- */

  if (cargando) {
    return (
      <div className="contenedor">
        <Cargando texto="Abriendo tu carrito..." />
      </div>
    );
  }

  const items = carrito?.items ?? [];

  // Alguna linea pide mas unidades de las que hay en stock? Si pasa eso, el
  // checkout va a fallar, asi que deshabilitamos el boton y lo explicamos.
  const hayProblemaDeStock = items.some((item) => item.quantity > item.stock);

  return (
    <div className="contenedor">
      <div className="encabezado-pagina">
        <div>
          <h1>Tu carrito</h1>
          <p>
            {items.length === 0
              ? 'Todavia no agregaste nada.'
              : `${items.length} ${items.length === 1 ? 'producto' : 'productos'} en el carrito`}
          </p>
        </div>

        {items.length > 0 && (
          <button type="button" className="boton boton-peligro" onClick={vaciar} disabled={ocupado}>
            Vaciar carrito
          </button>
        )}
      </div>

      <Aviso tipo="error" alCerrar={() => setError('')}>
        {error}
      </Aviso>

      {items.length === 0 ? (
        <Vacio
          icono={'\u{1F6D2}'}
          titulo="Tu carrito esta vacio"
          accion={
            <Link to="/" className="boton">
              Ver el catalogo
            </Link>
          }
        >
          Elegi algun juego del catalogo y va a aparecer aca.
        </Vacio>
      ) : (
        <div className="carrito">
          <ul className="carrito-lista panel">
            {items.map((item) => (
              <LineaCarrito
                key={item.id}
                item={item}
                alCambiarCantidad={cambiarCantidad}
                alQuitar={quitar}
                ocupado={ocupado || procesandoCompra}
              />
            ))}
          </ul>

          {/* ---------------- Resumen y checkout ---------------- */}
          <aside className="carrito-resumen panel">
            <h2>Resumen</h2>

            <ul className="resumen-lineas">
              {items.map((item) => (
                <li key={item.id}>
                  <span className="texto-chico">
                    {item.productName}
                    <span className="texto-gris"> x{item.quantity}</span>
                  </span>
                  <span className="texto-chico numero">{precio(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className="resumen-total">
              <span>Total</span>
              {/* Este total viene calculado del backend */}
              <strong>{precio(carrito.total)}</strong>
            </div>

            {hayProblemaDeStock && (
              <Aviso tipo="error">
                Hay productos con mas unidades de las que quedan en stock. Ajusta las cantidades
                para poder comprar.
              </Aviso>
            )}

            <button
              type="button"
              className="boton boton-coral boton-ancho"
              onClick={comprar}
              disabled={ocupado || procesandoCompra || hayProblemaDeStock}
            >
              {procesandoCompra ? 'Procesando la compra...' : 'Finalizar compra'}
            </button>

            <p className="texto-chico texto-gris centrado" style={{ marginTop: '.75rem' }}>
              La compra no incluye procesamiento de pago. Al confirmar se descuenta el stock y
              queda registrada en tus compras.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Carrito;
