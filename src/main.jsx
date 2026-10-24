/* ==========================================================================
   Punto de entrada de la aplicación
   --------------------------------------------------------------------------
   React no renderiza sobre todo el documento: se le da UN nodo del HTML (el
   div#root de index.html) y de ahí para abajo maneja todo él.

   El BrowserRouter va acá y envuelve a App. Tiene que estar por fuera de todo
   para que cualquier componente de la aplicación pueda usar Link, NavLink,
   useNavigate o useParams.
   ========================================================================== */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import './App.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
