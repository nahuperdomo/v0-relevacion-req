/**
 * Tipos comunes compartidos en toda la aplicación
 */

export type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date' | 'time';
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[];
  validation?: (value: any) => string | undefined;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface ActionButton {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
}
