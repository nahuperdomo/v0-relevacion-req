"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { InterviewChat } from "@/components/interview-chat"
import {
    MessageSquare,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    PlayCircle,
    Loader2
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface InterviewAssignment {
    execution_id: string
    interview: {
        interview_id: string
        title: string
        description: string
        duration_minutes: number
    }
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    due_date: string
    conversations_completed: number
    conversations_total: number
}

export default function UserInterviewsPage() {
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const [selectedInterview, setSelectedInterview] = useState<InterviewAssignment | null>(null)
    const [assignments, setAssignments] = useState<InterviewAssignment[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Fetch assignments
    useEffect(() => {
        if (!user) return

        const fetchAssignments = async () => {
            try {
                // En desarrollo usamos localhost:3000
                const response = await fetch(`http://localhost:3000/api/v1/interview-assignments/employee/${user.id}`)
                const data = await response.json()

                console.log('📋 Assignments response:', data)

                // El backend devuelve una estructura anidada debido al TransformInterceptor
                if (data.success && data.data && Array.isArray(data.data.data)) {
                    console.log('✅ Setting assignments:', data.data.data.length, 'items')
                    setAssignments(data.data.data)
                } else {
                    console.log('❌ Invalid data format:', data)
                    setAssignments([])
                }
            } catch (error) {
                console.error('Error fetching assignments:', error)
                setAssignments([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchAssignments()
    }, [user])

    // Check for interview query parameter
    useEffect(() => {
        const interviewId = searchParams.get('interview')
        if (interviewId && assignments.length > 0) {
            const interview = assignments.find(a => a.execution_id === interviewId)
            if (interview) {
                setSelectedInterview(interview)
            }
        }
    }, [searchParams, assignments])

    // Asegurar que assignments sea un array antes de filtrar
    const assignmentsArray = Array.isArray(assignments) ? assignments : []
    const pendingInterviews = assignmentsArray.filter(i => i.status === "PENDING")
    const inProgressInterviews = assignmentsArray.filter(i => i.status === "IN_PROGRESS")
    const completedInterviews = assignmentsArray.filter(i => i.status === "COMPLETED")

    const handleStartInterview = (interview: InterviewAssignment) => {
        setSelectedInterview(interview)
    }

    const handleCloseChat = () => {
        setSelectedInterview(null)
        // Clear query parameter
        window.history.replaceState({}, '', '/mis-entrevistas')
        // Refresh assignments to update status
        if (user) {
            fetch(`http://localhost:3000/api/v1/interview-assignments/employee/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data && Array.isArray(data.data.data)) {
                        setAssignments(data.data.data)
                    }
                })
        }
    }

    if (selectedInterview) {
        // Map to Interview interface expected by InterviewChat
        const interviewProps = {
            id: selectedInterview.execution_id,
            title: selectedInterview.interview.title,
            description: selectedInterview.interview.description,
            status: selectedInterview.status,
            questionsTotal: selectedInterview.conversations_total,
            questionsCompleted: selectedInterview.conversations_completed,
            dueDate: selectedInterview.due_date,
            estimatedDuration: selectedInterview.interview.duration_minutes,
        }
        return <InterviewChat interview={interviewProps} onClose={handleCloseChat} />
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <>
            <PageHeader title="Mis Entrevistas" />

            <main className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Welcome Section */}
                <div className="rounded-lg border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
                    <h2 className="text-2xl font-bold mb-2">¡Hola, {user?.name}! 👋</h2>
                    <p className="text-muted-foreground">
                        Aquí encontrarás todas las entrevistas asignadas a ti. Completa las pendientes para ayudarnos a mejorar.
                    </p>
                </div>

                {/* Pending Interviews */}
                {pendingInterviews.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            <h3 className="text-lg font-semibold">Entrevistas Pendientes</h3>
                            <Badge variant="secondary">{pendingInterviews.length}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingInterviews.map((assignment) => (
                                <Card
                                    key={assignment.execution_id}
                                    className="group hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer"
                                    onClick={() => handleStartInterview(assignment)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-base mb-2 group-hover:text-primary transition-colors">
                                                    {assignment.interview.title}
                                                </CardTitle>
                                                <CardDescription className="text-sm">
                                                    {assignment.interview.description}
                                                </CardDescription>
                                            </div>
                                            <PlayCircle className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {assignment.due_date && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Vence: {new Date(assignment.due_date).toLocaleDateString('es-ES')}</span>
                                                </div>
                                            )}
                                            {assignment.interview.duration_minutes && (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{assignment.interview.duration_minutes} min</span>
                                                </div>
                                            )}
                                        </div>
                                        <Button className="w-full mt-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                                            <PlayCircle className="h-4 w-4 mr-2" />
                                            Comenzar Entrevista
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* In Progress Interviews */}
                {inProgressInterviews.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                            <h3 className="text-lg font-semibold">En Progreso</h3>
                            <Badge variant="secondary">{inProgressInterviews.length}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {inProgressInterviews.map((assignment) => (
                                <Card
                                    key={assignment.execution_id}
                                    className="group hover:border-blue-500/50 transition-all hover:shadow-lg cursor-pointer"
                                    onClick={() => handleStartInterview(assignment)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-base mb-2 group-hover:text-blue-500 transition-colors">
                                                    {assignment.interview.title}
                                                </CardTitle>
                                                <CardDescription className="text-sm">
                                                    {assignment.interview.description}
                                                </CardDescription>
                                            </div>
                                            <PlayCircle className="h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {assignment.due_date && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Vence: {new Date(assignment.due_date).toLocaleDateString('es-ES')}</span>
                                                </div>
                                            )}
                                            {assignment.interview.duration_minutes && (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{assignment.interview.duration_minutes} min</span>
                                                </div>
                                            )}
                                        </div>
                                        <Button className="w-full mt-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                                            <PlayCircle className="h-4 w-4 mr-2" />
                                            Continuar Entrevista
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Completed Interviews */}
                {completedInterviews.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <h3 className="text-lg font-semibold">Completadas</h3>
                            <Badge variant="secondary">{completedInterviews.length}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {completedInterviews.map((assignment) => (
                                <Card key={assignment.execution_id} className="opacity-75">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-base mb-2 flex items-center gap-2">
                                                    {assignment.interview.title}
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                </CardTitle>
                                                <CardDescription className="text-sm">
                                                    {assignment.interview.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-4 w-4" />
                                                <span>Completada el {new Date(assignment.due_date || new Date()).toLocaleDateString('es-ES')}</span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                            Completada
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {assignments.length === 0 && (
                    <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No hay entrevistas asignadas</h3>
                        <p className="text-muted-foreground">
                            Cuando se te asignen entrevistas, aparecerán aquí.
                        </p>
                    </div>
                )}
            </main>
        </>
    )
}
