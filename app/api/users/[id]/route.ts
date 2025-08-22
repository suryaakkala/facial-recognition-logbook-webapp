import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = createServerClient()

  try {
    // 1. Fetch the user first (to know image_url for cleanup)
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("image_url")
      .eq("user_id", id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 2. Delete attendance records for this user
    const { error: attendanceError } = await supabase
      .from("attendance")
      .delete()
      .eq("user_id", id)

    if (attendanceError) {
      console.error("Attendance delete error:", attendanceError)
      return NextResponse.json({ error: attendanceError.message }, { status: 500 })
    }

    // 3. Delete user from database
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("user_id", id)

    if (deleteError) {
      console.error("User delete error:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // 4. Delete profile image from storage
    if (user.image_url) {
      const imagePath = user.image_url.split("/").pop()
      if (imagePath) {
        const { error: storageError } = await supabase.storage
          .from("user-images")
          .remove([imagePath])
        if (storageError) {
          console.error("Storage delete error:", storageError)
        }
      }
    }

    return NextResponse.json({ message: "User and attendance deleted successfully" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
