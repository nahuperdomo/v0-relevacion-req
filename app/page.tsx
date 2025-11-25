"use client"
import { PageHeader } from "@/components/page-header"
import { ProtectedRoute } from "@/components/protected-route"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
  FileText,
  Calendar,
  Target,
  BarChart3,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { interviewsApi, type InterviewStats } from "@/lib/services/interviews"
import { employeesApi } from "@/lib/services/employees"
import { agentsApi, type AgentStats } from "@/lib/services/agents"
import { resultsApi, type Result } from "@/lib/services/results"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [stats, setStats] = useState<{
    interviews?: InterviewStats
    agents?: AgentStats
    employeesCount?: number
  }>({})
  const [recentInterviews, setRecentInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [selectedInterviewDetails, setSelectedInterviewDetails] = useState<any>(null)
  const [interviewResults, setInterviewResults] = useState<Result[]>([])
  const [loadingResults, setLoadingResults] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Redirect regular users to their interviews page
  useEffect(() => {
    if (user && user.role === "USER") {
      router.push("/mis-entrevistas")
    }
  }, [user, router])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setConnectionError(null)
        const [interviewStats, agentStats, employeesData, interviewsData, sectionsData] = await Promise.all([
          interviewsApi.getStats(),
          agentsApi.getStats(),
          employeesApi.getAll({ limit: 1 }),
          interviewsApi.getAll({ limit: 4 }),
          employeesApi.getAll({ limit: 1000 }), // Para contar por sección
        ])

        setStats({
          interviews: interviewStats,
          agents: agentStats,
          employeesCount: employeesData.total,
        })

        setRecentInterviews(interviewsData.interviews)

      } catch (error: any) {
        console.error("[v0] Error cargando datos del dashboard:", error)
        setConnectionError(error.message || "Error al cargar los datos")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const handleInterviewClick = async (interview: any) => {
    setSelectedInterviewDetails(interview)
    setIsDetailsModalOpen(true)
    setLoadingResults(true)

    try {
      // Obtener resultados de la entrevista
      const response = await resultsApi.getAll({
        interviewId: interview.interview_id,
        limit: 100,
      })
      setInterviewResults(response.data || [])
    } catch (error) {
      console.error("[v0] Error cargando resultados:", error)
      setInterviewResults([])
    } finally {
      setLoadingResults(false)
    }
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <PageHeader
        title="Dashboard"
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
          />
          <StatsCard
            title="Total Respuestas"
            value={loading ? "-" : stats.interviews?.total_responses || 0}
            description="Recolectadas"
            icon={TrendingUp}
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
                {loading ? (
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : !recentInterviews || recentInterviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay entrevistas recientes</p>
                ) : (
                  recentInterviews
                    .filter((interview) => interview.status !== "DRAFT") // Excluir borradores
                    .map((interview) => (
                      <button
                        key={interview.interview_id}
                        onClick={() => handleInterviewClick(interview)}
                        className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            {interview.status === "COMPLETED" ? (
                              <CheckCircle2 className="h-5 w-5 text-accent" />
                            ) : interview.status === "ACTIVE" ? (
                              <Activity className="h-5 w-5 text-primary" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{interview.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {interview.section_name || interview.section_id}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                )}
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
                    <span className="text-sm font-medium">Módulo IA</span>
                  </div>
                  <span className="text-xs text-accent">Operativo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Detalle de Entrevista */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold mb-1">
                    {selectedInterviewDetails?.title}
                  </DialogTitle>
                  <DialogDescription className="text-base flex items-center gap-2">
                    <span>{selectedInterviewDetails?.section_name || selectedInterviewDetails?.section_id}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <Badge
                      variant="outline"
                      className={
                        selectedInterviewDetails?.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      }
                    >
                      {selectedInterviewDetails?.status === "COMPLETED" ? "Completada" : "Activa"}
                    </Badge>
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Métricas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-blue-500/5 to-transparent p-6 hover:border-blue-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
                  <div className="relative space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="p-2.5 rounded-lg bg-blue-500/10">
                        <Users className="h-5 w-5 text-blue-400" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-blue-400 text-center">
                      {selectedInterviewDetails?.conversations_total || 0}
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-emerald-500/5 to-transparent p-6 hover:border-emerald-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
                  <div className="relative space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-emerald-400 text-center">
                      {selectedInterviewDetails?.conversations_completed || 0}
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-violet-500/5 to-transparent p-6 hover:border-violet-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
                  <div className="relative space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="p-2.5 rounded-lg bg-violet-500/10">
                        <Clock className="h-5 w-5 text-violet-400" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-violet-400 text-center">
                      {selectedInterviewDetails?.duration_minutes || 0}
                      <span className="text-sm font-normal text-muted-foreground ml-1">min</span>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-amber-500/5 to-transparent p-6 hover:border-amber-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
                  <div className="relative space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="p-2.5 rounded-lg bg-amber-500/10">
                        <BarChart3 className="h-5 w-5 text-amber-400" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-amber-400 text-center">
                      {interviewResults.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de la Entrevista */}
              <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    Detalles de la Entrevista
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-background/50 p-4 border border-border/50">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Descripción</div>
                    <p className="text-sm leading-relaxed">{selectedInterviewDetails?.description || "Sin descripción"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-background/50 p-4 border border-border/50">
                      <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Sección</div>
                      <p className="text-sm font-semibold">
                        {selectedInterviewDetails?.section_name || selectedInterviewDetails?.section_id}
                      </p>
                    </div>
                    <div className="rounded-lg bg-background/50 p-4 border border-border/50">
                      <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Agente IA</div>
                      <p className="text-sm font-semibold">{selectedInterviewDetails?.agent_id || "N/A"}</p>
                    </div>
                  </div>
                  {selectedInterviewDetails?.objectives && selectedInterviewDetails.objectives.length > 0 && (
                    <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                      <div className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Objetivos de la Entrevista
                      </div>
                      <div className="space-y-2">
                        {selectedInterviewDetails.objectives.map((obj: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 text-sm bg-background/50 p-3 rounded-lg border border-border/30">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary flex-shrink-0">
                              <span className="text-xs font-bold">{idx + 1}</span>
                            </div>
                            <span className="leading-relaxed">{obj}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resultados Individuales */}
              <Card className="border-border/50">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <span>Resultados Individuales</span>
                      <Badge variant="secondary" className="ml-2">
                        {interviewResults.length} resultados
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingResults ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        </div>
                        <p className="text-sm font-medium">Cargando resultados...</p>
                      </div>
                    </div>
                  ) : interviewResults.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No hay resultados disponibles para esta entrevista</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                      {interviewResults.map((result) => (
                        <div
                          key={result.id}
                          className="group relative p-5 rounded-xl border border-border bg-gradient-to-br from-background to-muted/20 hover:from-accent/10 hover:to-muted/30 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/3 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <div className="relative">
                            <div className="flex items-start justify-between mb-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-primary/60" />
                                  <div className="font-semibold text-base">{result.employeeName || result.employeeId}</div>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(result.createdAt).toLocaleDateString("es-ES", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className={`
                                px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-sm
                                ${result.sentiment === "positive"
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                    : result.sentiment === "negative"
                                      ? "bg-red-500/15 text-red-400 border-red-500/30"
                                      : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                                  }
                              `}>
                                  {result.sentiment === "positive"
                                    ? "😊 Positivo"
                                    : result.sentiment === "negative"
                                      ? "😟 Negativo"
                                      : "😐 Neutral"}
                                </div>

                                <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 backdrop-blur-sm">
                                  ⚡ {result.urgencyLevel}/5
                                </div>
                              </div>
                            </div>

                            <div className="mb-4 p-4 rounded-lg bg-background/60 border border-border/50">
                              <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>
                            </div>

                            {result.topicsDetected && result.topicsDetected.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {result.topicsDetected.slice(0, 5).map((topic, idx) => (
                                  <div
                                    key={idx}
                                    className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
                                  >
                                    {topic}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 px-6 pb-6 border-t bg-gradient-to-r from-muted/20 to-transparent">
            <Button
              variant="outline"
              onClick={() => setIsDetailsModalOpen(false)}
              className="hover:bg-accent/50 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
            <Button
              onClick={() => {
                window.location.href = `/reportes?interview=${selectedInterviewDetails?.interview_id}`
              }}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Análisis Completo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
