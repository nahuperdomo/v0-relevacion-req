const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"

export const apiConfig = {
  baseUrl: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 segundos
}

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
 * Formatea los mensajes de error del backend para hacerlos más amigables
 */
function formatErrorMessage(error: any, statusCode: number): string {
  // Si el backend envió un mensaje, procesarlo
  if (error.message) {
    const message = error.message

    // Mapeo de mensajes comunes del backend a mensajes amigables
    const errorMappings: Record<string, string> = {
      // Agentes
      'Cannot delete agent with active interviews': '❌ No se puede eliminar el agente porque tiene entrevistas activas.\n\n💡 Por favor, reasigna las entrevistas primero.',
      'Agent not found': '❌ El agente no fue encontrado',
      'Agent with this ID already exists': '❌ Ya existe un agente con ese ID',
      
      // Empleados
      'Cannot delete employee with active interviews': '❌ No se puede eliminar el empleado porque tiene entrevistas activas.',
      'Employee not found': '❌ El empleado no fue encontrado',
      'Employee with this ID already exists': '❌ Ya existe un empleado con ese ID',
      
      // Secciones
      'Cannot delete section with active interviews': '❌ No se puede eliminar la sección porque tiene entrevistas activas.',
      'Section not found': '❌ La sección no fue encontrada',
      'Section with this ID already exists': '❌ Ya existe una sección con ese ID',
      
      // Entrevistas
      'Interview not found': '❌ La entrevista no fue encontrada',
      'Cannot delete an interview that is in progress': '❌ No se puede eliminar una entrevista en progreso.\n\n💡 Primero debes pausarla o completarla.',
      'Interview must be in PENDING status to start': '⚠️ La entrevista debe estar en estado PENDIENTE para iniciarla',
      'Only IN_PROGRESS interviews can be paused': '⚠️ Solo se pueden pausar entrevistas en progreso',
      
      // Autenticación
      'Unauthorized': '🔒 No tienes autorización para realizar esta acción',
      'Invalid credentials': '🔒 Credenciales inválidas',
      'Token expired': '🔒 Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
      
      // Validación
      'Validation failed': '⚠️ Error de validación en los datos enviados',
      'Bad Request': '⚠️ La solicitud contiene datos inválidos',
      
      // Servidor
      'Internal server error': '💥 Error interno del servidor. Por favor, intenta nuevamente',
    }

    // Buscar coincidencia exacta primero
    if (errorMappings[message]) {
      return errorMappings[message]
    }

    // Buscar coincidencia parcial
    for (const [key, value] of Object.entries(errorMappings)) {
      if (message.includes(key)) {
        return value
      }
    }

    // Si el mensaje es descriptivo, mostrarlo directamente con emoji
    if (message.length > 10 && message.length < 200) {
      return `⚠️ ${message}`
    }
  }

  // Mensajes por código de estado HTTP
  const statusMessages: Record<number, string> = {
    400: '⚠️ Solicitud inválida. Verifica los datos enviados.',
    401: '🔒 No autorizado. Por favor, inicia sesión.',
    403: '🚫 No tienes permisos para realizar esta acción.',
    404: '🔍 Recurso no encontrado.',
    409: '⚠️ Conflicto: El recurso ya existe.',
    422: '⚠️ Error de validación en los datos.',
    429: '⏱️ Demasiadas solicitudes. Intenta nuevamente más tarde.',
    500: '💥 Error del servidor. Intenta nuevamente.',
    502: '🔌 El servidor no está disponible.',
    503: '🚧 Servicio temporalmente no disponible.',
  }

  return statusMessages[statusCode] || `❌ Error ${statusCode}: ${error.message || 'Error desconocido'}`
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
      const error = await response.json().catch(() => ({ 
        message: "Error en la solicitud" 
      }))
      
      const friendlyMessage = formatErrorMessage(error, response.status)
      
      const apiError = new ApiError(
        friendlyMessage,
        response.status,
        error
      )
      
      // Mostrar el error automáticamente en un alert
      if (typeof window !== "undefined") {
        // Importación dinámica para evitar problemas de SSR
        import("@/components/error-alert").then(({ showErrorAlert }) => {
          showErrorAlert(friendlyMessage, "Error")
        })
      }
      
      throw apiError
    }

    const jsonResponse = await response.json()
    
    // Si el backend envuelve la respuesta en { data, success, timestamp }, extraer data
    if (jsonResponse && typeof jsonResponse === 'object' && 'data' in jsonResponse) {
      return jsonResponse.data as T
    }
    
    return jsonResponse
  } catch (error: any) {
    clearTimeout(timeoutId)

    let apiError: ApiError

    if (error.name === "AbortError") {
      apiError = new ApiError(
        "⏱️ La solicitud excedió el tiempo de espera.\n\n💡 Verifica que el backend esté ejecutándose.",
        408
      )
    } else if (error.message === "Failed to fetch") {
      apiError = new ApiError(
        `🔌 No se puede conectar al servidor.\n\n💡 Verifica que el backend esté ejecutándose en:\n${apiConfig.baseUrl}`,
        503
      )
    } else if (error instanceof ApiError) {
      // Si ya es un ApiError, dejarlo pasar (ya se mostró el alert arriba)
      throw error
    } else {
      apiError = new ApiError(
        error.message || "❌ Error desconocido",
        500,
        error
      )
    }
    
    // Mostrar el error automáticamente en un alert
    if (typeof window !== "undefined") {
      import("@/components/error-alert").then(({ showErrorAlert }) => {
        showErrorAlert(apiError.message, "Error")
      })
    }
    
    throw apiError
  }
}
