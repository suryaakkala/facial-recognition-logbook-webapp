"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Download, CheckCircle, AlertCircle, ExternalLink, FolderOpen } from "lucide-react"

const MODELS = [
  {
    name: "tiny_face_detector_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json",
  },
  {
    name: "tiny_face_detector_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1",
  },
  {
    name: "face_landmark_68_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json",
  },
  {
    name: "face_landmark_68_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1",
  },
  {
    name: "face_recognition_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json",
  },
  {
    name: "face_recognition_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1",
  },
  {
    name: "face_recognition_model-shard2",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2",
  },
  {
    name: "ssd_mobilenetv1_model-weights_manifest.json",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json",
  },
  {
    name: "ssd_mobilenetv1_model-shard1",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1",
  },
  {
    name: "ssd_mobilenetv1_model-shard2",
    url: "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2",
  },
]

export default function ModelDownloader() {
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [downloadedModels, setDownloadedModels] = useState<string[]>([])
  const [checkingModels, setCheckingModels] = useState(false)
  const [modelsStatus, setModelsStatus] = useState<{ [key: string]: boolean }>({})

  const checkExistingModels = async () => {
    setCheckingModels(true)
    const status: { [key: string]: boolean } = {}

    for (const model of MODELS) {
      try {
        const response = await fetch(`/models/${model.name}`)
        status[model.name] = response.ok
      } catch (error) {
        status[model.name] = false
      }
    }

    setModelsStatus(status)
    setCheckingModels(false)

    const existingCount = Object.values(status).filter(Boolean).length
    if (existingCount === MODELS.length) {
      setMessage({ type: "success", text: "All models are already available!" })
    } else if (existingCount > 0) {
      setMessage({ type: "info", text: `${existingCount}/${MODELS.length} models found. Download the missing ones.` })
    } else {
      setMessage({ type: "info", text: "No models found. Please download all required models." })
    }
  }

  const downloadModels = async () => {
    setDownloading(true)
    setProgress(0)
    setMessage({ type: "info", text: "Starting model download..." })

    try {
      for (let i = 0; i < MODELS.length; i++) {
        const model = MODELS[i]

        // Skip if already exists
        if (modelsStatus[model.name]) {
          setProgress(((i + 1) / MODELS.length) * 100)
          continue
        }

        setMessage({ type: "info", text: `Downloading ${model.name}...` })

        const response = await fetch(model.url)
        if (!response.ok) {
          throw new Error(`Failed to download ${model.name}`)
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        // Create download link
        const a = document.createElement("a")
        a.href = url
        a.download = model.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setDownloadedModels((prev) => [...prev, model.name])
        setProgress(((i + 1) / MODELS.length) * 100)

        // Small delay to prevent overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      setMessage({
        type: "success",
        text: "Download complete! Please place all files in /public/models/ folder and refresh the page.",
      })
    } catch (error) {
      setMessage({ type: "error", text: `Download failed: ${error.message}` })
    } finally {
      setDownloading(false)
    }
  }

  const downloadAllAsZip = () => {
    setMessage({
      type: "info",
      text: "Opening GitHub repository. You can download all models from the weights folder.",
    })
    window.open("https://github.com/justadudewhohacks/face-api.js/tree/master/weights", "_blank")
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Face API Models Setup
        </CardTitle>
        <CardDescription>Download the required machine learning models for face recognition</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The face recognition system requires ML models to be placed in <code>/public/models/</code> directory. These
            files enable face detection and recognition functionality.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            onClick={checkExistingModels}
            disabled={checkingModels}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <FolderOpen className="h-4 w-4" />
            {checkingModels ? "Checking..." : "Check Existing Models"}
          </Button>
          <Button onClick={downloadAllAsZip} variant="outline" className="flex items-center gap-2 bg-transparent">
            <ExternalLink className="h-4 w-4" />
            Open GitHub Repository
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">
            Required Models ({Object.values(modelsStatus).filter(Boolean).length}/{MODELS.length}):
          </h3>
          <div className="grid grid-cols-1 gap-1 text-sm max-h-48 overflow-y-auto">
            {MODELS.map((model, index) => {
              const exists = modelsStatus[model.name]
              const downloaded = downloadedModels.includes(model.name)

              return (
                <div key={index} className="flex items-center gap-2">
                  {exists ? (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : downloaded ? (
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={`${exists ? "text-green-600" : downloaded ? "text-blue-600" : ""} truncate`}>
                    {model.name}
                  </span>
                  {exists && <span className="text-xs text-green-600 ml-auto">✓ Found</span>}
                  {downloaded && !exists && <span className="text-xs text-blue-600 ml-auto">Downloaded</span>}
                </div>
              )
            })}
          </div>
        </div>

        {downloading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center">{Math.round(progress)}% complete</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={downloadModels} disabled={downloading} className="flex-1" size="lg">
            {downloading ? "Downloading..." : "Download Missing Models"}
          </Button>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-2 p-3 bg-gray-50 rounded">
          <p>
            <strong>Setup Instructions:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              Create a <code>models</code> folder inside your <code>public</code> directory
            </li>
            <li>Download the model files using the button above OR from the GitHub repository</li>
            <li>
              Place all downloaded files directly in <code>/public/models/</code>
            </li>
            <li>Refresh the page to load the models</li>
          </ol>
          <p className="mt-2">
            <strong>File structure should be:</strong>
          </p>
          <pre className="text-xs bg-white p-2 rounded border">
            {`/public/
  /models/
    tiny_face_detector_model-weights_manifest.json
    tiny_face_detector_model-shard1
    face_landmark_68_model-weights_manifest.json
    face_landmark_68_model-shard1
    face_recognition_model-weights_manifest.json
    face_recognition_model-shard1
    face_recognition_model-shard2
    ssd_mobilenetv1_model-weights_manifest.json
    ssd_mobilenetv1_model-shard1
    ssd_mobilenetv1_model-shard2`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
