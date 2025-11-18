import { fetchApi } from "../api-config"

export interface Employee {
  employee_id: string
  name: string
  section_id: string
  job_id: string
  contact_info: {
    whatsapp_number: string
    email: string
    phone?: string
  }
  interviews_assigned: string[]
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED"
  created_at: string
  updated_at: string
}

export interface CreateEmployeeData {
  employee_id: string
  name: string
  section_id: string
  job_id: string
  contact_info: {
    whatsapp_number: string
    email: string
    phone?: string
  }
  interviews_assigned?: string[]
  status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED"
}

export interface EmployeesResponse {
  employees: Employee[]
  total: number
  page: number
  limit: number
}

export const employeesApi = {
  getAll: async (params?: {
    section_id?: string
    job_id?: string
    status?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<EmployeesResponse> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })
    }
    return fetchApi(`/employees?${queryParams.toString()}`)
  },

  getById: async (id: string): Promise<Employee> => {
    return fetchApi(`/employees/${id}`)
  },

  getBySection: async (sectionId: string): Promise<Employee[]> => {
    return fetchApi(`/employees/section/${sectionId}`)
  },

  create: async (data: CreateEmployeeData): Promise<Employee> => {
    return fetchApi("/employees", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Partial<CreateEmployeeData>): Promise<Employee> => {
    return fetchApi(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchApi(`/employees/${id}`, {
      method: "DELETE",
    })
  },

  assignInterview: async (id: string, interviewId: string): Promise<Employee> => {
    return fetchApi(`/employees/${id}/assign-interview`, {
      method: "POST",
      body: JSON.stringify({ interview_id: interviewId }),
    })
  },
}
