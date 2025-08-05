import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    // Delete user from database
    const { error } = await supabase.from("users").delete().eq("user_id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also delete from storage
    await supabase.storage.from("user-images").remove([`${params.id}.jpg`, `${params.id}.png`, `${params.id}.jpeg`])

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
