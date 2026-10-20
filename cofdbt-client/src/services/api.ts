import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

export const getActiveCaffeine = async (userId: string) => {
  const response = await axios.get(`${API_BASE}/caffeine/active/${userId}`);
  return response.data;
};

export const logCoffee = async (data: {
  user_id: string;
  volume_tbsp_fraction: number;
  water_ratio_percent: number;
  work_intensity: string;
  ui_mode: string;
}) => {
  const response = await axios.post(`${API_BASE}/logs`, data);
  return response.data;
};

export const submitCheckin = async (data: {
  user_id: string;
  check_in_date?: string;
  sleep_hours: number;
  fatigue_score: number;
}) => {
  const response = await axios.post(`${API_BASE}/checkins`, data);
  return response.data;
};

export const getFDI = async (userId: string) => {
  const response = await axios.get(`${API_BASE}/fdi/${userId}`);
  return response.data;
};

export const getTapering = async (userId: string) => {
  const response = await axios.get(`${API_BASE}/tapering/${userId}`);
  return response.data;
};