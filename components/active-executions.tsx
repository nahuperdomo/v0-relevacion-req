"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { executionsService, type InterviewExecution } from "@/lib/services/executions"
import { RefreshCw, StopCircle, Eye, CheckCircle, AlertCircle, Clock, Pause, Play } from "lucide-react"

export function ActiveExecutions() {
  const [executions, setExecutions] = useState<InterviewExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadExecutions()
    // Auto-refresh cada 10 segundos
    const interval = setInterval(loadExecutions, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadExecutions = async () => {
    try {
      setRefreshing(true)
      const data = await executionsService.getActive()
      setExecutions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error cargando ejecuciones activas:", error)
      setExecutions([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handlePauseExecution = async (executionId: string) => {
    try {
      await executionsService.pause(executionId)
      await loadExecutions()
    } catch (error) {
      console.error("Error pausando ejecución:", error)
    }
  }

  const handleResumeExecution = async (executionId: string) => {
    try {
      await executionsService.resume(executionId)
      await loadExecutions()
    } catch (error) {
      console.error("Error reanudando ejecución:", error)
    }
  }

  const handleStopExecution = async (executionId: string) => {
    try {
      await executionsService.stop(executionId)
      await loadExecutions()
    } catch (error) {
      console.error("Error deteniendo ejecución:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-pulse" />
            Ejecuciones Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">Cargando...</div>
        </CardContent>
      </Card>
    )
  }

  if (!executions || executions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Ejecuciones Activas
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadExecutions} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No hay ejecuciones activas en este momento
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
          Ejecuciones Activas ({executions.length})
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={loadExecutions} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {executions.map((execution) => {
          const statusColor = execution.status === 'IN_PROGRESS' 
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
          
          const statusLabel = execution.status === 'IN_PROGRESS' ? 'En Progreso' : 'Pausada';

          return (
            <div
              key={execution.execution_id}
              className="rounded-lg border p-4 space-y-3 bg-card hover:bg-accent/5 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="font-medium">Entrevista: {execution.interview_id}</div>
                  <div className="text-sm text-muted-foreground">
                    ID Ejecución: {execution.execution_id}
                  </div>
                  {execution.started_at && (
                    <div className="text-xs text-muted-foreground">
                      Iniciada: {new Date(execution.started_at).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className={statusColor}>
                  {statusLabel}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{Number(execution.completion_percentage).toFixed(0)}%</span>
                </div>
                <Progress value={Number(execution.completion_percentage)} className="h-2" />
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-medium">{execution.conversations_total}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Completadas
                  </div>
                  <div className="font-medium text-green-400">
                    {execution.conversations_completed}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-500" />
                    Pendientes
                  </div>
                  <div className="font-medium text-amber-400">
                    {execution.conversations_total - execution.conversations_completed}
                  </div>
                </div>
              </div>

              {/* Topics */}
              {execution.consolidated_topics && execution.consolidated_topics.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Temas detectados:</div>
                  <div className="flex flex-wrap gap-1">
                    {execution.consolidated_topics.slice(0, 3).map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {execution.consolidated_topics.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{execution.consolidated_topics.length - 3} más
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(`/entrevistas/execution/${execution.execution_id}`, "_blank")}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Ver Detalles
                </Button>
                
                {execution.status === 'IN_PROGRESS' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePauseExecution(execution.execution_id)}
                  >
                    <Pause className="h-3.5 w-3.5 mr-1.5" />
                    Pausar
                  </Button>
                )}

                {execution.status === 'PAUSED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResumeExecution(execution.execution_id)}
                  >
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Reanudar
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStopExecution(execution.execution_id)}
                >
                  <StopCircle className="h-3.5 w-3.5 mr-1.5" />
                  Detener
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
