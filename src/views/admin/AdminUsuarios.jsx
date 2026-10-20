/* ==========================================================================
   Panel de la tienda: cuentas de usuario
   --------------------------------------------------------------------------
   Cubre el punto "Administracion de cuentas de usuario, incluyendo la
   asignacion de permisos".

   Un usuario puede ser COMPRADOR (USER) o TIENDA (ADMIN). Desde aca se cambia.

   Dos cosas a tener en cuenta:
   - El backend no deja que un admin se cambie el rol a si mismo, para que la
     tienda no quede sin ningun administrador. Aca directamente no le mostramos
     el boton, asi no intenta algo que va a fallar.
   - El listado nunca trae contrasenias: el UserResponse no las expone.
   ========================================================================== */

import { useEffect, useState } from 'react';
import Aviso from '../../components/Aviso';
import Cargando from '../../components/Cargando';
import Paginador from '../../components/Paginador';
import { cambiarRol, obtenerUsuarios } from '../../api/usuarios';

const POR_PAGINA = 20;

function AdminUsuarios({ usuario, avisar }) {
  const [usuarios, setUsuarios] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [cambiandoId, setCambiandoId] = useState(null);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError('');

    obtenerUsuarios({ page: pagina, size: POR_PAGINA })
      .then((respuesta) => {
        if (cancelado) return;
        setUsuarios(respuesta.content ?? []);
        setTotalPaginas(respuesta.totalPages ?? 0);
        setTotal(respuesta.totalElements ?? 0);
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
  }, [pagina]);

  /** Cambia el rol de una cuenta entre comprador y tienda. */
  async function cambiar(cuenta) {
    const rolNuevo = cuenta.role === 'ADMIN' ? 'USER' : 'ADMIN';

    const confirmado = window.confirm(
      rolNuevo === 'ADMIN'
        ? `Darle permisos de tienda a ${cuenta.username}?\n\n` +
            'Va a poder publicar, editar y dar de baja productos, y administrar las demas cuentas.'
        : `Quitarle los permisos de tienda a ${cuenta.username}?\n\n` +
            'Va a volver a ser una cuenta de comprador.',
    );
    if (!confirmado) return;

    setCambiandoId(cuenta.id);
    setError('');

    try {
      const actualizada = await cambiarRol(cuenta.id, rolNuevo);
      setUsuarios(usuarios.map((u) => (u.id === actualizada.id ? actualizada : u)));
      avisar(
        'exito',
        `${actualizada.username} ahora es ${actualizada.role === 'ADMIN' ? 'tienda' : 'comprador'}.`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setCambiandoId(null);
    }
  }

  return (
    <div className="contenedor">
      <div className="encabezado-pagina">
        <div>
          <h1>Cuentas</h1>
          <p>
            {total} {total === 1 ? 'cuenta registrada' : 'cuentas registradas'} en Mesa Llena.
          </p>
        </div>
      </div>

      <Aviso tipo="error" alCerrar={() => setError('')}>
        {error}
      </Aviso>

      {cargando ? (
        <Cargando texto="Cargando las cuentas..." />
      ) : (
        <>
          <div className="panel">
            <div className="tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre y apellido</th>
                    <th>Email</th>
                    <th>Permisos</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.map((cuenta) => {
                    // Comparamos por username porque es lo que guardamos en
                    // localStorage al loguearnos.
                    const esMiCuenta = cuenta.username === usuario.username;
                    const esAdmin = cuenta.role === 'ADMIN';

                    return (
                      <tr key={cuenta.id}>
                        <td>
                          <strong>{cuenta.username}</strong>
                          {esMiCuenta && (
                            <span className="texto-chico texto-gris"> (vos)</span>
                          )}
                        </td>
                        <td>
                          {cuenta.name} {cuenta.surname}
                        </td>
                        <td className="texto-chico">{cuenta.email}</td>
                        <td>
                          <span
                            className={`etiqueta ${esAdmin ? 'etiqueta-admin' : 'etiqueta-user'}`}
                          >
                            {esAdmin ? 'Tienda' : 'Comprador'}
                          </span>
                        </td>
                        <td>
                          <div className="celda-acciones">
                            {esMiCuenta ? (
                              <span className="texto-chico texto-gris">
                                No podes cambiar tu propio rol
                              </span>
                            ) : (
                              <button
                                type="button"
                                className={`boton boton-chico ${esAdmin ? 'boton-peligro' : 'boton-borde'}`}
                                onClick={() => cambiar(cuenta)}
                                disabled={cambiandoId === cuenta.id}
                              >
                                {cambiandoId === cuenta.id
                                  ? 'Cambiando...'
                                  : esAdmin
                                    ? 'Quitar permisos de tienda'
                                    : 'Dar permisos de tienda'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Paginador pagina={pagina} totalPaginas={totalPaginas} alCambiarPagina={setPagina} />
        </>
      )}
    </div>
  );
}

export default AdminUsuarios;
