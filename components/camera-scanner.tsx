"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { detectFaces, loadFaceAPI } from "@/lib/face-recognition"
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

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users")
      if (res.ok) setUsers(await res.json())
    } catch (err) {
      console.error("Failed to load users:", err)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    async function getCameras() {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === "videoinput")
      setCameras(videoDevices)
      if (!selectedCamera && videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId)
      }
    }
    getCameras()
  }, [selectedCamera])

  const startCamera = () => setIsCameraActive(true)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    streamRef.current = null
    setIsCameraActive(false)
    setRecognizedFaces([])
  }

  useEffect(() => {
    const enableCamera = async () => {
      if (!videoRef.current) {
        requestAnimationFrame(enableCamera)
        return
      }

      try {
        // If no selected camera yet, just request default
        const constraints = selectedCamera
          ? { video: { deviceId: { exact: selectedCamera } } }
          : { video: true }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setMessage(null)

        // After permission granted, fetch cameras with labels
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === "videoinput")
        setCameras(videoDevices)
        if (!selectedCamera && videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId)
        }
      } catch (err) {
        console.error("Camera access error:", err)
        setMessage({ type: "error", text: "Camera access denied or not available." })
      }
    }

    if (isCameraActive) {
      requestAnimationFrame(enableCamera)
    }

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop())
      if (videoRef.current) videoRef.current.srcObject = null
      streamRef.current = null
    }
  }, [isCameraActive, selectedCamera])


  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current || users.length === 0) {
      setMessage({ type: "error", text: "Camera not ready or no users." })
      return
    }

    setLoading(true)
    setMessage(null)
    setRecognizedFaces([])

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const faceapi = await loadFaceAPI()
    const detections = await detectFaces(video)

    if (!detections.length) {
      setMessage({ type: "error", text: "No face detected." })
      setLoading(false)
      return
    }

    const recognized: RecognizedFace[] = []
    const THRESHOLD = 0.4

    for (const detection of detections) {
      let bestMatch: RecognizedFace | null = null
      let bestDistance = Infinity

      for (const user of users) {
        const descriptor = new Float32Array(user.face_encoding)
        const distance = faceapi.euclideanDistance(detection.descriptor, descriptor)
        if (distance < bestDistance && distance < THRESHOLD) {
          bestDistance = distance
          bestMatch = {
            user,
            confidence: Math.max(0, (1 - distance / THRESHOLD) * 100),
          }
        }
      }

      if (bestMatch) recognized.push(bestMatch)
    }

    setRecognizedFaces(recognized)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, detections)

    setMessage({
      type: recognized.length ? "success" : "error",
      text: recognized.length
        ? `Recognized: ${recognized.map(r => r.user.name).join(", ")}`
        : "No known face matched.",
    })

    setLoading(false)
  }

  const markAttendance = async () => {
    if (!recognizedFaces.length) {
      setMessage({ type: "error", text: "No recognized face." })
      return
    }

    setLoading(true)
    try {
      await Promise.all(
        recognizedFaces.map(face =>
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: face.user.user_id,
              confidence_score: face.confidence / 100,
            }),
          })
        )
      )
      setMessage({ type: "success", text: "Attendance marked." })
      setRecognizedFaces([])
    } catch {
      setMessage({ type: "error", text: "Failed to mark attendance." })
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
            <Button onClick={startCamera}>
              <Camera className="mr-2 h-5 w-5" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="outline">
              <CameraOff className="mr-2 h-5 w-5" />
              Stop Camera
            </Button>
          )}
        </div>

        {isCameraActive && cameras.length > 1 && (
          <div className="flex justify-center">
            <select
              className="p-2 border rounded-md"
              value={selectedCamera || ""}
              onChange={e => setSelectedCamera(e.target.value)}
              aria-label="Select camera"
            >
              {cameras.map(cam => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${cam.deviceId}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {isCameraActive && (
          <>
            <div className="relative">
              <video ref={videoRef} autoPlay muted playsInline className="w-full max-h-96 object-cover rounded-lg" />
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
            </div>

            <div className="flex justify-center gap-2">
              <Button onClick={captureAndRecognize} disabled={loading}>
                {loading ? "Scanning..." : "Scan Face"}
              </Button>

              {recognizedFaces.length > 0 && (
                <Button onClick={markAttendance} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Mark Present
                </Button>
              )}
            </div>
          </>
        )}

        {recognizedFaces.length > 0 && (
          <div className="space-y-2 text-center">
            <h3 className="font-semibold">Recognized:</h3>
            <div className="flex justify-center flex-wrap gap-2">
              {recognizedFaces.map((face, i) => (
                <Badge key={i} className="text-sm px-3 py-1">
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
      </CardContent>
    </Card>
  )
}
