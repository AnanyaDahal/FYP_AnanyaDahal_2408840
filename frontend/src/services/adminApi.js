import axios from "axios";
import { API_BASE_URL } from "../config/api";

const adminClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getAdminStats = async () => {
  const { data } = await adminClient.get("/api/admin/stats");
  return data;
};

const getAdminUsers = async () => {
  const { data } = await adminClient.get("/api/admin/users");
  return data.users || [];
};

const getAdminScans = async () => {
  const { data } = await adminClient.get("/api/admin/scans");
  return data.scans || [];
};

const deleteAdminUser = async (userId) => {
  const { data } = await adminClient.delete(`/api/admin/users/${userId}`);
  return data;
};

export { getAdminStats, getAdminUsers, getAdminScans, deleteAdminUser };