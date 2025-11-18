import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
  successMessage?: string
  errorMessage?: string
}

/**
 * Hook reutilizable para manejar llamadas a API con estado de carga y errores
 */
export function useApi<T = any>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const execute = useCallback(
    async (apiCall: () => Promise<T>, options?: UseApiOptions<T>): Promise<T | null> => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiCall()
        
        if (options?.successMessage) {
          toast({
            title: "Éxito",
            description: options.successMessage,
          })
        }
        
        options?.onSuccess?.(data)
        return data
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        
        toast({
          title: "Error",
          description: options?.errorMessage || error.message,
          variant: "destructive",
        })
        
        options?.onError?.(err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  return { loading, error, execute }
}

/**
 * Hook para operaciones CRUD con estado común
 */
export function useCrud<T extends { id?: string } | { [key: string]: any }>() {
  const [data, setData] = useState<T[]>([])
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const { loading, error, execute } = useApi<T>()

  const loadAll = useCallback(
    async (apiCall: () => Promise<any>) => {
      const result = await execute(apiCall as any)
      if (result) {
        // Handle different response structures
        if (Array.isArray(result)) {
          setData(result)
        } else if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
          setData(result.data)
        } else if (result && typeof result === 'object') {
          // Try to find the array in common property names
          const possibleArrays = Object.values(result).find(v => Array.isArray(v))
          if (possibleArrays) {
            setData(possibleArrays as T[])
          }
        }
      }
    },
    [execute]
  )

  const create = useCallback(
    async (apiCall: () => Promise<T>, successMessage?: string) => {
      const newItem = await execute(apiCall, { successMessage })
      if (newItem) {
        setData((prev) => [...prev, newItem])
      }
      return newItem
    },
    [execute]
  )

  const update = useCallback(
    async (id: string, apiCall: () => Promise<T>, successMessage?: string) => {
      const updatedItem = await execute(apiCall, { successMessage })
      if (updatedItem) {
        setData((prev) =>
          prev.map((item) => {
            const itemId = 'id' in item ? item.id : Object.values(item)[0]
            return itemId === id ? updatedItem : item
          })
        )
      }
      return updatedItem
    },
    [execute]
  )

  const remove = useCallback(
    async (id: string, apiCall: () => Promise<any>, successMessage?: string) => {
      const result = await execute(apiCall, { successMessage })
      if (result !== null) {
        setData((prev) =>
          prev.filter((item) => {
            const itemId = 'id' in item ? item.id : Object.values(item)[0]
            return itemId !== id
          })
        )
      }
      return result
    },
    [execute]
  )

  return {
    data,
    setData,
    selectedItem,
    setSelectedItem,
    loading,
    error,
    loadAll,
    create,
    update,
    remove,
  }
}
