"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    X,
    Send,
    Bot,
    User,
    Loader2,
    CheckCircle2,
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    WifiOff
} from "lucide-react"
import { webSocketService, ChatMessage, SessionStartedData } from "@/lib/services/websocket.service"
import { useAuth } from "@/components/auth-provider"
import { getAuthToken } from "@/lib/services/auth"

interface Interview {
    id: string
    title: string
    description: string
    status: string
    questionsTotal: number
    questionsCompleted: number
    dueDate?: string
    estimatedDuration?: number
}

interface InterviewChatProps {
    interview: Interview
    onClose: () => void
}

export function InterviewChat({ interview, onClose }: InterviewChatProps) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isCompleted, setIsCompleted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    // WebSocket integration
    useEffect(() => {
        if (!user) return

        // Obtener el token real de autenticación
        const token = getAuthToken()
        if (!token) {
            setError("No hay token de autenticación disponible")
            return
        }

        // Connect to WebSocket with real token
        webSocketService.connect(token)

        // Setup listeners
        const unsubscribeConnection = webSocketService.on('connection-change', (connected: boolean) => {
            setIsConnected(connected)
            if (connected) {
                setError(null)
                // Join interview when connected (employeeId viene del token JWT)
                webSocketService.joinInterview(interview.id)
            } else {
                setError("Conexión perdida. Intentando reconectar...")
            }
        })

        const unsubscribeSession = webSocketService.on('session-started', (data: SessionStartedData) => {
            console.log('Session started:', data)
            setMessages(data.conversationHistory.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            })))
        })

        const unsubscribeMessage = webSocketService.on('new-message', (message: ChatMessage) => {
            setMessages(prev => [...prev, {
                ...message,
                timestamp: new Date(message.timestamp)
            }])
            setIsTyping(false)
        })

        const unsubscribeUserMessage = webSocketService.on('message-received', (message: ChatMessage) => {
            setMessages(prev => [...prev, {
                ...message,
                timestamp: new Date(message.timestamp)
            }])
        })

        const unsubscribeTyping = webSocketService.on('agent-typing', (data: { isTyping: boolean }) => {
            setIsTyping(data.isTyping)
        })

        const unsubscribeCompleted = webSocketService.on('interview-completed', async () => {
            setIsCompleted(true)
            
            // Actualizar el estado de la asignación a COMPLETED en el backend
            try {
                await fetch(`http://localhost:3000/api/v1/interview-assignments/${interview.id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'COMPLETED' })
                })
                
                // Esperar 3 segundos antes de cerrar para que el usuario vea el mensaje
                setTimeout(() => {
                    onClose()
                }, 3000)
            } catch (error) {
                console.error('Error updating assignment status:', error)
            }
        })

        const unsubscribeError = webSocketService.on('error', (err: any) => {
            console.error('Socket error:', err)
            setError("Ocurrió un error en la conexión")
            setIsTyping(false)
        })

        // Initial join attempt
        if (webSocketService.isConnected()) {
            setIsConnected(true)
            webSocketService.joinInterview(interview.id)
        }

        return () => {
            unsubscribeConnection()
            unsubscribeSession()
            unsubscribeMessage()
            unsubscribeUserMessage()
            unsubscribeTyping()
            unsubscribeCompleted()
            unsubscribeError()
            webSocketService.disconnect()
        }
    }, [user, interview.id])

    const handleSend = () => {
        if (!input.trim() || !isConnected || isCompleted) return

        webSocketService.sendMessage(input)
        setInput("")
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="hover:bg-accent flex-shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="font-semibold text-lg">{interview.title}</h2>
                                {!isConnected && (
                                    <Badge variant="destructive" className="gap-1">
                                        <WifiOff className="h-3 w-3" />
                                        Desconectado
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{interview.description}</p>

                            {/* Interview Details */}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                {interview.dueDate && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        <span>Vence: {new Date(interview.dueDate).toLocaleDateString('es-ES')}</span>
                                    </div>
                                )}
                                {interview.estimatedDuration && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" />
                                        <span>{interview.estimatedDuration} min</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="hover:bg-accent flex-shrink-0"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {error && (
                    <div className="mt-2 p-2 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                        <WifiOff className="h-4 w-4" />
                        {error}
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p>Conectando con el entrevistador...</p>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {message.role === "assistant" && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                        )}

                        <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                                {message.timestamp.toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>

                        {message.role === "user" && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent flex-shrink-0">
                                <User className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3 justify-start">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}

                {isCompleted && (
                    <div className="flex justify-center">
                        <Card className="p-6 bg-green-500/10 border-green-500/30 max-w-md">
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                </div>
                                <h3 className="font-semibold text-lg">¡Entrevista Completada!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Gracias por tu tiempo y tus valiosas respuestas.
                                </p>
                            </div>
                        </Card>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!isCompleted && (
                <div className="border-t border-border bg-card p-4">
                    <div className="flex gap-2 max-w-4xl mx-auto">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Escribe tu respuesta..."
                            disabled={!isConnected || isTyping}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || !isConnected || isTyping}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isTyping ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Presiona Enter para enviar
                    </p>
                </div>
            )}
        </div>
    )
}
