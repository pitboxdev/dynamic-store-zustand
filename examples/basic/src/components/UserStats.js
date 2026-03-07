import React from 'react';
import { useDynamicStore, useDynamicStoreMethods } from '@pitboxdev/dynamic-store-zustand';
import { userConfig } from '../storeConfigs';

export default function UserStats() {
  console.log("UserStats");
  // Subscribe only to 'score' part of target slice (prevents re-renders of UserStats when user.name changes)
  const { data: score, setData: setUser } = useDynamicStore('user', userConfig, (u) => u.score);
  
  // Get actions without subscribing to 'ui' state changes (prevents UserStats re-renders when sidebar toggles)
  const { setData: setUI } = useDynamicStoreMethods('ui');

  const openSidebarAndAddPoints = () => {
    // Modify UI state without re-rendering this component layer
    setUI({ sidebarOpen: true });
    // Modify current user state
    setUser((prev) => ({ score: prev.score + 50 }));
  };

  return (
    <div className="card">
      <h3>Stats (Actions usage)</h3>
      <p>Points: <b style={{ fontSize: '24px', color: 'var(--accent)' }}>{score}</b></p>
      
      <button 
        style={{ marginTop: '10px' }} 
        // Update state via functional callback API
        onClick={() => setUser((prev) => ({ score: Math.max(0, prev.score - 5) }))}
      >
        Decrease points (-5)
      </button>

      <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
         <p style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '10px' }}>
           * This component uses <code>useDynamicStoreMethods</code> to 
           modify the <b>Sidebar</b> state without subscribing to it, preventing unnecessary re-renders of this card.
         </p>
         <button className="accent-btn" onClick={openSidebarAndAddPoints}>
           Open Sidebar and grant 50 points
         </button>
      </div>
    </div>
  );
}
