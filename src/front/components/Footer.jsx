import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';

export const Footer = () => {
	return (
		<Box
			sx={{
				bgcolor: 'background.paper',
				py: 3,
				textAlign: 'center',
				borderTop: '1px solid #e0e0e0',
			}}
		>
			<Typography variant="body2" color="text.secondary" align="center">
				{'© '}
				<Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
					Aura
				</Link>{' '}
				{new Date().getFullYear()}
				{'.'}
			</Typography>
			<Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
				Hecho con <FavoriteIcon sx={{ color: 'primary.main', fontSize: 16, verticalAlign: 'middle' }} /> para el {' '}
				<Link href="https://www.4geeksacademy.com" target="_blank" rel="noopener" style={{ textDecoration: 'none', color: 'primary.main' }}>
					Proyecto Final del bootcamp de 4geeksacademy.
				</Link>
			</Typography>
		</Box>
	);
};