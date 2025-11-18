import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface StatusConfig {
  [key: string]: {
    label: string
    className: string
  }
}

interface StatusBadgeProps {
  status: string
  statusConfig: StatusConfig
  className?: string
}

/**
 * Componente reutilizable para mostrar badges de estado con estilos consistentes
 */
export function StatusBadge({ status, statusConfig, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  }

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}

/**
 * Configuraciones predefinidas de estados comunes
 */
export const STATUS_CONFIGS = {
  common: {
    ACTIVE: {
      label: "Activo",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    INACTIVE: {
      label: "Inactivo",
      className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    },
    PENDING: {
      label: "Pendiente",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    COMPLETED: {
      label: "Completada",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    CANCELLED: {
      label: "Cancelada",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  },
  agent: {
    ACTIVE: {
      label: "Activo",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    INACTIVE: {
      label: "Inactivo",
      className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    },
    TRAINING: {
      label: "En Entrenamiento",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    MAINTENANCE: {
      label: "Mantenimiento",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
  },
  employee: {
    ACTIVE: {
      label: "Activo",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    INACTIVE: {
      label: "Inactivo",
      className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    },
    ON_LEAVE: {
      label: "De Licencia",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    TERMINATED: {
      label: "Desvinculado",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  },
  interview: {
    DRAFT: {
      label: "Borrador",
      className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    },
    PENDING: {
      label: "Pendiente",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    IN_PROGRESS: {
      label: "En Progreso",
      className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
    ACTIVE: {
      label: "Activa",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    COMPLETED: {
      label: "Completada",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    PAUSED: {
      label: "Pausada",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    CANCELLED: {
      label: "Cancelada",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    ARCHIVED: {
      label: "Archivada",
      className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    },
  },
}
