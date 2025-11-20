import { io, Socket } from 'socket.io-client';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

export type SessionStartedData = {
    sessionId: string;
    interview: {
        id: string;
        title: string;
        description: string;
        durationMinutes: number;
    };
    employee: {
        id: string;
        name: string;
    };
    conversationHistory: ChatMessage[];
};

class WebSocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();

    connect(token: string) {
        if (this.socket?.connected) return;

        // En desarrollo usamos localhost:3000, en producción debería ser variable de entorno
        const url = 'http://localhost:3000/interview-chat';

        this.socket = io(url, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.emitEvent('connection-change', true);
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            this.emitEvent('connection-change', false);
        });

        this.socket.on('connect_error', (error: Error) => {
            console.error('WebSocket connection error:', error);
            this.emitEvent('error', error);
        });

        // Configurar listeners genéricos
        this.socket.onAny((eventName: string, ...args: any[]) => {
            this.emitEvent(eventName, ...args);
        });
    }

    joinInterview(executionId: string) {
        if (!this.socket) return;
        // El employeeId se extrae del token JWT en el backend
        this.socket.emit('join-interview', { executionId });
    }

    sendMessage(content: string) {
        if (!this.socket) return;
        this.socket.emit('send-message', { content });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Sistema simple de eventos para componentes React
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);

        // Retornar función para desuscribirse
        return () => {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                this.listeners.set(event, callbacks.filter(cb => cb !== callback));
            }
        };
    }

    private emitEvent(event: string, ...args: any[]) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(...args));
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const webSocketService = new WebSocketService();
