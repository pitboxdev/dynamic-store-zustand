import React from 'react';
import { useDynamicStore } from '@pitboxdev/dynamic-store-zustand';
import { userConfig } from '../storeConfigs';

export default function ProfileEditor() {
  console.log("ProfileEditor");
  // Subscribe only to 'name' part of target slice (prevents re-renders of ProfileEditor when user.score changes)
  const { data: name, setData: setUser, reset } = useDynamicStore('user', userConfig, (u) => u.name);

  return (
    <div className="card">
      <h3>Profile Editor</h3>
      <p style={{ fontSize: '13px', color: '#7f8c8d' }}>
        These input fields instantly update the user name displayed in the Header component 
        while remaining in an entirely different part of the component tree.
      </p>
      
      <div className="form-group" style={{ marginTop: '10px' }}>
        <label>Username</label>
        <input 
          className="input-field"
          value={name} 
          // Update partial state via object API
          onChange={(e) => setUser({ name: e.target.value })} 
          placeholder="Enter name..."
        />
      </div>

      <button style={{ marginTop: '20px', background: '#e74c3c' }} onClick={reset}>
        Reset all to initial values
      </button>
    </div>
  );
}
