import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('college_portal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid (and not currently on login page)
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('college_portal_token');
        localStorage.removeItem('college_portal_user');
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  getDemoAccounts: () => api.get('/auth/demo-accounts')
};

export const coursesApi = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`)
};

export const enrollmentsApi = {
  register: (courseId, studentId) => api.post('/enrollments/register', { courseId, studentId }),
  drop: (courseId, studentId) => api.post('/enrollments/drop', { courseId, studentId }),
  getMyCourses: () => api.get('/enrollments/my-courses'),
  getCourseRoster: (courseId) => api.get(`/enrollments/course/${courseId}`)
};

export const studentsApi = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getMyProfile: () => api.get('/students/profile/me'),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`)
};

export const facultyApi = {
  getAll: (params) => api.get('/faculty', { params }),
  getById: (id) => api.get(`/faculty/${id}`),
  getMyProfile: () => api.get('/faculty/profile/me'),
  create: (data) => api.post('/faculty', data),
  update: (id, data) => api.put(`/faculty/${id}`, data),
  delete: (id) => api.delete(`/faculty/${id}`)
};

export const attendanceApi = {
  mark: (data) => api.post('/attendance/mark', data),
  getCourseAttendance: (courseId, params) => api.get(`/attendance/course/${courseId}`, { params }),
  getMyAttendance: () => api.get('/attendance/my-attendance')
};

export const resultsApi = {
  enter: (data) => api.post('/results/enter', data),
  getCourseResults: (courseId) => api.get(`/results/course/${courseId}`),
  getMyResults: () => api.get('/results/my-results'),
  getAll: (params) => api.get('/results', { params })
};

export const reportsApi = {
  getDashboardStats: () => api.get('/reports/dashboard-stats'),
  getEnrollments: () => api.get('/reports/enrollments'),
  getAttendance: () => api.get('/reports/attendance'),
  getResults: () => api.get('/reports/results'),
  getExportUrl: (reportType) => `/api/reports/export/${reportType}`
};

export const departmentsApi = {
  getAll: () => api.get('/departments')
};

export default api;

