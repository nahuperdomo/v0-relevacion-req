"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play, 
  Square,
  AlertTriangle,
  TrendingUp,
  Heart,
  Target,
  FileText
} from "lucide-react"
import { executionsService, type InterviewExecution } from "@/lib/services/executions"
import { interviewsApi, type Interview } from "@/lib/services/interviews"
import { employeesApi, type Employee } from "@/lib/services/employees"
import { useToast } from "@/hooks/use-toast"
import { LoadingState } from "@/components/common/loading-state"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InterviewMessagesViewer } from "@/components/interview-messages-viewer"

const statusColors = {
  PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PAUSED: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  COMPLETED: "bg-green-500/10 text-green-600 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
}

const statusLabels = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  PAUSED: "Pausada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
}

interface ExecutionConversation {
  conversation_id: string
  employee_id: string
  employee_name: string
  status: string
  started_at: string
  completed_at?: string
  messages_count: number
  last_message?: string
}

export default function ExecutionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const executionId = params.executionId as string

  const [execution, setExecution] = useState<InterviewExecution | null>(null)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [conversations, setConversations] = useState<ExecutionConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchExecutionDetails()
  }, [executionId])

  const fetchExecutionDetails = async () => {
    try {
      setLoading(true)
      
      // Obtener datos de la ejecución
      const executionData = await executionsService.getById(executionId)
      setExecution(executionData)

      // Obtener datos de la entrevista
      const interviewData = await interviewsApi.getById(executionData.interview_id)
      setInterview(interviewData)

      // Obtener empleados objetivo
      const employeesData = await employeesApi.getAll({ limit: 1000 })
      const targetEmployees = employeesData.employees.filter(emp => 
        executionData.target_employees.includes(emp.employee_id)
      )
      setEmployees(targetEmployees)

      // Obtener conversaciones
      try {
        const conversationsData = await executionsService.getConversations(executionId)
        setConversations(conversationsData)
      } catch (error) {
        console.warn("No se pudieron cargar las conversaciones:", error)
        setConversations([])
      }

    } catch (error) {
      console.error("Error fetching execution details:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la ejecución",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string) => {
    if (!execution) return
    
    try {
      setActionLoading(action)
      let result: InterviewExecution

      switch (action) {
        case "start":
          result = await executionsService.start(executionId)
          break
        case "pause":
          result = await executionsService.pause(executionId)
          break
        case "resume":
          result = await executionsService.resume(executionId)
          break
        case "complete":
          result = await executionsService.complete(executionId)
          break
        case "cancel":
          result = await executionsService.cancel(executionId)
          break
        case "stop":
          result = await executionsService.stop(executionId)
          break
        default:
          return
      }

      setExecution(result)
      toast({
        title: "Éxito",
        description: `Ejecución ${statusLabels[result.status].toLowerCase()}`,
      })
    } catch (error) {
      console.error(`Error ${action} execution:`, error)
      toast({
        title: "Error",
        description: `No se pudo ${action} la ejecución`,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return <LoadingState />
  }

  if (!execution || !interview) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No se pudo encontrar la ejecución solicitada.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <PageHeader
            title={`Ejecución: ${interview.title}`}
            description={`ID: ${execution.execution_id}`}
          />
        </div>
      </div>

      {/* Status y acciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={statusColors[execution.status]} variant="outline">
                {statusLabels[execution.status]}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Creada: {formatDate(execution.created_at)}
              </div>
              {execution.started_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Iniciada: {formatDate(execution.started_at)}
                </div>
              )}
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-2">
              {execution.status === "PENDING" && (
                <Button
                  onClick={() => handleAction("start")}
                  disabled={actionLoading === "start"}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Iniciar
                </Button>
              )}
              
              {execution.status === "IN_PROGRESS" && (
                <>
                  <Button
                    onClick={() => handleAction("pause")}
                    disabled={actionLoading === "pause"}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pausar
                  </Button>
                  <Button
                    onClick={() => handleAction("complete")}
                    disabled={actionLoading === "complete"}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Completar
                  </Button>
                  <Button
                    onClick={() => handleAction("stop")}
                    disabled={actionLoading === "stop"}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Detener
                  </Button>
                </>
              )}
              
              {execution.status === "PAUSED" && (
                <>
                  <Button
                    onClick={() => handleAction("resume")}
                    disabled={actionLoading === "resume"}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Reanudar
                  </Button>
                  <Button
                    onClick={() => handleAction("cancel")}
                    disabled={actionLoading === "cancel"}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Progreso */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso de conversaciones</span>
              <span>{execution.conversations_completed} de {execution.conversations_total}</span>
            </div>
            <Progress value={execution.completion_percentage} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {Number(execution.completion_percentage).toFixed(1)}% completado
            </div>
          </div>

          {execution.started_at && (
            <Separator className="my-4" />
          )}

          {/* Duración */}
          {execution.started_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Duración: {formatDuration(execution.started_at, execution.completed_at)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs con información detallada */}
      <Tabs defaultValue="overview" className="space-y-4 mb-12">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
          <TabsTrigger value="employees">Empleados</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Empleados Objetivo</p>
                    <p className="text-2xl font-bold">{execution.target_employees.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Conversaciones</p>
                    <p className="text-2xl font-bold">{execution.conversations_completed}/{execution.conversations_total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {execution.average_urgency !== null && execution.average_urgency !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Urgencia Promedio</p>
                      <p className="text-2xl font-bold">{Number(execution.average_urgency).toFixed(1)}/10</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {execution.average_productivity_impact !== null && execution.average_productivity_impact !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Impacto Productividad</p>
                      <p className="text-2xl font-bold">{Number(execution.average_productivity_impact).toFixed(1)}/10</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {execution.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{execution.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Mensajes */}
        <TabsContent value="messages" className="space-y-4">
          <InterviewMessagesViewer executionId={executionId} />
        </TabsContent>

        {/* Tab: Empleados */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Empleados Objetivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.employee_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        WhatsApp: {employee.contact_info.whatsapp_number}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {employee.status === "ACTIVE" ? "Activo" : employee.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}