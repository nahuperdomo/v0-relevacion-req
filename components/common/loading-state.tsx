import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

/**
 * Componente reutilizable para estados de carga
 */
export function LoadingState({ message = "Cargando...", size = "md", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

/**
 * Loader inline compacto
 */
export function InlineLoader({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
}
