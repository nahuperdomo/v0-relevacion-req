import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { InlineLoader } from "./loading-state"
import { EmptyState } from "./empty-state"
import { FileX, ChevronLeft, ChevronRight } from "lucide-react"

export interface Column<T> {
  key: string
  header: string
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  keyExtractor: (row: T) => string
}

/**
 * Componente reutilizable de tabla de datos con paginación
 */
export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  emptyDescription = "Comienza agregando nuevos elementos",
  onRowClick,
  pagination,
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <InlineLoader className="h-8 w-8" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <EmptyState icon={FileX} title={emptyMessage} description={emptyDescription} />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} style={{ width: column.width }}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.cell
                      ? column.cell(row)
                      : String((row as any)[column.key] || "-")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.currentPage} de {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
