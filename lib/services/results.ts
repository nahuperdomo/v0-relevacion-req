import { fetchApi } from "../api-config"

export interface Result {
  id: string
  interviewId: string
  employeeId: string
  sectionId: string
  summary: string
  topicsDetected: string[]
  sentiment: "positive" | "neutral" | "negative"
  criticalIssues: string[]
  improvementOpportunities: string[]
  urgencyLevel: number
  productivityImpact: number
  additionalNotes?: string
  createdAt: string
}

export interface CreateResultData {
  interviewId: string
  employeeId: string
  summary: string
  topicsDetected: string[]
  sentiment: "positive" | "neutral" | "negative"
  criticalIssues: string[]
  improvementOpportunities: string[]
  urgencyLevel: number
  productivityImpact: number
  additionalNotes?: string
}

export interface ResultsResponse {
  data: Result[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ResultStats {
  totalResults: number
  sentimentDistribution: {
    positive: number
    neutral: number
    negative: number
  }
  mostCommonTopics: string[]
}

export interface AggregateReport {
  globalSummary: string
  mostCommonTopics: string[]
  departmentalBreakdown: {
    [key: string]: {
      criticalIssues: string[]
      averageUrgency: number
      employeesAffected: number
    }
  }
  topImprovementOpportunities: string[]
  sentimentDistribution: {
    positive: number
    neutral: number
    negative: number
  }
  totalInterviewsAnalyzed: number
  generatedAt: string
}

export const resultsApi = {
  getAll: async (params?: {
    interviewId?: string
    employeeId?: string
    sectionId?: string
    sentiment?: string
    minUrgencyLevel?: number
    topics?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<ResultsResponse> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) queryParams.append(key, value.toString())
      })
    }
    return fetchApi(`/results?${queryParams.toString()}`)
  },

  getById: async (id: string): Promise<Result> => {
    return fetchApi(`/results/${id}`)
  },

  getStats: async (): Promise<ResultStats> => {
    return fetchApi("/results/stats")
  },

  create: async (data: CreateResultData): Promise<Result> => {
    return fetchApi("/results", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Partial<CreateResultData>): Promise<Result> => {
    return fetchApi(`/results/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi(`/results/${id}`, {
      method: "DELETE",
    })
  },

  aggregate: async (data: {
    sectionIds: string[]
    startDate: string
    endDate: string
    criticalOnly?: boolean
  }): Promise<AggregateReport> => {
    return fetchApi("/results/aggregate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  getByInterview: async (interviewId: string): Promise<Result[]> => {
    return fetchApi(`/results/by-interview/${interviewId}`)
  },

  getByEmployee: async (employeeId: string): Promise<Result[]> => {
    return fetchApi(`/results/by-employee/${employeeId}`)
  },

  getBySection: async (sectionId: string): Promise<Result[]> => {
    return fetchApi(`/results/by-section/${sectionId}`)
  },

  exportResult: async (
    id: string,
    format: "pdf" | "excel" | "json",
  ): Promise<{
    result: Result
    exportMetadata: any
    downloadUrl: string
    message: string
  }> => {
    return fetchApi(`/results/${id}/export`, {
      method: "POST",
      body: JSON.stringify({ format }),
    })
  },

  getReport: async (id: string): Promise<any> => {
    return fetchApi(`/results/report/${id}`)
  },

  compareResults: async (params: {
    result_ids: string[]
    comparison_type?: string
  }): Promise<any> => {
    const queryParams = new URLSearchParams()
    queryParams.append("result_ids", params.result_ids.join(","))
    if (params.comparison_type) {
      queryParams.append("comparison_type", params.comparison_type)
    }
    return fetchApi(`/results/compare?${queryParams.toString()}`)
  },
}
