import { fetchApi } from "../api-config"

export interface WhatsAppMessage {
  to: string
  message: string
  employee_id?: string
}

export interface WhatsAppTestResponse {
  success: boolean
  message_id?: string
  message: string
  timestamp: string
}

export interface StartConversationData {
  employee_id: string
  interview_id: string
}

export interface StartConversationResponse {
  success: boolean
  conversation_id: string
  employee: {
    employee_id: string
    name: string
    whatsapp_number: string
  }
  interview: {
    interview_id: string
    title: string
  }
  message: string
  timestamp: string
}

export interface ValidateNumberData {
  phone_number: string
}

export interface ValidateNumberResponse {
  valid: boolean
  formatted_number: string
  country_code?: string
  message: string
}

export interface WhatsAppMetrics {
  total_messages_sent: number
  total_messages_received: number
  active_conversations: number
  completed_conversations: number
  avg_response_time_seconds: number
  success_rate: number
  last_24h: {
    messages_sent: number
    messages_received: number
    new_conversations: number
  }
}

export const whatsappApi = {
  sendTestMessage: async (data: WhatsAppMessage): Promise<WhatsAppTestResponse> => {
    return fetchApi("/whatsapp/send-test-message", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  startConversation: async (data: StartConversationData): Promise<StartConversationResponse> => {
    return fetchApi("/whatsapp/start-conversation", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  validateNumber: async (data: ValidateNumberData): Promise<ValidateNumberResponse> => {
    return fetchApi("/whatsapp/validate-number", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  getMetrics: async (): Promise<WhatsAppMetrics> => {
    return fetchApi("/whatsapp/metrics")
  },
}
