
import * as React from "react";
import PropTypes from "prop-types";
import { ThemeProvider, createTheme } from "@mui/material/styles";

function AppTheme({ children, disableCustomTheme, themeComponents }) {
    const theme = React.useMemo(() => {
        return disableCustomTheme
            ? {}
            : createTheme({
                typography: {
                    fontFamily: ["Poppins", "Roboto", "sans-serif"].join(","),
                },
                components: {
                    ...themeComponents,
                },
            });
    }, [disableCustomTheme, themeComponents]);

    if (disableCustomTheme) {
        return <>{children}</>;
    }

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

AppTheme.propTypes = {
    children: PropTypes.node,
    disableCustomTheme: PropTypes.bool,
    themeComponents: PropTypes.object,
};

export default AppTheme;
