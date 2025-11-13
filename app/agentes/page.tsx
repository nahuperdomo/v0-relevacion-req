"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Bot, MessageSquare, Zap } from "lucide-react"

interface Agent {
  id: string
  name: string
  tone: string
  model: string
  embedding_profile: string
  assigned_section: string
  section_name: string
  active_interviews: string[]
  total_conversations: number
  status: "ACTIVE" | "INACTIVE" | "TRAINING"
  created_at: string
}

const mockAgents: Agent[] = [
  {
    id: "agt-it-001",
    name: "Agente IT",
    tone: "casual y amigable",
    model: "gpt-5-chat",
    embedding_profile: "it_operaciones",
    assigned_section: "sec-IT",
    section_name: "Tecnología",
    active_interviews: ["int-it-002"],
    total_conversations: 156,
    status: "ACTIVE",
    created_at: "2025-11-12T09:40:00Z",
  },
  {
    id: "agt-rrhh-001",
    name: "Agente RRHH",
    tone: "empático y cercano",
    model: "gpt-5-chat",
    embedding_profile: "rrhh_clima",
    assigned_section: "sec-RRHH",
    section_name: "Recursos Humanos",
    active_interviews: [],
    total_conversations: 89,
    status: "ACTIVE",
    created_at: "2025-11-12T09:45:00Z",
  },
  {
    id: "agt-cont-001",
    name: "Agente Contable",
    tone: "profesional y preciso",
    model: "gpt-5-chat",
    embedding_profile: "contabilidad_procesos",
    assigned_section: "sec-CONT",
    section_name: "Contabilidad",
    active_interviews: ["int-cont-003"],
    total_conversations: 45,
    status: "ACTIVE",
    created_at: "2025-11-12T09:50:00Z",
  },
  {
    id: "agt-sales-001",
    name: "Agente Ventas",
    tone: "dinámico y motivador",
    model: "gpt-5-chat",
    embedding_profile: "ventas_performance",
    assigned_section: "sec-SALES",
    section_name: "Ventas",
    active_interviews: [],
    total_conversations: 203,
    status: "TRAINING",
    created_at: "2025-11-12T09:55:00Z",
  },
]

const statusColors = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INACTIVE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  TRAINING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
}

const statusLabels = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  TRAINING: "En Entrenamiento",
}

const modelOptions = [
  { value: "gpt-5-chat", label: "GPT-5 Chat" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "claude-3", label: "Claude 3" },
]

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.section_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <>
      <PageHeader
        title="Gestión de Agentes IA"
        description="Configura y administra agentes conversacionales para cada área"
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar agentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Agente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Agente IA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Nombre del Agente</Label>
                  <Input id="agent-name" placeholder="Ej: Agente IT" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agent-section">Sección Asignada</Label>
                    <Select>
                      <SelectTrigger id="agent-section">
                        <SelectValue placeholder="Selecciona una sección" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sec-IT">Tecnología</SelectItem>
                        <SelectItem value="sec-RRHH">Recursos Humanos</SelectItem>
                        <SelectItem value="sec-CONT">Contabilidad</SelectItem>
                        <SelectItem value="sec-SALES">Ventas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agent-model">Modelo IA</Label>
                    <Select defaultValue="gpt-5-chat">
                      <SelectTrigger id="agent-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-tone">Tono de Conversación</Label>
                  <Input id="agent-tone" placeholder="Ej: casual y amigable" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-embedding">Perfil de Embeddings</Label>
                  <Input id="agent-embedding" placeholder="Ej: it_operaciones" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-instructions">Instrucciones del Sistema</Label>
                  <Textarea
                    id="agent-instructions"
                    placeholder="Define cómo debe comportarse el agente, qué temas debe explorar y cómo guiar la conversación..."
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>Crear Agente</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{agents.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {agents.filter((a) => a.status === "ACTIVE").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-500/10 p-2">
                    <Bot className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Agente Ventas</CardTitle>
                    <p className="text-sm text-muted-foreground">Ventas</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                  En Entrenamiento
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tono:</span>
                  <span className="font-medium">dinámico y motivador</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Modelo:</span>
                  <span className="font-medium font-mono text-xs">gpt-5-chat</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Embeddings:</span>
                  <span className="font-medium font-mono text-xs">ventas_performance</span>
                </div>
              </div>

              <div className="rounded-lg bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Conversaciones</div>
                    <div className="text-xl font-bold text-violet-400">203</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Entrevistas Activas</div>
                    <div className="text-xl font-bold text-emerald-400">0</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => setSelectedAgent(mockAgents[3])}
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Configurar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Probar
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-violet-500/10 p-2">
                      <Bot className="h-6 w-6 text-violet-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{agent.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{agent.section_name}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColors[agent.status]}>
                    {statusLabels[agent.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Tono:</span>
                    <span className="font-medium">{agent.tone}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Modelo:</span>
                    <span className="font-medium font-mono text-xs">{agent.model}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Embeddings:</span>
                    <span className="font-medium font-mono text-xs">{agent.embedding_profile}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Conversaciones</div>
                      <div className="text-xl font-bold text-violet-400">{agent.total_conversations}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Entrevistas Activas</div>
                      <div className="text-xl font-bold text-emerald-400">{agent.active_interviews.length}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Configurar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Probar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedAgent && (
          <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurar {selectedAgent.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre del Agente</Label>
                  <Input defaultValue={selectedAgent.name} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sección Asignada</Label>
                    <Select defaultValue={selectedAgent.assigned_section}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sec-IT">Tecnología</SelectItem>
                        <SelectItem value="sec-RRHH">Recursos Humanos</SelectItem>
                        <SelectItem value="sec-CONT">Contabilidad</SelectItem>
                        <SelectItem value="sec-SALES">Ventas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Modelo IA</Label>
                    <Select defaultValue={selectedAgent.model}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tono de Conversación</Label>
                  <Input defaultValue={selectedAgent.tone} />
                </div>

                <div className="space-y-2">
                  <Label>Perfil de Embeddings</Label>
                  <Input defaultValue={selectedAgent.embedding_profile} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedAgent(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => setSelectedAgent(null)}>Guardar Cambios</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </>
  )
}
