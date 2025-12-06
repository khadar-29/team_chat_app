import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data)
};

export const channelsAPI = {
  getAll: () => API.get('/channels'),
  create: (data) => API.post('/channels', data),
  join: (id) => API.post(`/channels/${id}/join`)
};

export const messagesAPI = {
  getByChannel: (channelId, page = 1) => 
    API.get(`/messages/${channelId}?page=${page}&limit=20`)
};

export const tasksAPI = {
  getAll: () => API.get('/tasks'),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`)
};

export default API;
