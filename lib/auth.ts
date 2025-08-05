import { createServerClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export interface Admin {
  id: string
  username: string
  name: string
}

export async function verifyAdmin(username: string, password: string): Promise<Admin | null> {
  const supabase = createServerClient()

  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, username, name, password_hash")
    .eq("username", username)
    .single()

  if (error || !admin) {
    return null
  }

  const isValid = await bcrypt.compare(password, admin.password_hash)
  if (!isValid) {
    return null
  }

  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
  }
}

export async function createAdmin(username: string, password: string, name: string) {
  const supabase = createServerClient()
  const passwordHash = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from("admins")
    .insert([
      {
        username,
        password_hash: passwordHash,
        name,
      },
    ])
    .select("id, username, name")

  if (error) {
    throw new Error(error.message)
  }

  return data[0]
}
