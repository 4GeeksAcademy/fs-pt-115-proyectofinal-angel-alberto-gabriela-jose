import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import SignIn from "./pages/Login";
import SignUp from "./pages/SignUp";
import { Dashboard } from "./pages/Dashboard.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import { Tareas } from "./pages/Tareas.jsx";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>¡Página no encontrada!</h1>} >

      {/* --- Rutas Públicas --- */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/single/:theId" element={<Single />} />

      {/* --- Rutas Protegidas --- */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tareas" element={<Tareas />} />
      </Route>

    </Route>
  )
);