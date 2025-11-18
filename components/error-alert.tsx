"use client"

import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, XCircle, AlertTriangle, Info } from "lucide-react"

interface ErrorAlertProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: "error" | "warning" | "info"
}

export function ErrorAlert({ isOpen, onClose, title, message, type = "error" }: ErrorAlertProps) {
  const icons = {
    error: <XCircle className="h-12 w-12 text-red-500" />,
    warning: <AlertTriangle className="h-12 w-12 text-amber-500" />,
    info: <Info className="h-12 w-12 text-blue-500" />,
  }

  const titles = {
    error: title || "Error",
    warning: title || "Advertencia",
    info: title || "Información",
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-4 pb-2">
            {icons[type]}
            <AlertDialogTitle className="text-center text-xl">
              {titles[type]}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-center whitespace-pre-line text-base leading-relaxed pt-2">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="min-w-[100px]">
            Entendido
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook para usar el ErrorAlert globalmente
let globalShowError: ((message: string, title?: string, type?: "error" | "warning" | "info") => void) | null = null

export function ErrorAlertProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [errorData, setErrorData] = useState<{
    title?: string
    message: string
    type: "error" | "warning" | "info"
  }>({
    message: "",
    type: "error",
  })

  useEffect(() => {
    globalShowError = (message: string, title?: string, type: "error" | "warning" | "info" = "error") => {
      setErrorData({ message, title, type })
      setIsOpen(true)
    }

    return () => {
      globalShowError = null
    }
  }, [])

  return (
    <>
      {children}
      <ErrorAlert
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={errorData.title}
        message={errorData.message}
        type={errorData.type}
      />
    </>
  )
}

export function showErrorAlert(message: string, title?: string, type: "error" | "warning" | "info" = "error") {
  if (globalShowError) {
    globalShowError(message, title, type)
  } else {
    // Fallback a alert nativo si el provider no está disponible
    alert(message)
  }
}
