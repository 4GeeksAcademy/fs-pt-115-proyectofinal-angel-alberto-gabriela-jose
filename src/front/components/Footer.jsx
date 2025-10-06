import React from 'react';
import { Box, Typography, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';

export const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 3,
                px: 2,
                mt: 'auto', // Esto ayuda a que se pegue al final del contenedor flex
                backgroundColor: 'transparent',
                textAlign: 'center',
            }}
        >
            <Typography variant="body2" color="text.secondary">
                {'© '}
                <MuiLink component={RouterLink} to="/" color="inherit">
                    Aura
                </MuiLink>{' '}
                {new Date().getFullYear()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Hecho con <FavoriteIcon sx={{ color: 'secondary.main', fontSize: 16, verticalAlign: 'middle' }} /> para el proyecto final de 4Geeks Academy.
            </Typography>
        </Box>
    );
};