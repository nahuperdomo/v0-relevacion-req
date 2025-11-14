import { fetchApi } from "../api-config"

export interface Admin {
  admin_id: string
  name: string
  email: string
  role: "ADMIN" | "SUPER_ADMIN" | "VIEWER"
  status: "ACTIVE" | "INACTIVE"
  created_at: string
  updated_at: string
}

export interface CreateAdminData {
  admin_id?: string
  name: string
  email: string
  role: "ADMIN" | "SUPER_ADMIN" | "VIEWER"
  password: string
}

export interface UpdateAdminData {
  name?: string
  email?: string
  role?: "ADMIN" | "SUPER_ADMIN" | "VIEWER"
  password?: string
  status?: "ACTIVE" | "INACTIVE"
}

export const adminsApi = {
  getById: async (id: string): Promise<Admin> => {
    return fetchApi(`/admins/${id}`)
  },

  create: async (data: CreateAdminData): Promise<Admin> => {
    return fetchApi("/admins", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: UpdateAdminData): Promise<Admin> => {
    return fetchApi(`/admins/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchApi(`/admins/${id}`, {
      method: "DELETE",
    })
  },
}
