import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const user = {
    name: "Ananya Dahal",
    email: "ananyadahal@gmail.com",
  };

  return (
    <div className="flex min-h-screen bg-[#0f2027]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <div className="flex-1 p-10 mt-16">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
