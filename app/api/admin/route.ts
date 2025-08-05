import { type NextRequest, NextResponse } from "next/server"
import { createAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password, name } = await request.json()

    if (!username || !password || !name) {
      return NextResponse.json({ error: "Username, password, and name are required" }, { status: 400 })
    }

    const newAdmin = await createAdmin(username, password, name)
    return NextResponse.json(newAdmin, { status: 201 })
  } catch (error) {
    console.error("Error creating admin:", error)
    return NextResponse.json({ error: error.message || "Failed to create admin" }, { status: 500 })
  }
}
