"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAdmin?: boolean
}

/**
 * Component to protect routes based on authentication and role
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading) {
            // If not authenticated, redirect to login
            if (!user) {
                router.push("/login")
                return
            }

            // If admin route required and user is not admin, redirect to user dashboard
            if (requireAdmin && user.role !== "ADMIN") {
                router.push("/mis-entrevistas")
                return
            }
        }
    }, [user, loading, requireAdmin, router, pathname])

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Verificando permisos...</p>
                </div>
            </div>
        )
    }

    // If not authenticated, don't render content (will redirect)
    if (!user) {
        return null
    }

    // If admin required and user is not admin, don't render content (will redirect)
    if (requireAdmin && user.role !== "ADMIN") {
        return null
    }

    return <>{children}</>
}
