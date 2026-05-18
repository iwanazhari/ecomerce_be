import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function createAdminAuth({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const userService = container.resolve(Modules.USER)
  const authModuleService = container.resolve(Modules.AUTH)
  
  const adminEmail = "admin@waterpro.id"
  const adminPassword = "supersecret"
  
  try {
    // Get existing user
    const [user] = await userService.listUsers({ email: adminEmail })
    
    if (!user) {
      logger.error("❌ User not found!")
      return
    }
    
    logger.info("✅ User found: " + user.email)
    
    // Delete existing auth identities
    const existingIdentities = await authModuleService.listAuthIdentities({})
    for (const identity of existingIdentities) {
      if (identity.app_metadata?.user_id === user.id) {
        await authModuleService.deleteAuthIdentities([identity.id])
        logger.info("Deleted old auth identity")
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
    
    logger.info("✅ Auth identity created successfully!")
    logger.info("📧 Login: " + adminEmail + " / " + adminPassword)
    
  } catch (error) {
    logger.error("❌ Error: " + error.message)
  }
}
