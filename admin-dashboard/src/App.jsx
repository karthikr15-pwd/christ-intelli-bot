import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CanteenManager from './pages/CanteenManager';
import FacultyManager from './pages/FacultyManager';
import LocationManager from './pages/LocationManager';
import RouteManager from './pages/RouteManager';
import CampusBrain from './pages/CampusBrain';
import KnowledgeHub from './pages/KnowledgeHub';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex min-h-screen bg-mesh font-sans text-slate-800 selection:bg-blue-200 selection:text-blue-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className={`flex-1 transition-all duration-500 ease-in-out lg:ml-72 ${sidebarOpen ? 'ml-72' : ''}`}>
          <div className="p-4 md:p-8 animate-fade-in-up">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/canteen" element={<CanteenManager />} />
              <Route path="/faculty" element={<FacultyManager />} />
              <Route path="/locations" element={<LocationManager />} />
              <Route path="/routes" element={<RouteManager />} />
              <Route path="/campus-brain" element={<CampusBrain />} />
              <Route path="/knowledge" element={<KnowledgeHub />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
