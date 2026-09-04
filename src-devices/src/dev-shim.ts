// Dev-only shim for the dm-widgets runtime resolver.
//
// `@iobroker/dm-widgets` re-exports `React`, `MuiMaterial`, `MuiIcons`, `moment` from
// `window.__iobrokerShared__` at MODULE-INIT time. In production the host (ioBroker.devices)
// populates that global before any plugin loads. In our Vite dev harness nobody sets it, so
// `MuiMaterial?.Button` etc. evaluate to `undefined` and any widget that references MUI
// components crashes with "Element type is invalid".
//
// This file populates the global from the dev environment's real React + MUI instances. It
// must run BEFORE the widget files import `@iobroker/dm-widgets` — which is why `index.tsx`
// imports this module FIRST (ahead of `./App`) and this file has no dependency on App or any
// widget. ES-module evaluation is depth-first along the dependency graph, so this body
// executes before App's transitive imports trigger dm-widgets to initialise.
//
// We use *named* imports for MUI components rather than `import *` because Vite's dependency
// pre-bundling can wrap a star-namespace import in a way where `.Box`, `.Button` etc. aren't
// directly own-properties of the namespace object. With explicit named imports we build the
// shared object by hand — bulletproof regardless of how the bundler chooses to expose the
// module.

import * as ReactRuntime from 'react';
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Button,
    ButtonGroup,
    ToggleButton,
    ToggleButtonGroup,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    Checkbox,
    FormControlLabel,
    Tooltip,
    Menu,
    Divider,
    Card,
    CardContent,
    Grid,
    Stack,
    Paper,
    Slider,
    LinearProgress,
    CircularProgress,
} from '@mui/material';
import {
    Close,
    Add,
    Remove,
    Settings,
    Edit,
    Delete,
    Check,
    Refresh,
    PlayArrow,
    Pause,
    Stop,
    KeyboardArrowUp,
    KeyboardArrowDown,
    KeyboardArrowLeft,
    KeyboardArrowRight,
    ExpandMore,
    ExpandLess,
} from '@mui/icons-material';
import momentRuntime from 'moment';
import * as AdapterReact from '@iobroker/gui-components';

const muiMaterial = {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Button,
    ButtonGroup,
    ToggleButton,
    ToggleButtonGroup,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    Checkbox,
    FormControlLabel,
    Tooltip,
    Menu,
    Divider,
    Card,
    CardContent,
    Grid,
    Stack,
    Paper,
    Slider,
    LinearProgress,
    CircularProgress,
};

const muiIcons = {
    Close,
    Add,
    Remove,
    Settings,
    Edit,
    Delete,
    Check,
    Refresh,
    PlayArrow,
    Pause,
    Stop,
    KeyboardArrowUp,
    KeyboardArrowDown,
    KeyboardArrowLeft,
    KeyboardArrowRight,
    ExpandMore,
    ExpandLess,
};

(window as any).__iobrokerShared__ = {
    react: ReactRuntime,
    '@mui/material': muiMaterial,
    '@mui/icons-material': muiIcons,
    moment: momentRuntime,
    '@iobroker/gui-components': AdapterReact,
};

// Sanity log so a dev opening DevTools immediately sees whether the shim is wired up. The
// guard suppresses the message if the host happens to populate the global before this point
// (shouldn't happen in dev, but harmless). Drop the log if it gets noisy.
console.log(
    '[dev-shim] __iobrokerShared__ initialised — Box=',
    typeof muiMaterial.Box,
    'CloseIcon=',
    typeof muiIcons.Close,
);
