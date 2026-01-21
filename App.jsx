import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LinkManager from "./LinkManager";
import ProjectStatus from "./ProjectStatus";

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff' } }} />
      <Routes>
        <Route path="/" element={<ProjectStatus />} />
        <Route path="/app" element={<LinkManager />} />
        {/* Redirect any unknown route to landing page or app */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
