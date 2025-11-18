import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Result } from '@/lib/services/results'

// Definir colores corporativos
const COLORS = {
  primary: '#6366f1', // Indigo
  secondary: '#8b5cf6', // Violet
  success: '#10b981', // Emerald
  warning: '#f59e0b', // Amber
  danger: '#ef4444', // Red
  dark: '#1e293b', // Slate dark
  gray: '#64748b', // Slate
  lightGray: '#f1f5f9', // Slate light
  white: '#ffffff',
}

/**
 * Genera un PDF estético con el detalle de un reporte consolidado
 */
export async function generateConsolidatedReportPDF(
  result: Result,
  interviewTitle: string,
  individualCount: number
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPosition = margin

  // ========== ENCABEZADO ==========
  // Fondo del encabezado
  doc.setFillColor(COLORS.primary)
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Logo o título principal
  doc.setTextColor(COLORS.white)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE CONSOLIDADO', margin, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(interviewTitle, margin, 30)

  // Fecha de generación
  const fecha = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.setFontSize(10)
  doc.text(`Fecha: ${fecha}`, margin, 38)

  yPosition = 55

  // ========== INFORMACIÓN GENERAL ==========
  doc.setTextColor(COLORS.dark)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMACION GENERAL', margin, yPosition)
  yPosition += 8

  // Tabla de información general
  const infoData = [
    ['ID de Entrevista', result.interviewId || 'N/A'],
    ['Empleados Entrevistados', individualCount.toString()],
    ['Nivel de Urgencia', `${result.urgencyLevel || 0}/5`],
    ['Sentimiento General', result.sentiment || 'N/A'],
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: infoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, textColor: COLORS.gray },
      1: { cellWidth: 'auto', textColor: COLORS.dark },
    },
    margin: { left: margin, right: margin },
  })

  yPosition = (doc as any).lastAutoTable.finalY + 12

  // ========== RESUMEN EJECUTIVO ==========
  if (result.summary) {
    // Verificar si necesitamos una nueva página
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.dark)
    doc.text('RESUMEN EJECUTIVO', margin, yPosition)
    yPosition += 8

    // Fondo del resumen
    const summaryLines = doc.splitTextToSize(result.summary, pageWidth - 2 * margin - 10)
    const summaryHeight = summaryLines.length * 6 + 10

    doc.setFillColor(COLORS.lightGray)
    doc.roundedRect(margin, yPosition - 2, pageWidth - 2 * margin, summaryHeight, 3, 3, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.dark)
    doc.text(summaryLines, margin + 5, yPosition + 5)

    yPosition += summaryHeight + 12
  }

  // ========== TEMAS PRINCIPALES ==========
  if (result.topicsDetected && result.topicsDetected.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.dark)
    doc.text('TEMAS PRINCIPALES DETECTADOS', margin, yPosition)
    yPosition += 8

    // Crear grid de badges para los temas
    const topicsData = result.topicsDetected.map((topic, index) => [
      `${index + 1}`,
      topic,
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Tema']],
      body: topicsData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: COLORS.dark,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
      alternateRowStyles: {
        fillColor: COLORS.lightGray,
      },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 12
  }

  // ========== PROBLEMAS CRÍTICOS ==========
  if (result.criticalIssues && result.criticalIssues.length > 0) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.danger)
    doc.text('PROBLEMAS CRITICOS', margin, yPosition)
    yPosition += 8

    const issuesData = result.criticalIssues.map((issue, index) => [
      `${index + 1}`,
      issue,
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Problema']],
      body: issuesData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.danger,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: COLORS.dark,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
      alternateRowStyles: {
        fillColor: '#fee2e2', // Red light
      },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 12
  }

  // ========== OPORTUNIDADES DE MEJORA ==========
  if (result.improvementOpportunities && result.improvementOpportunities.length > 0) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.success)
    doc.text('RECOMENDACIONES Y OPORTUNIDADES', margin, yPosition)
    yPosition += 8

    const opportunitiesData = result.improvementOpportunities.map((opp, index) => [
      `${index + 1}`,
      opp,
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Recomendación']],
      body: opportunitiesData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.success,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: COLORS.dark,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
      alternateRowStyles: {
        fillColor: '#d1fae5', // Emerald light
      },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 12
  }

  // ========== PIE DE PÁGINA EN TODAS LAS PÁGINAS ==========
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Línea separadora
    doc.setDrawColor(COLORS.gray)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    // Texto del pie
    doc.setFontSize(8)
    doc.setTextColor(COLORS.gray)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Reporte generado automáticamente - Sistema de Relevación de Requerimientos`,
      margin,
      pageHeight - 10
    )
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  // ========== GUARDAR PDF ==========
  const fileName = `reporte-consolidado-${result.interviewId}-${Date.now()}.pdf`
  doc.save(fileName)
}

/**
 * Genera un PDF para un resultado individual
 */
export async function generateIndividualReportPDF(
  result: Result
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPosition = margin

  // ========== ENCABEZADO ==========
  doc.setFillColor(COLORS.primary)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(COLORS.white)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE INDIVIDUAL', margin, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(result.employeeName || result.employeeId || 'Empleado', margin, 30)

  const fecha = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.setFontSize(10)
  doc.text(`Fecha: ${fecha}`, margin, 38)

  yPosition = 55

  // ========== INFORMACIÓN GENERAL ==========
  doc.setTextColor(COLORS.dark)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMACION DEL EMPLEADO', margin, yPosition)
  yPosition += 8

  const infoData = [
    ['Nombre', result.employeeName || 'N/A'],
    ['ID Empleado', result.employeeId || 'N/A'],
    ['Entrevista', result.interviewTitle || result.interviewId || 'N/A'],
    ['Nivel de Urgencia', `${result.urgencyLevel || 0}/5`],
    ['Sentimiento', result.sentiment || 'N/A'],
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: infoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, textColor: COLORS.gray },
      1: { cellWidth: 'auto', textColor: COLORS.dark },
    },
    margin: { left: margin, right: margin },
  })

  yPosition = (doc as any).lastAutoTable.finalY + 12

  // ========== RESUMEN ==========
  if (result.summary) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.dark)
    doc.text('RESUMEN DE LA ENTREVISTA', margin, yPosition)
    yPosition += 8

    const summaryLines = doc.splitTextToSize(result.summary, pageWidth - 2 * margin - 10)
    const summaryHeight = summaryLines.length * 6 + 10

    doc.setFillColor(COLORS.lightGray)
    doc.roundedRect(margin, yPosition - 2, pageWidth - 2 * margin, summaryHeight, 3, 3, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.dark)
    doc.text(summaryLines, margin + 5, yPosition + 5)

    yPosition += summaryHeight + 12
  }

  // ========== TEMAS DETECTADOS ==========
  if (result.topicsDetected && result.topicsDetected.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.dark)
    doc.text('TEMAS DETECTADOS', margin, yPosition)
    yPosition += 8

    const topicsData = result.topicsDetected.map((topic, index) => [
      `${index + 1}`,
      topic,
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Tema']],
      body: topicsData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: COLORS.dark,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
      alternateRowStyles: {
        fillColor: COLORS.lightGray,
      },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 12
  }

  // ========== PROBLEMAS CRÍTICOS ==========
  if (result.criticalIssues && result.criticalIssues.length > 0) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.danger)
    doc.text('PROBLEMAS CRITICOS', margin, yPosition)
    yPosition += 8

    const issuesData = result.criticalIssues.map((issue, index) => [
      `${index + 1}`,
      issue,
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Problema']],
      body: issuesData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.danger,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: COLORS.dark,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
      alternateRowStyles: {
        fillColor: '#fee2e2',
      },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 12
  }

  // ========== OPORTUNIDADES DE MEJORA ==========
  if (result.improvementOpportunities && result.improvementOpportunities.length > 0) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.success)
    doc.text('OPORTUNIDADES DE MEJORA', margin, yPosition)
    yPosition += 8

    const opportunitiesData = result.improvementOpportunities.map((opp, index) => [
      `${index + 1}`,
      opp,
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Oportunidad']],
      body: opportunitiesData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.success,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: COLORS.dark,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
      alternateRowStyles: {
        fillColor: '#d1fae5',
      },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 12
  }

  // ========== PIE DE PÁGINA ==========
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    doc.setDrawColor(COLORS.gray)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    doc.setFontSize(8)
    doc.setTextColor(COLORS.gray)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Reporte generado automáticamente - Sistema de Relevación de Requerimientos`,
      margin,
      pageHeight - 10
    )
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  // ========== GUARDAR PDF ==========
  const fileName = `reporte-individual-${result.employeeId || 'empleado'}-${Date.now()}.pdf`
  doc.save(fileName)
}
