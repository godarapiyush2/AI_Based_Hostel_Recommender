import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import Home from './Home';
// Make sure App.css is imported if your dashboard styles are there
import './App.css'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Regular users go here */}
        <Route path="/" element={<Home />} />
        
        {/* Only you go here */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;