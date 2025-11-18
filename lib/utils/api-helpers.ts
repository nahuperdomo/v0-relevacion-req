/**
 * Utilidades mejoradas y tipadas para el manejo de API
 */

/**
 * Clase de error personalizada para errores de API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Formatea los mensajes de error del backend
 */
export function formatErrorMessage(error: any, statusCode: number): string {
  if (error.message) {
    const message = error.message

    const errorMappings: Record<string, string> = {
      'Cannot delete agent with active interviews': '❌ No se puede eliminar el agente porque tiene entrevistas activas.\n\n💡 Por favor, reasigna las entrevistas primero.',
      'Agent not found': '❌ El agente no fue encontrado',
      'Cannot delete employee with active interviews': '❌ No se puede eliminar el empleado porque tiene entrevistas activas.',
      'Employee not found': '❌ El empleado no fue encontrado',
      'Cannot delete section with active interviews': '❌ No se puede eliminar la sección porque tiene entrevistas activas.',
      'Section not found': '❌ La sección no fue encontrada',
      'Interview not found': '❌ La entrevista no fue encontrada',
      'Cannot delete an interview that is in progress': '❌ No se puede eliminar una entrevista en progreso.\n\n💡 Primero debes pausarla o completarla.',
      'Interview must be in PENDING status to start': '⚠️ La entrevista debe estar en estado PENDIENTE para iniciarla',
      'Unauthorized': '🔒 No tienes autorización para realizar esta acción',
      'Invalid credentials': '🔒 Credenciales inválidas',
      'Validation failed': '⚠️ Error de validación en los datos enviados',
      'Internal server error': '💥 Error interno del servidor. Por favor, intenta nuevamente',
    }

    for (const [key, value] of Object.entries(errorMappings)) {
      if (message.includes(key)) return value
    }

    if (message.length > 10 && message.length < 200) {
      return `⚠️ ${message}`
    }
  }

  const statusMessages: Record<number, string> = {
    400: '⚠️ Solicitud inválida. Verifica los datos enviados.',
    401: '🔒 No autorizado. Por favor, inicia sesión.',
    403: '🚫 No tienes permisos para realizar esta acción.',
    404: '🔍 Recurso no encontrado.',
    409: '⚠️ Conflicto: El recurso ya existe.',
    422: '⚠️ Error de validación en los datos.',
    500: '💥 Error del servidor. Intenta nuevamente.',
    503: '🚧 Servicio temporalmente no disponible.',
  }

  return statusMessages[statusCode] || '⚠️ Ocurrió un error inesperado'
}

/**
 * Función principal para realizar peticiones a la API
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"
  const url = `${baseUrl}${endpoint}`

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: response.statusText }
      }

      const errorMessage = formatErrorMessage(errorData, response.status)
      throw new ApiError(errorMessage, response.status, errorData)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Network or other errors
    throw new ApiError(
      '🔌 Error de conexión. Verifica tu conexión a internet.',
      0,
      error
    )
  }
}

/**
 * Funciones helper para diferentes métodos HTTP
 */
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) => {
    const queryString = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value)
            }
            return acc
          }, {} as Record<string, string>)
        ).toString()
      : ""
    return fetchApi<T>(`${endpoint}${queryString}`)
  },

  post: <T = any>(endpoint: string, data?: any) =>
    fetchApi<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any) =>
    fetchApi<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any) =>
    fetchApi<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    fetchApi<T>(endpoint, {
      method: "DELETE",
    }),
}

/**
 * Helper para retry con backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
