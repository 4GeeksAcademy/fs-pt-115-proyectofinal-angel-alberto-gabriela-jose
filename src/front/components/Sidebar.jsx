import React, { useState } from 'react';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, IconButton, useMediaQuery
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';

const drawerWidth = 240;

export const Sidebar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const location = useLocation();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Tareas', icon: <AssignmentIcon />, path: '/tareas' },
        { text: 'Gastos', icon: <AttachMoneyIcon />, path: '/gastos' },
        { text: 'Objetivos', icon: <StarIcon />, path: '/objetivos' },
        { text: 'Recompensas', icon: <EmojiEventsIcon />, path: '/recompensas' },
        { text: 'Perfil', icon: <AccountCircleIcon />, path: '/perfil' },
    ];

    const drawerContent = (
        <div>
            <Toolbar />
            <Box sx={{ overflow: 'auto', p: 1 }}>
                <List>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <ListItemButton
                                key={item.text}
                                component={Link}
                                to={item.path}
                                selected={isActive}
                                onClick={() => isMobile && setMobileOpen(false)}
                                sx={{
                                    borderRadius: 2,
                                    marginBottom: 1,
                                    color: isActive ? 'primary.main' : 'text.secondary',
                                    backgroundColor: isActive ? 'rgba(100, 181, 246, 0.1)' : 'transparent', // Un fondo sutil para el activo
                                    '&:hover': {
                                        backgroundColor: 'rgba(100, 181, 246, 0.05)',
                                    },
                                    '&.Mui-selected .MuiListItemIcon-root': {
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>
        </div>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? mobileOpen : true}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    '& .MuiDrawer-paper': { 
                        boxSizing: 'border-box', 
                        width: drawerWidth,
                    },
                }}
            >
                {drawerContent}
            </Drawer>
            
            {isMobile && (
                 <IconButton
                    color="inherit"
                    onClick={handleDrawerToggle}
                    sx={{ position: 'fixed', top: 16, left: 16, zIndex: 1301, color: 'white' }}
                >
                    <MenuIcon />
                </IconButton>
            )}
        </Box>
    );
};