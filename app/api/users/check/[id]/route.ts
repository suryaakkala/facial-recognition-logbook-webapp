import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  console.log("User ID received:", context.params.id)
  const { id } = context.params
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id")
      .eq("user_id", id)
      .single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ exists: !!data })
  } catch (error) {
    return NextResponse.json({ error: "Failed to check user existence" }, { status: 500 })
  }
}
