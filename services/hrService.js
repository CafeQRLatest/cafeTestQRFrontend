import api from '../utils/api';

export const hrService = {
  // ---- Employees ----
  getAllEmployees: async () => {
    return await api.get('/api/v1/hr/employees');
  },
  
  getEmployeeById: async (id) => {
    return await api.get(`/api/v1/hr/employees/${id}`);
  },

  createEmployee: async (data) => {
    return await api.post('/api/v1/hr/employees', data);
  },

  updateEmployee: async (id, data) => {
    return await api.put(`/api/v1/hr/employees/${id}`, data);
  },

  // ---- Departments ----
  getAllDepartments: async () => {
    return await api.get('/api/v1/hr/departments');
  },
  
  createDepartment: async (data) => {
    return await api.post('/api/v1/hr/departments', data);
  },

  // ---- Designations ----
  getAllDesignations: async () => {
    return await api.get('/api/v1/hr/designations');
  },
  
  createDesignation: async (data) => {
    return await api.post('/api/v1/hr/designations', data);
  },

  // ---- Attendance ----
  clockIn: async (data) => {
    // data: { employeeId, punchMethod: "PIN" | "FACE_SCAN", pin: "1234" }
    return await api.post('/api/v1/hr/attendance/clock-in', data);
  },

  clockOut: async (data) => {
    return await api.post('/api/v1/hr/attendance/clock-out', data);
  },

  // ---- Payroll Engine ----
  initiatePayrollRun: async (data) => {
    // data: { name: "Sep 2026", startDate, endDate }
    return await api.post('/api/v1/hr/payroll/run', data);
  },

  getAllPayrollRuns: async () => {
    return await api.get('/api/v1/hr/payroll/runs');
  },

  getSlipsForRun: async (runId) => {
    return await api.get(`/api/v1/hr/payroll/runs/${runId}/slips`);
  },
  
  // ---- Accounting Export ----
  downloadAchExport: (runId) => {
    // Return the URL for direct download or fetch blob
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/hr/payroll-export/ach/${runId}`;
  },

  syncToAccounting: async (runId) => {
    return await api.post(`/api/v1/hr/payroll-accounting/sync/${runId}`);
  }
};
