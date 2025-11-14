"use client"

import { useEffect, useState } from "react"
import { agentsApi, type Agent, type CreateAgentData } from "@/lib/services/agents"
import { sectionsApi, type Section } from "@/lib/services/sections"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Bot, MessageSquare, Zap } from "lucide-react"

const statusColors = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INACTIVE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  TRAINING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  MAINTENANCE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
}

const statusLabels = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  TRAINING: "En Entrenamiento",
  MAINTENANCE: "Mantenimiento",
}

const modelOptions = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
]

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form state for create
  const [createFormData, setCreateFormData] = useState<{
    name: string
    description: string
    section_id: string
    tone: "FORMAL" | "CASUAL" | "FRIENDLY" | "PROFESSIONAL" | "EMPATHETIC"
    model: string
    embedding_profile: string
    system_prompt: string
  }>({
    name: "",
    description: "",
    section_id: "",
    tone: "PROFESSIONAL",
    model: "gpt-4-turbo",
    embedding_profile: "",
    system_prompt: "",
  })

  // Form state for edit
  const [editFormData, setEditFormData] = useState<{
    name: string
    description: string
    section_id: string
    tone: "FORMAL" | "CASUAL" | "FRIENDLY" | "PROFESSIONAL" | "EMPATHETIC"
    model: string
    embedding_profile: string
    system_prompt: string
    greeting_prompt: string
    closing_prompt: string
    context_instructions: string
  }>({
    name: "",
    description: "",
    section_id: "",
    tone: "PROFESSIONAL",
    model: "gpt-4-turbo",
    embedding_profile: "",
    system_prompt: "",
    greeting_prompt: "",
    closing_prompt: "",
    context_instructions: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [agentsData, sectionsData] = await Promise.all([agentsApi.getAll({ limit: 100 }), sectionsApi.getAll()])

      setAgents(agentsData.agents)
      setSections(sectionsData)
    } catch (error) {
      console.error("[v0] Error cargando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los agentes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async () => {
    try {
      // Validar campos requeridos
      if (!createFormData.name || !createFormData.section_id || !createFormData.embedding_profile) {
        toast({
          title: "Error de validación",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        })
        return
      }

      const data: CreateAgentData = {
        name: createFormData.name,
        description: createFormData.description,
        tone: createFormData.tone,
        embedding_profile: createFormData.embedding_profile,
        section_id: createFormData.section_id,
        prompt_config: {
          system_prompt: createFormData.system_prompt || "Eres un asistente conversacional profesional.",
          greeting_prompt: "¡Hola! ¿Cómo estás?",
          closing_prompt: "Gracias por tu tiempo.",
          context_instructions: "Mantén una conversación natural y enfocada.",
        },
        model_config: {
          model: createFormData.model,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
        },
        specialties: [],
      }

      const newAgent = await agentsApi.create(data)
      setAgents([...agents, newAgent])
      setIsCreateDialogOpen(false)

      // Reset form
      setCreateFormData({
        name: "",
        description: "",
        section_id: "",
        tone: "PROFESSIONAL",
        model: "gpt-4-turbo",
        embedding_profile: "",
        system_prompt: "",
      })

      toast({
        title: "Éxito",
        description: "Agente creado correctamente",
      })
    } catch (error) {
      console.error("[v0] Error creando agente:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el agente",
        variant: "destructive",
      })
    }
  }

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return

    try {
      const data: Partial<CreateAgentData> = {
        name: editFormData.name,
        description: editFormData.description,
        tone: editFormData.tone,
        embedding_profile: editFormData.embedding_profile,
        section_id: editFormData.section_id,
        prompt_config: {
          system_prompt: editFormData.system_prompt,
          greeting_prompt: editFormData.greeting_prompt,
          closing_prompt: editFormData.closing_prompt,
          context_instructions: editFormData.context_instructions,
        },
        model_config: {
          model: editFormData.model,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
        },
      }

      const updated = await agentsApi.update(selectedAgent.agent_id, data)
      setAgents(agents.map((a) => (a.agent_id === selectedAgent.agent_id ? updated : a)))
      setIsEditDialogOpen(false)
      setSelectedAgent(null)

      toast({
        title: "Éxito",
        description: "Agente actualizado correctamente",
      })
    } catch (error) {
      console.error("[v0] Error actualizando agente:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el agente",
        variant: "destructive",
      })
    }
  }

  const handleTestAgent = async (id: string) => {
    try {
      const result = await agentsApi.test(id, {
        test_message: "¿Cuáles son los principales desafíos en tu área?",
        context: "Prueba desde el panel de administración",
      })

      toast({
        title: "Prueba exitosa",
        description: `Respuesta: ${result.agent_response.substring(0, 100)}...`,
      })
    } catch (error) {
      console.error("[v0] Error probando agente:", error)
      toast({
        title: "Error",
        description: "No se pudo probar el agente",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAgent = async (id: string) => {
    try {
      await agentsApi.delete(id)
      setAgents(agents.filter((a) => a.agent_id !== id))
      toast({
        title: "Agente eliminado",
        description: "El agente ha sido desactivado",
      })
    } catch (error) {
      console.error("[v0] Error eliminando agente:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el agente",
        variant: "destructive",
      })
    }
  }

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.section_id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getSectionName = (sectionId: string) => {
    return sections.find((s) => s.section_id === sectionId)?.name || sectionId
  }

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
                <DialogDescription>
                  Configura un nuevo agente conversacional para una sección específica
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Nombre del Agente</Label>
                  <Input
                    id="agent-name"
                    placeholder="Ej: Agente IT"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-description">Descripción</Label>
                  <Textarea
                    id="agent-description"
                    placeholder="Describe el propósito de este agente..."
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agent-section">Sección Asignada</Label>
                    <Select
                      value={createFormData.section_id}
                      onValueChange={(value) => setCreateFormData({ ...createFormData, section_id: value })}
                    >
                      <SelectTrigger id="agent-section">
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
                    <Label htmlFor="agent-model">Modelo IA</Label>
                    <Select
                      value={createFormData.model}
                      onValueChange={(value) => setCreateFormData({ ...createFormData, model: value })}
                    >
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
                  <Select
                    value={createFormData.tone}
                    onValueChange={(value) =>
                      setCreateFormData({
                        ...createFormData,
                        tone: value as "FORMAL" | "CASUAL" | "FRIENDLY" | "PROFESSIONAL" | "EMPATHETIC",
                      })
                    }
                  >
                    <SelectTrigger id="agent-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROFESSIONAL">Profesional</SelectItem>
                      <SelectItem value="FORMAL">Formal</SelectItem>
                      <SelectItem value="CASUAL">Casual</SelectItem>
                      <SelectItem value="FRIENDLY">Amigable</SelectItem>
                      <SelectItem value="EMPATHETIC">Empático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-embedding">Perfil de Embeddings</Label>
                  <Input
                    id="agent-embedding"
                    placeholder="Ej: it_operaciones"
                    value={createFormData.embedding_profile}
                    onChange={(e) => setCreateFormData({ ...createFormData, embedding_profile: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-instructions">Instrucciones del Sistema</Label>
                  <Textarea
                    id="agent-instructions"
                    placeholder="Define cómo debe comportarse el agente, qué temas debe explorar y cómo guiar la conversación..."
                    value={createFormData.system_prompt}
                    onChange={(e) => setCreateFormData({ ...createFormData, system_prompt: e.target.value })}
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAgent}>Crear Agente</Button>
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
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Entrenamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">
                {agents.filter((a) => a.status === "TRAINING").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-violet-400">
                {agents.reduce((sum, a) => sum + a.total_conversations, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">Cargando agentes...</div>
          ) : (
            filteredAgents.map((agent) => (
              <Card key={agent.agent_id} className="border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-violet-500/10 p-2">
                        <Bot className="h-6 w-6 text-violet-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{agent.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{getSectionName(agent.section_id)}</p>
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
                      <span className="font-medium font-mono text-xs">{agent.model_config.model}</span>
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
                        <div className="text-xl font-bold text-emerald-400">{agent.assigned_interviews_count}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setSelectedAgent(agent)
                        setEditFormData({
                          name: agent.name,
                          description: agent.description,
                          section_id: agent.section_id,
                          tone: agent.tone,
                          model: agent.model_config.model,
                          embedding_profile: agent.embedding_profile,
                          system_prompt: agent.prompt_config.system_prompt,
                          greeting_prompt: agent.prompt_config.greeting_prompt,
                          closing_prompt: agent.prompt_config.closing_prompt,
                          context_instructions: agent.prompt_config.context_instructions,
                        })
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Configurar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handleTestAgent(agent.agent_id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Probar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteAgent(agent.agent_id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {selectedAgent && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configurar {selectedAgent.name}</DialogTitle>
                <DialogDescription>Modifica la configuración del agente conversacional</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre del Agente</Label>
                  <Input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sección Asignada</Label>
                    <Select
                      value={editFormData.section_id}
                      onValueChange={(value) => setEditFormData({ ...editFormData, section_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label>Modelo IA</Label>
                    <Select
                      value={editFormData.model}
                      onValueChange={(value) => setEditFormData({ ...editFormData, model: value })}
                    >
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
                  <Select
                    value={editFormData.tone}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        tone: value as "FORMAL" | "CASUAL" | "FRIENDLY" | "PROFESSIONAL" | "EMPATHETIC",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROFESSIONAL">Profesional</SelectItem>
                      <SelectItem value="FORMAL">Formal</SelectItem>
                      <SelectItem value="CASUAL">Casual</SelectItem>
                      <SelectItem value="FRIENDLY">Amigable</SelectItem>
                      <SelectItem value="EMPATHETIC">Empático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Perfil de Embeddings</Label>
                  <Input
                    value={editFormData.embedding_profile}
                    onChange={(e) => setEditFormData({ ...editFormData, embedding_profile: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prompt del Sistema</Label>
                  <Textarea
                    value={editFormData.system_prompt}
                    onChange={(e) => setEditFormData({ ...editFormData, system_prompt: e.target.value })}
                    placeholder="Define cómo debe comportarse el agente..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prompt de Saludo</Label>
                  <Textarea
                    value={editFormData.greeting_prompt}
                    onChange={(e) => setEditFormData({ ...editFormData, greeting_prompt: e.target.value })}
                    placeholder="¿Cómo debe saludar el agente?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prompt de Cierre</Label>
                  <Textarea
                    value={editFormData.closing_prompt}
                    onChange={(e) => setEditFormData({ ...editFormData, closing_prompt: e.target.value })}
                    placeholder="¿Cómo debe despedirse el agente?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instrucciones de Contexto</Label>
                  <Textarea
                    value={editFormData.context_instructions}
                    onChange={(e) => setEditFormData({ ...editFormData, context_instructions: e.target.value })}
                    placeholder="Instrucciones adicionales sobre el contexto de la conversación..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setSelectedAgent(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateAgent}>Guardar Cambios</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </>
  )
}
