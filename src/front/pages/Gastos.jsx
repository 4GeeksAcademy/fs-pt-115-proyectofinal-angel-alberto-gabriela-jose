import React, { useState, useEffect, useRef } from "react";
import {
  Container, Card, Typography, Button, TextField, Grid, List, Box, Alert,
  ListItem, ListItemText, IconButton, Divider, Select, MenuItem, Checkbox, FormControlLabel, CircularProgress
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import Tesseract from "tesseract.js";

function ControlDeGastos() {
  const [usuarios, setUsuarios] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para las subir Imagenes.
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [procesandoOCR, setProcesandoOCR] = useState(false);
  const [imagenPrevia, setImagenPrevia] = useState(null);
  const [texto, setTexto] = useState("");
  const [montoDetectado, setMontoDetectado] = useState("");
  const [errorOCR, setErrorOCR] = useState("");
  const [publicIdImagen, setPublicIdImagen] = useState("");
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        if (!token) {
          console.error("No se encontró token de autenticación");
          setCargando(false);
          return;
        }

        // Obtener usuarios
        const usuariosResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar/miembros`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!usuariosResponse.ok) {
          throw new Error(`Error ${usuariosResponse.status}: No autorizado o token inválido.`);
        }

        const usuariosData = await usuariosResponse.json();
        setUsuarios(usuariosData);

        // Obtener gastos
        const gastosResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gastos`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (gastosResponse.ok) {
          const gastosData = await gastosResponse.json();
          setGastos(gastosData);
        } else if (gastosResponse.status !== 404) {
          throw new Error(`Error ${gastosResponse.status} al obtener los gastos`);
        }

      } catch (error) {
        console.error("Error al obtener los datos:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, []);

  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [usuario, setUsuario] = useState("");
  const [compartido, setCompartido] = useState(false);
  const [agregando, setAgregando] = useState(false);

  // Agregar gasto
  const handleAdd = async () => {
    const montoNum = parseFloat(monto);

    if (!descripcion.trim() || isNaN(montoNum) || (!compartido && !usuario)) {
      alert("Por favor completa todos los campos con valores válidos");
      return;
    }

    setAgregando(true);

    try {
      const token = getToken();
      const nuevoGasto = {
        descripcion: descripcion.trim(),
        monto: montoNum,
        fecha,
        usuario: compartido ? "COMPARTIDO" : usuario,
        compartido: !!compartido,
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gastos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nuevoGasto)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo guardar el gasto`);
      }

      const gastoGuardado = await response.json();
      setGastos((prev) => [...prev, gastoGuardado]);

      // reset form
      setDescripcion("");
      setMonto("");
      setFecha(new Date().toISOString().split("T")[0]);
      setUsuario("");
      setCompartido(false);

    } catch (error) {
      console.error("Error al añadir el gasto", error);
      alert("Error al agregar el gasto");
    } finally {
      setAgregando(false);
    }
  };

  // Eliminar gasto
  const handleDelete = async (id) => {
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gastos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se ha podido eliminar el gasto`);
      }

      setGastos((prev) => prev.filter((g) => g.id !== id));
    } catch (error) {
      console.error("Error al eliminar el gasto", error);
      alert("Error al eliminar el gasto");
    }
  };

  // Reasignar gasto al arrastrar (al caer en otra columna deja de ser compartido)
  const handleReassign = async (gastoId, newUsuario) => {
    try {
      const token = getToken();
      const gasto = gastos.find(g => g.id === gastoId);

      if (!gasto) return;

      const gastoActualizado = {
        ...gasto,
        usuario: newUsuario,
        compartido: false
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gastos/${gastoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gastoActualizado)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo actualizar gasto`);
      }

      const gastoActualizadoResponse = await response.json();
      setGastos((prev) =>
        prev.map((g) =>
          g.id === gastoId ? gastoActualizadoResponse : g
        )
      );
    } catch (error) {
      console.error("Error al reasignar un gasto", error);
      alert("Error al reasignar el gasto");
    }
  };
  // Función que maneja selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorOCR("Por favor selecciona una imagen válida");
      return;
    }

    // Crear URL para previsualización
    const imageUrl = URL.createObjectURL(file);
    setImagenPrevia(imageUrl);
    setErrorOCR("");
    setTexto("");
    setMontoDetectado("");


    procesarImagen(file);
  };

  // Función para subir y procesar la imagen
  const procesarImagen = async (file) => {
    setSubiendoImagen(true);
    setProcesandoOCR(true);

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('ticketImage', file);

      console.log("Subiendo imagen...");

      // Sube imagen a Cloudinary
      const uploadResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gastos/upload-ticket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir la imagen');
      }

      const uploadData = await uploadResponse.json();
      console.log(" Imagen subida:", uploadData);
      setPublicIdImagen(uploadData.publicId);

      //Tesseract.js
      console.log("🔍 Procesando OCR...");
      const { data: { text } } = await Tesseract.recognize(
        uploadData.imageUrl,
        'spa+eng'
      );

      console.log(" Texto completo extraído:", text);
      setTexto(text);

      //Buscar el total 
      const totalEncontrado = buscarTotalEnTexto(text);
      console.log(" Resultado de búsqueda:", totalEncontrado);
      if (totalEncontrado) {
        setMontoDetectado(totalEncontrado);
        setMonto(totalEncontrado);
        console.log("Monto agregado al formulario:", totalEncontrado);
      } else {
        console.log("no se pudo detectar el total automaticamente");

      }


    } catch (error) {
      console.error("Error procesando imagen:", error);
      setErrorOCR("Error al procesar la imagen. Intenta de nuevo.");

      // Limpiar imagen error
      if (publicIdImagen) {
        await eliminarImagenCloudinary();
      }
    } finally {
      setSubiendoImagen(false);
      setProcesandoOCR(false);
    }
  };

  // Función para buscar el total en el texto extraído
  const buscarTotalEnTexto = (texto) => {
    if (!texto) return null;

    // Patrones para encontrar el total
    const patrones = [
      /total[\s:]*[\$€]?\s*(\d+[.,]\d{2})/i,
      /total[\s:]*(\d+[.,]\d{2})/i,
      /importe[\s:]*[\$€]?\s*(\d+[.,]\d{2})/i,
      /amount[\s:]*[\$€]?\s*(\d+[.,]\d{2})/i,
      /tota[l1]\s*:?\s*[\$€]?\s*(\d+[.,]\d{2})/i,
      /pag[ao]\s*:?\s*[\$€]?\s*(\d+[.,]\d{2})/i,
      /final\s*:?\s*[\$€]?\s*(\d+[.,]\d{2})/i,
      /[\$€]\s*(\d+[.,]\d{2})/g
    ];

    for (let patron of patrones) {
      const coincidencias = texto.match(patron);
      if (coincidencias && coincidencias[1]) {
        // Convertir a formato numérico 
        let monto = coincidencias[1].replace(',', '.');
        return parseFloat(monto).toFixed(2);
      }
    }

    // Busca lineas que contengan "TOTAL" y números.
    const lineas = texto.split('\n');
    for (let linea of lineas) {
      if (linea.toLowerCase().includes('total')) {
        const numerosEnLinea = linea.match(/(\d+[.,]\d{2})/g);
        if (numerosEnLinea && numerosEnLinea.length > 0) {
          const ultimoNumero = numerosEnLinea[numerosEnLinea.length - 1];
          let monto = ultimoNumero.replace(',', '.');
          console.log("total encontrado en linea con 'total':", monto);
          return parseFloat(monto).toFixed(2);
        }
      }
    }
    // Si no encuentra patrones, busca números que parezcan totales
    const numeros = texto.match(/\d+[.,]\d{2}/g);
    if (numeros && numeros.length > 0) {
      // Tomar el número más grande
      const montos = numeros.map(num => parseFloat(num.replace(',', '.')));
      const maxMonto = Math.max(...montos);
      return maxMonto.toFixed(2);
    }

    return null;
  };

  // Función para eliminar imagen de Cloudinary
  const eliminarImagenCloudinary = async () => {
    if (!publicIdImagen) return;

    try {
      const token = getToken();
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gastos/delete-ticket-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ publicId: publicIdImagen })
      });
    } catch (error) {
      console.error("Error eliminando imagen:", error);
    }
  };

  // Función para limpiar todo cuando se cancela
  const limpiarProcesamientoImagen = () => {
    if (imagenPrevia) {
      URL.revokeObjectURL(imagenPrevia);
    }
    setImagenPrevia(null);
    setTexto("");
    setMontoDetectado("");
    setErrorOCR("");
    setPublicIdImagen("");

    // Eliminar imagen de Cloudinary si existe
    if (publicIdImagen) {
      eliminarImagenCloudinary();
    }
  };

  // Separar gastos
  const gastosCompartidos = gastos.filter((g) => g.compartido);
  const gastosIndividuales = gastos.filter((g) => !g.compartido);

  // Totales compartidos
  const totalCompartido = gastosCompartidos.reduce((s, g) => s + (g.monto || 0), 0);
  const cuotaCompartida = usuarios.length > 0 ? totalCompartido / usuarios.length : 0;

  // Total individual general (suma de todos los individuales)
  const totalIndividualGeneral = gastosIndividuales.reduce(
    (s, g) => s + (g.monto || 0),
    0
  );

  if (cargando) {
    return (
      <Container maxWidth="xl" sx={{ mt: 5, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Control de Gastos Mensuales
      </Typography>

      {/* Formulario */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6">Agregar gasto</Typography>
        <Box sx={{ mb: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            📷 Subir ticket (opcional)
          </Typography>

          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="ticket-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="ticket-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={subiendoImagen || procesandoOCR}
            >
              Seleccionar ticket
            </Button>
          </label>

          {/* Mostrar estado de procesamiento */}
          {(subiendoImagen || procesandoOCR) && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">
                {subiendoImagen ? "Subiendo imagen..." : "Procesando texto..."}
              </Typography>
            </Box>
          )}

          {/* Mostrar previsualización */}
          {imagenPrevia && (
            <Box sx={{ mt: 2 }}>
              <img
                src={imagenPrevia}
                alt="Vista previa del ticket"
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
              <Button
                size="small"
                onClick={limpiarProcesamientoImagen}
                sx={{ mt: 1 }}
              >
                Eliminar imagen
              </Button>
            </Box>
          )}

          {/* Mostrar resultados del OCR */}
          {montoDetectado && (
            <Alert severity="success" sx={{ mt: 1 }}>
              ✅ Total detectado: ${montoDetectado}
            </Alert>
          )}

          {errorOCR && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {errorOCR}
            </Alert>
          )}
        </Box>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              type="number"
              label="Monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Fecha"
              InputLabelProps={{ shrink: true }}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            {!compartido && (
              <Select
                fullWidth
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Seleccionar usuario</MenuItem>
                {usuarios.map((u) => (
                  <MenuItem key={u.id} value={u.nombre}>
                    {u.nombre}
                  </MenuItem>
                ))}
              </Select>
            )}
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Checkbox
                  checked={compartido}
                  onChange={(e) => setCompartido(e.target.checked)}
                />
              }
              label="Gasto compartido"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAdd}
              disabled={agregando}
              sx={{ height: "100%" }}
            >
              {agregando ? <CircularProgress size={24} /> : "+"}
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={2}>
        {usuarios.map((u) => (
          <Grid item xs={12} sm={6} md={4} key={u.id}>
            <KanbanColumn
              usuario={u.nombre}
              gastos={gastosIndividuales.filter((g) => g.usuario === u.nombre)}
              onDelete={handleDelete}
              onReassign={handleReassign}
              cuotaCompartida={cuotaCompartida}
            />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6">Totales</Typography>
        <Typography>Gastos individuales: 💸 ${totalIndividualGeneral.toFixed(2)}</Typography>
        <Typography>Gastos compartidos: 🏠 ${totalCompartido.toFixed(2)}</Typography>
        {usuarios.length > 0 && (
          <Typography>
            Cada usuario aporta en compartidos: 💵 ${cuotaCompartida.toFixed(2)}
          </Typography>
        )}
      </Card>
    </Container>
  );
}


function KanbanColumn({ usuario, gastos, onDelete, onReassign, cuotaCompartida }) {
  const ref = useRef(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const cleanupDrop = dropTargetForElements({
      element: ref.current,
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false);
        const gastoId = source.data.id;
        onReassign(gastoId, usuario);
      },
    });

    return () => {
      cleanupDrop();
    };
  }, [usuario, onReassign]);

  // Subtotal individual de esta columna
  const subtotalIndividual = gastos.reduce((s, g) => s + (g.monto || 0), 0);
  const totalPersonal = subtotalIndividual + (cuotaCompartida || 0);

  return (
    <Card
      ref={ref}
      sx={{
        p: 1,
        minHeight: 300,
        backgroundColor: isOver ? "#f1f8e9" : "#fafafa",
        transition: "all 0.2s ease-in-out",
      }}
    >
      <Typography variant="h6" align="center" gutterBottom>
        👤 {usuario}
      </Typography>
      <Divider sx={{ mb: 1 }} />

      <List>
        {gastos.map((g) => (
          <DraggableGasto key={g.id} gasto={g} onDelete={onDelete} />
        ))}

        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText primary={`Subtotal individual: $${subtotalIndividual.toFixed(2)}`} />
        </ListItem>
        <ListItem>
          <ListItemText primary={`Cuota compartida: $${(cuotaCompartida || 0).toFixed(2)}`} />
        </ListItem>
        <ListItem>
          <ListItemText
            primary={`Total personal: $${totalPersonal.toFixed(2)}`}
            sx={{ fontWeight: "bold" }}
          />
        </ListItem>
      </List>
    </Card>
  );
}

function DraggableGasto({ gasto, onDelete }) {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const cleanupDrag = draggable({
      element: ref.current,
      getInitialData: () => ({ id: gasto.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => {
      cleanupDrag();
    };
  }, [gasto.id]);

  return (
    <ListItem
      ref={ref}
      sx={{
        cursor: "grab",
        backgroundColor: isDragging ? "#e3f2fd" : "white",
        mb: 1,
        borderRadius: 1,
        boxShadow: isDragging ? 3 : 1,
        transition: "all 0.2s ease-in-out",
      }}
      secondaryAction={
        <IconButton edge="end" onClick={() => onDelete(gasto.id)}>
          <DeleteIcon />
        </IconButton>
      }
    >
      <ListItemText
        primary={`${new Date(gasto.fecha).toLocaleDateString()} - ${gasto.descripcion}`}
        secondary={`$${Number(gasto.monto || 0).toFixed(2)}`}
      />
    </ListItem>
  );
}

export default ControlDeGastos;