import { apiConfig } from '../api-config';

export interface ConfigKeys {
  openai_api_key: string;
  whatsapp_access_token: string;
  whatsapp_phone_number_id: string;
  whatsapp_verify_token: string;
}

export const configService = {
  async getConfig(): Promise<ConfigKeys> {
    const response = await fetch(`${apiConfig.baseUrl}/config/keys`, {
      headers: apiConfig.headers,
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener la configuración');
    }
    
    return response.json();
  },

  async updateConfig(config: Partial<ConfigKeys>): Promise<void> {
    const response = await fetch(`${apiConfig.baseUrl}/config/keys`, {
      method: 'PUT',
      headers: apiConfig.headers,
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar la configuración');
    }
  },
};
