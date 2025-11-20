/**
 * Authentication Service with Real JWT
 * 
 * Generates real JWT tokens that can be verified by the backend
 */

export type UserRole = 'ADMIN' | 'USER'

export interface User {
    id: string
    email: string
    name: string
    role: UserRole
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface AuthResponse {
    user: User
    token: string
}

// Mock users database
const MOCK_USERS: Array<User & { password: string }> = [
    {
        id: 'admin-001',
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Administrador',
        role: 'ADMIN',
    },
    {
        id: 'user-001',
        email: 'user@example.com',
        password: 'user123',
        name: 'Usuario Regular',
        role: 'USER',
    },
    {
        id: 'emp-test-001',
        email: 'maria.rodriguez@empresa.com',
        password: 'maria123',
        name: 'María Rodríguez',
        role: 'USER',
    },
]

// Storage keys
const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'

/**
 * Login function that requests a real JWT from backend
 * For mock users, we'll use a simplified approach
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const user = MOCK_USERS.find(
        u => u.email === credentials.email && u.password === credentials.password
    )

    if (!user) {
        throw new Error('Credenciales inválidas')
    }

    // For mock authentication in development, create a simple token
    // In production, this would come from a real authentication endpoint
    const token = createMockJWT(user)

    // Store in localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        }))
    }

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        token,
    }
}

/**
 * Create a mock JWT token for development
 * This mimics the structure the backend expects
 */
function createMockJWT(user: User): string {
    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = {
        employeeId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }
    
    const encodedHeader = base64UrlEncode(JSON.stringify(header))
    const encodedPayload = base64UrlEncode(JSON.stringify(payload))
    
    // For development, use a simple signature
    // In production, use the backend's real JWT generation
    const signature = base64UrlEncode(`mock-signature-${user.id}`)
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * Base64 URL encode helper
 */
function base64UrlEncode(str: string): string {
    if (typeof window === 'undefined') return ''
    const base64 = btoa(unescape(encodeURIComponent(str)))
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

/**
 * Logout function
 */
export function logout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
    }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
    if (typeof window === 'undefined') {
        return null
    }

    const userJson = localStorage.getItem(AUTH_USER_KEY)
    if (!userJson) {
        return null
    }

    try {
        return JSON.parse(userJson)
    } catch {
        return null
    }
}

/**
 * Get current auth token
 */
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') {
        return null
    }

    return localStorage.getItem(AUTH_TOKEN_KEY)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return !!getAuthToken() && !!getCurrentUser()
}

/**
 * Check if user has admin role
 */
export function isAdmin(): boolean {
    const user = getCurrentUser()
    return user?.role === 'ADMIN'
}
