"use client"

import { useEffect, useState } from "react"
import { agentsApi, type Agent } from "@/lib/services/agents"
import { sectionsApi, type Section } from "@/lib/services/sections"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Bot, MessageSquare, Zap, Edit, Trash2 } from "lucide-react"
import {
  DataTable,
  Column,
  FormDialog,
  FormField,
  StatusBadge,
  STATUS_CONFIGS,
  LoadingState,
  EmptyState,
  ActionButtons,
  commonActions,
} from "@/components/common"
import { useCrud } from "@/hooks/use-api"
import { useForm, validators } from "@/hooks/use-form"
import { usePaginatedFilter } from "@/hooks/use-pagination"

const MODEL_OPTIONS = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
]

const TONE_OPTIONS = [
  { value: "FORMAL", label: "Formal" },
  { value: "CASUAL", label: "Casual" },
  { value: "FRIENDLY", label: "Amigable" },
  { value: "PROFESSIONAL", label: "Profesional" },
  { value: "EMPATHETIC", label: "Empático" },
]

export default function AgentesPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { data: agents, selectedItem, setSelectedItem, loading, loadAll, create, update, remove } = useCrud<Agent>()

  const { query, setQuery, currentData, currentPage, totalPages, goToPage } = usePaginatedFilter(
    agents,
    (agent, query) => {
      const searchLower = query.toLowerCase()
      return (
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description?.toLowerCase().includes(searchLower) ||
        agent.agent_id.toLowerCase().includes(searchLower)
      )
    },
    { initialLimit: 10 }
  )

  const createForm = useForm(
    {
      name: "",
      description: "",
      section_id: "",
      tone: "PROFESSIONAL" as "FORMAL" | "CASUAL" | "FRIENDLY" | "PROFESSIONAL" | "EMPATHETIC",
      model: "gpt-4-turbo",
      embedding_profile: "",
      system_prompt: "",
    },
    {
      name: validators.required("El nombre es requerido"),
      section_id: validators.required("La sección es requerida"),
      embedding_profile: validators.required("El perfil de embedding es requerido"),
    }
  )

  const editForm = useForm(
    {
      name: "",
      description: "",
      section_id: "",
      tone: "PROFESSIONAL" as "FORMAL" | "CASUAL" | "FRIENDLY" | "PROFESSIONAL" | "EMPATHETIC",
      model: "gpt-4-turbo",
      embedding_profile: "",
      system_prompt: "",
      greeting_prompt: "",
      closing_prompt: "",
      context_instructions: "",
    },
    {
      name: validators.required("El nombre es requerido"),
      section_id: validators.required("La sección es requerida"),
      embedding_profile: validators.required("El perfil de embedding es requerido"),
    }
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await loadAll(async () => {
      const [agentsData, sectionsData] = await Promise.all([
        agentsApi.getAll({ limit: 100 }),
        sectionsApi.getAll(),
      ])
      setSections(sectionsData)
      return agentsData
    })
  }

  const handleCreateAgent = async () => {
    if (!createForm.validate()) return

    const agentId = `agt-${createForm.formData.section_id}-${Date.now()}`

    await create(
      () =>
        agentsApi.create({
          agent_id: agentId,
          name: createForm.formData.name,
          description: createForm.formData.description,
          tone: createForm.formData.tone,
          embedding_profile: createForm.formData.embedding_profile,
          section_id: createForm.formData.section_id,
          prompt_config: {
            system_prompt: createForm.formData.system_prompt || "Eres un asistente conversacional profesional.",
            greeting_prompt: "¡Hola! ¿Cómo estás?",
            closing_prompt: "Gracias por tu tiempo.",
            context_instructions: "Mantén una conversación natural y enfocada.",
          },
          model_config: {
            model: createForm.formData.model,
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 0.9,
          },
          specialties: [],
        }),
      "Agente creado correctamente"
    )

    setIsCreateDialogOpen(false)
    createForm.reset()
  }

  const handleUpdateAgent = async () => {
    if (!selectedItem || !editForm.validate()) return

    await update(
      selectedItem.agent_id,
      () =>
        agentsApi.update(selectedItem.agent_id, {
          name: editForm.formData.name,
          description: editForm.formData.description,
          tone: editForm.formData.tone,
          embedding_profile: editForm.formData.embedding_profile,
          section_id: editForm.formData.section_id,
          prompt_config: {
            system_prompt: editForm.formData.system_prompt,
            greeting_prompt: editForm.formData.greeting_prompt,
            closing_prompt: editForm.formData.closing_prompt,
            context_instructions: editForm.formData.context_instructions,
          },
          model_config: selectedItem.model_config,
          specialties: selectedItem.specialties,
        }),
      "Agente actualizado correctamente"
    )

    setIsEditDialogOpen(false)
    setSelectedItem(null)
  }

  const handleDeleteAgent = async (agent: Agent) => {
    if (!confirm(`¿Estás seguro de eliminar el agente "${agent.name}"?`)) return

    await remove(agent.agent_id, () => agentsApi.delete(agent.agent_id), "Agente eliminado correctamente")
  }

  const openEditDialog = (agent: Agent) => {
    setSelectedItem(agent)
    editForm.setValues({
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
  }

  const columns: Column<Agent>[] = [
    {
      key: "name",
      header: "Nombre",
      cell: (agent) => (
        <div>
          <div className="font-medium">{agent.name}</div>
          <div className="text-xs text-muted-foreground">{agent.agent_id}</div>
        </div>
      ),
    },
    {
      key: "section_id",
      header: "Sección",
      cell: (agent) => sections.find((s) => s.section_id === agent.section_id)?.name || agent.section_id,
    },
    {
      key: "tone",
      header: "Tono",
    },
    {
      key: "status",
      header: "Estado",
      cell: (agent) => <StatusBadge status={agent.status} statusConfig={STATUS_CONFIGS.agent} />,
    },
    {
      key: "assigned_interviews_count",
      header: "Entrevistas",
    },
    {
      key: "actions",
      header: "Acciones",
      cell: (agent) => (
        <ActionButtons
          actions={[
            commonActions.edit(() => openEditDialog(agent)),
            commonActions.delete(() => handleDeleteAgent(agent)),
          ]}
        />
      ),
    },
  ]

  const createFields: FormField[] = [
    { name: "name", label: "Nombre", type: "text", required: true, placeholder: "Agente de Ventas" },
    { name: "description", label: "Descripción", type: "textarea", placeholder: "Descripción del agente..." },
    {
      name: "section_id",
      label: "Sección",
      type: "select",
      required: true,
      options: sections.map((s) => ({ value: s.section_id, label: s.name })),
    },
    {
      name: "tone",
      label: "Tono",
      type: "select",
      required: true,
      options: TONE_OPTIONS,
    },
    {
      name: "model",
      label: "Modelo",
      type: "select",
      required: true,
      options: MODEL_OPTIONS,
    },
    {
      name: "embedding_profile",
      label: "Perfil de Embedding",
      type: "text",
      required: true,
      placeholder: "profile-name",
    },
    {
      name: "system_prompt",
      label: "Prompt del Sistema",
      type: "textarea",
      placeholder: "Eres un asistente conversacional...",
    },
  ]

  const editFields: FormField[] = [
    ...createFields,
    { name: "greeting_prompt", label: "Prompt de Saludo", type: "textarea" },
    { name: "closing_prompt", label: "Prompt de Cierre", type: "textarea" },
    { name: "context_instructions", label: "Instrucciones de Contexto", type: "textarea" },
  ]

  if (loading && agents.length === 0) {
    return <LoadingState message="Cargando agentes..." />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        title="Agentes IA"
        description="Gestiona los agentes conversacionales del sistema"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agentes</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.filter((a) => a.status === "ACTIVE").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.reduce((sum, a) => sum + a.total_conversations, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Agentes</CardTitle>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Agente
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar agentes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <DataTable
              data={currentData}
              columns={columns}
              loading={loading}
              emptyMessage="No hay agentes registrados"
              emptyDescription="Comienza creando tu primer agente IA"
              keyExtractor={(agent) => agent.agent_id}
              pagination={{
                currentPage,
                totalPages,
                onPageChange: goToPage,
              }}
            />
          </CardContent>
        </Card>
      </main>

      {/* Create Dialog */}
      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Crear Nuevo Agente"
        description="Configura un nuevo agente conversacional"
        fields={createFields}
        formData={createForm.formData}
        onFieldChange={(name, value) => createForm.handleChange(name as any, value)}
        onSubmit={handleCreateAgent}
        loading={loading}
        submitLabel="Crear Agente"
      />

      {/* Edit Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) setSelectedItem(null)
        }}
        title="Editar Agente"
        description="Modifica la configuración del agente"
        fields={editFields}
        formData={editForm.formData}
        onFieldChange={(name, value) => editForm.handleChange(name as any, value)}
        onSubmit={handleUpdateAgent}
        loading={loading}
        submitLabel="Guardar Cambios"
      />
    </div>
  )
}
