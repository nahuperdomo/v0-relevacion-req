import { fetchApi } from "../api-config"

export interface Agent {
  agent_id: string
  name: string
  description: string
  tone: "FORMAL" | "CASUAL" | "FRIENDLY" | "PROFESSIONAL" | "EMPATHETIC"
  embedding_profile: string
  section_id: string
  prompt_config: {
    system_prompt: string
    greeting_prompt: string
    closing_prompt: string
    context_instructions: string
  }
  model_config: {
    model: string
    temperature: number
    max_tokens: number
    top_p: number
  }
  specialties: string[]
  status: "ACTIVE" | "INACTIVE" | "TRAINING" | "MAINTENANCE"
  assigned_interviews_count: number
  total_conversations: number
  avg_satisfaction_rating: number
  created_at: string
  updated_at: string
  last_used_at?: string
}

export interface CreateAgentData {
  agent_id?: string
  name: string
  description: string
  tone: "FORMAL" | "CASUAL" | "FRIENDLY" | "PROFESSIONAL" | "EMPATHETIC"
  embedding_profile: string
  section_id: string
  prompt_config: {
    system_prompt: string
    greeting_prompt: string
    closing_prompt: string
    context_instructions: string
  }
  model_config: {
    model: string
    temperature: number
    max_tokens: number
    top_p: number
  }
  specialties: string[]
}

export interface AgentsResponse {
  agents: Agent[]
  total: number
  page: number
  limit: number
}

export interface AgentStats {
  total_agents: number
  active_agents: number
  total_conversations: number
  avg_satisfaction: number
  avg_response_time: number
}

export const agentsApi = {
  getAll: async (params?: {
    section_id?: string
    status?: string
    tone?: string
    model?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<AgentsResponse> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })
    }
    return fetchApi(`/agents?${queryParams.toString()}`)
  },

  getById: async (id: string): Promise<Agent> => {
    return fetchApi(`/agents/${id}`)
  },

  getStats: async (): Promise<AgentStats> => {
    return fetchApi("/agents/stats")
  },

  create: async (data: CreateAgentData): Promise<Agent> => {
    return fetchApi("/agents", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Partial<CreateAgentData>): Promise<Agent> => {
    return fetchApi(`/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi(`/agents/${id}`, {
      method: "DELETE",
    })
  },

  test: async (
    id: string,
    data: { test_message: string; context?: string },
  ): Promise<{
    input_message: string
    agent_response: string
    response_time_ms: number
    tokens_used: number
    timestamp: string
  }> => {
    return fetchApi(`/agents/${id}/test`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  activate: async (id: string): Promise<Agent> => {
    return fetchApi(`/agents/${id}/activate`, {
      method: "POST",
    })
  },

  deactivate: async (id: string): Promise<Agent> => {
    return fetchApi(`/agents/${id}/deactivate`, {
      method: "POST",
    })
  },

  clone: async (id: string): Promise<Agent> => {
    return fetchApi(`/agents/${id}/clone`, {
      method: "POST",
    })
  },

  getBySection: async (sectionId: string): Promise<Agent[]> => {
    return fetchApi(`/agents/section/${sectionId}`)
  },
}
