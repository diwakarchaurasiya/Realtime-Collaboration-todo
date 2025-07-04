import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AuthProvider from "./context/AuthContext";
import SocketProvider from "./context/SocketContext";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <div className="min-h-screen bg-slate-50">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <Dashboard />

                // <ProtectedRoute> </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        <ToastContainer />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
