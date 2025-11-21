import { fetchApi } from "../api-config"

export interface Interview {
  interview_id: string
  title: string
  description: string
  section_id: string
  section_name?: string
  agent_id: string
  agent_name?: string
  topics: string[]
  duration_minutes: number
  type: "INDIVIDUAL" | "GROUP" | "FOLLOW_UP"
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  target_employees: string[]
  created_at: string
  updated_at: string
  interview_context?: string
  objectives?: string[]
  conversations_completed?: number
  conversations_total?: number
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
  description?: string
  section_id: string
  agent_id: string
  duration_minutes: number
  objectives?: string[]
  type?: "INDIVIDUAL" | "GROUP" | "FOLLOW_UP"
  target_employees?: string[]
  schedule: {
    start_date: string
    end_date: string
    allowed_days: string[]
    start_time: string
    end_time: string
  }
}

export interface UpdateInterviewData {
  title?: string
  description?: string
  section_id?: string
  agent_id?: string
  duration_minutes?: number
  objectives?: string[]
  type?: "INDIVIDUAL" | "GROUP" | "FOLLOW_UP"
  target_employees?: string[]
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED"
  schedule?: {
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

  update: async (id: string, data: UpdateInterviewData): Promise<Interview> => {
    return fetchApi(`/interviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
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
}
