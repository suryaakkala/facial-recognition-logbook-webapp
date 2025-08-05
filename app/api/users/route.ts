import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()

  const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { user_id, name, image_url, face_encoding } = body

    // Validate required fields
    if (!user_id || !name || !image_url || !face_encoding) {
      return NextResponse.json(
        {
          error: "Missing required fields: user_id, name, image_url, and face_encoding are required",
        },
        { status: 400 },
      )
    }

    // Validate face_encoding is an array
    if (!Array.isArray(face_encoding) || face_encoding.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid face encoding data",
        },
        { status: 400 },
      )
    }

    console.log("Inserting user:", { user_id, name, image_url, face_encoding_length: face_encoding.length })

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          user_id,
          name,
          image_url,
          face_encoding,
        },
      ])
      .select()

    if (error) {
      console.error("Database error:", error)
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json({ error: "User ID already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    console.log("User created successfully:", data[0])
    return NextResponse.json(data[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Invalid request or server error" }, { status: 500 })
  }
}
