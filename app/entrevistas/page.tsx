"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Play, Pause, Edit, Trash2, Eye, RotateCcw, CheckCircle, Copy, Zap } from "lucide-react"
import { interviewsApi, type Interview, type CreateInterviewData } from "@/lib/services/interviews"
import { sectionsApi, type Section } from "@/lib/services/sections"
import { agentsApi, type Agent } from "@/lib/services/agents"
import { employeesApi, type Employee } from "@/lib/services/employees"
import { useToast } from "@/hooks/use-toast"
import { ActiveExecutions } from "@/components/active-executions"

type InterviewStatus = "DRAFT" | "PENDING" | "IN_PROGRESS" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | "ARCHIVED"

const statusColors: Record<InterviewStatus, string> = {
  DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  PENDING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  IN_PROGRESS: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PAUSED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
}

const statusLabels: Record<InterviewStatus, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  ACTIVE: "Activa",
  COMPLETED: "Completada",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada",
  ARCHIVED: "Archivada",
}

export default function EntrevistasPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [agentsList, setAgentsList] = useState<Agent[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [executeType, setExecuteType] = useState<"employees" | "section">("employees")
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [executionStatus, setExecutionStatus] = useState<any>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    section_id: "",
    agent_id: "",
    duration_minutes: 10,
    topics: "",
    type: "INDIVIDUAL" as const,
    target_employees: [] as string[],
    schedule: {
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      allowed_days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      start_time: "09:00",
      end_time: "18:00",
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [interviewsData, sectionsData, agentsData, employeesData] = await Promise.all([
        interviewsApi.getAll(),
        sectionsApi.getAll(),
        agentsApi.getAll({ limit: 100 }),
        employeesApi.getAll({ limit: 100 }),
      ])

      setInterviews(interviewsData.interviews)
      setSections(sectionsData)
      setAgentsList(agentsData.agents)
      setEmployees(employeesData.employees)
    } catch (error) {
      console.error("[v0] Error cargando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las entrevistas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInterview = async () => {
    try {
      // Validar campos requeridos
      if (!formData.title || !formData.section_id || !formData.agent_id) {
        toast({
          title: "Error de validación",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        })
        return
      }

      if (formData.target_employees.length === 0) {
        toast({
          title: "Error de validación",
          description: "Debes seleccionar al menos un empleado",
          variant: "destructive",
        })
        return
      }

      // Preparar datos para el endpoint
      const data: CreateInterviewData = {
        title: formData.title,
        description: formData.description,
        section_id: formData.section_id,
        agent_id: formData.agent_id,
        duration_minutes: formData.duration_minutes,
        topics: formData.topics.split(",").map((t) => t.trim()).filter(Boolean),
        type: formData.type,
        target_employees: formData.target_employees,
        schedule: formData.schedule,
      }

      const newInterview = await interviewsApi.create(data)
      setInterviews([...interviews, newInterview])
      setIsCreateDialogOpen(false)
      
      // Resetear formulario
      setFormData({
        title: "",
        description: "",
        section_id: "",
        agent_id: "",
        duration_minutes: 10,
        topics: "",
        type: "INDIVIDUAL" as const,
        target_employees: [] as string[],
        schedule: {
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          allowed_days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
          start_time: "09:00",
          end_time: "18:00",
        },
      })

      toast({
        title: "Éxito",
        description: "Entrevista creada correctamente",
      })
    } catch (error) {
      console.error("[v0] Error creando entrevista:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la entrevista",
        variant: "destructive",
      })
    }
  }

  const handleStartInterview = async (id: string) => {
    try {
      const updated = await interviewsApi.start(id)
      setInterviews(interviews.map((i) => (i.interview_id === id ? updated : i)))
      toast({
        title: "Entrevista iniciada",
        description: "La entrevista ha sido lanzada correctamente",
      })
    } catch (error) {
      console.error("[v0] Error iniciando entrevista:", error)
      toast({
        title: "Error",
        description: "No se pudo iniciar la entrevista",
        variant: "destructive",
      })
    }
  }

  const handlePauseInterview = async (id: string) => {
    try {
      const updated = await interviewsApi.pause(id)
      setInterviews(interviews.map((i) => (i.interview_id === id ? updated : i)))
      toast({
        title: "Entrevista pausada",
        description: "La entrevista ha sido pausada",
      })
    } catch (error) {
      console.error("[v0] Error pausando entrevista:", error)
      toast({
        title: "Error",
        description: "No se pudo pausar la entrevista",
        variant: "destructive",
      })
    }
  }

  const handleResumeInterview = async (id: string) => {
    try {
      const updated = await interviewsApi.resume(id)
      setInterviews(interviews.map((i) => (i.interview_id === id ? updated : i)))
      toast({
        title: "Entrevista reanudada",
        description: "La entrevista ha sido reanudada correctamente",
      })
    } catch (error) {
      console.error("[v0] Error reanudando entrevista:", error)
      toast({
        title: "Error",
        description: "No se pudo reanudar la entrevista",
        variant: "destructive",
      })
    }
  }

  const handleCompleteInterview = async (id: string) => {
    try {
      const updated = await interviewsApi.complete(id)
      setInterviews(interviews.map((i) => (i.interview_id === id ? updated : i)))
      toast({
        title: "Entrevista completada",
        description: "La entrevista ha sido marcada como completada",
      })
    } catch (error) {
      console.error("[v0] Error completando entrevista:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la entrevista",
        variant: "destructive",
      })
    }
  }

  const handleCloneInterview = async (id: string) => {
    try {
      const cloned = await interviewsApi.clone(id)
      setInterviews([...interviews, cloned])
      toast({
        title: "Entrevista duplicada",
        description: "Se ha creado una copia de la entrevista",
      })
    } catch (error) {
      console.error("[v0] Error clonando entrevista:", error)
      toast({
        title: "Error",
        description: "No se pudo clonar la entrevista",
        variant: "destructive",
      })
    }
  }

  const handleOpenExecuteDialog = (interview: Interview) => {
    setSelectedInterview(interview)
    setSelectedEmployees([])
    setExecutionStatus(null)
    setIsExecuteDialogOpen(true)
  }

  const handleExecuteInterview = async () => {
    if (!selectedInterview) return

    try {
      let result

      if (executeType === "section") {
        result = await interviewsApi.executeForSection({
          interview_id: selectedInterview.interview_id,
          section_id: selectedInterview.section_id,
          start_immediately: true,
        })
        toast({
          title: "Ejecución iniciada",
          description: `Se iniciaron ${result.employees_count} conversaciones para toda la sección`,
        })
      } else {
        if (selectedEmployees.length === 0) {
          toast({
            title: "Error",
            description: "Debes seleccionar al menos un empleado",
            variant: "destructive",
          })
          return
        }

        result = await interviewsApi.executeForEmployees({
          interview_id: selectedInterview.interview_id,
          employee_ids: selectedEmployees,
          start_immediately: true,
        })
        toast({
          title: "Ejecución iniciada",
          description: `Se iniciaron ${result.employees_count} conversaciones con los empleados seleccionados`,
        })
      }

      setExecutionStatus(result)
      
      // Cerrar diálogo después de 2 segundos
      setTimeout(() => {
        setIsExecuteDialogOpen(false)
        loadData() // Recargar datos
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Error ejecutando entrevista:", error)
      toast({
        title: "Error al ejecutar entrevista",
        description: error?.message || "No se pudo ejecutar la entrevista. Verifica que el backend esté corriendo.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteInterview = async (id: string) => {
    try {
      await interviewsApi.delete(id)
      setInterviews(interviews.filter((i) => i.interview_id !== id))
      toast({
        title: "Entrevista eliminada",
        description: "La entrevista ha sido archivada",
      })
    } catch (error) {
      console.error("[v0] Error eliminando entrevista:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la entrevista",
        variant: "destructive",
      })
    }
  }

  const filteredInterviews = interviews.filter(
    (interview) =>
      interview.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.section_id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const statusMapping: Record<Interview["status"], InterviewStatus> = {
    DRAFT: "DRAFT",
    PENDING: "PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
    PAUSED: "PAUSED",
    CANCELLED: "CANCELLED",
    ARCHIVED: "ARCHIVED",
  }

  return (
    <>
      <PageHeader
        title="Gestión de Entrevistas"
        description="Crea y administra entrevistas encubiertas para relevamiento de requerimientos"
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar entrevistas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva Entrevista
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entrevistas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{interviews.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes/Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {interviews.filter((i) => i.status === "PENDING" || i.status === "ACTIVE" || i.status === "IN_PROGRESS").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {interviews.filter((i) => i.status === "COMPLETED").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Borradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-400">
                {interviews.filter((i) => i.status === "DRAFT").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ejecuciones Activas */}
        <ActiveExecutions />

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Listado de Entrevistas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando entrevistas...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-muted/5">
                    <TableHead>Título</TableHead>
                    <TableHead>Sección</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Respuestas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterviews.map((interview) => (
                    <TableRow key={interview.interview_id} className="border-border/50 hover:bg-muted/5">
                      <TableCell className="font-medium">{interview.title}</TableCell>
                      <TableCell>{interview.section_id}</TableCell>
                      <TableCell className="text-muted-foreground">{interview.agent_id}</TableCell>
                      <TableCell>{interview.duration_minutes} min</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[statusMapping[interview.status]]}>
                          {statusLabels[statusMapping[interview.status]]}
                        </Badge>
                      </TableCell>
                      <TableCell>{interview.target_employees.length}</TableCell>
                      <TableCell>
                        {interview.responses_count}/{interview.target_employees.length}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {interview.status === "DRAFT" && (
                            <Button
                              key={`start-${interview.interview_id}`}
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleStartInterview(interview.interview_id)}
                            >
                              <Play className="h-3.5 w-3.5" />
                              Lanzar
                            </Button>
                          )}
                          {(interview.status === "IN_PROGRESS" || interview.status === "ACTIVE") && [
                            <Button
                              key={`view-${interview.interview_id}`}
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Ver
                            </Button>,
                            <Button
                              key={`pause-${interview.interview_id}`}
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handlePauseInterview(interview.interview_id)}
                            >
                              <Pause className="h-3.5 w-3.5" />
                              Pausar
                            </Button>,
                            <Button
                              key={`complete-${interview.interview_id}`}
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleCompleteInterview(interview.interview_id)}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Completar
                            </Button>
                          ]}
                          {interview.status === "PAUSED" && [
                            <Button
                              key={`resume-${interview.interview_id}`}
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleResumeInterview(interview.interview_id)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reanudar
                            </Button>,
                            <Button
                              key={`complete-paused-${interview.interview_id}`}
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleCompleteInterview(interview.interview_id)}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Completar
                            </Button>
                          ]}
                          {interview.status === "COMPLETED" && (
                            <Button
                              key={`results-${interview.interview_id}`}
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Resultados
                            </Button>
                          )}
                          {(interview.status === "DRAFT" || interview.status === "COMPLETED") && (
                            <Button
                              key={`clone-${interview.interview_id}`}
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleCloneInterview(interview.interview_id)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Clonar
                            </Button>
                          )}
                          {(interview.status === "ACTIVE" || interview.status === "PENDING") && (
                            <Button
                              key={`execute-${interview.interview_id}`}
                              variant="default"
                              size="sm"
                              className="gap-1.5 bg-violet-600 hover:bg-violet-700"
                              onClick={() => handleOpenExecuteDialog(interview)}
                            >
                              <Zap className="h-3.5 w-3.5" />
                              Ejecutar
                            </Button>
                          )}
                          <Button key={`edit-${interview.interview_id}`} variant="ghost" size="sm">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            key={`delete-${interview.interview_id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInterview(interview.interview_id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Entrevista</DialogTitle>
              <DialogDescription>Completa el formulario para crear una nueva entrevista encubierta</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Entrevista</Label>
                <Input
                  id="title"
                  placeholder="Ej: Detección de Cuellos de Botella en IT"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el objetivo de esta entrevista"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="section">Sección</Label>
                  <Select value={formData.section_id} onValueChange={(value) => setFormData({ ...formData, section_id: value })}>
                    <SelectTrigger id="section">
                      <SelectValue placeholder="Selecciona una sección" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.section_id} value={section.section_id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent">Agente IA</Label>
                  <Select value={formData.agent_id} onValueChange={(value) => setFormData({ ...formData, agent_id: value })}>
                    <SelectTrigger id="agent">
                      <SelectValue placeholder="Selecciona un agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentsList.map((agent) => (
                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Entrevista</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="GROUP">Grupal</SelectItem>
                      <SelectItem value="FOLLOW_UP">Seguimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="10"
                    min="5"
                    max="30"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topics">Temas a Explorar</Label>
                <Textarea
                  id="topics"
                  placeholder="Ingresa los temas separados por coma: procesos lentos, automatización, comunicación interna"
                  rows={3}
                  value={formData.topics}
                  onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employees">Empleados Objetivo</Label>
                <Select
                  value={formData.target_employees.length > 0 ? formData.target_employees[0] : ""}
                  onValueChange={(value) => {
                    if (!formData.target_employees.includes(value)) {
                      setFormData({ ...formData, target_employees: [...formData.target_employees, value] })
                    }
                  }}
                >
                  <SelectTrigger id="employees">
                    <SelectValue placeholder="Selecciona empleados" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((emp) => !formData.section_id || emp.section_id === formData.section_id)
                      .map((employee) => (
                        <SelectItem key={employee.employee_id} value={employee.employee_id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formData.target_employees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.target_employees.map((empId) => {
                      const emp = employees.find((e) => e.employee_id === empId)
                      return (
                        <Badge key={empId} variant="secondary" className="gap-1">
                          {emp?.name || empId}
                          <button
                            onClick={() =>
                              setFormData({
                                ...formData,
                                target_employees: formData.target_employees.filter((id) => id !== empId),
                              })
                            }
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateInterview}>Crear Entrevista</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para ejecutar entrevista */}
        <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ejecutar Entrevista: {selectedInterview?.title}</DialogTitle>
              <DialogDescription>
                Esta acción iniciará conversaciones automáticas por WhatsApp con los empleados seleccionados usando IA.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Tipo de ejecución */}
              <div className="space-y-2">
                <Label>Tipo de Ejecución</Label>
                <Select
                  value={executeType}
                  onValueChange={(value: "employees" | "section") => {
                    setExecuteType(value)
                    setSelectedEmployees([])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employees">Empleados específicos</SelectItem>
                    <SelectItem value="section">Toda la sección</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Información de la sección */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sección:</span>
                    <span className="font-medium">
                      {sections.find(s => s.section_id === selectedInterview?.section_id)?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agente IA:</span>
                    <span className="font-medium">
                      {agentsList.find(a => a.agent_id === selectedInterview?.agent_id)?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración estimada:</span>
                    <span className="font-medium">{selectedInterview?.duration_minutes} minutos</span>
                  </div>
                </div>
              </div>

              {/* Selección de empleados si es necesario */}
              {executeType === "employees" && (
                <div className="space-y-2">
                  <Label>Seleccionar Empleados</Label>
                  <Select
                    onValueChange={(value) => {
                      if (!selectedEmployees.includes(value)) {
                        setSelectedEmployees([...selectedEmployees, value])
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona empleados para entrevistar" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((emp) => emp.section_id === selectedInterview?.section_id)
                        .filter((emp) => !selectedEmployees.includes(emp.employee_id))
                        .map((employee) => (
                          <SelectItem key={employee.employee_id} value={employee.employee_id}>
                            {employee.name} - {employee.contact_info.whatsapp_number}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedEmployees.length > 0 && (
                    <div className="rounded-lg border p-3 space-y-2">
                      <div className="text-sm font-medium">
                        Empleados seleccionados ({selectedEmployees.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmployees.map((empId) => {
                          const emp = employees.find((e) => e.employee_id === empId)
                          return (
                            <Badge key={empId} variant="secondary" className="gap-1">
                              {emp?.name || empId}
                              <button
                                onClick={() =>
                                  setSelectedEmployees(selectedEmployees.filter((id) => id !== empId))
                                }
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {executeType === "section" && (
                <div className="rounded-lg border p-4 bg-blue-500/10 border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-500/20 p-2">
                      <Zap className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-blue-400">Ejecución masiva</div>
                      <div className="text-sm text-muted-foreground">
                        Se enviará la entrevista a todos los empleados activos de la sección{" "}
                        <strong>
                          {sections.find(s => s.section_id === selectedInterview?.section_id)?.name}
                        </strong>
                        . Total aproximado:{" "}
                        <strong>
                          {employees.filter(e => e.section_id === selectedInterview?.section_id).length} empleados
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Estado de ejecución */}
              {executionStatus && (
                <div className="rounded-lg border p-4 bg-green-500/10 border-green-500/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-medium text-green-400">Ejecución iniciada exitosamente</div>
                      <div className="text-sm text-muted-foreground">
                        ID de ejecución: <code className="text-xs">{executionStatus.execution_id}</code>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Estado: <Badge variant="outline">{executionStatus.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExecuteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleExecuteInterview}
                disabled={executeType === "employees" && selectedEmployees.length === 0}
              >
                <Zap className="mr-2 h-4 w-4" />
                Iniciar Ejecución
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
