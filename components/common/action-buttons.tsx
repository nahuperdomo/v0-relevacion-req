import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Action {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
}

interface ActionButtonsProps {
  actions: Action[]
  compact?: boolean
}

/**
 * Componente reutilizable para botones de acción en tablas
 */
export function ActionButtons({ actions, compact = false }: ActionButtonsProps) {
  if (compact && actions.length > 2) {
    // Mostrar menú dropdown si hay más de 2 acciones en modo compacto
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action, index) => (
            <div key={index}>
              <DropdownMenuItem
                onClick={action.onClick}
                disabled={action.disabled}
                className={action.variant === "destructive" ? "text-destructive" : ""}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
              {index < actions.length - 1 && action.variant === "destructive" && <DropdownMenuSeparator />}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex gap-2">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant === "destructive" ? "destructive" : "ghost"}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.icon}
        </Button>
      ))}
    </div>
  )
}

/**
 * Acciones predefinidas comunes
 */
export const commonActions = {
  edit: (onClick: () => void, disabled = false): Action => ({
    label: "Editar",
    icon: <Edit className="h-4 w-4" />,
    onClick,
    disabled,
  }),
  delete: (onClick: () => void, disabled = false): Action => ({
    label: "Eliminar",
    icon: <Trash2 className="h-4 w-4" />,
    onClick,
    variant: "destructive" as const,
    disabled,
  }),
  view: (onClick: () => void, disabled = false): Action => ({
    label: "Ver",
    icon: <Eye className="h-4 w-4" />,
    onClick,
    disabled,
  }),
}
