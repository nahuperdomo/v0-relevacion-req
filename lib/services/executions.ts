import { fetchApi } from '../api-config';

export interface InterviewExecution {
  execution_id: string;
  interview_id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  target_employees: string[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
  auto_complete_at?: string;
  general_summary?: string;
  consolidated_topics?: string[];
  critical_issues?: string[];
  general_recommendations?: string[];
  overall_sentiment?: string;
  average_urgency?: number;
  average_productivity_impact?: number;
  completed_objectives?: string[];
  conversations_completed: number;
  conversations_total: number;
  completion_percentage: number;
  notes?: string;
}

export interface CreateExecutionDto {
  interview_id: string;
  target_employees: string[];
  scheduled_start?: string;
  notes?: string;
}

export interface ExecutionListResponse {
  executions: InterviewExecution[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Servicio para gestionar ejecuciones de entrevistas
 */
export const executionsService = {
  /**
   * Crear nueva ejecución
   */
  async create(data: CreateExecutionDto): Promise<InterviewExecution> {
    return fetchApi('/executions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Listar ejecuciones con filtros
   */
  async getAll(filters?: {
    interview_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ExecutionListResponse> {
    const params = new URLSearchParams();
    if (filters?.interview_id) params.append('interview_id', filters.interview_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return fetchApi(`/executions${query ? `?${query}` : ''}`);
  },

  /**
   * Obtener ejecuciones activas (IN_PROGRESS o PAUSED)
   */
  async getActive(): Promise<InterviewExecution[]> {
    return fetchApi('/executions/active');
  },

  /**
   * Obtener ejecución por ID
   */
  async getById(executionId: string): Promise<InterviewExecution> {
    return fetchApi(`/executions/${executionId}`);
  },

  /**
   * Iniciar ejecución
   */
  async start(executionId: string): Promise<InterviewExecution> {
    return fetchApi(`/executions/${executionId}/start`, {
      method: 'POST',
    });
  },

  /**
   * Pausar ejecución
   */
  async pause(executionId: string): Promise<InterviewExecution> {
    return fetchApi(`/executions/${executionId}/pause`, {
      method: 'POST',
    });
  },

  /**
   * Reanudar ejecución
   */
  async resume(executionId: string): Promise<InterviewExecution> {
    return fetchApi(`/executions/${executionId}/resume`, {
      method: 'POST',
    });
  },

  /**
   * Completar ejecución
   */
  async complete(executionId: string): Promise<InterviewExecution> {
    return fetchApi(`/executions/${executionId}/complete`, {
      method: 'POST',
    });
  },

  /**
   * Cancelar ejecución
   */
  async cancel(executionId: string): Promise<InterviewExecution> {
    return fetchApi(`/executions/${executionId}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Detener ejecución
   */
  async stop(executionId: string): Promise<InterviewExecution> {
    return fetchApi(`/executions/${executionId}/stop`, {
      method: 'POST',
    });
  },

  /**
   * Obtener conversaciones de una ejecución
   */
  async getConversations(executionId: string): Promise<any[]> {
    return fetchApi(`/executions/${executionId}/conversations`);
  },

  /**
   * Obtener historial de mensajes de todas las conversaciones
   */
  async getMessages(executionId: string): Promise<{
    execution_id: string;
    interview_id: string;
    total_conversations: number;
    conversations: Array<{
      execution_id: string;
      employee_id: string;
      employee_name?: string;
      interview_id: string;
      messages: Array<{
        role: string;
        content: string;
        timestamp: Date;
      }>;
      is_completed: boolean;
      message_count: number;
    }>;
  }> {
    return fetchApi(`/executions/${executionId}/messages`);
  },

  /**
   * Obtener mensajes de una conversación específica (ejecución + empleado)
   */
  async getMessagesByEmployee(executionId: string, employeeId: string): Promise<{
    execution_id: string;
    employee_id: string;
    interview_id: string;
    messages: Array<{
      role: string;
      content: string;
      timestamp: Date;
    }>;
    is_completed: boolean;
  }> {
    return fetchApi(`/executions/${executionId}/messages/${employeeId}`);
  },
};
