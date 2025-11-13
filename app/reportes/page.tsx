"use client"

import type React from "react"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Download, TrendingUp, AlertCircle, CheckCircle2, Clock, BarChart3, FileText } from "lucide-react"

type Sentiment = "positive" | "neutral" | "negative"

interface Result {
  id: string
  employee_name: string
  interview_title: string
  section: string
  summary: string
  topics_detected: string[]
  sentiment: Sentiment
  urgency_score: number
  created_at: string
}

const mockResults: Result[] = [
  {
    id: "res-it-001",
    employee_name: "Juan Pérez",
    interview_title: "Detección de Cuellos de Botella en IT",
    section: "Tecnología",
    summary:
      "Se detectó lentitud en los deploys, falta de CI/CD automatizado. El empleado menciona que los procesos manuales generan demoras de hasta 3 horas.",
    topics_detected: ["devops", "tiempos de entrega", "automatización"],
    sentiment: "negative",
    urgency_score: 4,
    created_at: "2025-11-12T10:00:00Z",
  },
  {
    id: "res-it-002",
    employee_name: "María García",
    interview_title: "Detección de Cuellos de Botella en IT",
    section: "Tecnología",
    summary: "Proceso de code review funciona bien. Sugiere implementar pair programming para casos complejos.",
    topics_detected: ["code review", "colaboración", "calidad"],
    sentiment: "positive",
    urgency_score: 2,
    created_at: "2025-11-12T10:15:00Z",
  },
  {
    id: "res-rrhh-001",
    employee_name: "Carlos López",
    interview_title: "Evaluación de Clima Laboral",
    section: "Recursos Humanos",
    summary: "Buena comunicación con el equipo, pero falta claridad en los objetivos trimestrales.",
    topics_detected: ["objetivos", "comunicación", "planificación"],
    sentiment: "neutral",
    urgency_score: 3,
    created_at: "2025-11-12T10:30:00Z",
  },
  {
    id: "res-cont-001",
    employee_name: "Ana Martínez",
    interview_title: "Mejoras en Procesos Contables",
    section: "Contabilidad",
    summary: "Los cierres mensuales toman demasiado tiempo. Sugiere automatizar conciliaciones bancarias.",
    topics_detected: ["cierres contables", "automatización", "conciliaciones"],
    sentiment: "negative",
    urgency_score: 5,
    created_at: "2025-11-12T10:45:00Z",
  },
]

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
  const [results, setResults] = useState<Result[]>(mockResults)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSection, setFilterSection] = useState<string>("all")
  const [filterSentiment, setFilterSentiment] = useState<string>("all")
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.interview_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.summary.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSection = filterSection === "all" || result.section === filterSection

    const matchesSentiment = filterSentiment === "all" || result.sentiment === filterSentiment

    return matchesSearch && matchesSection && matchesSentiment
  })

  const urgencyDistribution = {
    high: results.filter((r) => r.urgency_score >= 4).length,
    medium: results.filter((r) => r.urgency_score === 3).length,
    low: results.filter((r) => r.urgency_score <= 2).length,
  }

  const sentimentDistribution = {
    positive: results.filter((r) => r.sentiment === "positive").length,
    neutral: results.filter((r) => r.sentiment === "neutral").length,
    negative: results.filter((r) => r.sentiment === "negative").length,
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
              <SelectItem value="Tecnología">Tecnología</SelectItem>
              <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
              <SelectItem value="Contabilidad">Contabilidad</SelectItem>
              <SelectItem value="Ventas">Ventas</SelectItem>
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

          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>

          <Button variant="outline" className="gap-2 bg-transparent">
            <BarChart3 className="h-4 w-4" />
            Resumen General
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Resultados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{results.length}</div>
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
                {Math.round((sentimentDistribution.positive / results.length) * 100)}% del total
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
              {[
                { topic: "automatización", count: 3 },
                { topic: "comunicación", count: 2 },
                { topic: "tiempos de entrega", count: 2 },
                { topic: "objetivos", count: 1 },
              ].map((item) => (
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
                    <TableCell className="font-medium">{result.employee_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{result.interview_title}</TableCell>
                    <TableCell>{result.section}</TableCell>
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
                              key={i}
                              className={`h-2 w-2 rounded-full ${
                                i < result.urgency_score
                                  ? result.urgency_score >= 4
                                    ? "bg-red-400"
                                    : result.urgency_score === 3
                                      ? "bg-amber-400"
                                      : "bg-emerald-400"
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{result.urgency_score}/5</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {result.topics_detected.slice(0, 2).map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {result.topics_detected.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{result.topics_detected.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setSelectedResult(result)}>
                          <Eye className="h-3.5 w-3.5" />
                          Ver Detalle
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedResult && (
          <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Detalle del Resultado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Empleado</div>
                    <div className="font-medium">{selectedResult.employee_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Sección</div>
                    <div className="font-medium">{selectedResult.section}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">Entrevista</div>
                  <div className="font-medium">{selectedResult.interview_title}</div>
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
                            key={i}
                            className={`h-3 w-3 rounded-full ${
                              i < selectedResult.urgency_score
                                ? selectedResult.urgency_score >= 4
                                  ? "bg-red-400"
                                  : selectedResult.urgency_score === 3
                                    ? "bg-amber-400"
                                    : "bg-emerald-400"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{selectedResult.urgency_score}/5</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Temas Detectados</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedResult.topics_detected.map((topic) => (
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
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </>
  )
}
