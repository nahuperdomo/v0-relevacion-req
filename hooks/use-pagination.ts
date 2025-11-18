import { useState, useEffect, useCallback } from "react"

interface PaginationOptions {
  initialPage?: number
  initialLimit?: number
}

/**
 * Hook reutilizable para manejar paginación
 */
export function usePagination<T>(
  allData: T[],
  options: PaginationOptions = {}
) {
  const { initialPage = 1, initialLimit = 10 } = options
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const totalPages = Math.ceil(allData.length / limit)
  const startIndex = (currentPage - 1) * limit
  const endIndex = startIndex + limit
  const currentData = allData.slice(startIndex, endIndex)

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setCurrentPage(1) // Reset to first page when changing limit
  }, [])

  // Reset to page 1 when data length changes significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [allData.length, currentPage, totalPages])

  return {
    currentPage,
    totalPages,
    limit,
    currentData,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}

/**
 * Hook para filtrado de datos
 */
export function useFilter<T>(
  data: T[],
  filterFn: (item: T, query: string) => boolean
) {
  const [query, setQuery] = useState("")
  const [filteredData, setFilteredData] = useState(data)

  useEffect(() => {
    if (!query.trim()) {
      setFilteredData(data)
    } else {
      setFilteredData(data.filter((item) => filterFn(item, query)))
    }
  }, [data, query, filterFn])

  return {
    query,
    setQuery,
    filteredData,
  }
}

/**
 * Hook combinado para paginación y filtrado
 */
export function usePaginatedFilter<T>(
  data: T[],
  filterFn: (item: T, query: string) => boolean,
  paginationOptions?: PaginationOptions
) {
  const { query, setQuery, filteredData } = useFilter(data, filterFn)
  const pagination = usePagination(filteredData, paginationOptions)

  return {
    query,
    setQuery,
    ...pagination,
  }
}
