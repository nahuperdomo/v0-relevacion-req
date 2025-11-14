"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { interviewsApi } from "@/lib/services/interviews"
import { RefreshCw, StopCircle, Eye, CheckCircle, AlertCircle, Clock } from "lucide-react"

interface ExecutionSummary {
  execution_id: string
  interview_title: string
  section_id: string
  section_name: string
  conversations: any[]
  statistics: {
    total_targeted: number
    completed_successfully: number
    failed_conversations: number
    completion_rate: number
    avg_conversation_duration: number
    total_messages_exchanged: number
  }
  started_at: Date
  duration_minutes: number
  detected_topics: string[]
}

export function ActiveExecutions() {
  const [executions, setExecutions] = useState<ExecutionSummary[]>([])
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
      const data = await interviewsApi.getActiveExecutions()
      setExecutions(data)
    } catch (error) {
      console.error("Error cargando ejecuciones:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleStopExecution = async (executionId: string) => {
    try {
      await interviewsApi.stopExecution(executionId)
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

  if (executions.length === 0) {
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
          const completionRate = 
            (execution.statistics.completed_successfully / execution.statistics.total_targeted) * 100 || 0

          return (
            <div
              key={execution.execution_id}
              className="rounded-lg border p-4 space-y-3 bg-card hover:bg-accent/5 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="font-medium">{execution.interview_title}</div>
                  <div className="text-sm text-muted-foreground">
                    {execution.section_name} • ID: {execution.execution_id}
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  En Progreso
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{completionRate.toFixed(0)}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-medium">{execution.statistics.total_targeted}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Completadas
                  </div>
                  <div className="font-medium text-green-400">
                    {execution.statistics.completed_successfully}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    Fallidas
                  </div>
                  <div className="font-medium text-red-400">
                    {execution.statistics.failed_conversations}
                  </div>
                </div>
              </div>

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
