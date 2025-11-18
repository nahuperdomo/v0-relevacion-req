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
import { Plus, Search, Edit, Trash2, CheckCircle, Copy, Zap, Sparkles, Info, X } from "lucide-react"
import { interviewsApi, type Interview, type CreateInterviewData } from "@/lib/services/interviews"
import { executionsService } from "@/lib/services/executions"
import { sectionsApi, type Section } from "@/lib/services/sections"
import { agentsApi, type Agent } from "@/lib/services/agents"
import { employeesApi, type Employee } from "@/lib/services/employees"
import { useToast } from "@/hooks/use-toast"
import { ActiveExecutions } from "@/components/active-executions"
import { Pagination } from "@/components/ui/pagination"

type InterviewStatus = "DRAFT" | "ACTIVE" | "ARCHIVED"

const statusColors: Record<InterviewStatus, string> = {
  DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ARCHIVED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
}

const statusLabels: Record<InterviewStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  ARCHIVED: "Archivada",
}

export default function EntrevistasPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [agentsList, setAgentsList] = useState<Agent[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(null)
  const [interviewToEdit, setInterviewToEdit] = useState<Interview | null>(null)
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
    objectives: [] as string[],
    target_employees: [] as string[],
    schedule: {
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      allowed_days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      start_time: "09:00",
      end_time: "18:00",
    },
  })
  const [newObjective, setNewObjective] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [interviewsData, sectionsData, agentsData, employeesData] = await Promise.all([
        interviewsApi.getAll({ limit: 100 }), // Aumentar límite para mostrar todas
        sectionsApi.getAll(),
        agentsApi.getAll({ limit: 100 }),
        employeesApi.getAll({ limit: 100 }),
      ])

      setInterviews(interviewsData.interviews)
      setSections(Array.isArray(sectionsData) ? sectionsData : [])
      setAgentsList(Array.isArray(agentsData.agents) ? agentsData.agents : [])
      setEmployees(Array.isArray(employeesData.employees) ? employeesData.employees : [])
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
      if (!formData.title || !formData.description || !formData.section_id || !formData.agent_id) {
        toast({
          title: "Error de validación",
          description: "Por favor completa todos los campos requeridos (título, descripción, sección y agente)",
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
        objectives: formData.objectives.length > 0 ? formData.objectives : undefined,
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
        objectives: [],
        target_employees: [],
        schedule: {
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          allowed_days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
          start_time: "09:00",
          end_time: "18:00",
        },
      })
      setNewObjective("")

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

  const handleActivateInterview = async (id: string) => {
    if (activatingId) return // Prevent multiple clicks
    
    setActivatingId(id)
    try {
      // Change interview status from DRAFT to ACTIVE
      const updatedInterview = await interviewsApi.update(id, { status: "ACTIVE" })

      // Update local state immediately with the response
      setInterviews((prev) =>
        prev.map((interview) =>
          interview.interview_id === id ? { ...interview, status: updatedInterview.status } : interview
        )
      )

      toast({
        title: "✅ Entrevista activada",
        description: "La entrevista está lista para ser ejecutada",
      })

      // Refresh data in background
      loadData()
      
      // Reset activating state after a short delay to allow UI update
      setTimeout(() => setActivatingId(null), 100)
    } catch (error) {
      console.error("[v0] Error activando entrevista:", error)
      toast({
        title: "Error",
        description: "No se pudo activar la entrevista",
        variant: "destructive",
      })
      setActivatingId(null)
    }
  }

  const handleQuickExecuteInterview = async (interview: Interview) => {
    try {
      // Create an execution from the interview template
      const execution = await executionsService.create({
        interview_id: interview.interview_id,
        target_employees: interview.target_employees || []
      })

      // Start the execution immediately
      await executionsService.start(execution.execution_id)

      toast({
        title: "Ejecución iniciada",
        description: `Entrevista "${interview.title}" ejecutándose con ${interview.target_employees?.length || 0} empleados`,
      })

      // Refresh data
      await loadData()
    } catch (error) {
      console.error("[v0] Error iniciando ejecución:", error)
      toast({
        title: "Error",
        description: "No se pudo iniciar la ejecución de la entrevista",
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
    setEmployeeSearchQuery("")
    setExecutionStatus(null)
    setIsExecuteDialogOpen(true)
  }

  const handleOpenEditDialog = (interview: Interview) => {
    setInterviewToEdit(interview)
    setFormData({
      title: interview.title,
      description: interview.description,
      section_id: interview.section_id,
      agent_id: interview.agent_id,
      duration_minutes: interview.duration_minutes,
      objectives: interview.objectives || [],
      target_employees: interview.target_employees || [],
      schedule: interview.schedule || {
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        allowed_days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        start_time: "09:00",
        end_time: "18:00",
      },
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateInterview = async () => {
    if (!interviewToEdit) return

    try {
      // Validar campos requeridos
      if (!formData.title || !formData.description || !formData.section_id || !formData.agent_id) {
        toast({
          title: "Error de validación",
          description: "Por favor completa todos los campos requeridos (título, descripción, sección y agente)",
          variant: "destructive",
        })
        return
      }

      // Preparar datos para el endpoint
      const data: Partial<CreateInterviewData> = {
        title: formData.title,
        description: formData.description,
        section_id: formData.section_id,
        agent_id: formData.agent_id,
        duration_minutes: formData.duration_minutes,
        objectives: formData.objectives.length > 0 ? formData.objectives : undefined,
        target_employees: formData.target_employees,
        schedule: formData.schedule,
      }

      await interviewsApi.update(interviewToEdit.interview_id, data)
      
      setIsEditDialogOpen(false)
      setInterviewToEdit(null)

      // Resetear formulario
      setFormData({
        title: "",
        description: "",
        section_id: "",
        agent_id: "",
        duration_minutes: 10,
        objectives: [],
        target_employees: [],
        schedule: {
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          allowed_days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
          start_time: "09:00",
          end_time: "18:00",
        },
      })
      setNewObjective("")

      toast({
        title: "Éxito",
        description: "Entrevista actualizada correctamente",
      })

      // Recargar datos para obtener los nombres completos
      loadData()
    } catch (error) {
      console.error("[v0] Error actualizando entrevista:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la entrevista",
        variant: "destructive",
      })
    }
  }

  const handleOpenDeleteDialog = (interview: Interview) => {
    setInterviewToDelete(interview)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!interviewToDelete) return

    try {
      await interviewsApi.delete(interviewToDelete.interview_id)
      setInterviews((interviews || []).filter((i) => i.interview_id !== interviewToDelete.interview_id))
      setIsDeleteDialogOpen(false)
      setInterviewToDelete(null)
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

  const handleExecuteInterview = async () => {
    if (!selectedInterview) return

    try {
      let targetEmployees: string[] = []

      if (executeType === "section") {
        // For section execution, use all employees from the interview's target_employees
        targetEmployees = selectedInterview.target_employees || []
      } else {
        if (selectedEmployees.length === 0) {
          toast({
            title: "Error",
            description: "Debes seleccionar al menos un empleado",
            variant: "destructive",
          })
          return
        }
        targetEmployees = selectedEmployees
      }

      // Create execution
      const execution = await executionsService.create({
        interview_id: selectedInterview.interview_id,
        target_employees: targetEmployees,
      })

      // Start execution immediately
      await executionsService.start(execution.execution_id)

      toast({
        title: "Ejecución iniciada",
        description: `Se iniciaron conversaciones con ${targetEmployees.length} empleado(s)`,
      })

      setExecutionStatus({
        execution_id: execution.execution_id,
        interview_id: selectedInterview.interview_id,
        employees_count: targetEmployees.length,
        status: "IN_PROGRESS",
        initiated_at: new Date().toISOString(),
      })
      
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
    // This function is now replaced by handleOpenDeleteDialog
    // Kept for backward compatibility but redirects to confirmation dialog
    const interview = interviews.find(i => i.interview_id === id)
    if (interview) {
      handleOpenDeleteDialog(interview)
    }
  }

  const filteredInterviews = (interviews || []).filter(
    (interview) =>
      interview.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.section_id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Paginación
  const totalPages = Math.ceil(filteredInterviews.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInterviews = filteredInterviews.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1)
  }

  const statusMapping: Record<Interview["status"], InterviewStatus> = {
    DRAFT: "DRAFT",
    ACTIVE: "ACTIVE",
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
              <div className="text-3xl font-bold">{(interviews || []).length}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {(interviews || []).filter((i) => i.status === "ACTIVE").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Borradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-400">
                {(interviews || []).filter((i) => i.status === "DRAFT").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Archivadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">
                {(interviews || []).filter((i) => i.status === "ARCHIVED").length}
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
            ) : paginatedInterviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No se encontraron entrevistas" : "No hay entrevistas creadas"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-muted/5">
                    <TableHead>Título</TableHead>
                    <TableHead>Sección</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Empleados Target</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInterviews.map((interview) => (
                    <TableRow key={interview.interview_id} className="border-border/50 hover:bg-muted/5">
                      <TableCell className="font-medium">{interview.title}</TableCell>
                      <TableCell>{interview.section_name || interview.section_id}</TableCell>
                      <TableCell className="text-muted-foreground">{interview.agent_name || interview.agent_id}</TableCell>
                      <TableCell>{interview.duration_minutes} min</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(interview.created_at).toLocaleDateString('es-UY', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[statusMapping[interview.status]]}>
                          {statusLabels[statusMapping[interview.status]]}
                        </Badge>
                      </TableCell>
                      <TableCell>{interview.conversations_total || 0}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {interview.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleActivateInterview(interview.interview_id)}
                              disabled={activatingId === interview.interview_id}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              {activatingId === interview.interview_id ? "Activando..." : "Activar"}
                            </Button>
                          )}
                          {interview.status === "ACTIVE" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1.5 bg-violet-600 hover:bg-violet-700"
                              onClick={() => handleOpenExecuteDialog(interview)}
                            >
                              <Zap className="h-3.5 w-3.5" />
                              Ejecutar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleCloneInterview(interview.interview_id)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Clonar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleOpenEditDialog(interview)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                          <Button
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

        {/* Paginación */}
        {!loading && filteredInterviews.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredInterviews.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">Crear Nueva Entrevista</DialogTitle>
                  <DialogDescription className="text-base mt-1">
                    Configura una entrevista que será conducida por un agente de IA
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="font-semibold">Información Básica</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Título de la Entrevista <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ej: Detección de Cuellos de Botella en IT"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-base"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Un título descriptivo ayuda a identificar rápidamente el propósito
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe brevemente el objetivo y contexto de esta entrevista..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="text-base resize-none"
                  />
                </div>
              </div>

              {/* Configuración */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="font-semibold">Configuración</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="section" className="text-sm font-medium">
                      Sección <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.section_id} onValueChange={(value) => setFormData({ ...formData, section_id: value })}>
                      <SelectTrigger id="section" className="text-base">
                        <SelectValue placeholder="Selecciona una sección" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(sections) && sections.map((section) => (
                          <SelectItem key={section.section_id} value={section.section_id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium">
                      Duración estimada <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="duration"
                        type="number"
                        placeholder="10"
                        min="5"
                        max="30"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 10 })}
                        className="text-base"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">minutos</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Entre 5 y 30 minutos
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent" className="text-sm font-medium">
                    Agente de IA <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.agent_id} onValueChange={(value) => setFormData({ ...formData, agent_id: value })}>
                    <SelectTrigger id="agent" className="text-base">
                      <SelectValue placeholder="Selecciona un agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {(agentsList || []).map((agent) => (
                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                          <div className="flex items-center gap-2">
                            <span>{agent.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {agent.tone}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-200">
                    <div className="flex gap-2">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>
                        El agente define la personalidad y estilo de la conversación. Cada agente tiene objetivos base que se combinarán con los objetivos específicos de esta entrevista.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Objetivos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="font-semibold">Objetivos Específicos</h3>
                  <Badge variant="secondary" className="text-xs">Opcional</Badge>
                </div>

                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200">
                  <div className="flex gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      Estos objetivos se sumarán a los del agente. La conversación finalizará cuando todos los objetivos se hayan cumplido.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: Evaluar impacto de la migración a la nube"
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (newObjective.trim()) {
                            setFormData({ ...formData, objectives: [...formData.objectives, newObjective.trim()] })
                            setNewObjective("")
                          }
                        }
                      }}
                      className="text-base"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (newObjective.trim()) {
                          setFormData({ ...formData, objectives: [...formData.objectives, newObjective.trim()] })
                          setNewObjective("")
                        }
                      }}
                      className="gap-2 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>

                  {formData.objectives.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {formData.objectives.length} objetivo{formData.objectives.length !== 1 ? 's' : ''} agregado{formData.objectives.length !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-2">
                        {formData.objectives.map((objective, index) => (
                          <div 
                            key={index} 
                            className="group flex items-start gap-3 bg-muted/50 hover:bg-muted p-3 rounded-lg transition-colors"
                          >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {index + 1}
                            </div>
                            <p className="flex-1 text-sm pt-0.5">{objective}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setFormData({ 
                                ...formData, 
                                objectives: formData.objectives.filter((_, i) => i !== index) 
                              })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setFormData({
                    title: "",
                    description: "",
                    section_id: "",
                    agent_id: "",
                    duration_minutes: 10,
                    objectives: [],
                    target_employees: [],
                    schedule: {
                      start_date: new Date().toISOString().split("T")[0],
                      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                      allowed_days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
                      start_time: "09:00",
                      end_time: "18:00",
                    },
                  })
                  setNewObjective("")
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateInterview}
                disabled={!formData.title || !formData.section_id || !formData.agent_id}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Crear Entrevista
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para editar entrevista */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Edit className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <DialogTitle>Editar Entrevista</DialogTitle>
                  <DialogDescription>
                    Modifica los detalles de la entrevista. Los cambios afectarán futuras ejecuciones.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Sección 1: Información Básica */}
              <div className="space-y-4 border-b pb-6">
                <h3 className="text-sm font-semibold text-foreground">Información Básica</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-title">
                    Título <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    placeholder="Ej: Detección de Cuellos de Botella en IT"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">
                    Descripción <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe el objetivo de esta entrevista"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Sección 2: Configuración */}
              <div className="space-y-4 border-b pb-6">
                <h3 className="text-sm font-semibold text-foreground">Configuración</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-section">
                      Sección <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.section_id} onValueChange={(value) => setFormData({ ...formData, section_id: value })}>
                      <SelectTrigger id="edit-section">
                        <SelectValue placeholder="Selecciona una sección" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(sections) && sections.map((section) => (
                          <SelectItem key={section.section_id} value={section.section_id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-duration">
                      Duración (minutos) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      min="5"
                      max="30"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-agent">
                    Agente IA <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.agent_id} onValueChange={(value) => setFormData({ ...formData, agent_id: value })}>
                    <SelectTrigger id="edit-agent">
                      <SelectValue placeholder="Selecciona un agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {(agentsList || []).map((agent) => (
                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                          {agent.name} ({agent.tone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        El agente define la personalidad base. NO se modifica por entrevista.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 3: Objetivos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Objetivos Específicos</h3>
                  <Badge variant="outline" className="text-xs">Opcional</Badge>
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Los objetivos del agente ya están definidos. Estos se sumarán y la conversación finalizará cuando todos se cumplan.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: Evaluar impacto de la migración a la nube"
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (newObjective.trim()) {
                            setFormData({ ...formData, objectives: [...formData.objectives, newObjective.trim()] })
                            setNewObjective("")
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (newObjective.trim()) {
                          setFormData({ ...formData, objectives: [...formData.objectives, newObjective.trim()] })
                          setNewObjective("")
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {formData.objectives.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {formData.objectives.length} objetivo{formData.objectives.length !== 1 ? 's' : ''} adicional{formData.objectives.length !== 1 ? 'es' : ''}
                      </div>
                      <div className="space-y-2">
                        {formData.objectives.map((objective, index) => (
                          <div key={index} className="group flex items-start gap-3 rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                              {index + 1}
                            </div>
                            <p className="flex-1 text-sm pt-0.5">{objective}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setFormData({ 
                                ...formData, 
                                objectives: formData.objectives.filter((_, i) => i !== index) 
                              })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setInterviewToEdit(null)
                  setFormData({
                    title: "",
                    description: "",
                    section_id: "",
                    agent_id: "",
                    duration_minutes: 10,
                    objectives: [],
                    target_employees: [],
                    schedule: {
                      start_date: new Date().toISOString().split("T")[0],
                      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                      allowed_days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
                      start_time: "09:00",
                      end_time: "18:00",
                    },
                  })
                  setNewObjective("")
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateInterview}
                disabled={!formData.title || !formData.section_id || !formData.agent_id}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Guardar Cambios
              </Button>
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
                      {Array.isArray(sections) ? sections.find(s => s.section_id === selectedInterview?.section_id)?.name || "N/A" : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agente IA:</span>
                    <span className="font-medium">
                      {(agentsList || []).find(a => a.agent_id === selectedInterview?.agent_id)?.name || "N/A"}
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
                <div className="space-y-3">
                  <Label>Seleccionar Empleados</Label>
                  
                  {/* Buscador */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o teléfono..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Lista de empleados disponibles */}
                  <div className="rounded-lg border max-h-[200px] overflow-y-auto">
                    {employees
                      .filter((emp) => emp.section_id === selectedInterview?.section_id)
                      .filter((emp) => !selectedEmployees.includes(emp.employee_id))
                      .filter((emp) => {
                        const searchLower = employeeSearchQuery.toLowerCase()
                        return (
                          emp.name.toLowerCase().includes(searchLower) ||
                          emp.contact_info.whatsapp_number.includes(searchLower)
                        )
                      })
                      .map((employee) => (
                        <button
                          key={employee.employee_id}
                          onClick={() => {
                            setSelectedEmployees([...selectedEmployees, employee.employee_id])
                            setEmployeeSearchQuery("")
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-accent transition-colors border-b last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{employee.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {employee.contact_info.whatsapp_number}
                              </div>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    {employees
                      .filter((emp) => emp.section_id === selectedInterview?.section_id)
                      .filter((emp) => !selectedEmployees.includes(emp.employee_id))
                      .filter((emp) => {
                        const searchLower = employeeSearchQuery.toLowerCase()
                        return (
                          emp.name.toLowerCase().includes(searchLower) ||
                          emp.contact_info.whatsapp_number.includes(searchLower)
                        )
                      }).length === 0 && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        {employeeSearchQuery ? "No se encontraron empleados" : "No hay empleados disponibles"}
                      </div>
                    )}
                  </div>
                  
                  {selectedEmployees.length > 0 && (
                    <div className="rounded-lg border p-3 space-y-2">
                      <div className="text-sm font-medium">
                        Empleados seleccionados ({selectedEmployees.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmployees.map((empId) => {
                          const emp = (employees || []).find((e) => e.employee_id === empId)
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
                          {Array.isArray(sections) ? sections.find(s => s.section_id === selectedInterview?.section_id)?.name : ""}
                        </strong>
                        . Total aproximado:{" "}
                        <strong>
                          {(employees || []).filter(e => e.section_id === selectedInterview?.section_id).length} empleados
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

        {/* Diálogo de confirmación de eliminación */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>¿Eliminar entrevista?</DialogTitle>
              <DialogDescription>
                Esta acción archivará la entrevista <strong>"{interviewToDelete?.title}"</strong>. 
                Podrás recuperarla desde la sección de archivadas.
              </DialogDescription>
            </DialogHeader>
            
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="text-sm font-medium text-amber-400">Información importante</div>
                  <div className="text-sm text-muted-foreground">
                    Las ejecuciones y resultados asociados a esta entrevista se mantendrán guardados.
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
