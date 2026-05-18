// Script untuk create/reset password admin user
const { createMedusaApp } = require("@medusajs/medusa/dist/loaders")

async function createAdminAuth() {
  const adminEmail = "admin@waterpro.id"
  const adminPassword = "supersecret"
  
  try {
    const medusaApp = await createMedusaApp()
    const container = medusaApp.container
    
    const userService = container.resolve("user_service")
    const authModuleService = container.resolve("auth_module")
    
    // Get existing user
    const [user] = await userService.listUsers({ email: adminEmail })
    
    if (!user) {
      console.log("❌ User not found!")
      return
    }
    
    console.log("✅ User found:", user.email)
    
    // Delete existing auth identities
    const existingIdentities = await authModuleService.listAuthIdentities({})
    for (const identity of existingIdentities) {
      if (identity.app_metadata?.user_id === user.id) {
        await authModuleService.deleteAuthIdentities([identity.id])
        console.log("Deleted old auth identity")
      }
    }
    
    // Create new auth identity with password
    await authModuleService.createAuthIdentities({
      provider_identities: [
        {
          provider: "emailpass",
          entity_id: adminEmail,
          provider_metadata: {
            password: adminPassword,
          },
        },
      ],
      app_metadata: {
        user_id: user.id,
      },
    })
    
    console.log("✅ Auth identity created successfully!")
    console.log("📧 Login: " + adminEmail + " / " + adminPassword)
    
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}

createAdminAuth()
