"use client"

let faceapi: any = null
let isModelsLoaded = false

const loadFaceAPI = async () => {
  if (faceapi) return faceapi

  try {
    faceapi = await import("face-api.js")
    return faceapi
  } catch (error) {
    console.error("Failed to load face-api.js:", error)
    throw new Error("Face API library not available")
  }
}

export const checkModelsAvailable = async () => {
  try {
    // Check if model files exist by trying to fetch them
    const modelFiles = [
      "/models/tiny_face_detector_model-weights_manifest.json",
      "/models/face_landmark_68_model-weights_manifest.json",
      "/models/face_recognition_model-weights_manifest.json",
      "/models/ssd_mobilenetv1_model-weights_manifest.json",
    ]

    const checks = await Promise.allSettled(
      modelFiles.map(async (file) => {
        const response = await fetch(file)
        if (!response.ok) {
          throw new Error(`Model file not found: ${file}`)
        }
        return response.json()
      }),
    )

    const allAvailable = checks.every((result) => result.status === "fulfilled")

    if (!allAvailable) {
      console.log(
        "Some model files are missing:",
        checks.filter((r) => r.status === "rejected"),
      )
      return false
    }

    return true
  } catch (error) {
    console.error("Model availability check failed:", error)
    return false
  }
}

export const loadModels = async () => {
  if (isModelsLoaded) return true

  try {
    const api = await loadFaceAPI()
    const MODEL_URL = "/models"

    // Check if models are available first
    const modelsAvailable = await checkModelsAvailable()
    if (!modelsAvailable) {
      throw new Error("Face recognition models not found in /public/models directory")
    }

    console.log("Loading face API models...")

    await Promise.all([
      api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      api.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      api.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    ])

    isModelsLoaded = true
    console.log("Face API models loaded successfully")
    return true
  } catch (error) {
    console.error("Failed to load face API models:", error)
    isModelsLoaded = false
    throw error
  }
}

export const detectFaces = async (imageElement: HTMLImageElement) => {
  const api = await loadFaceAPI()
  await loadModels()

  const detections = await api
    .detectAllFaces(imageElement, new api.SsdMobilenetv1Options())
    .withFaceLandmarks()
    .withFaceDescriptors()

  return detections
}

export const compareFaces = async (descriptor1: Float32Array, descriptor2: Float32Array, threshold = 0.6) => {
  const api = await loadFaceAPI()
  const distance = api.euclideanDistance(descriptor1, descriptor2)
  return distance < threshold
}

export const getFaceDescriptor = async (imageElement: HTMLImageElement) => {
  try {
    const api = await loadFaceAPI()
    await loadModels()

    // Ensure image is loaded
    if (!imageElement.complete || imageElement.naturalHeight === 0) {
      throw new Error("Image not loaded properly")
    }

    const detection = await api
      .detectSingleFace(imageElement, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      console.log("No face detected in image")
      return null
    }

    console.log("Face detected with confidence:", detection.detection.score)
    return detection.descriptor
  } catch (error) {
    console.error("Face detection error:", error)
    throw error
  }
}
