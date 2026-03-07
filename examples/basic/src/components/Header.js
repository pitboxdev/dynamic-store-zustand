import React from 'react';
import { useDynamicStore, useDynamicStoreMethods } from '@pitboxdev/dynamic-store-zustand';
import { userConfig } from '../storeConfigs';

export default function Header() {
  console.log("Header");
  // Get actions without subscribing to 'ui' state changes (prevents re-renders of Header when sidebar toggles)
  const { setData: setUI } = useDynamicStoreMethods('ui');
  // Subscribe to 'user' slice state changes (Header uses all properties: name and score)
  const { data: user } = useDynamicStore('user', userConfig);

  const toggleSidebar = () => {
    setUI((prev) => ({ sidebarOpen: !prev.sidebarOpen }));
  };

  return (
    <div className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button className="icon-button" onClick={toggleSidebar}>
          ☰
        </button>
        <h2>Dynamic Store Example</h2>
      </div>
      <div>
        <span>👤 {user.name} | 🏆 {user.score} points</span>
      </div>
    </div>
  );
}
