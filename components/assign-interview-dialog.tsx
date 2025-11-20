"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface Employee {
    employee_id: string
    name: string
    position: string
}

interface Interview {
    interview_id: string
    title: string
    description: string
}

export function AssignInterviewDialog() {
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [interviews, setInterviews] = useState<Interview[]>([])

    const [selectedEmployee, setSelectedEmployee] = useState("")
    const [selectedInterview, setSelectedInterview] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [notificationChannel, setNotificationChannel] = useState<"platform" | "whatsapp">("platform")

    // Fetch data when dialog opens
    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open])

    const fetchData = async () => {
        try {
            // Fetch employees
            const empRes = await fetch('http://localhost:3000/api/v1/employees')
            const empData = await empRes.json()
            if (empData.success) setEmployees(empData.data)

            // Fetch interviews
            const intRes = await fetch('http://localhost:3000/api/v1/interviews')
            const intData = await intRes.json()
            if (intData.success) setInterviews(intData.data)
        } catch (error) {
            console.error('Error fetching data:', error)
        }
    }

    const handleAssign = async () => {
        if (!selectedEmployee || !selectedInterview || !user) return

        setIsLoading(true)
        try {
            const response = await fetch('http://localhost:3000/api/v1/interview-assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    interviewId: selectedInterview,
                    employeeId: selectedEmployee,
                    dueDate: dueDate || undefined,
                    assignedBy: user.id, // Admin ID
                    notificationChannel: notificationChannel,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setOpen(false)
                // Reset form
                setSelectedEmployee("")
                setSelectedInterview("")
                setDueDate("")
                setNotificationChannel("platform")
                // TODO: Trigger refresh of assignments list if needed
            }
        } catch (error) {
            console.error('Error assigning interview:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Asignar Entrevista
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Asignar Nueva Entrevista</DialogTitle>
                    <DialogDescription>
                        Selecciona un empleado y una entrevista para asignarla.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="employee">Empleado</Label>
                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar empleado" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                                        {emp.name} - {emp.position}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="interview">Entrevista</Label>
                        <Select value={selectedInterview} onValueChange={setSelectedInterview}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar entrevista" />
                            </SelectTrigger>
                            <SelectContent>
                                {interviews.map((int) => (
                                    <SelectItem key={int.interview_id} value={int.interview_id}>
                                        {int.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="dueDate">Fecha Límite (Opcional)</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notificationChannel">Canal de Notificación</Label>
                        <Select value={notificationChannel} onValueChange={(value: "platform" | "whatsapp") => setNotificationChannel(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="platform">
                                    <div className="flex flex-col">
                                        <span className="font-medium">Solo Plataforma</span>
                                        <span className="text-xs text-muted-foreground">El empleado verá la asignación en su panel</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="whatsapp">
                                    <div className="flex flex-col">
                                        <span className="font-medium">WhatsApp + Plataforma</span>
                                        <span className="text-xs text-muted-foreground">Enviar mensaje de WhatsApp además de notificar en la plataforma</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedEmployee || !selectedInterview || isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Asignar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
