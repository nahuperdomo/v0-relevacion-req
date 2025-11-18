"use client"

import { useEffect, useState } from "react"
import { employeesApi, type Employee, type CreateEmployeeData } from "@/lib/services/employees"
import { sectionsApi, type Section, type CreateSectionData } from "@/lib/services/sections"
import { agentsApi, type Agent } from "@/lib/services/agents"
import { useToast } from "@/hooks/use-toast"
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
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Edit, Trash2, Building2, Users } from "lucide-react"

const statusColors = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INACTIVE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  ON_LEAVE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  TERMINATED: "bg-red-500/10 text-red-400 border-red-500/20",
}

const statusLabels = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ON_LEAVE: "De Licencia",
  TERMINATED: "Desvinculado",
}

export default function EmpleadosPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateEmployeeDialogOpen, setIsCreateEmployeeDialogOpen] = useState(false)
  const [isCreateSectionDialogOpen, setIsCreateSectionDialogOpen] = useState(false)
  const [isEditEmployeeDialogOpen, setIsEditEmployeeDialogOpen] = useState(false)
  const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const { toast } = useToast()

  // Form states
  const [employeeFormData, setEmployeeFormData] = useState({
    name: "",
    section_id: "",
    job_id: "",
    whatsapp_number: "",
    email: "",
  })

  const [sectionFormData, setSectionFormData] = useState({
    name: "",
    agent_id: "",
    admin_id: typeof window !== "undefined" ? localStorage.getItem("admin_id") || "admin-default" : "admin-default",
  })

  const [editEmployeeFormData, setEditEmployeeFormData] = useState({
    name: "",
    section_id: "",
    job_id: "",
    whatsapp_number: "",
    email: "",
  })

  const [editSectionFormData, setEditSectionFormData] = useState({
    name: "",
    agent_id: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [employeesData, sectionsData, agentsData] = await Promise.all([
        employeesApi.getAll({ limit: 100 }),
        sectionsApi.getAll(),
        agentsApi.getAll({ limit: 100 }),
      ])

      setEmployees(employeesData.employees)
      setSections(Array.isArray(sectionsData) ? sectionsData : [])
      setAgents(agentsData.agents)
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

  const handleCreateEmployee = async () => {
    try {
      if (!employeeFormData.name || !employeeFormData.section_id || !employeeFormData.whatsapp_number) {
        toast({
          title: "Error de validación",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        })
        return
      }

      // Generar un ID único para el empleado
      const employeeId = `emp-${employeeFormData.name.toLowerCase().replace(/\s+/g, '-').substring(0, 10)}-${Date.now().toString(36)}`

      const data: CreateEmployeeData = {
        employee_id: employeeId,
        name: employeeFormData.name,
        section_id: employeeFormData.section_id,
        job_id: employeeFormData.job_id || `job-${Date.now().toString(36)}`,
        contact_info: {
          whatsapp_number: employeeFormData.whatsapp_number,
          email: employeeFormData.email,
        },
        interviews_assigned: [],
        status: "ACTIVE",
      }

      const newEmployee = await employeesApi.create(data)
      setEmployees([...employees, newEmployee])
      setIsCreateEmployeeDialogOpen(false)

      // Reset form
      setEmployeeFormData({
        name: "",
        section_id: "",
        job_id: "",
        whatsapp_number: "",
        email: "",
      })

      toast({
        title: "Éxito",
        description: "Empleado registrado correctamente",
      })
    } catch (error) {
      console.error("[v0] Error creando empleado:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el empleado",
        variant: "destructive",
      })
    }
  }

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return

    try {
      const data: Partial<CreateEmployeeData> = {
        name: editEmployeeFormData.name,
        section_id: editEmployeeFormData.section_id,
        job_id: editEmployeeFormData.job_id,
        contact_info: {
          whatsapp_number: editEmployeeFormData.whatsapp_number,
          email: editEmployeeFormData.email,
        },
      }

      const updated = await employeesApi.update(selectedEmployee.employee_id, data)
      setEmployees((employees || []).map((e) => (e.employee_id === selectedEmployee.employee_id ? updated : e)))
      setIsEditEmployeeDialogOpen(false)
      setSelectedEmployee(null)

      toast({
        title: "Éxito",
        description: "Empleado actualizado correctamente",
      })
    } catch (error) {
      console.error("[v0] Error actualizando empleado:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el empleado",
        variant: "destructive",
      })
    }
  }

  const handleCreateSection = async () => {
    try {
      if (!sectionFormData.name) {
        toast({
          title: "Error de validación",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        })
        return
      }

      const data: CreateSectionData = {
        name: sectionFormData.name,
        admin_id: sectionFormData.admin_id,
        interviews_configured: [],
      }

      const newSection = await sectionsApi.create(data)
      setSections([...sections, newSection])
      setIsCreateSectionDialogOpen(false)

      // Reset form
      setSectionFormData({
        name: "",
        agent_id: "",
        admin_id: typeof window !== "undefined" ? localStorage.getItem("admin_id") || "admin-default" : "admin-default",
      })

      toast({
        title: "Éxito",
        description: "Sección creada correctamente",
      })
    } catch (error) {
      console.error("[v0] Error creando sección:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la sección",
        variant: "destructive",
      })
    }
  }

  const handleUpdateSection = async () => {
    if (!selectedSection) return

    try {
      const data: Partial<CreateSectionData> = {
        name: editSectionFormData.name,
      }

      const updated = await sectionsApi.update(selectedSection.section_id, data)
      setSections(Array.isArray(sections) ? sections.map((s) => (s.section_id === selectedSection.section_id ? updated : s)) : [updated])
      setIsEditSectionDialogOpen(false)
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

  const handleDeleteEmployee = async (id: string) => {
    try {
      await employeesApi.delete(id)
      setEmployees((employees || []).filter((e) => e.employee_id !== id))
      toast({
        title: "Empleado eliminado",
        description: "El empleado ha sido dado de baja",
      })
    } catch (error) {
      console.error("[v0] Error eliminando empleado:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el empleado",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSection = async (id: string) => {
    try {
      await sectionsApi.delete(id)
      setSections(Array.isArray(sections) ? sections.filter((s) => s.section_id !== id) : [])
      toast({
        title: "Sección eliminada",
        description: "La sección ha sido eliminada",
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

  const filteredEmployees = (employees || []).filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.section_id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredSections = Array.isArray(sections) ? sections.filter((section) => section.name.toLowerCase().includes(searchQuery.toLowerCase())) : []

  const getSectionName = (sectionId: string) => {
    return Array.isArray(sections) ? sections.find((s) => s.section_id === sectionId)?.name || sectionId : sectionId
  }

  return (
    <>
      <PageHeader
        title="Gestión de Empleados y Secciones"
        description="Administra empleados y las secciones organizacionales"
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4" />
              Empleados
            </TabsTrigger>
            <TabsTrigger value="sections" className="gap-2">
              <Building2 className="h-4 w-4" />
              Secciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar empleados..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Dialog open={isCreateEmployeeDialogOpen} onOpenChange={setIsCreateEmployeeDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Empleado
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Nuevo Empleado</DialogTitle>
                    <DialogDescription>
                      Completa el formulario para registrar un nuevo empleado en el sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee-name">Nombre Completo</Label>
                      <Input
                        id="employee-name"
                        placeholder="Ej: Juan Pérez"
                        value={employeeFormData.name}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employee-section">Sección</Label>
                      <Select
                        value={employeeFormData.section_id}
                        onValueChange={(value) => setEmployeeFormData({ ...employeeFormData, section_id: value })}
                      >
                        <SelectTrigger id="employee-section">
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
                      <Label htmlFor="employee-email">Email</Label>
                      <Input
                        id="employee-email"
                        placeholder="juan@empresa.com"
                        type="email"
                        value={employeeFormData.email}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employee-whatsapp">Número de WhatsApp</Label>
                      <Input
                        id="employee-whatsapp"
                        placeholder="+5491122233344"
                        type="tel"
                        value={employeeFormData.whatsapp_number}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, whatsapp_number: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateEmployeeDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateEmployee}>Registrar Empleado</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Empleados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{(employees || []).length}</div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-400">
                    {(employees || []).filter((e) => e.status === "ACTIVE").length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Con Entrevistas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-violet-400">
                    {(employees || []).filter((e) => e.interviews_assigned.length > 0).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Secciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Array.isArray(sections) ? sections.length : 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Listado de Empleados</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando empleados...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-muted/5">
                        <TableHead>Nombre</TableHead>
                        <TableHead>Sección</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Última Entrevista</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.employee_id} className="border-border/50 hover:bg-muted/5">
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{getSectionName(employee.section_id)}</TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {employee.contact_info.whatsapp_number}
                          </TableCell>
                          <TableCell>
                            {employee.interviews_assigned.length > 0 ? (
                              <span className="text-sm text-muted-foreground">{employee.interviews_assigned[0]}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground/50">Sin entrevistas</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[employee.status]}>
                              {statusLabels[employee.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setEditEmployeeFormData({
                                    name: employee.name,
                                    section_id: employee.section_id,
                                    job_id: employee.job_id,
                                    whatsapp_number: employee.contact_info.whatsapp_number,
                                    email: employee.contact_info.email || "",
                                  })
                                  setIsEditEmployeeDialogOpen(true)
                                }}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEmployee(employee.employee_id)}
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
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar secciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Dialog open={isCreateSectionDialogOpen} onOpenChange={setIsCreateSectionDialogOpen}>
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
                        placeholder="Ej: Tecnología"
                        value={sectionFormData.name}
                        onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="section-agent">Agente IA Asignado</Label>
                      <Select
                        value={sectionFormData.agent_id}
                        onValueChange={(value) => setSectionFormData({ ...sectionFormData, agent_id: value })}
                      >
                        <SelectTrigger id="section-agent">
                          <SelectValue placeholder="Selecciona un agente" />
                        </SelectTrigger>
                        <SelectContent>
                          {(agents || []).map((agent) => (
                            <SelectItem key={agent.agent_id} value={agent.agent_id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateSectionDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateSection}>Crear Sección</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {loading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">Cargando secciones...</div>
              ) : (
                filteredSections.map((section) => (
                  <Card key={section.section_id} className="border-border/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-violet-400" />
                          <CardTitle className="text-lg">{section.name}</CardTitle>
                        </div>
                        <Badge variant="outline" className={statusColors[section.status]}>
                          {statusLabels[section.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Agentes Asignados:</span>
                          <span className="font-medium">
                            {(agents || []).filter((a) => a.section_id === section.section_id).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Empleados:</span>
                          <span className="font-medium text-emerald-400">
                            {(employees || []).filter((e) => e.section_id === section.section_id).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entrevistas:</span>
                          <span className="font-medium text-violet-400">{section.interviews_configured.length}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            setSelectedSection(section)
                            setEditSectionFormData({
                              name: section.name,
                              agent_id: "",
                            })
                            setIsEditSectionDialogOpen(true)
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleDeleteSection(section.section_id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Employee Dialog */}
        {selectedEmployee && (
          <Dialog open={isEditEmployeeDialogOpen} onOpenChange={setIsEditEmployeeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Empleado</DialogTitle>
                <DialogDescription>Actualiza la información del empleado</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-employee-name">Nombre Completo</Label>
                  <Input
                    id="edit-employee-name"
                    value={editEmployeeFormData.name}
                    onChange={(e) => setEditEmployeeFormData({ ...editEmployeeFormData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-employee-section">Sección</Label>
                  <Select
                    value={editEmployeeFormData.section_id}
                    onValueChange={(value) => setEditEmployeeFormData({ ...editEmployeeFormData, section_id: value })}
                  >
                    <SelectTrigger id="edit-employee-section">
                      <SelectValue />
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
                  <Label htmlFor="edit-employee-email">Email</Label>
                  <Input
                    id="edit-employee-email"
                    type="email"
                    value={editEmployeeFormData.email}
                    onChange={(e) => setEditEmployeeFormData({ ...editEmployeeFormData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-employee-whatsapp">Número de WhatsApp</Label>
                  <Input
                    id="edit-employee-whatsapp"
                    type="tel"
                    value={editEmployeeFormData.whatsapp_number}
                    onChange={(e) =>
                      setEditEmployeeFormData({ ...editEmployeeFormData, whatsapp_number: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditEmployeeDialogOpen(false)
                    setSelectedEmployee(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateEmployee}>Guardar Cambios</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Section Dialog */}
        {selectedSection && (
          <Dialog open={isEditSectionDialogOpen} onOpenChange={setIsEditSectionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Sección</DialogTitle>
                <DialogDescription>Actualiza la configuración de la sección</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-section-name">Nombre de la Sección</Label>
                  <Input
                    id="edit-section-name"
                    value={editSectionFormData.name}
                    onChange={(e) => setEditSectionFormData({ ...editSectionFormData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-section-agent">Agente IA Asignado</Label>
                  <Select
                    value={editSectionFormData.agent_id}
                    onValueChange={(value) => setEditSectionFormData({ ...editSectionFormData, agent_id: value })}
                  >
                    <SelectTrigger id="edit-section-agent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(agents || []).map((agent) => (
                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditSectionDialogOpen(false)
                    setSelectedSection(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateSection}>Guardar Cambios</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </>
  )
}
