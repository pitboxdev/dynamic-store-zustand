import React from 'react';
import { useDynamicStore, useDynamicStoreMethods } from '@pitboxdev/dynamic-store-zustand';
import { uiConfig } from '../storeConfigs';

export default function Sidebar() {
  console.log("Sidebar");
  // Subscribe to 'ui' slice state (Sidebar needs all properties: sidebarOpen and theme)
  const { data: ui, setData: setUI } = useDynamicStore('ui', uiConfig);
  // Get actions without subscribing to 'user' state changes (prevents Sidebar re-renders when user data changes)
  const { setData: setUser } = useDynamicStoreMethods('user');

  // Synchronize theme to body attribute
  React.useEffect(() => {
    document.body.setAttribute('data-theme', ui.theme);
  }, [ui.theme]);

  const toggleTheme = () => {
    setUI((prev) => ({ theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  return (
    <div className={`sidebar ${ui.sidebarOpen ? 'open' : 'closed'}`}>
      <h3>Navigation</h3>
      
      <div className="sidebar-section border-section">
        <p>Current theme: <strong>{ui.theme === 'light' ? 'Light' : 'Dark'}</strong></p>
        <button onClick={toggleTheme}>Toggle Theme</button>
      </div>

      <div className="sidebar-section border-section">
        <p>Cross-branch state update:</p>
        <button className="accent-btn" onClick={() => setUser((prev) => ({ score: prev.score + 10 }))}>
           Add +10 points
        </button>
        <p style={{ fontSize: '12px', color: '#bdc3c7', marginTop: '10px' }}>
          * This button resides in Sidebar (Branch A) and directly updates the User State (used in Branch B).
        </p>
      </div>
    </div>
  );
}
