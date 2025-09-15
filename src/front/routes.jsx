import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";

import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import SignIn from "./pages/Login";
import SignUp from "./pages/SignUp";

import PrivateRoute from "./components/PrivateRoute.jsx";
import Tareas from "./pages/Tareas.jsx";
import Gastos from "./pages/Gastos.jsx";
import Objetivos from "./pages/Objetivos.jsx";
import Ranking from "./pages/Ranking.jsx";
import Recompensas from "./pages/Recompensas.jsx";
import Usuarios from "./components/Usuarios.jsx";

import { LandingPage } from "./pages/LandingPage.jsx";
import Dashboard from "./components/Dashboard.jsx";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>¡Página no encontrada!</h1>} >

      {/* --- Rutas Públicas --- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/single/:theId" element={<Single />} />
      <Route path="/usuarios" element={<Usuarios />} />

      {/* --- Rutas Protegidas --- */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tareas" element={<Tareas />} />
        {/* --- AÑADIR ESTAS LÍNEAS --- */}
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/objetivos" element={<Objetivos />} />
        <Route path="/recompensas" element={<Recompensas />} />
        <Route path="/ranking" element={<Ranking />} />
      </Route>

    </Route>
  )
);