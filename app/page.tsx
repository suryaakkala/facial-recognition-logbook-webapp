"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import AdminLogin from "@/components/admin-login"
import CameraScanner from "@/components/camera-scanner"
import AdminUserManagement from "@/components/admin-user-management"
import AdminAttendanceManagement from "@/components/admin-attendance-management"
import AdminAdminManagement from "@/components/admin-admin-management" // New import
import DebugInfo from "@/components/debug-info"
import ModelDownloader from "@/components/model-downloader"
import { LogOut, Camera, Users, BarChart3, Download, UserCog } from "lucide-react" // New icon
import { checkModelsAvailable } from "@/lib/face-recognition"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"


interface Admin {
  id: string
  username: string
  name: string
}

export default function Home() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [modelsAvailable, setModelsAvailable] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    // Check if admin is already logged in and models are available
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify")
        if (response.ok) {
          const { admin } = await response.json()
          setAdmin(admin)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      }

      // Check if models are available
      try {
        const available = await checkModelsAvailable()
        setModelsAvailable(available)
        console.log("Models available:", available)
      } catch (error) {
        console.error("Model check failed:", error)
        setModelsAvailable(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = (adminData: Admin) => {
    setAdmin(adminData)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setAdmin(null)
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const refreshModels = async () => {
    setLoading(true)
    try {
      const available = await checkModelsAvailable()
      setModelsAvailable(available)
      if (available) {
        setShowSetup(false)
      }
    } catch (error) {
      console.error("Model refresh failed:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Show model setup if models are not available or user wants to see setup
  if (!modelsAvailable || showSetup) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Setup Required</h1>
          <p className="text-muted-foreground text-lg">Face recognition models need to be downloaded and configured</p>
        </div>
        <ModelDownloader />
        <div className="text-center mt-6 space-y-2">
          <Button onClick={refreshModels} variant="outline">
            Check Models Again
          </Button>
          {modelsAvailable && (
            <div>
              <Button onClick={() => setShowSetup(false)} className="ml-2">
                Continue to App
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show admin login if not authenticated
  if (!admin) {
    return (
      <div>
        {/* User Interface - Camera Scanner Only */}
        <div className="container mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Facial Recognition Attendance</h1>
            <p className="text-muted-foreground text-lg">Scan your face to mark attendance</p>
          </div>

          <CameraScanner />

          <div className="text-center mt-8 space-x-2">
            <Button
              onClick={() => setAdmin({ id: "temp", username: "temp", name: "temp" })}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Admin Login
            </Button>
            <Button onClick={() => setShowSetup(true)} variant="outline" size="sm" className="text-xs">
              Setup Models
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show admin login form if admin button was clicked but not authenticated
  if (admin.id === "temp") {
    return <AdminLogin onLogin={handleLogin} />
  }

  // Show admin dashboard if authenticated
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg">Welcome back, {admin.name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSetup(true)}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" />
            Setup
          </Button>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {" "}
          {/* Updated grid-cols */}
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            {" "}
            {/* New tab */}
            <UserCog className="h-4 w-4" />
            Admins
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="mt-6">
          <CameraScanner />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <AdminAttendanceManagement />
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          {" "}
          {/* New tab content */}
          <AdminAdminManagement />
        </TabsContent>

        <TabsContent value="debug" className="mt-6">
          <DebugInfo />
        </TabsContent>
      </Tabs>
    </div>
  )
}
