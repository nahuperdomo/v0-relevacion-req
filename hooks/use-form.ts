import { useState, useCallback } from "react"

/**
 * Hook reutilizable para manejar formularios con validación
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | undefined>>
) {
  const [formData, setFormData] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const handleChange = useCallback((name: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear error when field changes
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }, [])

  const handleBlur = useCallback((name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    
    // Validate on blur if rules exist
    if (validationRules?.[name]) {
      const error = validationRules[name]!(formData[name])
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }))
      }
    }
  }, [formData, validationRules])

  const validate = useCallback((): boolean => {
    if (!validationRules) return true

    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.keys(validationRules).forEach((key) => {
      const fieldKey = key as keyof T
      const validator = validationRules[fieldKey]
      if (validator) {
        const error = validator(formData[fieldKey])
        if (error) {
          newErrors[fieldKey] = error
          isValid = false
        }
      }
    })

    setErrors(newErrors)
    return isValid
  }, [formData, validationRules])

  const reset = useCallback(() => {
    setFormData(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const setValues = useCallback((values: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...values }))
  }, [])

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValues,
    setFormData,
  }
}

/**
 * Validadores comunes reutilizables
 */
export const validators = {
  required: (message = "Este campo es requerido") => (value: any) => {
    if (!value || (typeof value === "string" && !value.trim())) {
      return message
    }
  },
  
  email: (message = "Email inválido") => (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message
    }
  },
  
  minLength: (min: number, message?: string) => (value: string) => {
    if (value && value.length < min) {
      return message || `Debe tener al menos ${min} caracteres`
    }
  },
  
  maxLength: (max: number, message?: string) => (value: string) => {
    if (value && value.length > max) {
      return message || `No debe exceder ${max} caracteres`
    }
  },
  
  phone: (message = "Número de teléfono inválido") => (value: string) => {
    if (value && !/^\+?[\d\s-]{10,}$/.test(value)) {
      return message
    }
  },
  
  number: (message = "Debe ser un número válido") => (value: any) => {
    if (value && isNaN(Number(value))) {
      return message
    }
  },
  
  min: (min: number, message?: string) => (value: number) => {
    if (value < min) {
      return message || `Debe ser mayor o igual a ${min}`
    }
  },
  
  max: (max: number, message?: string) => (value: number) => {
    if (value > max) {
      return message || `Debe ser menor o igual a ${max}`
    }
  },
}
