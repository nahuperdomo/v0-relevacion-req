"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AudioRecorder } from "@/components/audio-recorder"
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
    WifiOff,
    Paperclip,
    File,
    Image as ImageIcon,
    FileType,
    X as XIcon,
    Mic
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploadingFile, setIsUploadingFile] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isRecordingAudio, setIsRecordingAudio] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
            setSessionId(data.sessionId)
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

        const unsubscribeTranscribed = webSocketService.on('audio-transcribed', (data: { transcription: string; timestamp: Date }) => {
            console.log('Audio transcribed:', data.transcription)
            // Actualizar el último mensaje del usuario con la transcripción
            setMessages(prev => {
                const newMessages = [...prev]
                // Buscar el último mensaje del usuario que tenga audio
                for (let i = newMessages.length - 1; i >= 0; i--) {
                    if (newMessages[i].role === 'user' && newMessages[i].audio) {
                        // Reemplazar el audio por la transcripción
                        newMessages[i] = {
                            ...newMessages[i],
                            content: data.transcription,
                            audio: undefined, // Eliminar el audio
                        }
                        break
                    }
                }
                return newMessages
            })
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
                
                // No cerrar automáticamente - el usuario debe cerrar manualmente
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
            unsubscribeTranscribed()
            unsubscribeCompleted()
            unsubscribeError()
            webSocketService.disconnect()
        }
    }, [user, interview.id])

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || !isConnected || isCompleted) return

        // Si hay archivo seleccionado, subirlo primero
        if (selectedFile) {
            await handleFileUpload()
            return
        }

        webSocketService.sendMessage(input)
        setInput("")
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validar tamaño (20MB)
            if (file.size > 20 * 1024 * 1024) {
                setError("El archivo es demasiado grande. Máximo 20MB")
                return
            }
            setSelectedFile(file)
            setError(null)
        }
    }

    const handleFileUpload = async () => {
        if (!selectedFile || !sessionId) return

        setIsUploadingFile(true)
        // NO establecer isTyping aquí, se establecerá después cuando el agente responda

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('sessionId', sessionId)
            if (input.trim()) {
                formData.append('message', input)
            }

            // Agregar mensaje del usuario inmediatamente con indicador de carga
            const userMessageContent = input.trim() 
                ? `${input}\n\n[📎 Adjuntando: ${selectedFile.name}...]`
                : `[📎 Adjuntando archivo: ${selectedFile.name}...]`

            setMessages(prev => [...prev, {
                role: 'user',
                content: userMessageContent,
                timestamp: new Date()
            }])

            // Guardar info para actualizar después
            const fileName = selectedFile.name
            const userInputText = input.trim()
            
            // Limpiar estado
            setSelectedFile(null)
            setInput("")
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            const response = await fetch('http://localhost:3000/api/v1/interview-files/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            })

            if (!response.ok) {
                throw new Error('Error al subir el archivo')
            }

            const result = await response.json()
            
            console.log('Upload result:', result)

            // El backend envuelve la respuesta en {success, data, timestamp}
            const fileData = result.data || result
            
            console.log('File data extracted:', fileData)
            
            // Validar que tenemos todos los datos necesarios
            if (!fileData) {
                throw new Error('No se recibieron datos del servidor')
            }
            
            if (!fileData.fileUrl) {
                console.error('Missing fileUrl in response:', fileData)
                throw new Error('La respuesta del servidor no incluye la URL del archivo')
            }
            
            if (!fileData.mimetype) {
                console.error('Missing mimetype in response:', fileData)
                throw new Error('La respuesta del servidor no incluye el tipo de archivo')
            }
            
            if (!fileData.filename) {
                console.error('Missing filename in response:', fileData)
                throw new Error('La respuesta del servidor no incluye el nombre del archivo')
            }

            // Actualizar el mensaje del usuario para mostrar que el archivo se subió
            setMessages(prev => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage.role === 'user') {
                    // Guardar metadata del archivo para visualización
                    lastMessage.content = userInputText || ''
                    lastMessage.attachment = {
                        filename: fileName,
                        mimetype: fileData.mimetype,
                        size: fileData.size
                    }
                }
                return newMessages
            })

            // Ahora enviar por WebSocket con los attachments para que el agente responda
            setIsTyping(true) // Ahora sí mostrar que el agente está escribiendo
            
            const attachment = {
                url: fileData.fileUrl,
                filename: fileData.filename,
                mimetype: fileData.mimetype,
                size: fileData.size
            }
            
            console.log('Sending attachment via WebSocket:', attachment)
            console.log('Attachment validation:', {
                hasUrl: !!attachment.url,
                hasFilename: !!attachment.filename,
                hasMimetype: !!attachment.mimetype,
                hasSize: !!attachment.size
            })
            
            webSocketService.sendMessage(
                userInputText || '',
                [attachment]
            )

        } catch (error) {
            console.error('Error uploading file:', error)
            setError("Error al subir el archivo. Inténtalo de nuevo.")
            setIsTyping(false)
        } finally {
            setIsUploadingFile(false)
        }
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleAudioRecorded = async (audioBlob: Blob) => {
        if (!sessionId) {
            setError("No hay sesión activa")
            return
        }

        setIsUploadingFile(true)
        setIsRecordingAudio(false)

        try {
            // Crear URL del blob para reproducción
            const audioUrl = URL.createObjectURL(audioBlob)
            
            // Crear un blob con el tipo correcto si no lo tiene
            const typedBlob = new Blob([audioBlob], { type: 'audio/webm' })
            
            const formData = new FormData()
            formData.append('file', typedBlob, `audio_${Date.now()}.webm`)
            formData.append('sessionId', sessionId)
            if (input.trim()) {
                formData.append('message', input)
            }

            console.log('Uploading audio:', {
                size: typedBlob.size,
                type: typedBlob.type,
                sessionId: sessionId
            })

            // Agregar mensaje del usuario con audio player
            const userMessageContent = input.trim() || ''

            setMessages(prev => [...prev, {
                role: 'user',
                content: userMessageContent,
                timestamp: new Date(),
                audio: {
                    url: audioUrl,
                    duration: 0 // Se calculará con el audio element
                }
            }])

            const userInputText = input.trim()
            setInput("")

            const response = await fetch('http://localhost:3000/api/v1/interview-files/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            })

            console.log('Upload response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Upload error response:', errorText)
                throw new Error(`Error al subir el audio: ${response.status}`)
            }

            const result = await response.json()
            console.log('Upload result:', result)
            
            const fileData = result.data || result

            if (!fileData) {
                throw new Error('No se recibieron datos del servidor')
            }

            // No necesitamos actualizar el mensaje ya que ya tiene el audio player

            // Enviar por WebSocket
            setIsTyping(true)

            const attachment = {
                url: fileData.fileUrl,
                filename: fileData.filename,
                mimetype: fileData.mimetype,
                size: fileData.size
            }

            console.log('Sending audio via WebSocket:', attachment)

            webSocketService.sendMessage(
                userInputText || '',
                [attachment]
            )

        } catch (err) {
            console.error('Error uploading audio:', err)
            setError(err instanceof Error ? err.message : 'Error al subir la nota de voz')

            // Remover el mensaje de carga del usuario
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setIsUploadingFile(false)
        }
    }

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
        if (file.type === 'application/pdf') return <FileType className="h-4 w-4" />
        return <File className="h-4 w-4" />
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
                            {/* Si el mensaje tiene archivo adjunto, mostrar componente visual */}
                            {message.attachment && (
                                <div className="mb-2 p-2 bg-background/10 rounded-lg border border-border/20">
                                    <div className="flex items-center gap-2">
                                        {message.attachment.mimetype.startsWith('image/') ? (
                                            <ImageIcon className="h-4 w-4 flex-shrink-0" />
                                        ) : message.attachment.mimetype.includes('pdf') ? (
                                            <FileType className="h-4 w-4 flex-shrink-0" />
                                        ) : (
                                            <File className="h-4 w-4 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{message.attachment.filename}</p>
                                            <p className="text-xs opacity-70">{(message.attachment.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Si el mensaje tiene audio, mostrar player */}
                            {message.audio ? (
                                <div className="min-w-[200px]">
                                    <audio 
                                        controls 
                                        src={message.audio.url}
                                        className="w-full"
                                        style={{
                                            height: '32px',
                                            maxWidth: '100%'
                                        }}
                                    />
                                </div>
                            ) : message.content ? (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            ) : null}
                            
                            {/* Mostrar texto adicional si hay */}
                            {message.audio && message.content && (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap mt-2">{message.content}</p>
                            )}
                            
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

                {isUploadingFile && (
                    <div className="flex gap-3 justify-start">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 flex-shrink-0">
                            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Cargando y analizando archivo...
                            </p>
                        </div>
                    </div>
                )}

                {isTyping && !isUploadingFile && (
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
                                <Button 
                                    onClick={onClose}
                                    className="mt-2 w-full"
                                    variant="default"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!isCompleted && (
                <div className="border-t border-border bg-card p-4">
                    <div className="max-w-4xl mx-auto space-y-3">
                        {/* Audio Recorder */}
                        {isRecordingAudio && (
                            <AudioRecorder
                                onRecordingComplete={handleAudioRecorded}
                                onCancel={() => setIsRecordingAudio(false)}
                                disabled={!isConnected || isTyping || isUploadingFile}
                            />
                        )}

                        {/* File Preview */}
                        {selectedFile && !isRecordingAudio && (
                            <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getFileIcon(selectedFile)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemoveFile}
                                    className="h-8 w-8"
                                >
                                    <XIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {!isRecordingAudio && (
                            <>
                                <div className="flex gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileSelect}
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={!isConnected || isTyping || isUploadingFile || !!selectedFile}
                                        title="Adjuntar archivo"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setIsRecordingAudio(true)}
                                        disabled={!isConnected || isTyping || isUploadingFile || !!selectedFile}
                                        title="Grabar audio"
                                    >
                                        <Mic className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={selectedFile ? "Mensaje opcional..." : "Escribe tu respuesta, graba audio o adjunta archivos..."}
                                        disabled={!isConnected || isTyping || isUploadingFile}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={(!input.trim() && !selectedFile) || !isConnected || isTyping || isUploadingFile}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {isTyping || isUploadingFile ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    {selectedFile 
                                        ? "Haz clic en enviar para subir el archivo" 
                                        : "Presiona Enter para enviar, 🎤 para grabar audio o 📎 para adjuntar archivos"}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
