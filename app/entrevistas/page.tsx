"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Play, Pause, Edit, Trash2, Eye } from "lucide-react"

type InterviewStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "PAUSED"

interface Interview {
  id: string
  title: string
  section: string
  topics: string[]
  duration: number
  agent: string
  status: InterviewStatus
  created_at: string
  participants: number
  responses: number
}

const mockInterviews: Interview[] = [
  {
    id: "int-it-002",
    title: "Detección de Cuellos de Botella en IT",
    section: "Tecnología",
    topics: ["procesos lentos", "automatización", "comunicación interna"],
    duration: 10,
    agent: "Agente IT",
    status: "IN_PROGRESS",
    created_at: "2025-11-12T09:30:00Z",
    participants: 15,
    responses: 8,
  },
  {
    id: "int-rrhh-001",
    title: "Evaluación de Clima Laboral",
    section: "Recursos Humanos",
    topics: ["satisfacción", "comunicación", "beneficios"],
    duration: 15,
    agent: "Agente RRHH",
    status: "COMPLETED",
    created_at: "2025-11-10T14:20:00Z",
    participants: 23,
    responses: 23,
  },
  {
    id: "int-cont-003",
    title: "Mejoras en Procesos Contables",
    section: "Contabilidad",
    topics: ["herramientas digitales", "tiempos de cierre", "reportes"],
    duration: 12,
    agent: "Agente Contable",
    status: "DRAFT",
    created_at: "2025-11-11T11:00:00Z",
    participants: 0,
    responses: 0,
  },
]

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
  const [interviews, setInterviews] = useState<Interview[]>(mockInterviews)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredInterviews = interviews.filter(
    (interview) =>
      interview.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.section.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Entrevista
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Entrevista</DialogTitle>
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
                        <SelectItem value="tecnologia">Tecnología</SelectItem>
                        <SelectItem value="rrhh">Recursos Humanos</SelectItem>
                        <SelectItem value="contabilidad">Contabilidad</SelectItem>
                        <SelectItem value="ventas">Ventas</SelectItem>
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
                        <SelectItem value="agt-it-001">Agente IT</SelectItem>
                        <SelectItem value="agt-rrhh-001">Agente RRHH</SelectItem>
                        <SelectItem value="agt-cont-001">Agente Contable</SelectItem>
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
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Progreso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-violet-400">
                {interviews.filter((i) => i.status === "IN_PROGRESS").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {interviews.filter((i) => i.status === "COMPLETED").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
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
                  <TableRow key={interview.id} className="border-border/50 hover:bg-muted/5">
                    <TableCell className="font-medium">{interview.title}</TableCell>
                    <TableCell>{interview.section}</TableCell>
                    <TableCell className="text-muted-foreground">{interview.agent}</TableCell>
                    <TableCell>{interview.duration} min</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[interview.status]}>
                        {statusLabels[interview.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{interview.participants}</TableCell>
                    <TableCell>
                      {interview.responses}/{interview.participants}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {interview.status === "DRAFT" && (
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            <Play className="h-3.5 w-3.5" />
                            Lanzar
                          </Button>
                        )}
                        {interview.status === "IN_PROGRESS" && (
                          <>
                            <Button variant="ghost" size="sm" className="gap-1.5">
                              <Eye className="h-3.5 w-3.5" />
                              Ver
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1.5">
                              <Pause className="h-3.5 w-3.5" />
                              Pausar
                            </Button>
                          </>
                        )}
                        {interview.status === "COMPLETED" && (
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            Resultados
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
