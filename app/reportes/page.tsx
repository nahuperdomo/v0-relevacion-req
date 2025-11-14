"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { resultsApi, type Result } from "@/lib/services/results"
import { sectionsApi } from "@/lib/services/sections"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Download, TrendingUp, AlertCircle, CheckCircle2, Clock, BarChart3, FileText } from "lucide-react"

type Sentiment = "positive" | "neutral" | "negative"

const sentimentColors: Record<Sentiment, string> = {
  positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  negative: "bg-red-500/10 text-red-400 border-red-500/20",
}

const sentimentLabels: Record<Sentiment, string> = {
  positive: "Positivo",
  neutral: "Neutral",
  negative: "Negativo",
}

const sentimentIcons: Record<Sentiment, React.ReactNode> = {
  positive: <CheckCircle2 className="h-4 w-4" />,
  neutral: <Clock className="h-4 w-4" />,
  negative: <AlertCircle className="h-4 w-4" />,
}

export default function ReportesPage() {
  const [results, setResults] = useState<Result[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSection, setFilterSection] = useState<string>("all")
  const [filterSentiment, setFilterSentiment] = useState<string>("all")
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [resultsData, sectionsData] = await Promise.all([resultsApi.getAll({ limit: 100 }), sectionsApi.getAll()])

      setResults(resultsData.data)
      setSections(sectionsData)
    } catch (error) {
      console.error("[v0] Error cargando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los resultados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (resultId: string, format: "pdf" | "excel" | "json" = "pdf") => {
    try {
      toast({
        title: "Exportando",
        description: "Generando el reporte...",
      })
      
      const result = await resultsApi.exportResult(resultId, format)
      
      toast({
        title: "Éxito",
        description: `Reporte exportado en formato ${format.toUpperCase()}`,
      })
      
      // Si hay una URL de descarga, abrirla
      if (result.downloadUrl) {
        window.open(result.downloadUrl, '_blank')
      }
    } catch (error) {
      console.error("[v0] Error exportando:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
        variant: "destructive",
      })
    }
  }

  const handleGenerateAggregate = async () => {
    try {
      const sectionIds = filterSection === "all" 
        ? sections.map((s) => s.section_id)
        : [filterSection]

      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // últimos 30 días
      const endDate = new Date().toISOString()

      toast({
        title: "Generando reporte consolidado",
        description: "Esto puede tardar unos momentos...",
      })

      const aggregate = await resultsApi.aggregate({
        sectionIds,
        startDate,
        endDate,
        criticalOnly: false,
      })

      toast({
        title: "Reporte generado",
        description: "El reporte consolidado está listo",
      })

      // Aquí podrías mostrar el reporte en un diálogo o redirigir a una página de detalle
      console.log("Aggregate report:", aggregate)
    } catch (error) {
      console.error("[v0] Error generando reporte consolidado:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el reporte consolidado",
        variant: "destructive",
      })
    }
  }

  const filteredResults = (results || []).filter((result) => {
    const matchesSearch =
      result.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.topicsDetected.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSection = filterSection === "all" || result.sectionId === filterSection

    const matchesSentiment = filterSentiment === "all" || result.sentiment === filterSentiment

    return matchesSearch && matchesSection && matchesSentiment
  })

  const urgencyDistribution = {
    high: (results || []).filter((r) => r.urgencyLevel >= 4).length,
    medium: (results || []).filter((r) => r.urgencyLevel === 3).length,
    low: (results || []).filter((r) => r.urgencyLevel <= 2).length,
  }

  const sentimentDistribution = {
    positive: (results || []).filter((r) => r.sentiment === "positive").length,
    neutral: (results || []).filter((r) => r.sentiment === "neutral").length,
    negative: (results || []).filter((r) => r.sentiment === "negative").length,
  }

  const getTopTopics = () => {
    const topicCounts: Record<string, number> = {}
    ;(results || []).forEach((r) => {
      r.topicsDetected.forEach((topic) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      })
    })

    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([topic, count]) => ({ topic, count }))
  }

  const getSectionName = (sectionId: string) => {
    return sections.find((s) => s.section_id === sectionId)?.name || sectionId
  }

  return (
    <>
      <PageHeader
        title="Reportes y Resultados"
        description="Visualiza y analiza los resultados consolidados de las entrevistas"
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar en resultados..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterSection} onValueChange={setFilterSection}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas las secciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las secciones</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.section_id} value={section.section_id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSentiment} onValueChange={setFilterSentiment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los sentimientos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="positive">Positivos</SelectItem>
              <SelectItem value="neutral">Neutrales</SelectItem>
              <SelectItem value="negative">Negativos</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2 bg-transparent" onClick={handleGenerateAggregate}>
            <BarChart3 className="h-4 w-4" />
            Resumen Consolidado
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Resultados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{results?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Urgencia Alta</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{urgencyDistribution.high}</div>
              <p className="text-xs text-muted-foreground mt-1">Requieren atención inmediata</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sentimiento Positivo</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">{sentimentDistribution.positive}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(results?.length || 0) > 0 ? Math.round((sentimentDistribution.positive / (results?.length || 1)) * 100) : 0}% del
                total
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sentimiento Negativo</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{sentimentDistribution.negative}</div>
              <p className="text-xs text-muted-foreground mt-1">Requieren seguimiento</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Distribución por Urgencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="text-sm">Alta (4-5)</span>
                </div>
                <span className="text-lg font-bold text-red-400">{urgencyDistribution.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="text-sm">Media (3)</span>
                </div>
                <span className="text-lg font-bold text-amber-400">{urgencyDistribution.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="text-sm">Baja (1-2)</span>
                </div>
                <span className="text-lg font-bold text-emerald-400">{urgencyDistribution.low}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Distribución por Sentimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm">Positivo</span>
                </div>
                <span className="text-lg font-bold text-emerald-400">{sentimentDistribution.positive}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">Neutral</span>
                </div>
                <span className="text-lg font-bold text-slate-400">{sentimentDistribution.neutral}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm">Negativo</span>
                </div>
                <span className="text-lg font-bold text-red-400">{sentimentDistribution.negative}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Temas Más Detectados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getTopTopics().map((item) => (
                <div key={item.topic} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.topic}</span>
                  <Badge variant="outline" className="font-mono">
                    {item.count}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Resultados Individuales</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando resultados...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-muted/5">
                    <TableHead>Empleado</TableHead>
                    <TableHead>Entrevista</TableHead>
                    <TableHead>Sección</TableHead>
                    <TableHead>Sentimiento</TableHead>
                    <TableHead>Urgencia</TableHead>
                    <TableHead>Temas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id} className="border-border/50 hover:bg-muted/5">
                      <TableCell className="font-medium">{result.employeeId}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{result.interviewId}</TableCell>
                      <TableCell>{getSectionName(result.sectionId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1.5 ${sentimentColors[result.sentiment]}`}>
                          {sentimentIcons[result.sentiment]}
                          {sentimentLabels[result.sentiment]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={`urgency-${result.id}-${i}`}
                                className={`h-2 w-2 rounded-full ${
                                  i < result.urgencyLevel
                                    ? result.urgencyLevel >= 4
                                      ? "bg-red-400"
                                      : result.urgencyLevel === 3
                                        ? "bg-amber-400"
                                        : "bg-emerald-400"
                                    : "bg-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{result.urgencyLevel}/5</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {result.topicsDetected.slice(0, 2).map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {result.topicsDetected.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{result.topicsDetected.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setSelectedResult(result)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver Detalle
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleExport(result.id, "pdf")}
                          >
                            <Download className="h-3.5 w-3.5" />
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

        {selectedResult && (
          <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Detalle del Resultado</DialogTitle>
                <DialogDescription>Información completa de la entrevista y análisis de resultados</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Empleado</div>
                    <div className="font-medium">{selectedResult.employeeId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Sección</div>
                    <div className="font-medium">{getSectionName(selectedResult.sectionId)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">Entrevista</div>
                  <div className="font-medium">{selectedResult.interviewId}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Sentimiento</div>
                    <Badge variant="outline" className={`gap-1.5 ${sentimentColors[selectedResult.sentiment]}`}>
                      {sentimentIcons[selectedResult.sentiment]}
                      {sentimentLabels[selectedResult.sentiment]}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Urgencia</div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={`detail-urgency-${selectedResult.id}-${i}`}
                            className={`h-3 w-3 rounded-full ${
                              i < selectedResult.urgencyLevel
                                ? selectedResult.urgencyLevel >= 4
                                  ? "bg-red-400"
                                  : selectedResult.urgencyLevel === 3
                                    ? "bg-amber-400"
                                    : "bg-emerald-400"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{selectedResult.urgencyLevel}/5</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Temas Detectados</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedResult.topicsDetected.map((topic) => (
                      <Badge key={topic} variant="outline" className="bg-violet-500/5">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Resumen</div>
                  <div className="rounded-lg bg-muted/30 p-4 text-sm leading-relaxed">{selectedResult.summary}</div>
                </div>

                {selectedResult.criticalIssues.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Problemas Críticos</div>
                    <ul className="space-y-1">
                      {selectedResult.criticalIssues.map((issue, i) => (
                        <li key={`critical-${i}`} className="text-sm text-red-400">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedResult.improvementOpportunities.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Oportunidades de Mejora</div>
                    <ul className="space-y-1">
                      {selectedResult.improvementOpportunities.map((opp, i) => (
                        <li key={`improvement-${i}`} className="text-sm text-emerald-400">
                          • {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </>
  )
}
