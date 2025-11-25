"use client"

import { useEffect, useState } from "react"
import { sectionsApi, type Section, type CreateSectionData } from "@/lib/services/sections"
import { agentsApi, type Agent } from "@/lib/services/agents"
import { configService } from "@/lib/services/config"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/page-header"
import { ProtectedRoute } from "@/components/protected-route"
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
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Edit, Trash2, Settings2, Building2, Key, Eye, EyeOff } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ConfiguracionPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)
  
  // Estados para API Keys
  const [apiKeys, setApiKeys] = useState({
    openai_api_key: "",
    whatsapp_access_token: "",
    whatsapp_phone_number_id: "",
    whatsapp_verify_token: "",
  })
  const [showKeys, setShowKeys] = useState({
    openai_api_key: false,
    whatsapp_access_token: false,
    whatsapp_phone_number_id: false,
    whatsapp_verify_token: false,
  })
  const [savingKeys, setSavingKeys] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
  })

  const [editFormData, setEditFormData] = useState({
    name: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    loadData()
    loadApiKeys()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [sectionsData, agentsData] = await Promise.all([
        sectionsApi.getAll(),
        agentsApi.getAll({ limit: 100 }),
      ])

      setSections(Array.isArray(sectionsData) ? sectionsData : [])
      setAgents(Array.isArray(agentsData.agents) ? agentsData.agents : [])
    } catch (error) {
      console.error("[v0] Error cargando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadApiKeys = async () => {
    try {
      const keys = await configService.getConfig()
      setApiKeys(keys)
    } catch (error) {
      console.error("[v0] Error cargando API keys:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las API keys",
        variant: "destructive",
      })
    }
  }

  const handleSaveApiKeys = async () => {
    try {
      setSavingKeys(true)
      await configService.updateConfig(apiKeys)
      toast({
        title: "Éxito",
        description: "API keys actualizadas. Reinicia el servidor para aplicar los cambios.",
      })
    } catch (error) {
      console.error("[v0] Error guardando API keys:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las API keys",
        variant: "destructive",
      })
    } finally {
      setSavingKeys(false)
    }
  }

  const handleCreateSection = async () => {
    try {
      if (!formData.name) {
        toast({
          title: "Error",
          description: "Por favor ingresa el nombre de la sección",
          variant: "destructive",
        })
        return
      }

      // Generar un ID único para la sección
      const sectionId = `sec-${formData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`

      const data: CreateSectionData = {
        section_id: sectionId,
        name: formData.name,
        admin_id: "admin-default", // TODO: usar admin real del contexto
      }

      const newSection = await sectionsApi.create(data)
      
      setSections([...(sections || []), newSection])
      setIsCreateDialogOpen(false)
      setFormData({ name: "" })

      toast({
        title: "Éxito",
        description: "Sección creada correctamente",
      })
    } catch (error: any) {
      console.error("Error creando sección:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo crear la sección",
        variant: "destructive",
      })
    }
  }

  const handleEditSection = async () => {
    if (!selectedSection) return

    try {
      const data = {
        name: editFormData.name,
      }

      const updated = await sectionsApi.update(selectedSection.section_id, data)
      setSections(
        Array.isArray(sections)
          ? sections.map((s) => (s.section_id === selectedSection.section_id ? updated : s))
          : [updated]
      )
      setIsEditDialogOpen(false)
      setSelectedSection(null)

      toast({
        title: "Éxito",
        description: "Sección actualizada correctamente",
      })
    } catch (error) {
      console.error("[v0] Error actualizando sección:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la sección",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (section: Section) => {
    setSelectedSection(section)
    setEditFormData({
      name: section.name,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (sectionId: string) => {
    setSectionToDelete(sectionId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return

    try {
      await sectionsApi.delete(sectionToDelete)
      setSections(Array.isArray(sections) ? sections.filter((s) => s.section_id !== sectionToDelete) : [])
      setDeleteDialogOpen(false)
      setSectionToDelete(null)
      
      toast({
        title: "Sección eliminada",
        description: "La sección ha sido eliminada correctamente",
      })
    } catch (error) {
      console.error("[v0] Error eliminando sección:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la sección",
        variant: "destructive",
      })
    }
  }

  const getAssignedAgentsCount = (sectionId: string) => {
    return (agents || []).filter((a) => a.section_id === sectionId).length
  }

  const filteredSections = Array.isArray(sections)
    ? sections.filter((section) => {
        if (!section || !section.name) return false
        return section.name.toLowerCase().includes(searchQuery.toLowerCase())
      })
    : []

  return (
    <ProtectedRoute requireAdmin={true}>
      <PageHeader
        title="Configuración"
        description="Gestiona las secciones y configuraciones del sistema"
      />

      <Tabs defaultValue="sections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="sections" className="gap-2">
            <Building2 className="h-4 w-4" />
            Secciones
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* Tab de Secciones */}
        <TabsContent value="sections" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Gestión de Secciones</CardTitle>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nueva Sección
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Sección</DialogTitle>
                    <DialogDescription>
                      Completa el formulario para crear una nueva sección organizacional
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="section-name">Nombre de la Sección</Label>
                      <Input
                        id="section-name"
                        placeholder="Ej: Tecnología, Recursos Humanos, Ventas"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Podrás asignar el agente IA después de crear la sección
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateSection}>Crear Sección</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar secciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando secciones...</div>
              ) : filteredSections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No se encontraron secciones" : "No hay secciones creadas"}
                </div>
              ) : (
                <div className="rounded-md border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Entrevistas</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSections.map((section) => (
                        <TableRow key={section.section_id}>
                          <TableCell className="font-medium">{section.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{section.interviews_configured.length}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                section.status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                              }
                            >
                              {section.status === "ACTIVE" ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(section)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(section.section_id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Secciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Array.isArray(sections) ? sections.length : 0}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Secciones Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {Array.isArray(sections) ? sections.filter((s) => s.status === "ACTIVE").length : 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Agentes Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-violet-400">
                {Array.isArray(agents) ? agents.length : 0}
              </div>
            </CardContent>
          </Card>
        </div>
        </TabsContent>

        {/* Tab de API Keys */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>Configuración de API Keys</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Gestiona las claves de API necesarias para el funcionamiento del sistema
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OpenAI API Key */}
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <p className="text-xs text-muted-foreground">
                  Requerida para la generación de respuestas y análisis con IA
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="openai-key"
                      type={showKeys.openai_api_key ? "text" : "password"}
                      placeholder="sk-..."
                      value={apiKeys.openai_api_key}
                      onChange={(e) =>
                        setApiKeys({ ...apiKeys, openai_api_key: e.target.value })
                      }
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, openai_api_key: !showKeys.openai_api_key })}
                    >
                      {showKeys.openai_api_key ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* WhatsApp Access Token */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp-token">WhatsApp Access Token</Label>
                <p className="text-xs text-muted-foreground">
                  Token de acceso para la API de WhatsApp Business
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="whatsapp-token"
                      type={showKeys.whatsapp_access_token ? "text" : "password"}
                      placeholder="EAAxxxxxxxx..."
                      value={apiKeys.whatsapp_access_token}
                      onChange={(e) => setApiKeys({ ...apiKeys, whatsapp_access_token: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys({ ...showKeys, whatsapp_access_token: !showKeys.whatsapp_access_token })}
                    >
                      {showKeys.whatsapp_access_token ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* WhatsApp Phone Number ID */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp-phone">WhatsApp Phone Number ID</Label>
                <p className="text-xs text-muted-foreground">
                  ID del número de teléfono de WhatsApp Business
                </p>
                <Input
                  id="whatsapp-phone"
                  type="text"
                  placeholder="123456789012345"
                  value={apiKeys.whatsapp_phone_number_id}
                  onChange={(e) => setApiKeys({ ...apiKeys, whatsapp_phone_number_id: e.target.value })}
                />
              </div>

              {/* WhatsApp Verify Token */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp-verify">WhatsApp Verify Token</Label>
                <p className="text-xs text-muted-foreground">
                  Token de verificación para el webhook de WhatsApp
                </p>
                <div className="relative">
                  <Input
                    id="whatsapp-verify"
                    type={showKeys.whatsapp_verify_token ? "text" : "password"}
                    placeholder="mi_token_secreto..."
                    value={apiKeys.whatsapp_verify_token}
                    onChange={(e) => setApiKeys({ ...apiKeys, whatsapp_verify_token: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowKeys({ ...showKeys, whatsapp_verify_token: !showKeys.whatsapp_verify_token })}
                  >
                    {showKeys.whatsapp_verify_token ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={handleSaveApiKeys}
                  disabled={savingKeys}
                >
                  {savingKeys ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sección</DialogTitle>
            <DialogDescription>
              Modifica los datos de la sección
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-section-name">Nombre de la Sección</Label>
              <Input
                id="edit-section-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSection}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la sección.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}
