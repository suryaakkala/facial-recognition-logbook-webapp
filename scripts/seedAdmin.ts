import "dotenv/config" // ⬅ loads .env.local or .env automatically
import { createAdmin } from "@/lib/auth"

async function main() {
  try {
    const admin = await createAdmin("surya", "ayrus", "Admin User")
    console.log("✅ Admin created:", admin)
  } catch (err) {
    console.error("❌ Failed to create admin:", (err as Error).message)
  }
}

main()
