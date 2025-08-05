import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

  const { data: attendance, error } = await supabase
    .from("attendance")
    .select(`
      *,
      users (
        user_id,
        name,
        image_url
      )
    `)
    .eq("date", date)
    .order("time_in", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(attendance)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const { user_id, confidence_score } = await request.json()

    // Check if user already marked present today
    const today = new Date().toISOString().split("T")[0]
    const { data: existingAttendance } = await supabase
      .from("attendance")
      .select("id")
      .eq("user_id", user_id)
      .eq("date", today)
      .single()

    if (existingAttendance) {
      return NextResponse.json({ message: "Already marked present today" }, { status: 200 })
    }

    const { data, error } = await supabase
      .from("attendance")
      .insert([
        {
          user_id,
          confidence_score,
          status: "present",
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
