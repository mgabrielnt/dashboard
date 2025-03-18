// src/services/teamService.js

import axios from "axios";

const API_URL = "/api";

// Create axios instance with authentication
const authAxios = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

// Get all team members with pagination
export const getAllTeamMembers = async (page = 1, limit = 10) => {
  try {
    const response = await authAxios().get(
      `/team?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get team member by ID
export const getTeamMemberById = async (id) => {
  try {
    const response = await authAxios().get(`/team/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new team member
export const createTeamMember = async (teamMemberData) => {
  try {
    const response = await authAxios().post("/team", teamMemberData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update team member
export const updateTeamMember = async (id, teamMemberData) => {
  try {
    const response = await authAxios().put(`/team/${id}`, teamMemberData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete team member
export const deleteTeamMember = async (id) => {
  try {
    const response = await authAxios().delete(`/team/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Export all functions as a service object
const teamService = {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
};

export default teamService;