"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  Bot,
  Settings,
  MessageSquare,
  LogOut,
  User,
  Shield,
  Clock,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Entrevistas",
    href: "/entrevistas",
    icon: MessageSquare,
  },
  {
    title: "Empleados",
    href: "/empleados",
    icon: Users,
  },
  {
    title: "Agentes IA",
    href: "/agentes",
    icon: Bot,
  },
  {
    title: "Reportes",
    href: "/reportes",
    icon: FileText,
  },
  {
    title: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
]

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
}

function UserInterviewsSidebar() {
  const router = useRouter()
  const { user } = useAuth()
  const [pendingExpanded, setPendingExpanded] = useState(true)
  const [inProgressExpanded, setInProgressExpanded] = useState(true)
  const [assignments, setAssignments] = useState<InterviewAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch assignments
  useEffect(() => {
    if (!user) return

    const fetchAssignments = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/interview-assignments/employee/${user.id}`)
        const data = await response.json()

        // El backend devuelve una estructura anidada debido al TransformInterceptor
        if (data.success && data.data && Array.isArray(data.data.data)) {
          setAssignments(data.data.data)
        } else {
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

    // Refresh every 30 seconds
    const interval = setInterval(fetchAssignments, 30000)
    return () => clearInterval(interval)
  }, [user])

  const pendingInterviews = assignments.filter(i => i.status === "PENDING")
  const inProgressInterviews = assignments.filter(i => i.status === "IN_PROGRESS")

  const handleInterviewClick = (executionId: string) => {
    router.push(`/mis-entrevistas?interview=${executionId}`)
  }

  return (
    <div className="space-y-4">
      {/* Pending Interviews Section */}
      {pendingInterviews.length > 0 && (
        <div>
          <button
            onClick={() => setPendingExpanded(!pendingExpanded)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>PENDIENTES</span>
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {pendingInterviews.length}
              </Badge>
            </div>
            {pendingExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {pendingExpanded && (
            <div className="mt-2 space-y-1">
              {pendingInterviews.map((assignment) => (
                <button
                  key={assignment.execution_id}
                  onClick={() => handleInterviewClick(assignment.execution_id)}
                  className="w-full group flex flex-col gap-1 px-3 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-left"
                >
                  <span className="text-xs font-medium text-sidebar-foreground/90 group-hover:text-sidebar-foreground line-clamp-2">
                    {assignment.interview.title}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{assignment.interview.duration_minutes} min</span>
                    </div>
                    <PlayCircle className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* In Progress Interviews Section */}
      {inProgressInterviews.length > 0 && (
        <div>
          <button
            onClick={() => setInProgressExpanded(!inProgressExpanded)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
              <span>EN CURSO</span>
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {inProgressInterviews.length}
              </Badge>
            </div>
            {inProgressExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {inProgressExpanded && (
            <div className="mt-2 space-y-1">
              {inProgressInterviews.map((assignment) => (
                <button
                  key={assignment.execution_id}
                  onClick={() => handleInterviewClick(assignment.execution_id)}
                  className="w-full group flex flex-col gap-1 px-3 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-left border-l-2 border-blue-500/50"
                >
                  <span className="text-xs font-medium text-sidebar-foreground/90 group-hover:text-sidebar-foreground line-clamp-2">
                    {assignment.interview.title}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{assignment.interview.duration_minutes} min</span>
                    </div>
                    <PlayCircle className="h-3 w-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {pendingInterviews.length === 0 && inProgressInterviews.length === 0 && (
        <div className="px-3 py-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No hay entrevistas asignadas
          </p>
        </div>
      )}
    </div>
  )
}

export function SidebarNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Don't show sidebar on login page
  if (pathname === "/login") {
    return null
  }

  // Don't render if no user (loading state)
  if (!user) {
    return null
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1">
            <img src="/logolaib.png" alt="LAiB Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-sidebar-foreground">LAiB</h1>
            <p className="text-xs text-muted-foreground">Relevamiento</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-4">
        {user.role === "ADMIN" ? (
          // Admin navigation
          <div className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        ) : (
          // User navigation with interview sections
          <UserInterviewsSidebar />
        )}
      </nav>

      {/* Footer - User Info */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 rounded-lg bg-sidebar-accent p-3 hover:bg-sidebar-accent/80 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xs font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.name}
                  </p>
                  {user.role === "ADMIN" && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      <Shield className="h-2.5 w-2.5 mr-0.5" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
