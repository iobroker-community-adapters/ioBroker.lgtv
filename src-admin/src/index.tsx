// Only used by the standalone dev harness (`npm start`), not by the federation build.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

window.adapterName = 'lgtv';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App socket={{ port: 8081 }} />
        </React.StrictMode>,
    );
}
