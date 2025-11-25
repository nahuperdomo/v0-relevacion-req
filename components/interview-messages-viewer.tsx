"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  User, 
  Bot, 
  Clock,
  Loader2
} from "lucide-react"
import { executionsService } from "@/lib/services/executions"
import { useToast } from "@/hooks/use-toast"

interface Message {
  role: string
  content: string
  timestamp: Date | string
}

interface Conversation {
  execution_id: string
  employee_id: string
  employee_name?: string
  interview_id: string
  messages: Message[]
  is_completed: boolean
  message_count: number
}

interface InterviewMessagesViewerProps {
  executionId: string
}

export function InterviewMessagesViewer({ executionId }: InterviewMessagesViewerProps) {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [executionId])

  // Auto-seleccionar la primera conversación cuando se cargan
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      handleSelectConversation(conversations[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await executionsService.getMessages(executionId)
      setConversations(response.conversations || [])
    } catch (error) {
      console.error("Error fetching conversations:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      setMessagesLoading(true)
      // Si ya tiene los mensajes cargados (desde el endpoint general), usarlos
      // Si no, hacer una llamada específica
      if (conversation.messages && conversation.messages.length > 0) {
        setSelectedConversation(conversation)
      } else {
        const detailedConversation = await executionsService.getMessagesByEmployee(
          executionId,
          conversation.employee_id
        )
        setSelectedConversation({
          ...conversation,
          messages: detailedConversation.messages,
        })
      }
    } catch (error) {
      console.error("Error fetching conversation details:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      })
    } finally {
      setMessagesLoading(false)
    }
  }

  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    return date.toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay conversaciones disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selector de conversación */}
      {conversations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seleccionar Empleado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {conversations.map((conv) => (
                <Button
                  key={conv.employee_id}
                  variant={selectedConversation?.employee_id === conv.employee_id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectConversation(conv)}
                  className="gap-2"
                >
                  <User className="h-3 w-3" />
                  {conv.employee_name || conv.employee_id}
                  {conv.is_completed && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      ✓
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista de mensajes */}
      <Card className="h-[500px] flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          {selectedConversation ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">
                    {selectedConversation.employee_name || selectedConversation.employee_id}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.message_count} mensajes
                  </p>
                </div>
              </div>
              {selectedConversation.is_completed && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  Completada
                </Badge>
              )}
            </div>
          ) : (
            <CardTitle className="text-lg text-muted-foreground">
              Selecciona una conversación
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
          {messagesLoading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedConversation ? (
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-4 pb-16">
                {selectedConversation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="h-3 w-3 opacity-70" />
                        <span className="text-xs opacity-70">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-4" />
              <p>Selecciona una conversación para ver los mensajes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
