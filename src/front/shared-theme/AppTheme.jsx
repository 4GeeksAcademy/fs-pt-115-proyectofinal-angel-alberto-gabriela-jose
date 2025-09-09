import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

export default function AppTheme({ children, disableCustomTheme = false }) {
    const theme = React.useMemo(() => {
        if (disableCustomTheme) return {};

        return createTheme({

            palette: {
                mode: 'light',
                primary: {
                    main: '#1976d2',
                },
                secondary: {
                    main: '#dc004e',
                },
            },
        });
    }, [disableCustomTheme]);

    if (disableCustomTheme) {
        return <>{children}</>;
    }

    return (
        <ThemeProvider theme={theme}>
            {children}
        </ThemeProvider>
    );
}

