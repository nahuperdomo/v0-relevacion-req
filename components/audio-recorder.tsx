"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void
    onCancel?: () => void
    disabled?: boolean
}

export function AudioRecorder({ onRecordingComplete, onCancel, disabled = false }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [hasRecording, setHasRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [error, setError] = useState<string | null>(null)
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const startRecording = async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            })
            
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
                
                // Validar tamaño (20MB)
                if (blob.size > 20 * 1024 * 1024) {
                    setError('La grabación es demasiado larga. Máximo 20MB.')
                    chunksRef.current = []
                    return
                }
                
                setAudioBlob(blob)
                setHasRecording(true)
                
                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                }
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (err) {
            console.error('Error accessing microphone:', err)
            setError('No se pudo acceder al micrófono. Verifica los permisos.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }

    const handleDelete = () => {
        setHasRecording(false)
        setAudioBlob(null)
        setRecordingTime(0)
        chunksRef.current = []
        
        if (onCancel) {
            onCancel()
        }
    }

    const handleSend = () => {
        if (audioBlob) {
            onRecordingComplete(audioBlob)
            // Reset state
            setHasRecording(false)
            setAudioBlob(null)
            setRecordingTime(0)
            chunksRef.current = []
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (error) {
        return (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center justify-between">
                <span>{error}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                >
                    Cerrar
                </Button>
            </div>
        )
    }

    if (hasRecording && audioBlob) {
        return (
            <div className="p-3 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Mic className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">Audio grabado</p>
                            <p className="text-xs text-muted-foreground">Duración: {formatTime(recordingTime)}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        className="h-8 w-8 flex-shrink-0"
                        title="Eliminar"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                
                {/* Audio preview */}
                <audio
                    controls
                    src={URL.createObjectURL(audioBlob)}
                    className="w-full h-8"
                />

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSend}
                        className="flex-1 bg-primary hover:bg-primary/90"
                    >
                        Enviar Audio
                    </Button>
                </div>
            </div>
        )
    }

    if (isRecording) {
        return (
            <div className="p-4 bg-muted rounded-lg border-2 border-destructive/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <Mic className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="absolute -top-1 -right-1">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">Grabando...</p>
                            <p className="text-xl font-mono font-semibold">{formatTime(recordingTime)}</p>
                        </div>
                    </div>
                    <Button
                        onClick={stopRecording}
                        variant="destructive"
                        size="default"
                        className="flex-shrink-0"
                    >
                        <Square className="h-4 w-4 mr-2 fill-current" />
                        Detener
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Button
            onClick={startRecording}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="gap-2"
        >
            <Mic className="h-4 w-4" />
            Grabar Audio
        </Button>
    )
}
