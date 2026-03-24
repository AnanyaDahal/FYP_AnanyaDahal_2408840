import React, { useCallback, useEffect, useState } from "react";
import AdminNav from "../components/admin/AdminNav";
import { deleteAdminUser, getAdminUsers } from "../services/adminApi";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId, userName) => {
    const confirmed = window.confirm(`Delete user ${userName}? This cannot be undone.`);
    if (!confirmed) return;

    setMessage("");
    setError("");
    try {
      const data = await deleteAdminUser(userId);
      setMessage(data.message || "User deleted");
      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-8 text-white">
      <h1 className="mb-2 text-3xl font-bold">Admin - Users</h1>
      <p className="mb-6 text-gray-400">Manage all registered accounts.</p>

      <AdminNav />

      {message && <div className="mb-4 rounded-lg border border-green-700 bg-green-700/10 p-3 text-green-300">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-red-700 bg-red-700/10 p-3 text-red-300">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#141414]">
        <table className="w-full text-left">
          <thead className="bg-black text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}

            {users.map((user) => (
              <tr key={user._id} className="hover:bg-[#1a1a1a]">
                <td className="px-6 py-3">{user.name}</td>
                <td className="px-6 py-3 text-gray-300">{user.email}</td>
                <td className="px-6 py-3">
                  <span className={`rounded px-2 py-1 text-xs ${user.role === "admin" ? "bg-amber-600/20 text-amber-300" : "bg-cyan-600/20 text-cyan-300"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-400">
                  {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                </td>
                <td className="px-6 py-3 text-right">
                  {user.role === "user" ? (
                    <button
                      onClick={() => handleDelete(user._id, user.name)}
                      className="rounded border border-red-500 px-3 py-1 text-sm text-red-400 hover:bg-red-500 hover:text-black transition-all"
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">Protected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;