# Servicios de API - Frontend

## Configuración

### Variables de Entorno

Creá un archivo `.env.local` con:

```bash
# Desarrollo local (backend en localhost:3000)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# O usando ngrok para exponer el backend
# NEXT_PUBLIC_API_URL=https://tu-url.ngrok-free.app/api/v1
```

### Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Modo desarrollo (puerto 3001 por defecto)
npm run dev

# Build para producción
npm run build
npm start
```

## Servicios Disponibles

### 1. Admins API (`lib/services/admins.ts`)

```typescript
import { adminsApi } from "@/lib/services"

// Obtener admin por ID
const admin = await adminsApi.getById("adm-001")

// Crear nuevo admin
const newAdmin = await adminsApi.create({
  name: "Juan Pérez",
  email: "juan@empresa.com",
  role: "ADMIN",
  password: "securepass123",
})

// Actualizar admin
const updated = await adminsApi.update("adm-001", {
  name: "Juan Pérez Actualizado",
})

// Eliminar admin
await adminsApi.delete("adm-001")
```

### 2. Sections API (`lib/services/sections.ts`)

```typescript
import { sectionsApi } from "@/lib/services"

// Listar todas las secciones
const sections = await sectionsApi.getAll()

// Obtener sección por ID
const section = await sectionsApi.getById("sec-IT")

// Crear nueva sección
const newSection = await sectionsApi.create({
  name: "Área de Tecnología",
  agent_id: "agt-it-001",
  admin_id: "adm-001",
  interviews_configured: ["int-001"],
})

// Actualizar sección
const updated = await sectionsApi.update("sec-IT", {
  name: "IT Department",
})

// Eliminar sección
await sectionsApi.delete("sec-IT")
```

### 3. Employees API (`lib/services/employees.ts`)

```typescript
import { employeesApi } from "@/lib/services"

// Listar empleados con filtros
const { employees, total } = await employeesApi.getAll({
  section_id: "sec-IT",
  status: "ACTIVE",
  page: 1,
  limit: 10,
})

// Obtener empleado por ID
const employee = await employeesApi.getById("emp-001")

// Obtener empleados de una sección
const sectionEmployees = await employeesApi.getBySection("sec-IT")

// Crear empleado
const newEmployee = await employeesApi.create({
  name: "María González",
  section_id: "sec-IT",
  job_id: "job-dev-001",
  contact_info: {
    whatsapp_number: "+5491123456789",
    email: "maria@empresa.com",
  },
})

// Actualizar empleado
const updated = await employeesApi.update("emp-001", {
  status: "ON_LEAVE",
})

// Asignar entrevista a empleado
await employeesApi.assignInterview("emp-001", "int-001")

// Eliminar empleado
await employeesApi.delete("emp-001")
```

### 4. Agents API (`lib/services/agents.ts`)

```typescript
import { agentsApi } from "@/lib/services"

// Listar agentes con filtros
const { agents, total } = await agentsApi.getAll({
  section_id: "sec-IT",
  status: "ACTIVE",
  page: 1,
  limit: 10,
})

// Obtener estadísticas de agentes
const stats = await agentsApi.getStats()

// Crear agente
const newAgent = await agentsApi.create({
  name: "Asistente IT",
  description: "Agente especializado en IT",
  tone: "PROFESSIONAL",
  embedding_profile: "IT_SPECIALIST",
  section_id: "sec-IT",
  prompt_config: {
    system_prompt: "Eres un asistente especializado...",
    greeting_prompt: "Hola, soy tu asistente...",
    closing_prompt: "Gracias por tu tiempo...",
    context_instructions: "Contexto adicional...",
  },
  model_config: {
    model: "gpt-4",
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
  },
  specialties: ["Software", "Hardware", "Redes"],
})

// Probar agente
const testResult = await agentsApi.test("agt-001", {
  test_message: "Hola, ¿cómo estás?",
  context: "Contexto de prueba",
})

// Activar/Desactivar agente
await agentsApi.activate("agt-001")
await agentsApi.deactivate("agt-001")

// Clonar agente
const cloned = await agentsApi.clone("agt-001")

// Obtener agentes de una sección
const sectionAgents = await agentsApi.getBySection("sec-IT")
```

### 5. Interviews API (`lib/services/interviews.ts`)

```typescript
import { interviewsApi } from "@/lib/services"

// Listar entrevistas
const { interviews, total } = await interviewsApi.getAll({
  section_id: "sec-IT",
  status: "ACTIVE",
  page: 1,
  limit: 10,
})

// Obtener estadísticas
const stats = await interviewsApi.getStats()

// Crear entrevista
const newInterview = await interviewsApi.create({
  title: "Entrevista Clima Laboral",
  description: "Evaluación del clima laboral en IT",
  section_id: "sec-IT",
  agent_id: "agt-it-001",
  topics: ["Clima", "Satisfacción", "Herramientas"],
  duration_minutes: 15,
  type: "INDIVIDUAL",
  target_employees: ["emp-001", "emp-002"],
  schedule: {
    start_date: "2025-11-15T00:00:00Z",
    end_date: "2025-11-20T00:00:00Z",
    allowed_days: ["MONDAY", "TUESDAY", "WEDNESDAY"],
    start_time: "09:00",
    end_time: "18:00",
  },
})

