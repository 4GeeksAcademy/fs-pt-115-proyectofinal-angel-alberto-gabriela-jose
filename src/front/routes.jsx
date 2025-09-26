import { lazy } from "react"; 
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";

// --- Rutas Públicas ---
import { LandingPage } from "./pages/LandingPage.jsx";
import SignIn from "./pages/Login";
import SignUp from "./pages/SignUp";

const PrivateRoute = lazy(() => import("./components/PrivateRoute.jsx"));
const Dashboard = lazy(() => import("./components/Dashboard.jsx"));
const Tareas = lazy(() => import("./pages/Tareas.jsx"));
const Gastos = lazy(() => import("./pages/Gastos.jsx"));
const Objetivos = lazy(() => import("./pages/Objetivos.jsx"));
const Ranking = lazy(() => import("./pages/Ranking.jsx"));
const Recompensas = lazy(() => import("./pages/Recompensas.jsx"));
const Usuarios = lazy(() => import("./components/Usuarios.jsx"));

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>¡Página no encontrada!</h1>} >

      {/* --- Rutas Públicas--- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/usuarios" element={<Usuarios />} />

      {/* --- Rutas Protegidas--- */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tareas" element={<Tareas />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/objetivos" element={<Objetivos />} />
        <Route path="/recompensas" element={<Recompensas />} />
        <Route path="/ranking" element={<Ranking />} />
      </Route>

    </Route>
  )
);