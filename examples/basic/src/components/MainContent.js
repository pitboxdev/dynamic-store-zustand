import React from 'react';
import ProfileEditor from './ProfileEditor';
import UserStats from './UserStats';

export default function MainContent() {
  console.log("MainContent");
  return (
    <div className="content-area">
      <div className="description-card">
        <h3>About this example</h3>
        <p>
          This example demonstrates the power of <b>@pitboxdev/dynamic-store-zustand</b>.
          Components (Sidebar, Header, ProfileEditor) are located in completely different branches of the React tree.
        </p>
        <p>
          Despite this, they easily and reactively share common state using the familiar 
          <code>useState</code>-like syntax &mdash; avoiding unnecessary re-renders and complex global store boilerplate!
        </p>
      </div>
      <ProfileEditor />
      <UserStats />
    </div>
  );
}
