"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { resultsApi, type Result } from "@/lib/services/results"
import { sectionsApi } from "@/lib/services/sections"
import { interviewsApi, type Interview } from "@/lib/services/interviews"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Eye, Download, TrendingUp, AlertCircle, CheckCircle2, Clock, BarChart3, FileText, Users, MessageSquare, Target, ChevronLeft, ChevronRight } from "lucide-react"

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
  const [consolidatedResults, setConsolidatedResults] = useState<Result[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSection, setFilterSection] = useState<string>("all")
  const [filterSentiment, setFilterSentiment] = useState<string>("all")
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  
  // Estados para paginación de resultados individuales
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Estados para paginación de consolidados
  const [consolidatedPage, setConsolidatedPage] = useState(1)
  const [consolidatedPerPage] = useState(5)
  const [consolidatedSearch, setConsolidatedSearch] = useState("")
  
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [resultsData, sectionsData, interviewsData] = await Promise.all([
        resultsApi.getAll({ limit: 100 }),
        sectionsApi.getAll(),
        // Buscar entrevistas activas en lugar de completadas (COMPLETED es un estado de ejecución)
        interviewsApi.getAll({ status: 'ACTIVE', limit: 50 })
      ])

      console.log('[REPORTES] Results data:', resultsData)
      console.log('[REPORTES] Sections data:', sectionsData)
      console.log('[REPORTES] Interviews data:', interviewsData)

      const allResults = Array.isArray(resultsData?.data) ? resultsData.data : []
      
      // Separar resultados consolidados (employee_id = 'CONSOLIDATED') de individuales
      const consolidated = allResults.filter(r => r.employeeId === 'CONSOLIDATED')
      const individual = allResults.filter(r => r.employeeId !== 'CONSOLIDATED')
      
      console.log('[REPORTES] Consolidated results:', consolidated.length)
      console.log('[REPORTES] Individual results:', individual.length)

      setConsolidatedResults(consolidated)
      setResults(individual)
      setSections(Array.isArray(sectionsData) ? sectionsData : [])
      setInterviews(Array.isArray(interviewsData?.interviews) ? interviewsData.interviews : [])
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

  const filteredResults = Array.isArray(results) ? results.filter((result) => {
    const matchesSearch =
      (result.employeeName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (result.interviewTitle?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      result.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.topicsDetected.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSection = filterSection === "all" || result.sectionId === filterSection
    const matchesSentiment = filterSentiment === "all" || result.sentiment === filterSentiment

    return matchesSearch && matchesSection && matchesSentiment
  }) : []

  // Paginación de resultados individuales
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedResults = filteredResults.slice(startIndex, endIndex)

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterSection, filterSentiment])

  // Resetear página de consolidados cuando cambia la búsqueda
  useEffect(() => {
    setConsolidatedPage(1)
  }, [consolidatedSearch])

  // Filtrado y paginación de consolidados
  const filteredConsolidated = Array.isArray(consolidatedResults) ? consolidatedResults.filter((consolidated) => {
    const interview = interviews.find(int => int.interview_id === consolidated.interviewId)
    const matchesSearch = 
      interview?.title?.toLowerCase().includes(consolidatedSearch.toLowerCase()) ||
      consolidated.summary?.toLowerCase().includes(consolidatedSearch.toLowerCase()) ||
      consolidated.topicsDetected?.some((t) => t.toLowerCase().includes(consolidatedSearch.toLowerCase()))
    
    return matchesSearch
  }) : []

  const totalConsolidatedPages = Math.ceil(filteredConsolidated.length / consolidatedPerPage)
  const startConsolidatedIndex = (consolidatedPage - 1) * consolidatedPerPage
  const endConsolidatedIndex = startConsolidatedIndex + consolidatedPerPage
  const paginatedConsolidated = filteredConsolidated.slice(startConsolidatedIndex, endConsolidatedIndex)

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
    return Array.isArray(sections) ? sections.find((s) => s.section_id === sectionId)?.name || sectionId : sectionId
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-emerald-400'
      case 'negative':
        return 'text-red-400'
      case 'mixed':
        return 'text-amber-400'
      default:
        return 'text-slate-400'
    }
  }

  console.log('[REPORTES] Total interviews:', Array.isArray(interviews) ? interviews.length : 0)
  console.log('[REPORTES] Completed interviews:', consolidatedResults.length)
  console.log('[REPORTES] With summary:', consolidatedResults.length)
  console.log('[REPORTES] Total results:', Array.isArray(results) ? results.length : 0)

  return (
    <>
      <PageHeader
        title="Reportes y Resultados"
        description="Visualiza y analiza los resultados consolidados de las entrevistas"
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <Tabs defaultValue="consolidados" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="consolidados">Resúmenes Consolidados</TabsTrigger>
            <TabsTrigger value="individuales">Resultados Individuales</TabsTrigger>
          </TabsList>

          {/* TAB: Resúmenes Consolidados */}
          <TabsContent value="consolidados" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Entrevistas Completadas</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{consolidatedResults.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Con análisis consolidado</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Empleados Entrevistados</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{results?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Análisis individuales</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Problemas Críticos</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-400">
                    {consolidatedResults.reduce((sum, result) => {
                      return sum + (result.criticalIssues?.length || 0)
                    }, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Urgencia Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-400">
                    {consolidatedResults.length > 0
                      ? (consolidatedResults.reduce((sum, result) => sum + (result.urgencyLevel || 0), 0) / consolidatedResults.length).toFixed(1)
                      : '0.0'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">De 5.0 máximo</p>
                </CardContent>
              </Card>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Cargando resúmenes consolidados...</div>
            ) : consolidatedResults.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No hay entrevistas completadas con análisis consolidado aún.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Buscador de consolidados */}
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por entrevista, resumen o temas..."
                          value={consolidatedSearch}
                          onChange={(e) => setConsolidatedSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {filteredConsolidated.length} resultado{filteredConsolidated.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de consolidados paginada */}
                {paginatedConsolidated.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No se encontraron resultados con la búsqueda actual
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginatedConsolidated.map((consolidated) => {
                  const interview = interviews.find(int => int.interview_id === consolidated.interviewId)
                  const individualCount = results.filter(r => r.interviewId === consolidated.interviewId).length
                  
                  if (!interview) return null
                  
                  return (
                    <Card key={consolidated.id} className="border-border/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-xl">{interview.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                {interview.interview_id}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                {individualCount} empleados
                              </span>
                              {consolidated.sentiment && (
                                <Badge 
                                  variant="outline" 
                                  className={`gap-1.5 ${getSentimentColor(consolidated.sentiment)}`}
                                >
                                  {consolidated.sentiment}
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedResult(consolidated)}
                          >
                            Ver Detalle
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">📝 Resumen Ejecutivo</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {consolidated.summary || 'No disponible'}
                          </p>
                        </div>

                        {consolidated.topicsDetected && consolidated.topicsDetected.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">🎯 Temas Principales</h4>
                            <div className="flex flex-wrap gap-2">
                              {consolidated.topicsDetected.slice(0, 5).map((topic) => (
                                <Badge key={topic} variant="outline" className="bg-violet-500/5">
                                  {topic}
                                </Badge>
                              ))}
                              {consolidated.topicsDetected.length > 5 && (
                                <Badge variant="outline">+{consolidated.topicsDetected.length - 5}</Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {consolidated.criticalIssues && consolidated.criticalIssues.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 text-red-400">🚨 Problemas Críticos</h4>
                            <ul className="space-y-1">
                              {consolidated.criticalIssues.slice(0, 3).map((issue, i) => (
                                <li key={i} className="text-sm text-muted-foreground">
                                  • {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {consolidated.improvementOpportunities && consolidated.improvementOpportunities.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 text-emerald-400">💡 Recomendaciones</h4>
                            <ul className="space-y-1">
                              {consolidated.improvementOpportunities.slice(0, 3).map((rec, i) => (
                                <li key={i} className="text-sm text-muted-foreground">
                                  • {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}

                    {/* Paginación de consolidados */}
                    {totalConsolidatedPages > 1 && (
                      <Card className="border-border/50">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Mostrando {startConsolidatedIndex + 1} a {Math.min(endConsolidatedIndex, filteredConsolidated.length)} de {filteredConsolidated.length} análisis
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConsolidatedPage(prev => Math.max(1, prev - 1))}
                                disabled={consolidatedPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Anterior
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: totalConsolidatedPages }, (_, i) => i + 1)
                                  .filter(page => {
                                    return page === 1 || 
                                           page === totalConsolidatedPages || 
                                           (page >= consolidatedPage - 1 && page <= consolidatedPage + 1)
                                  })
                                  .map((page, index, array) => {
                                    const showEllipsis = index > 0 && page - array[index - 1] > 1
                                    return (
                                      <div key={page} className="flex items-center gap-1">
                                        {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                                        <Button
                                          variant={consolidatedPage === page ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => setConsolidatedPage(page)}
                                          className="min-w-[2.5rem]"
                                        >
                                          {page}
                                        </Button>
                                      </div>
                                    )
                                  })}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConsolidatedPage(prev => Math.min(totalConsolidatedPages, prev + 1))}
                                disabled={consolidatedPage === totalConsolidatedPages}
                              >
                                Siguiente
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB: Resultados Individuales */}
          <TabsContent value="individuales" className="space-y-6 mt-6">
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
                  {Array.isArray(sections) && sections.map((section) => (
                    <SelectItem key={section.section_id} value={section.section_id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSentiment} onValueChange={setFilterSentiment}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="positive">Positivos</SelectItem>
                  <SelectItem value="neutral">Neutrales</SelectItem>
                  <SelectItem value="negative">Negativos</SelectItem>
                </SelectContent>
              </Select>
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
                <CardDescription>
                  {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''} encontrado{filteredResults.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Buscador */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por empleado, entrevista, resumen o temas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando resultados...</div>
                ) : paginatedResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron resultados con los filtros actuales
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-muted/5">
                          <TableHead>Empleado</TableHead>
                          <TableHead>Entrevista</TableHead>
                          <TableHead>Sentimiento</TableHead>
                          <TableHead>Urgencia</TableHead>
                          <TableHead>Temas</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedResults.map((result) => (
                          <TableRow key={result.id} className="border-border/50 hover:bg-muted/5">
                            <TableCell className="font-medium">{result.employeeName || result.employeeId}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{result.interviewTitle || result.interviewId}</TableCell>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => setSelectedResult(result)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border/50 pt-4">
                        <p className="text-sm text-muted-foreground">
                          Mostrando {startIndex + 1} a {Math.min(endIndex, filteredResults.length)} de {filteredResults.length} resultados
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(page => {
                                // Mostrar siempre la primera, última, y páginas cercanas a la actual
                                return page === 1 || 
                                       page === totalPages || 
                                       (page >= currentPage - 1 && page <= currentPage + 1)
                              })
                              .map((page, index, array) => {
                                // Agregar "..." cuando hay saltos
                                const showEllipsis = index > 0 && page - array[index - 1] > 1
                                return (
                                  <div key={page} className="flex items-center gap-1">
                                    {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                                    <Button
                                      variant={currentPage === page ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(page)}
                                      className="min-w-[2.5rem]"
                                    >
                                      {page}
                                    </Button>
                                  </div>
                                )
                              })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para detalle de resultado individual */}
        {selectedResult && (
          <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Detalle del Resultado</DialogTitle>
                <DialogDescription>Análisis completo de la entrevista</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Empleado</div>
                  <div className="font-medium">{selectedResult.employeeName || selectedResult.employeeId}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">Entrevista</div>
                  <div className="font-medium">{selectedResult.interviewTitle || selectedResult.interviewId}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Resumen</div>
                  <div className="rounded-lg bg-muted/30 p-4 text-sm leading-relaxed">{selectedResult.summary}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Temas Detectados</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedResult.topicsDetected.map((topic) => (
                      <Badge key={topic} variant="outline">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedResult.criticalIssues.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Problemas Críticos</div>
                    <ul className="space-y-1">
                      {selectedResult.criticalIssues.map((issue, i) => (
                        <li key={i} className="text-sm text-red-400">
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
                        <li key={i} className="text-sm text-emerald-400">
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
