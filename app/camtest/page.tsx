'use client'
import { useEffect, useRef } from "react"

export default function CamTest() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          console.log("Camera stream set")
        }
      })
      .catch(err => {
        console.error("Camera error:", err)
      })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-4">Camera Test</h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full aspect-video border rounded"
      />
    </div>
  )
}
