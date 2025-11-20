"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser, isAuthenticated, logout, type User } from "@/lib/services/auth"

interface AuthContextType {
    user: User | null
    loading: boolean
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Check authentication on mount and route changes
        const checkAuth = () => {
            if (isAuthenticated()) {
                const currentUser = getCurrentUser()
                setUser(currentUser)

                // If on login page and authenticated, redirect to dashboard
                if (pathname === "/login") {
                    router.push("/")
                }
            } else {
                setUser(null)

                // If not on login page and not authenticated, redirect to login
                if (pathname !== "/login") {
                    router.push("/login")
                }
            }
            setLoading(false)
        }

        checkAuth()
    }, [pathname, router])

    const handleLogout = () => {
        logout()
        setUser(null)
        router.push("/login")
    }

    return (
        <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
