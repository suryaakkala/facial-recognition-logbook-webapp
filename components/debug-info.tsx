"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { checkModelsAvailable } from "@/lib/face-recognition"

export default function DebugInfo() {
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkSystem = async () => {
    setLoading(true)
    try {
      // Check users
      const usersResponse = await fetch("/api/users")
      const users = usersResponse.ok ? await usersResponse.json() : { error: "Failed to fetch users" }

      // Check Supabase connection
      const { supabase } = await import("@/lib/supabase")
      const { data: testData, error: testError } = await supabase.from("users").select("count").limit(1)

      // Check Face API models
      let modelsAvailable = false
      let modelError = ""
      try {
        modelsAvailable = await checkModelsAvailable()
      } catch (error) {
        modelError = error.message
      }

      // Check individual model files
      const modelFiles = [
        "tiny_face_detector_model-weights_manifest.json",
        "face_landmark_68_model-weights_manifest.json",
        "face_recognition_model-weights_manifest.json",
        "ssd_mobilenetv1_model-weights_manifest.json",
      ]

      const modelStatus = {}
      for (const file of modelFiles) {
        try {
          const response = await fetch(`/models/${file}`)
          modelStatus[file] = response.ok ? "✓" : "✗"
        } catch (error) {
          modelStatus[file] = "✗"
        }
      }

      setInfo({
        users: users,
        usersCount: Array.isArray(users) ? users.length : 0,
        supabaseConnection: testError ? `Error: ${testError.message}` : "Connected",
        faceApiLoaded: modelsAvailable ? "Models Loaded" : `Models Missing${modelError ? `: ${modelError}` : ""}`,
        cameraSupport: navigator.mediaDevices ? "Supported" : "Not supported",
        modelsPath: "/public/models/",
        modelFiles: modelStatus,
        httpsEnabled: window.location.protocol === "https:" ? "Yes" : "No (required for camera)",
      })
    } catch (error) {
      setInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>System Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkSystem} disabled={loading} className="w-full">
          {loading ? "Checking..." : "Check System Status"}
        </Button>

        {info && (
          <div className="space-y-3 text-sm">
            {info.error ? (
              <Badge variant="destructive">{info.error}</Badge>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Users in DB:</span>
                  <Badge variant="secondary">{info.usersCount}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Supabase:</span>
                  <Badge variant={info.supabaseConnection === "Connected" ? "default" : "destructive"}>
                    {info.supabaseConnection}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Face API:</span>
                  <Badge variant={info.faceApiLoaded.includes("Loaded") ? "default" : "destructive"}>
                    {info.faceApiLoaded}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Camera:</span>
                  <Badge variant={info.cameraSupport === "Supported" ? "default" : "destructive"}>
                    {info.cameraSupport}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>HTTPS:</span>
                  <Badge variant={info.httpsEnabled === "Yes" ? "default" : "destructive"}>{info.httpsEnabled}</Badge>
                </div>

                {info.modelFiles && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Model Files Status:</h4>
                    <div className="space-y-1">
                      {Object.entries(info.modelFiles).map(([file, status]) => (
                        <div key={file} className="flex justify-between text-xs">
                          <span className="truncate">{file}</span>
                          <Badge variant={status === "✓" ? "default" : "destructive"} className="text-xs">
                            {status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!info.faceApiLoaded.includes("Loaded") && (
                  <div className="text-xs text-muted-foreground mt-2 p-2 bg-yellow-50 rounded">
                    <p>
                      <strong>To fix model issues:</strong>
                    </p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>
                        Create <code>/public/models/</code> directory
                      </li>
                      <li>Download all model files from the Setup tab</li>
                      <li>Place files directly in the models folder</li>
                      <li>Refresh the page</li>
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
