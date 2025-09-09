import React from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Brightness2Icon from '@mui/icons-material/Brightness4';
import Brightness3Icon from '@mui/icons-material/Brightness7';
import { useColorMode } from './ThemeModeContext';

export const Navbar = () => {
	const { toggleColorMode, mode } = useColorMode();

	return (
		<AppBar position="fixed" color="primary">
			<Toolbar>
				<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
					Aura
				</Typography>
				<Box sx={{ display: { xs: 'none', md: 'flex' } }}>
					<Button color="inherit" component={Link} to="/register">
						Registrarse
					</Button>
					<Button color="inherit" component={Link} to="/login">
						Acceder
					</Button>
				</Box>
				<IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
					{mode === 'dark' ? <Brightness3Icon /> : <Brightness2Icon />}
				</IconButton>
			</Toolbar>
		</AppBar>
	);
};