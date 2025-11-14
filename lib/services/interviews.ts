import { fetchApi } from "../api-config"

export interface Interview {
  interview_id: string
  title: string
  description: string
  section_id: string
  agent_id: string
  topics: string[]
  duration_minutes: number
  type: "INDIVIDUAL" | "GROUP" | "FOLLOW_UP"
  status: "DRAFT" | "PENDING" | "IN_PROGRESS" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | "ARCHIVED"
  target_employees: string[]
  responses_count: number
  completion_percentage: number
  created_at: string
  updated_at: string
  started_at?: string
  schedule?: {
    start_date: string
    end_date: string
    allowed_days: string[]
    start_time: string
    end_time: string
  }
}

export interface CreateInterviewData {
  interview_id?: string
  title: string
  description: string
  section_id: string
  agent_id: string
  topics: string[]
  duration_minutes: number
  type: "INDIVIDUAL" | "GROUP" | "FOLLOW_UP"
  target_employees: string[]
  schedule: {
    start_date: string
    end_date: string
    allowed_days: string[]
    start_time: string
    end_time: string
  }
}

export interface InterviewsResponse {
  interviews: Interview[]
  total: number
  page: number
  limit: number
}

export interface InterviewStats {
  total_interviews: number
  active_interviews: number
  completed_interviews: number
  total_responses: number
  avg_responses_per_interview: number
}

export const interviewsApi = {
  getAll: async (params?: {
    section_id?: string
    agent_id?: string
    status?: string
    type?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<InterviewsResponse> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })
    }
    return fetchApi(`/interviews?${queryParams.toString()}`)
  },

  getById: async (id: string): Promise<Interview> => {
    return fetchApi(`/interviews/${id}`)
  },

  getStats: async (): Promise<InterviewStats> => {
    return fetchApi("/interviews/stats")
  },

  create: async (data: CreateInterviewData): Promise<Interview> => {
    return fetchApi("/interviews", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Partial<CreateInterviewData>): Promise<Interview> => {
    return fetchApi(`/interviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  start: async (id: string, data?: { start_date?: string; specific_employees?: string[] }): Promise<Interview> => {
    return fetchApi(`/interviews/${id}/start`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    })
  },

  pause: async (id: string): Promise<Interview> => {
    return fetchApi(`/interviews/${id}/pause`, {
      method: "POST",
    })
  },

  resume: async (id: string): Promise<Interview> => {
    return fetchApi(`/interviews/${id}/resume`, {
      method: "POST",
    })
  },

  complete: async (id: string): Promise<Interview> => {
    return fetchApi(`/interviews/${id}/complete`, {
      method: "POST",
    })
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi(`/interviews/${id}`, {
      method: "DELETE",
    })
  },

  clone: async (id: string): Promise<Interview> => {
    return fetchApi(`/interviews/${id}/clone`, {
      method: "POST",
    })
  },

  getBySection: async (sectionId: string): Promise<Interview[]> => {
    return fetchApi(`/interviews/section/${sectionId}`)
  },

  executeForEmployees: async (data: {
    interview_id: string
    employee_ids: string[]
    start_immediately?: boolean
    scheduled_start?: string
  }): Promise<{
    execution_id: string
    interview_id: string
    employees_count: number
    status: string
    initiated_at: string
  }> => {
    return fetchApi("/interviews/execute/employees", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  executeForSection: async (data: {
    interview_id: string
    section_id: string
    exclude_employees?: string[]
    start_immediately?: boolean
    scheduled_start?: string
  }): Promise<{
    execution_id: string
    interview_id: string
    section_id: string
    employees_count: number
    status: string
    initiated_at: string
  }> => {
    return fetchApi("/interviews/execute/section", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  getExecutionStatus: async (
    executionId: string,
  ): Promise<{
    execution_id: string
    status: string
    progress: {
      total: number
      sent: number
      pending: number
      failed: number
    }
    started_at: string
    completed_at?: string
  }> => {
    return fetchApi(`/interviews/execution/${executionId}/status`)
  },

  getExecutionConversations: async (executionId: string): Promise<any[]> => {
    return fetchApi(`/interviews/execution/${executionId}/conversations`)
  },

  stopExecution: async (
    executionId: string,
  ): Promise<{
    execution_id: string
    status: string
    stopped_at: string
    message: string
  }> => {
    return fetchApi(`/interviews/execution/${executionId}/stop`, {
      method: "POST",
    })
  },

  getActiveExecutions: async (): Promise<any[]> => {
    return fetchApi("/interviews/executions/active")
  },
}
