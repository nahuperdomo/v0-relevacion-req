import { fetchApi } from "../api-config"

export interface Section {
  section_id: string
  name: string
  agent_id: string
  interviews_configured: string[]
  created_at: string
  status: "ACTIVE" | "INACTIVE"
}

export interface CreateSectionData {
  section_id?: string
  name: string
  agent_id: string
  interviews_configured?: string[]
  admin_id: string
}

export const sectionsApi = {
  getAll: async (): Promise<Section[]> => {
    return fetchApi("/sections")
  },

  getById: async (id: string): Promise<Section> => {
    return fetchApi(`/sections/${id}`)
  },

  create: async (data: CreateSectionData): Promise<Section> => {
    return fetchApi("/sections", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Partial<CreateSectionData>): Promise<Section> => {
    return fetchApi(`/sections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchApi(`/sections/${id}`, {
      method: "DELETE",
    })
  },
}
