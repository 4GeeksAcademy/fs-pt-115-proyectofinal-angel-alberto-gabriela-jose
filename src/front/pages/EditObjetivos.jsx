import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button
} from "@mui/material";

const EditObjetivos = ({ open, user, onClose, onSave }) => {
    const [Values, setValues] = useState({ ingresos: 0, meta: 0 });

    useEffect(() => {
        if (user) {
            setValues({
                ingresos: user.ingresos || 0,
                meta: user.meta || 0,
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setValues({
            ...Values,
            [e.target.name]: e.target.value,
        });
    };

    const handleSave = () => {
        onSave(user.id, Values);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Editar Objetivos</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    label="Ingresos declarados"
                    type="number"
                    name="ingresos"
                    value={Values.ingresos}
                    onChange={handleChange}
                    fullWidth
                />
                <TextField
                    margin="dense"
                    label="Meta de ahorro"
                    type="number"
                    name="meta"
                    value={Values.meta}
                    onChange={handleChange}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained">Guardar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditObjetivos;
