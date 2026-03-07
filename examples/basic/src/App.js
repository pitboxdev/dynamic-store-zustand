import React from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import './App.css';

function App() {
  console.log("App");

  // Main layout assembling components that interact via @pitboxdev/dynamic-store-zustand
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <MainContent />
      </div>
    </div>
  );
}

export default App;
