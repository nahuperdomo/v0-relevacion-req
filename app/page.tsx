"use client"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Users,
  MessageSquare,
  Bot,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Settings,
} from "lucide-react"
import { useEffect, useState } from "react"
import { interviewsApi, type InterviewStats } from "@/lib/services/interviews"
import { employeesApi } from "@/lib/services/employees"
import { agentsApi, type AgentStats } from "@/lib/services/agents"

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    interviews?: InterviewStats
    agents?: AgentStats
    employeesCount?: number
  }>({})
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setConnectionError(null)
        const [interviewStats, agentStats, employeesData] = await Promise.all([
          interviewsApi.getStats(),
          agentsApi.getStats(),
          employeesApi.getAll({ limit: 1 }),
        ])

        setStats({
          interviews: interviewStats,
          agents: agentStats,
          employeesCount: employeesData.total,
        })
      } catch (error: any) {
        console.error("[v0] Error cargando datos del dashboard:", error)
        setConnectionError(error.message || "Error al cargar los datos")

        setStats({
          interviews: {
            total_interviews: 8,
            active_interviews: 3,
            completed_interviews: 4,
            total_responses: 127,
          },
          agents: {
            total_agents: 5,
            active_agents: 4,
            avg_response_time: 2.3,
          },
          employeesCount: 143,
        })
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Vista general del sistema de relevamiento"
        action={{
          label: "Nueva Entrevista",
          onClick: () => console.log("Nueva entrevista"),
        }}
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        {connectionError && (
          <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
            <WifiOff className="h-5 w-5 text-amber-400" />
            <AlertTitle className="text-amber-400 font-semibold">Backend no conectado</AlertTitle>
            <AlertDescription className="text-amber-200/90 mt-2 space-y-3">
              <p>
                No se puede conectar al servidor API. La interfaz está funcionando con datos de ejemplo para que puedas
                explorar el diseño.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <p className="font-medium text-amber-300">Para conectar con tu backend:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Abre el sidebar del chat y ve a la sección "Vars"</li>
                  <li>
                    Agrega la variable de entorno:{" "}
                    <code className="bg-background/50 px-1.5 py-0.5 rounded text-amber-100">NEXT_PUBLIC_API_URL</code>
                  </li>
                  <li>
                    Configura el valor con la URL de tu backend (ej:{" "}
                    <code className="bg-background/50 px-1.5 py-0.5 rounded text-amber-100">
                      http://localhost:8000/api/v1
                    </code>
                    )
                  </li>
                  <li>Asegúrate de que tu servidor backend esté ejecutándose</li>
                </ol>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-amber-400/50 hover:bg-amber-400/20 text-amber-300 bg-transparent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Ver guía de configuración
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Entrevistas Activas"
            value={loading ? "-" : stats.interviews?.active_interviews || 0}
            description="En progreso"
            icon={MessageSquare}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatsCard
            title="Empleados Totales"
            value={loading ? "-" : stats.employeesCount || 0}
            description="Registrados en el sistema"
            icon={Users}
          />
          <StatsCard
            title="Agentes IA"
            value={loading ? "-" : stats.agents?.active_agents || 0}
            description="Configurados y activos"
            icon={Bot}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Total Respuestas"
            value={loading ? "-" : stats.interviews?.total_responses || 0}
            description="Recolectadas"
            icon={TrendingUp}
            trend={{ value: 3.1, isPositive: true }}
          />
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Interviews */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Entrevistas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: "int-it-002",
                    title: "Cuellos de Botella en IT",
                    section: "Tecnología",
                    status: "in_progress",
                    responses: 12,
                    total: 18,
                  },
                  {
                    id: "int-rrhh-001",
                    title: "Procesos de Onboarding",
                    section: "RRHH",
                    status: "completed",
                    responses: 24,
                    total: 24,
                  },
                  {
                    id: "int-cont-003",
                    title: "Automatización Contable",
                    section: "Contabilidad",
                    status: "in_progress",
                    responses: 8,
                    total: 15,
                  },
                  {
                    id: "int-mkt-004",
                    title: "Eficiencia en Campañas",
                    section: "Marketing",
                    status: "pending",
                    responses: 0,
                    total: 20,
                  },
                ].map((interview) => (
                  <div
                    key={interview.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        {interview.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-accent" />
                        ) : interview.status === "in_progress" ? (
                          <Activity className="h-5 w-5 text-primary" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{interview.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {interview.section} • {interview.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-card-foreground">
                          {interview.responses}/{interview.total}
                        </p>
                        <p className="text-xs text-muted-foreground">respuestas</p>
                      </div>
                      <Badge
                        variant={
                          interview.status === "completed"
                            ? "default"
                            : interview.status === "in_progress"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {interview.status === "completed"
                          ? "Completada"
                          : interview.status === "in_progress"
                            ? "En Progreso"
                            : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <span className="text-sm font-medium">API Backend</span>
                  </div>
                  <span className="text-xs text-accent">Operativo</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <span className="text-sm font-medium">WhatsApp API</span>
                  </div>
                  <span className="text-xs text-accent">Operativo</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <span className="text-sm font-medium">Módulo IA</span>
                  </div>
                  <span className="text-xs text-accent">Operativo</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <span className="text-sm font-medium">Workers</span>
                  </div>
                  <span className="text-xs text-muted-foreground">3 activos</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3">Alertas</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-destructive">Cola de mensajes alta</p>
                      <p className="text-xs text-muted-foreground">142 mensajes pendientes</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-transparent" variant="outline">
                Ver Estado Completo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sections Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resumen por Sección</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  name: "Tecnología",
                  employees: 45,
                  interviews: 3,
                  color: "bg-primary",
                },
                {
                  name: "RRHH",
                  employees: 28,
                  interviews: 2,
                  color: "bg-accent",
                },
                {
                  name: "Contabilidad",
                  employees: 32,
                  interviews: 1,
                  color: "bg-chart-3",
                },
                {
                  name: "Marketing",
                  employees: 38,
                  interviews: 2,
                  color: "bg-chart-4",
                },
              ].map((section) => (
                <div
                  key={section.name}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-3 w-3 rounded-full ${section.color}`} />
                    <h4 className="font-medium text-card-foreground">{section.name}</h4>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{section.employees} empleados</p>
                    <p className="text-sm text-muted-foreground">{section.interviews} entrevistas activas</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
