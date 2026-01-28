import React from "react";

const Topbar = ({ user }) => {
  return (
    <div className="topbar">
      <div className="user-info">
        <span>{user.name}</span>
        <span className="email">{user.email}</span>
      </div>
      <div className="profile-circle">{user.name[0]}</div>
    </div>
  );
};

export default Topbar;
