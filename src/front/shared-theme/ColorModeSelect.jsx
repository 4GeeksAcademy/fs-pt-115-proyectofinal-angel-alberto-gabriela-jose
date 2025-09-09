import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

export default function ColorModeSelect(props) {
    const [mode, setMode] = React.useState('light');

    return (
        <Select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            {...props}
        >
            <MenuItem value="system">System</MenuItem>
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
        </Select>
    );
}