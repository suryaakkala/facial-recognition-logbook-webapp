"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { detectFaces } from "@/lib/face-recognition"
import { Camera, CameraOff, CheckCircle } from "lucide-react"

interface User {
  user_id: string
  name: string
  image_url: string
  face_encoding: number[]
}

interface RecognizedFace {
  user: User
  confidence: number
}

export default function CameraScanner() {
  const [users, setUsers] = useState<User[]>([])
  const [recognizedFaces, setRecognizedFaces] = useState<RecognizedFace[]>([])
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const userData = await response.json()
        setUsers(userData)
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
        setMessage(null)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to access camera. Please check permissions." })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setRecognizedFaces([])
  }

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current || users.length === 0) {
      setMessage({ type: "error", text: "Camera not ready or no users registered" })
      return
    }

    setLoading(true)
    setMessage(null)
    setRecognizedFaces([])

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) return

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Create image element from canvas for face detection
      const imageData = canvas.toDataURL("image/jpeg")
      const img = new Image()

      img.onload = async () => {
        try {
          const detections = await detectFaces(img)

          if (detections.length === 0) {
            setMessage({
              type: "error",
              text: "No faces detected. Please position yourself clearly in front of the camera.",
            })
            setLoading(false)
            return
          }

          const recognized: RecognizedFace[] = []

          for (const detection of detections) {
            let bestMatch: { user: User; confidence: number } | null = null
            let bestDistance = Number.POSITIVE_INFINITY

            for (const user of users) {
              if (user.face_encoding) {
                const userDescriptor = new Float32Array(user.face_encoding)
                const distance = detection.descriptor.reduce(
                  (sum, val, i) => sum + Math.pow(val - userDescriptor[i], 2),
                  0,
                )

                if (distance < bestDistance && distance < 0.6) {
                  bestDistance = distance
                  bestMatch = {
                    user,
                    confidence: Math.max(0, (1 - distance) * 100),
                  }
                }
              }
            }

            if (bestMatch) {
              recognized.push(bestMatch)
            }
          }

          setRecognizedFaces(recognized)

          if (recognized.length > 0) {
            setMessage({
              type: "success",
              text: `Recognized: ${recognized.map((r) => r.user.name).join(", ")}`,
            })
          } else {
            setMessage({ type: "error", text: "No registered faces found. Please register first or try again." })
          }
        } catch (error) {
          setMessage({ type: "error", text: "Error during face recognition" })
        } finally {
          setLoading(false)
        }
      }

      img.src = imageData
    } catch (error) {
      setMessage({ type: "error", text: "Error capturing image" })
      setLoading(false)
    }
  }

  const markAttendance = async () => {
    if (recognizedFaces.length === 0) {
      setMessage({ type: "error", text: "No faces recognized to mark attendance" })
      return
    }

    setLoading(true)

    try {
      const attendancePromises = recognizedFaces.map((face) =>
        fetch("/api/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: face.user.user_id,
            confidence_score: face.confidence / 100,
          }),
        }),
      )

      await Promise.all(attendancePromises)
      setMessage({
        type: "success",
        text: `Attendance marked successfully for ${recognizedFaces.length} person(s)!`,
      })
      setRecognizedFaces([])
    } catch (error) {
      setMessage({ type: "error", text: "Failed to mark attendance" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Camera className="h-6 w-6" />
          Face Recognition Scanner
        </CardTitle>
        <CardDescription>Click scan to open camera and detect your face for attendance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-2">
          {!isCameraActive ? (
            <Button onClick={startCamera} size="lg" className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="outline" size="lg" className="flex items-center gap-2 bg-transparent">
              <CameraOff className="h-5 w-5" />
              Stop Camera
            </Button>
          )}
        </div>

        {isCameraActive && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-96 object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex justify-center gap-2">
              <Button onClick={captureAndRecognize} disabled={loading} size="lg" className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {loading ? "Scanning..." : "Scan Face"}
              </Button>

              {recognizedFaces.length > 0 && (
                <Button
                  onClick={markAttendance}
                  disabled={loading}
                  size="lg"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-5 w-5" />
                  Mark Present
                </Button>
              )}
            </div>
          </div>
        )}

        {recognizedFaces.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-center">Recognized:</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {recognizedFaces.map((face, index) => (
                <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                  {face.user.name} ({face.confidence.toFixed(1)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription className="text-center">{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-muted-foreground">{users.length} users registered in the system</div>
      </CardContent>
    </Card>
  )
}