// Iniciar entrevista
await interviewsApi.start("int-001", {
  start_date: "2025-11-15T09:00:00Z",
  specific_employees: ["emp-001"],
})

// Pausar/Reanudar/Completar
await interviewsApi.pause("int-001")
await interviewsApi.resume("int-001")
await interviewsApi.complete("int-001")

// Clonar entrevista
const cloned = await interviewsApi.clone("int-001")

// Ejecutar entrevista para empleados específicos
const execution = await interviewsApi.executeForEmployees({
  interview_id: "int-001",
  employee_ids: ["emp-001", "emp-002"],
  send_immediately: true,
})

// Ejecutar entrevista para toda una sección
const sectionExecution = await interviewsApi.executeForSection({
  interview_id: "int-001",
  section_id: "sec-IT",
  send_immediately: true,
})

// Obtener estado de ejecución
const executionStatus = await interviewsApi.getExecutionStatus("exec-001")

// Obtener conversaciones de una ejecución
const conversations = await interviewsApi.getExecutionConversations("exec-001")

// Detener ejecución
await interviewsApi.stopExecution("exec-001")

// Obtener ejecuciones activas
const activeExecutions = await interviewsApi.getActiveExecutions()
```

### 6. Results API (`lib/services/results.ts`)

```typescript
import { resultsApi } from "@/lib/services"

// Listar resultados con filtros
const { data, meta } = await resultsApi.getAll({
  interview_id: "int-001",
  sentiment: "positive",
  page: 1,
  limit: 10,
})

// Crear resultado
const newResult = await resultsApi.create({
  interviewId: "int-001",
  employeeId: "emp-001",
  summary: "Resumen de la entrevista...",
  topicsDetected: ["Clima", "Salario"],
  sentiment: "positive",
  criticalIssues: [],
  improvementOpportunities: ["Mejor comunicación"],
  urgencyLevel: 3,
  productivityImpact: 7,
})

// Agregar resultados
const aggregateReport = await resultsApi.aggregate({
  sectionIds: ["sec-IT", "sec-HR"],
  startDate: "2025-11-01T00:00:00Z",
  endDate: "2025-11-30T23:59:59Z",
  criticalOnly: false,
})

// Obtener resultados por entrevista/empleado/sección
const interviewResults = await resultsApi.getByInterview("int-001")
const employeeResults = await resultsApi.getByEmployee("emp-001")
const sectionResults = await resultsApi.getBySection("sec-IT")

// Exportar resultado
const exportData = await resultsApi.exportResult("result-001", "pdf")

// Obtener reporte detallado
const report = await resultsApi.getReport("result-001")

// Comparar resultados
const comparison = await resultsApi.compareResults({
  result_ids: ["result-001", "result-002"],
  comparison_type: "sentiment",
})
```

### 7. WhatsApp API (`lib/services/whatsapp.ts`)

```typescript
import { whatsappApi } from "@/lib/services"

// Enviar mensaje de prueba
const testResponse = await whatsappApi.sendTestMessage({
  to: "+5491123456789",
  message: "Mensaje de prueba",
  employee_id: "emp-001",
})

// Iniciar conversación
const conversation = await whatsappApi.startConversation({
  employee_id: "emp-001",
  interview_id: "int-001",
})

// Validar número de teléfono
const validation = await whatsappApi.validateNumber({
  phone_number: "+5491123456789",
})

// Obtener métricas de WhatsApp
const metrics = await whatsappApi.getMetrics()
```

## Manejo de Errores

Todos los servicios lanzan errores que podés capturar:

```typescript
try {
  const employee = await employeesApi.getById("emp-001")
  console.log(employee)
} catch (error) {
  console.error("Error al obtener empleado:", error.message)
  // Mostrar mensaje al usuario
}
```

## TypeScript

Todos los servicios están completamente tipados. Los tipos están definidos en cada archivo de servicio y podés importarlos:

```typescript
import type { Employee, CreateEmployeeData } from "@/lib/services/employees"
import type { Agent, AgentStats } from "@/lib/services/agents"
```

## Próximos Pasos

1. **Configurá `.env.local`** con la URL de tu backend
2. **Instalá dependencias**: `npm install`
3. **Ejecutá el frontend**: `npm run dev`
4. **Importá los servicios** en tus componentes React/Next.js
5. **Verificá que el backend esté corriendo** en `http://localhost:3000`

## Notas Importantes

- El backend debe estar ejecutándose en `http://localhost:3000` (o la URL configurada en `.env.local`)
- Para WhatsApp, necesitás tener ngrok configurado para el webhook
- Todos los endpoints (excepto webhook) requieren autenticación Bearer Token en producción
