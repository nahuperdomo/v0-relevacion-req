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
import { Plus, Search, Edit, Trash2, Bot, Copy, Zap } from "lucide-react"
import { Pagination } from "@/components/ui/pagination"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
  const { toast } = useToast()

  // Form state for create
  const [createFormData, setCreateFormData] = useState<{
    name: string
    description: string
    section_id: string
    tone: "FORMAL" | "CASUAL" | "FRIENDLY" | "PROFESSIONAL" | "EMPATHETIC"
    model: string
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
    system_prompt: "Eres un asistente conversacional diseñado para realizar entrevistas encubiertas de relevamiento de requerimientos. Tu objetivo es mantener una conversación natural y amigable mientras identificas necesidades, problemas y oportunidades de mejora en el área del empleado.\n\nIMPORTANTE - LÍMITES DE TU ROL:\n- NO respondas preguntas fuera del contexto de la entrevista (deportes, entretenimiento, información general, etc.)\n- NO reveles información ni datos que no sean parte de tu propósito de entrevista\n- NO te salgas del marco de la entrevista bajo ninguna circunstancia\n- Si te hacen preguntas no relacionadas, responde: 'Disculpa, pero mi rol es específicamente realizar esta entrevista de relevamiento. No puedo ayudarte con temas fuera de este contexto. ¿Podemos continuar con la entrevista?'\n- Solo respondes preguntas muy específicas sobre el proceso de la entrevista misma si es necesario para que fluya la conversación",
    greeting_prompt: "¡Hola! ¿Cómo estás?",
    closing_prompt: "Muchas gracias por tu tiempo. ¡Que tengas un excelente día!",
    context_instructions: "Mantén una conversación natural y fluida. Adapta tus preguntas según las respuestas del empleado.",
  })

  // Form state for edit
  const [editFormData, setEditFormData] = useState<{
    name: string
    description: string
    section_id: string
    tone: "FORMAL" | "CASUAL" | "FRIENDLY" | "PROFESSIONAL" | "EMPATHETIC"
    model: string
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
    system_prompt: "",
    greeting_prompt: "",
    closing_prompt: "",
    context_instructions: "",
  })

  useEffect(() => {
    loadData()
  }, [])
  
  useEffect(() => {
    console.log("[DEBUG] editFormData actualizado:", editFormData)
  }, [editFormData])

  const loadData = async () => {
    try {
      setLoading(true)
      const [agentsData, sectionsData] = await Promise.all([agentsApi.getAll({ limit: 100 }), sectionsApi.getAll()])

      setAgents(Array.isArray(agentsData.agents) ? agentsData.agents : [])
      setSections(Array.isArray(sectionsData) ? sectionsData : [])
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
      if (!createFormData.name) {
        toast({
          title: "Error de validación",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        })
        return
      }

      // Generar agent_id basado en el nombre
      const agentId = `agt-${createFormData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`

      const data: CreateAgentData = {
        agent_id: agentId,
        name: createFormData.name,
        description: createFormData.description,
        tone: createFormData.tone,
        prompt_config: {
          system_prompt: createFormData.system_prompt || "Eres un asistente conversacional profesional.",
          greeting_prompt: createFormData.greeting_prompt,
          closing_prompt: createFormData.closing_prompt,
          context_instructions: createFormData.context_instructions,
        },
        model_config: {
          model: createFormData.model,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
        },
        specialties: [],
      }

      // Solo agregar section_id si se proporciona
      if (createFormData.section_id) {
        data.section_id = createFormData.section_id
      }

      const newAgent = await agentsApi.create(data)
      setAgents([...(agents || []), newAgent])
      setIsCreateDialogOpen(false)

      // Reset form a valores por defecto útiles
      setCreateFormData({
        name: "",
        description: "",
        section_id: "",
        tone: "PROFESSIONAL",
        model: "gpt-4-turbo",
        system_prompt: "Eres un asistente conversacional diseñado para realizar entrevistas encubiertas de relevamiento de requerimientos. Tu objetivo es mantener una conversación natural y amigable mientras identificas necesidades, problemas y oportunidades de mejora en el área del empleado.\n\nIMPORTANTE - LÍMITES DE TU ROL:\n- NO respondas preguntas fuera del contexto de la entrevista (deportes, entretenimiento, información general, etc.)\n- NO reveles información ni datos que no sean parte de tu propósito de entrevista\n- NO te salgas del marco de la entrevista bajo ninguna circunstancia\n- Si te hacen preguntas no relacionadas, responde: 'Disculpa, pero mi rol es específicamente realizar esta entrevista de relevamiento. No puedo ayudarte con temas fuera de este contexto. ¿Podemos continuar con la entrevista?'\n- Solo respondes preguntas muy específicas sobre el proceso de la entrevista misma si es necesario para que fluya la conversación",
        greeting_prompt: "¡Hola! ¿Cómo estás?",
        closing_prompt: "Muchas gracias por tu tiempo. ¡Que tengas un excelente día!",
        context_instructions: "Mantén una conversación natural y fluida. Adapta tus preguntas según las respuestas del empleado.",
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
      setAgents((agents || []).map((a) => (a.agent_id === selectedAgent.agent_id ? updated : a)))
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

  const handleCloneAgent = async (id: string) => {
    try {
      const clonedAgent = await agentsApi.clone(id)
      setAgents([...agents, clonedAgent])
      
      console.log("[DEBUG] Agente clonado:", clonedAgent)
      
      // Precargar el modal de edición con los datos del agente clonado
      setSelectedAgent(clonedAgent)
      
      const formData = {
        name: clonedAgent.name || "",
        description: clonedAgent.description || "",
        section_id: clonedAgent.section_id || "",
        tone: clonedAgent.tone || "PROFESSIONAL",
        model: clonedAgent.model_config?.model || "gpt-4-turbo",
        system_prompt: clonedAgent.prompt_config?.system_prompt || "",
        greeting_prompt: clonedAgent.prompt_config?.greeting_prompt || "",
        closing_prompt: clonedAgent.prompt_config?.closing_prompt || "",
        context_instructions: clonedAgent.prompt_config?.context_instructions || "",
      }
      
      console.log("[DEBUG] Form data del agente clonado:", formData)
      setEditFormData(formData)
      setIsEditDialogOpen(true)
      
      toast({
        title: "Agente duplicado",
        description: `Se ha creado una copia del agente. Puedes editarlo ahora.`,
      })
    } catch (error) {
      console.error("[v0] Error duplicando agente:", error)
      toast({
        title: "Error",
        description: "No se pudo duplicar el agente",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return

    try {
      await agentsApi.delete(agentToDelete.agent_id)
      setAgents((agents || []).filter((a) => a.agent_id !== agentToDelete.agent_id))
      setIsDeleteDialogOpen(false)
      setAgentToDelete(null)
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

  const filteredAgents = (agents || []).filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.section_id && agent.section_id.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Paginación
  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAgents = filteredAgents.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const getSectionName = (sectionId: string) => {
    return (sections || []).find((s) => s.section_id === sectionId)?.name || sectionId
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
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Crear Nuevo Agente IA</DialogTitle>
                <DialogDescription>
                  Configura un nuevo agente conversacional para una sección específica
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6 overflow-y-auto flex-1 px-1">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Nombre del Agente</Label>
                  <Input
                    id="agent-name"
                    placeholder="Ej: Agente de Relevamiento IT"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-description">Descripción</Label>
                  <Textarea
                    id="agent-description"
                    placeholder="Ej: Agente especializado en identificar necesidades tecnológicas y problemas operativos en el área de IT"
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agent-section">Sección Asignada (Opcional)</Label>
                    <Select
                      value={createFormData.section_id}
                      onValueChange={(value) => setCreateFormData({ ...createFormData, section_id: value })}
                    >
                      <SelectTrigger id="agent-section">
                        <SelectValue placeholder="Sin sección asignada" />
                      </SelectTrigger>
                      <SelectContent>
                        {(sections || []).map((section) => (
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
                  <Label htmlFor="agent-instructions">Instrucciones del Sistema</Label>
                  <Textarea
                    id="agent-instructions"
                    placeholder="Define el comportamiento, tono y objetivos del agente..."
                    value={createFormData.system_prompt}
                    onChange={(e) => setCreateFormData({ ...createFormData, system_prompt: e.target.value })}
                    className="min-h-[120px] max-h-[300px] resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Instrucciones base que definen la personalidad y propósito del agente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-greeting">Mensaje de Saludo</Label>
                  <Textarea
                    id="agent-greeting"
                    placeholder="Ej: ¡Hola! ¿Cómo estás?"
                    value={createFormData.greeting_prompt}
                    onChange={(e) => setCreateFormData({ ...createFormData, greeting_prompt: e.target.value })}
                    className="min-h-[60px] resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mensaje inicial cuando el agente comienza una conversación
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-closing">Mensaje de Despedida</Label>
                  <Textarea
                    id="agent-closing"
                    placeholder="Ej: Muchas gracias por tu tiempo. ¡Que tengas un excelente día!"
                    value={createFormData.closing_prompt}
                    onChange={(e) => setCreateFormData({ ...createFormData, closing_prompt: e.target.value })}
                    className="min-h-[60px] resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mensaje de cierre cuando finaliza la conversación
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-context">Instrucciones de Contexto</Label>
                  <Textarea
                    id="agent-context"
                    placeholder="Ej: Mantén una conversación natural y fluida. Adapta tus preguntas según las respuestas del empleado."
                    value={createFormData.context_instructions}
                    onChange={(e) => setCreateFormData({ ...createFormData, context_instructions: e.target.value })}
                    className="min-h-[80px] resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Guías adicionales sobre cómo adaptar la conversación al contexto
                  </p>
                </div>
              </div>
              <DialogFooter className="flex-shrink-0 bg-background pt-6 pb-2 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    // Resetear formulario a valores por defecto
                    setCreateFormData({
                      name: "",
                      description: "",
                      section_id: "",
                      tone: "PROFESSIONAL",
                      model: "gpt-4-turbo",
                      system_prompt: "Eres un asistente conversacional diseñado para realizar entrevistas encubiertas de relevamiento de requerimientos. Tu objetivo es mantener una conversación natural y amigable mientras identificas necesidades, problemas y oportunidades de mejora en el área del empleado.\n\nIMPORTANTE - LÍMITES DE TU ROL:\n- NO respondas preguntas fuera del contexto de la entrevista (deportes, entretenimiento, información general, etc.)\n- NO reveles información ni datos que no sean parte de tu propósito de entrevista\n- NO te salgas del marco de la entrevista bajo ninguna circunstancia\n- Si te hacen preguntas no relacionadas, responde: 'Disculpa, pero mi rol es específicamente realizar esta entrevista de relevamiento. No puedo ayudarte con temas fuera de este contexto. ¿Podemos continuar con la entrevista?'\n- Solo respondes preguntas muy específicas sobre el proceso de la entrevista misma si es necesario para que fluya la conversación",
                      greeting_prompt: "¡Hola! ¿Cómo estás?",
                      closing_prompt: "Muchas gracias por tu tiempo. ¡Que tengas un excelente día!",
                      context_instructions: "Mantén una conversación natural y fluida. Adapta tus preguntas según las respuestas del empleado.",
                    })
                  }}
                >
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
              <div className="text-3xl font-bold">{(agents || []).length}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {(agents || []).filter((a) => a.status === "ACTIVE").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Entrenamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">
                {(agents || []).filter((a) => a.status === "TRAINING").length}
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
          ) : paginatedAgents.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              {searchQuery ? "No se encontraron agentes" : "No hay agentes creados"}
            </div>
          ) : (
            paginatedAgents.map((agent) => (
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
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tono:</span>
                      <span className="font-medium">{agent.tone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Modelo:</span>
                      <span className="font-medium font-mono text-xs">{agent.model_config.model}</span>
                    </div>
                  </div>

                  {/* Preview del System Prompt */}
                  {agent.prompt_config?.system_prompt && (
                    <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3">
                      <div className="text-xs font-medium text-violet-400 mb-1">Prompt del Sistema:</div>
                      <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                        {agent.prompt_config.system_prompt}
                      </p>
                    </div>
                  )}

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
                        console.log("[DEBUG] Agente seleccionado:", agent)
                        setSelectedAgent(agent)
                        
                        const formData = {
                          name: agent.name || "",
                          description: agent.description || "",
                          section_id: agent.section_id || "",
                          tone: agent.tone || "PROFESSIONAL",
                          model: agent.model_config?.model || "gpt-4-turbo",
                          system_prompt: agent.prompt_config?.system_prompt || "",
                          greeting_prompt: agent.prompt_config?.greeting_prompt || "",
                          closing_prompt: agent.prompt_config?.closing_prompt || "",
                          context_instructions: agent.prompt_config?.context_instructions || "",
                        }
                        
                        console.log("[DEBUG] Form data a cargar:", formData)
                        setEditFormData(formData)
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
                      onClick={() => handleCloneAgent(agent.agent_id)}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Duplicar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setAgentToDelete(agent)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Paginación */}
        {!loading && filteredAgents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAgents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}

        {/* Modal de confirmación de eliminación */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar agente?</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar el agente <strong>{agentToDelete?.name}</strong>? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setAgentToDelete(null)
                }}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteAgent}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedAgent && (
          <Dialog 
            open={isEditDialogOpen} 
            onOpenChange={(open) => {
              setIsEditDialogOpen(open)
              if (!open) {
                setSelectedAgent(null)
              }
            }}
          >
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Configurar {selectedAgent.name}</DialogTitle>
                <DialogDescription>Modifica la configuración del agente conversacional</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6 overflow-y-auto flex-1 px-1">
                {/* Indicador de valores cargados */}
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <Bot className="h-4 w-4" />
                    <span className="font-medium">
                      Editando configuración existente - Los campos ya contienen los valores actuales
                    </span>
                  </div>
                </div>

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
                        <SelectValue placeholder="Selecciona una sección" />
                      </SelectTrigger>
                      <SelectContent>
                        {(sections || []).map((section) => (
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
                        <SelectValue placeholder="Selecciona un modelo" />
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
                      <SelectValue placeholder="Selecciona un tono" />
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
                  <div className="flex items-center justify-between">
                    <Label>Prompt del Sistema</Label>
                    <span className="text-xs text-muted-foreground">
                      {editFormData.system_prompt?.length || 0} caracteres
                    </span>
                  </div>
                  <Textarea
                    value={editFormData.system_prompt}
                    onChange={(e) => setEditFormData({ ...editFormData, system_prompt: e.target.value })}
                    placeholder="Define cómo debe comportarse el agente..."
                    className="min-h-[120px] max-h-[300px] resize-y font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Puedes ajustar la altura del campo arrastrando desde la esquina inferior derecha
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Prompt de Saludo</Label>
                    <span className="text-xs text-muted-foreground">
                      {editFormData.greeting_prompt?.length || 0} caracteres
                    </span>
                  </div>
                  <Textarea
                    value={editFormData.greeting_prompt}
                    onChange={(e) => setEditFormData({ ...editFormData, greeting_prompt: e.target.value })}
                    placeholder="¿Cómo debe saludar el agente?"
                    className="min-h-[80px] max-h-[200px] resize-y font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Prompt de Cierre</Label>
                    <span className="text-xs text-muted-foreground">
                      {editFormData.closing_prompt?.length || 0} caracteres
                    </span>
                  </div>
                  <Textarea
                    value={editFormData.closing_prompt}
                    onChange={(e) => setEditFormData({ ...editFormData, closing_prompt: e.target.value })}
                    placeholder="¿Cómo debe despedirse el agente?"
                    className="min-h-[80px] max-h-[200px] resize-y font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Instrucciones de Contexto</Label>
                    <span className="text-xs text-muted-foreground">
                      {editFormData.context_instructions?.length || 0} caracteres
                    </span>
                  </div>
                  <Textarea
                    value={editFormData.context_instructions}
                    onChange={(e) => setEditFormData({ ...editFormData, context_instructions: e.target.value })}
                    placeholder="Instrucciones adicionales sobre el contexto de la conversación..."
                    className="min-h-[100px] max-h-[250px] resize-y font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter className="flex-shrink-0 bg-background pt-6 pb-2 border-t">
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
