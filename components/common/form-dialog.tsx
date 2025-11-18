import { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InlineLoader } from "./loading-state"

export interface FormField {
  name: string
  label: string
  type: "text" | "email" | "number" | "select" | "textarea" | "date" | "time" | "tel"
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ value: string; label: string }>
  value?: any
  onChange?: (value: any) => void
  rows?: number
  min?: number
  max?: number
  step?: number
}

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: FormField[]
  onSubmit: () => void | Promise<void>
  submitLabel?: string
  cancelLabel?: string
  loading?: boolean
  formData: Record<string, any>
  onFieldChange: (name: string, value: any) => void
  customContent?: ReactNode
}

/**
 * Componente reutilizable de diálogo con formulario
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onSubmit,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  loading = false,
  formData,
  onFieldChange,
  customContent,
}: FormDialogProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit()
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? field.value ?? ""

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.name}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled || loading}
            value={value}
            onChange={(e) => (field.onChange || onFieldChange)(field.name, e.target.value)}
            rows={field.rows || 4}
          />
        )

      case "select":
        return (
          <Select
            value={value}
            onValueChange={(val) => (field.onChange || onFieldChange)(field.name, val)}
            disabled={field.disabled || loading}
          >
            <SelectTrigger id={field.name}>
              <SelectValue placeholder={field.placeholder || "Seleccionar..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "number":
        return (
          <Input
            id={field.name}
            type="number"
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled || loading}
            value={value}
            onChange={(e) => (field.onChange || onFieldChange)(field.name, Number(e.target.value))}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        )

      default:
        return (
          <Input
            id={field.name}
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled || loading}
            value={value}
            onChange={(e) => (field.onChange || onFieldChange)(field.name, e.target.value)}
          />
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {fields.map((field) => (
              <div key={field.name} className="grid gap-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
            {customContent}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <InlineLoader className="mr-2" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
