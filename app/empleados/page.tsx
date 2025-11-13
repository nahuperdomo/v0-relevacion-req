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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Edit, Trash2, Building2, Users } from "lucide-react"

interface Employee {
  id: string
  name: string
  section_id: string
  section_name: string
  whatsapp: string
  last_interview: string | null
  status: "ACTIVE" | "INACTIVE"
  created_at: string
}

interface Section {
  id: string
  name: string
  agent_id: string
  agent_name: string
  employee_count: number
  interviews_count: number
  status: "ACTIVE" | "INACTIVE"
  created_at: string
}

const mockSections: Section[] = [
  {
    id: "sec-IT",
    name: "Tecnología",
    agent_id: "agt-it-001",
    agent_name: "Agente IT",
    employee_count: 15,
    interviews_count: 3,
    status: "ACTIVE",
    created_at: "2025-11-12T09:10:00Z",
  },
  {
    id: "sec-RRHH",
    name: "Recursos Humanos",
    agent_id: "agt-rrhh-001",
    agent_name: "Agente RRHH",
    employee_count: 8,
    interviews_count: 5,
    status: "ACTIVE",
    created_at: "2025-11-12T09:15:00Z",
  },
  {
    id: "sec-CONT",
    name: "Contabilidad",
    agent_id: "agt-cont-001",
    agent_name: "Agente Contable",
    employee_count: 6,
    interviews_count: 2,
    status: "ACTIVE",
    created_at: "2025-11-12T09:20:00Z",
  },
  {
    id: "sec-SALES",
    name: "Ventas",
    agent_id: "agt-sales-001",
    agent_name: "Agente Ventas",
    employee_count: 12,
    interviews_count: 1,
    status: "ACTIVE",
    created_at: "2025-11-12T09:25:00Z",
  },
]

const mockEmployees: Employee[] = [
  {
    id: "emp-101",
    name: "Juan Pérez",
    section_id: "sec-IT",
    section_name: "Tecnología",
    whatsapp: "+5491122233344",
    last_interview: "int-it-002",
    status: "ACTIVE",
    created_at: "2025-11-12T09:20:00Z",
  },
  {
    id: "emp-102",
    name: "María García",
    section_id: "sec-IT",
    section_name: "Tecnología",
    whatsapp: "+5491122233355",
    last_interview: "int-it-002",
    status: "ACTIVE",
    created_at: "2025-11-12T09:25:00Z",
  },
  {
    id: "emp-103",
    name: "Carlos López",
    section_id: "sec-RRHH",
    section_name: "Recursos Humanos",
    whatsapp: "+5491122233366",
    last_interview: "int-rrhh-001",
    status: "ACTIVE",
    created_at: "2025-11-12T09:30:00Z",
  },
  {
    id: "emp-104",
    name: "Ana Martínez",
    section_id: "sec-CONT",
    section_name: "Contabilidad",
    whatsapp: "+5491122233377",
    last_interview: null,
    status: "ACTIVE",
    created_at: "2025-11-12T09:35:00Z",
  },
  {
    id: "emp-105",
    name: "Roberto Sánchez",
    section_id: "sec-SALES",
    section_name: "Ventas",
    whatsapp: "+5491122233388",
    last_interview: null,
    status: "ACTIVE",
    created_at: "2025-11-12T09:40:00Z",
  },
]

const statusColors = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INACTIVE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

const statusLabels = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
}

export default function EmpleadosPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [sections, setSections] = useState<Section[]>(mockSections)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateEmployeeDialogOpen, setIsCreateEmployeeDialogOpen] = useState(false)
  const [isCreateSectionDialogOpen, setIsCreateSectionDialogOpen] = useState(false)

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.section_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredSections = sections.filter((section) => section.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee-name">Nombre Completo</Label>
                      <Input id="employee-name" placeholder="Ej: Juan Pérez" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employee-section">Sección</Label>
                      <Select>
                        <SelectTrigger id="employee-section">
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
                      <Label htmlFor="employee-whatsapp">Número de WhatsApp</Label>
                      <Input id="employee-whatsapp" placeholder="+5491122233344" type="tel" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateEmployeeDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsCreateEmployeeDialogOpen(false)}>Registrar Empleado</Button>
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
                  <div className="text-3xl font-bold">{employees.length}</div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-400">
                    {employees.filter((e) => e.status === "ACTIVE").length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Con Entrevistas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-violet-400">
                    {employees.filter((e) => e.last_interview !== null).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Secciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sections.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Listado de Empleados</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <TableRow key={employee.id} className="border-border/50 hover:bg-muted/5">
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.section_name}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{employee.whatsapp}</TableCell>
                        <TableCell>
                          {employee.last_interview ? (
                            <span className="text-sm text-muted-foreground">{employee.last_interview}</span>
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
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="section-name">Nombre de la Sección</Label>
                      <Input id="section-name" placeholder="Ej: Tecnología" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="section-agent">Agente IA Asignado</Label>
                      <Select>
                        <SelectTrigger id="section-agent">
                          <SelectValue placeholder="Selecciona un agente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agt-it-001">Agente IT</SelectItem>
                          <SelectItem value="agt-rrhh-001">Agente RRHH</SelectItem>
                          <SelectItem value="agt-cont-001">Agente Contable</SelectItem>
                          <SelectItem value="agt-sales-001">Agente Ventas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateSectionDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsCreateSectionDialogOpen(false)}>Crear Sección</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {filteredSections.map((section) => (
                <Card key={section.id} className="border-border/50">
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
                        <span className="text-muted-foreground">Agente:</span>
                        <span className="font-medium">{section.agent_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Empleados:</span>
                        <span className="font-medium text-emerald-400">{section.employee_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entrevistas:</span>
                        <span className="font-medium text-violet-400">{section.interviews_count}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
