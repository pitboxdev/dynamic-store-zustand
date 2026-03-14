import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// NOTE: createDynamicStore() is optional in @pitboxdev/dynamic-store-zustand.
// It will be lazily initialized with defaults upon the first use of any hook.
// You only need to call it if you want to provide custom configuration.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);
