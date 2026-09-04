// Dev entry point — ONLY used by `vite` dev server (npm run start). The production bundle is
// produced via Module Federation from Components.tsx; `index.html` + this file are ignored there.

// IMPORTANT: `dev-shim` MUST be imported before anything else, because it populates
// `window.__iobrokerShared__` which `@iobroker/dm-widgets` reads at module-init time. If App
// (which transitively imports dm-widgets via the widget files) loaded first, dm-widgets would
// snapshot an empty global and `MuiMaterial?.Box` etc. would all be `undefined`.
import './dev-shim';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}
