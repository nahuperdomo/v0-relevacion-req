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
import { Plus, Search, Play, Pause, Edit, Trash2, Eye } from "lucide-react"
import { interviewsApi, type Interview, type CreateInterviewData } from "@/lib/services/interviews"
import { sectionsApi, type Section } from "@/lib/services/sections"
import { agentsApi, type Agent } from "@/lib/services/agents"
import { useToast } from "@/hooks/use-toast"

type InterviewStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "PAUSED"

const statusColors: Record<InterviewStatus, string> = {
  DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  IN_PROGRESS: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PAUSED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
}

const statusLabels: Record<InterviewStatus, string> = {
  DRAFT: "Borrador",
  IN_PROGRESS: "En Progreso",
  COMPLETED: "Completada",
  PAUSED: "Pausada",
}

export default function EntrevistasPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [agentsList, setAgentsList] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [interviewsData, sectionsData, agentsData] = await Promise.all([
        interviewsApi.getAll(),
        sectionsApi.getAll(),
        agentsApi.getAll({ limit: 100 }),
      ])

      setInterviews(interviewsData.interviews)
      setSections(sectionsData)
      setAgentsList(agentsData.agents)
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

  const handleCreateInterview = async (data: CreateInterviewData) => {
    try {
      const newInterview = await interviewsApi.create(data)
      setInterviews([...interviews, newInterview])
      setIsCreateDialogOpen(false)
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

  const statusMapping: Record<Interview["status"], "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "PAUSED"> = {
    DRAFT: "DRAFT",
    ACTIVE: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    PAUSED: "PAUSED",
    ARCHIVED: "COMPLETED",
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
              <CardTitle className="text-sm font-medium text-muted-foreground">En Progreso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-violet-400">
                {interviews.filter((i) => i.status === "ACTIVE").length}
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
                          {interview.status === "ACTIVE" && (
                            <>
                              <Button
                                key={`view-${interview.interview_id}`}
                                variant="ghost"
                                size="sm"
                                className="gap-1.5"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Ver
                              </Button>
                              <Button
                                key={`pause-${interview.interview_id}`}
                                variant="ghost"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => handlePauseInterview(interview.interview_id)}
                              >
                                <Pause className="h-3.5 w-3.5" />
                                Pausar
                              </Button>
                            </>
                          )}
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
                <Input id="title" placeholder="Ej: Detección de Cuellos de Botella en IT" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="section">Sección</Label>
                  <Select>
                    <SelectTrigger id="section">
                      <SelectValue placeholder="Selecciona una sección" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent">Agente IA</Label>
                  <Select>
                    <SelectTrigger id="agent">
                      <SelectValue placeholder="Selecciona un agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentsList.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input id="duration" type="number" placeholder="10" min="5" max="30" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topics">Temas a Explorar</Label>
                <Textarea
                  id="topics"
                  placeholder="Ingresa los temas separados por coma: procesos lentos, automatización, comunicación interna"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>Crear Entrevista</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
