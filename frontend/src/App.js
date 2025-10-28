import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const authApi = axios.create({
  baseURL: API,
});

// Add auth token to requests
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const openAuth = (mode = "login") => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          onOpenAuth={openAuth}
        />
        <Routes>
          <Route path="/" element={<Home user={user} onOpenAuth={openAuth} />} />
          <Route path="/movie/:id" element={<MovieDetail user={user} onOpenAuth={openAuth} />} />
          <Route 
            path="/profile" 
            element={
              user ? <Profile user={user} /> : <Navigate to="/" replace />
            } 
          />
        </Routes>
        
        <AuthModal 
          open={showAuth}
          onClose={() => setShowAuth(false)}
          mode={authMode}
          onModeChange={setAuthMode}
          onSuccess={(userData) => {
            setUser(userData.user);
            localStorage.setItem("token", userData.access_token);
            localStorage.setItem("user", JSON.stringify(userData.user));
            setShowAuth(false);
          }}
        />
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
