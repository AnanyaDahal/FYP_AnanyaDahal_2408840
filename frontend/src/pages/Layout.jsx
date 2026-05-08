import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";

const Layout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0a0a0a] text-white">
      {/* Universal navigation header at the top */}
      <AppNavbar />

      {/* Main layout underneath */}
      <main className="flex-grow overflow-y-auto px-4 py-8 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;