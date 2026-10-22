# Mesa Llena — frontend

Interfaz de usuario del e-commerce de juegos de mesa. Segunda entrega del TPO de
Aplicaciones Interactivas (UADE, 2º cuatrimestre 2026).

Todo lo que se ve acá está conectado al backend real. No hay datos mockeados:
cada pantalla pide la información a la API y muestra lo que el backend responde.

El backend vive en su propio repositorio: **https://github.com/tomidelia/API**
Son dos proyectos separados que se levantan a la par.

## Cómo levantarlo

Hacen falta **tres cosas corriendo a la vez**:

**1. MySQL** (servicio de Windows, suele arrancar solo).

**2. El backend.** Clonalo aparte desde https://github.com/tomidelia/API y
seguí su README para configurar `application.properties`. Después, desde
`tpo-backend/`:

**Windows PowerShell:**

```powershell
.\mvnw.cmd spring-boot:run
```

**macOS/Linux:**

```bash
./mvnw spring-boot:run
```

Queda escuchando en `http://localhost:4002`.

**3. El frontend**, desde la raíz del repositorio:

```bash
npm install
```

```bash
npm run dev
```

Abre en `http://localhost:5173`.

> El puerto 5173 no es opcional: es el único (junto con el 3000) que el backend
> tiene habilitado en el CORS, en `WebConfig.java`.

La URL del backend sale de la variable `VITE_API_URL` del archivo `.env`. Si
alguien levanta el backend en otro puerto, se cambia ahí y nada más.

## Qué hay adentro

```
src/
├── main.jsx          Monta React y envuelve todo en el BrowserRouter
├── App.jsx           Estado compartido (sesión y carrito) + todas las rutas
├── index.css         La paleta de Mesa Llena y los estilos base
├── App.css           Los estilos de cada componente
├── formato.js        Precios, fechas e imágenes en Base64
│
├── api/              El único lugar donde se escribe "fetch"
│   ├── cliente.js        Arma la request, pone el token, traduce los errores
│   ├── sesion.js         Guarda y lee el JWT de localStorage
│   ├── autenticacion.js  /api/v1/auth  (registro y login)
│   ├── productos.js      /products     (catálogo y gestión)
│   ├── categorias.js     /categories
│   ├── carrito.js        /carts
│   ├── ordenes.js        /orders       (checkout e historial)
│   └── usuarios.js       /users        (administración de cuentas)
│
├── components/       Piezas reutilizables (navbar, tarjetas, avisos...)
└── views/            Una por pantalla
    └── admin/        Las cuatro del panel de la tienda
```

## Las vistas

| Ruta | Quién entra | Qué hace |
|---|---|---|
| `/` | cualquiera | Catálogo con búsqueda, filtros y paginado |
| `/productos/:id` | cualquiera | Detalle del juego con sus fotos |
| `/ingresar` | cualquiera | Login |
| `/registro` | cualquiera | Alta de cuenta de comprador |
| `/carrito` | comprador | Carrito y checkout |
| `/mis-compras` | comprador | Historial de compras |
| `/mis-compras/:id` | comprador | Detalle de una compra |
| `/admin/productos` | tienda | Listado, stock, descuentos y baja |
| `/admin/productos/nuevo` | tienda | Publicar un producto con sus fotos |
| `/admin/productos/:id/editar` | tienda | Modificar la publicación |
| `/admin/categorias` | tienda | Ver y crear categorías |
| `/admin/usuarios` | tienda | Cuentas y asignación de permisos |

Los dos roles están separados a propósito: en el backend `/carts` y `/orders`
piden el rol `USER`, porque la tienda vende pero no compra. Por eso la cuenta de
administrador no ve el carrito.

`RutaProtegida` controla esto en el frontend, pero es solo para la experiencia de
uso: la seguridad real está en el backend. Aunque alguien escriba
`/admin/productos` a mano en la barra de direcciones, los endpoints le van a
responder 403 porque su token dice `USER`.

## Decisiones

**React 18 + Vite + react-router-dom, y nada más.** Es exactamente el stack que
dio la cátedra. Sin axios: `fetch` pelado, como se vio en clase.

**Estado local, no Redux.** El estado que comparten varias vistas (la sesión y el
carrito) vive en `App.jsx` y baja por props. Es el flujo unidireccional de React:
el padre manda los datos y el hijo comunica los eventos. Los `fetch` están
concentrados en `api/`, lo que mantiene separada la comunicación con el backend
de la lógica de las vistas y facilita futuros cambios en el manejo del estado.

**Sin librería de estilos.** La profesora pidió elegir una sola y no mezclarlas.
Elegimos no usar ninguna: CSS propio con variables, así el frontend queda liviano.
Toda la paleta está en `:root` dentro de `index.css`.

**Sin manipulación del DOM.** Nada de `document.getElementById` ni `innerHTML`
para cambiar la pantalla. Todo pasa por estado de React.

**El token en localStorage.** Se guarda al registrarse o loguearse y viaja en el
header `Authorization: Bearer ...` de cada request. Sobrevive a un F5, que es
justamente lo que no haría un estado de React.

**La plata la calcula el backend.** El frontend nunca suma precios: muestra el
`total` y los `subtotal` que vienen en la respuesta. Si cada lado hiciera su
propia cuenta, podríamos mostrar un total distinto al que se cobra.

## Dos detalles de la API que no son obvios

**Los listados vienen paginados.** `GET /products`, `/categories`, `/orders/my` y
`/users` devuelven un `Page` de Spring, así que los datos están en `.content` y no
en la raíz de la respuesta.

**El alta de productos no es JSON.** `POST /products` y `PUT /products/{id}`
reciben `multipart/form-data`, porque junto con los datos suben los archivos de
las fotos. Ahí se manda un `FormData` y **no** se declara el `Content-Type`: lo
tiene que poner el navegador, porque necesita agregarle el *boundary* que separa
cada parte. Es el único endpoint que se sale del molde.

Las fotos vuelven en Base64 dentro de `images`, y se muestran directo con
`src={`data:image/*;base64,${imagen}`}`, sin pedir otro endpoint.
