import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Snowfall from "react-snowfall";
import "./App.css";

import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MyTreesPage from "./pages/MyTreesPage"; 
import TreePage from "./pages/TreePage";
import OAuthSuccess from "./pages/OAuthSuccess";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    alert("로그아웃 되었습니다.");
  };

  const isAdmin = Boolean(user && (Number(user.id) === 4 || user.is_admin === 1));

  return (
    <div
      style={{
        backgroundImage: "url(/pixel-bg.png)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "cover",
        minHeight: "100vh",
      }}
    >
      <Snowfall color="#fff" snowflakeCount={60} style={{ imageRendering: "pixelated" }} />
      <Header user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth-success" element={<OAuthSuccess setUser={setUser} />} />
        <Route path="/mytrees" element={<MyTreesPage user={user} />} />
        <Route path="/tree/:id" element={<TreePage user={user} />} />
        <Route path="/admin" element={isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
