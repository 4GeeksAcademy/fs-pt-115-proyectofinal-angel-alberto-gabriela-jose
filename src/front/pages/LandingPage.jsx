import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Box, Stack, Card, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import './styles/LandingPage.css';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RedeemIcon from '@mui/icons-material/Redeem';
import StarsIcon from '@mui/icons-material/Stars';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export const LandingPage = () => {
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        setAnimated(true);
    }, []);

    const rewardFeatures = [
        { icon: <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'primary.main' }} />, title: "Completa Tareas", description: "Gana puntos por cada tarea del hogar que realices." },
        { icon: <StarsIcon sx={{ fontSize: 40, color: 'primary.main' }} />, title: "Acumula Puntos", description: "Suma puntos y escala en el ranking de tu hogar." },
        { icon: <EmojiEventsIcon sx={{ fontSize: 40, color: 'primary.main' }} />, title: "Desbloquea Logros", description: "Consigue recompensas exclusivas por tu esfuerzo." },
        { icon: <RedeemIcon sx={{ fontSize: 40, color: 'primary.main' }} />, title: "Canjea Premios", description: "Intercambia tus puntos por los premios que más te gusten." },
    ];

    return (
        <Box className="animated-landing-page-container" sx={{ pt: 10, pb: 10 }}>
            {/* Elementos para el fondo animado (burbujas) */}
            <div className="background-bubble bubble-1"></div>
            <div className="background-bubble bubble-2"></div>
            <div className="background-bubble bubble-3"></div>
            <div className="background-bubble bubble-4"></div>
            <div className="background-bubble bubble-5"></div>
            <div className="background-bubble bubble-6"></div>
            <div className="background-bubble bubble-7"></div>
            <div className="background-bubble bubble-8"></div>
            <div className="background-bubble bubble-9"></div>
            <div className="background-bubble bubble-10"></div>

            <Container maxWidth="lg" sx={{ zIndex: 1, position: 'relative' }}>
                <Card
                    sx={{
                        p: { xs: 3, md: 6 },
                        borderRadius: 4,
                        textAlign: 'center',
                        opacity: animated ? 1 : 0,
                        transform: animated ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                        transitionDelay: '0.2s',
                    }}
                >
                    {/* Contenido Principal */}
                    <Typography
                        variant="h2"
                        component="h1"
                        gutterBottom
                        sx={{ color: 'primary.main' }}
                    >
                        Simplifica tu vida con los tuyos.
                    </Typography>
                    <Typography
                        variant="h5"
                        component="p"
                        paragraph
                        sx={{ mt: 3, mb: 5, color: 'text.secondary' }}
                    >
                        Gestiona tareas, compras y mejora la armonía en tu hogar con Aura.
                    </Typography>



                    {/* Sección de Recompensas dentro de la misma tarjeta */}
                    <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'primary.main', mb: 4 }}>
                        Gana Puntos, Canjea Recompensas
                    </Typography>
                    <Grid container spacing={4} justifyContent="center">
                        {rewardFeatures.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        p: 2,
                                        borderRadius: 2,
                                        transition: 'transform 0.3s ease-in-out',
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                            backgroundColor: 'background.default',
                                        },
                                    }}
                                >
                                    {feature.icon}
                                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {feature.description}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                    <Stack
                        direction="row"
                        spacing={2}
                        justifyContent="center"
                        sx={{ mt: 4, mb: 6 }}
                    >
                        <Button
                            component={Link}
                            to="/register"
                            variant="contained"
                            size="large"
                            color="primary"
                        >
                            Registrate Gratis
                        </Button>
                    </Stack>
                </Card>
            </Container>
        </Box>
    );
};