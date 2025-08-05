"use client"

import * as faceapi from "face-api.js"

let isModelsLoaded = false

export const loadFaceAPI = async () => {
  return faceapi
}

export const checkModelsAvailable = async () => {
  try {
    const modelFiles = [
      "/models/tiny_face_detector_model-weights_manifest.json",
      "/models/face_landmark_68_model-weights_manifest.json",
      "/models/face_recognition_model-weights_manifest.json",
      "/models/ssd_mobilenetv1_model-weights_manifest.json",
    ]

    const checks = await Promise.allSettled(
      modelFiles.map(async (file) => {
        const res = await fetch(file)
        if (!res.ok) throw new Error(`Model missing: ${file}`)
        return res.json()
      })
    )

    return checks.every(r => r.status === "fulfilled")
  } catch (err) {
    console.error("Model check error:", err)
    return false
  }
}

export const loadModels = async () => {
  if (isModelsLoaded) return true

  const MODEL_URL = "/models"
  const available = await checkModelsAvailable()
  if (!available) throw new Error("Face models not found in /public/models")

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
  ])

  isModelsLoaded = true
  return true
}

export const detectFaces = async (image: HTMLImageElement | HTMLVideoElement) => {
  await loadModels()

  const detections = await faceapi
    .detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors()

  return detections
}

export const compareFaces = async (
  descriptor1: Float32Array,
  descriptor2: Float32Array,
  threshold = 0.4
) => {
  await loadModels()
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2)
  return distance < threshold
}

export const getFaceDescriptor = async (image: HTMLImageElement) => {
  await loadModels()

  if (!image.complete || image.naturalHeight === 0) {
    throw new Error("Image not loaded")
  }

  const detection = await faceapi
    .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor()

  return detection?.descriptor ?? null
}
