import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Componentes
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Usuarios from "./components/Usuarios";

// Pages
import Home from "./components/Home";
import Tareas from "./pages/Tareas";
import ControlDeGastos from "./pages/Gastos";
import Objetivos from "./pages/Objetivos";
import Recompensas from "./pages/Recompensas";
import Ranking from "./pages/Ranking";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tareas" element={<Tareas />} />
        <Route path="/gastos" element={<ControlDeGastos />} />
        <Route path="/objetivos" element={<Objetivos />} />
        <Route path="/recompensas" element={<Recompensas />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/usuarios" element={<Usuarios />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);