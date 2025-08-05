"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getFaceDescriptor } from "@/lib/face-recognition"
import { supabase } from "@/lib/supabase"
import { UserPlus, Upload, Trash2, Users } from "lucide-react"
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'

const supabaseClient  = createPagesBrowserClient()



interface User {
  id: string
  user_id: string
  name: string
  image_url: string
  face_encoding: number[]
  created_at: string
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [userId, setUserId] = useState("")
  const [name, setName] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const userData = await response.json()
        setUsers(userData)
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !name || !image) {
      setMessage({ type: "error", text: "Please fill all fields and upload an image" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Check if user already exists
      const checkResponse = await fetch(`/api/users/check/${userId}`)
      if (checkResponse.ok) {
        const { exists } = await checkResponse.json()
        if (exists) {
          setMessage({ type: "error", text: "User ID already exists. Please choose a different ID." })
          setLoading(false)
          return
        }
      }

      // Upload image to Supabase Storage
      const fileExt = image.name.split(".").pop()
      const fileName = `${userId}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("user-images")
        .upload(fileName, image, { upsert: true })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        setMessage({ type: "error", text: `Image upload failed: ${uploadError.message}` })
        setLoading(false)
        return
      }


      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-images").getPublicUrl(fileName)

      // Extract face descriptor
      if (imageRef.current) {
        try {
          const descriptor = await getFaceDescriptor(imageRef.current)

          if (!descriptor) {
            setMessage({ type: "error", text: "No face detected in the image. Please upload a clear face photo." })
            setLoading(false)
            return
          }

          // Save user to database
          const response = await fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              name,
              image_url: publicUrl,
              face_encoding: Array.from(descriptor),
            }),
          })

          const responseData = await response.json()

          if (response.ok) {
            setMessage({ type: "success", text: "User registered successfully!" })
            setUserId("")
            setName("")
            setImage(null)
            setImagePreview(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
            setIsDialogOpen(false)
            loadUsers()
          } else {
            console.error("API error:", responseData)
            setMessage({ type: "error", text: responseData.error || "Failed to register user" })
          }
        } catch (faceError) {
          console.error("Face detection error:", faceError)
          setMessage({ type: "error", text: "Face detection failed. Please ensure the image shows a clear face." })
        }
      }
    } catch (error) {
      console.error("Registration error:", error)
      setMessage({ type: "error", text: "An unexpected error occurred during registration" })
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: "User deleted successfully" })
        loadUsers()
      } else {
        setMessage({ type: "error", text: "Failed to delete user" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error deleting user" })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage registered users in the system</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Register New User</DialogTitle>
                  <DialogDescription>Add a new user to the facial recognition system</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="Enter unique user ID"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Profile Image</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Image
                      </Button>
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <img
                        ref={imageRef}
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-md border"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Registering..." : "Register User"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users registered yet</div>
            ) : (
              users.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.image_url || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {user.user_id}</div>
                        <Badge variant="secondary" className="text-xs">
                          Registered: {new Date(user.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      onClick={() => deleteUser(user.user_id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
