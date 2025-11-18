const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"

export const apiConfig = {
  baseUrl: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 segundos
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const headers = {
    ...apiConfig.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout)

  try {
    const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Error en la solicitud" }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === "AbortError") {
      throw new Error("La solicitud excedió el tiempo de espera. Verifica que el backend esté ejecutándose.")
    }
    if (error.message === "Failed to fetch") {
      throw new Error(
        `No se puede conectar al servidor en ${apiConfig.baseUrl}. Verifica que el backend esté ejecutándose.`,
      )
    }
    throw error
  }
}
