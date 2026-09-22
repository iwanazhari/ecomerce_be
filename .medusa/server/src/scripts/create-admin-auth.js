"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createAdminAuth;
const utils_1 = require("@medusajs/framework/utils");
async function createAdminAuth({ container }) {
    const logger = container.resolve("logger");
    const userService = container.resolve(utils_1.Modules.USER);
    const authModuleService = container.resolve(utils_1.Modules.AUTH);
    const adminEmail = "admin@waterpro.id";
    const adminPassword = "supersecret";
    try {
        // Get existing user
        const [user] = await userService.listUsers({ email: adminEmail });
        if (!user) {
            logger.error("❌ User not found!");
            return;
        }
        logger.info("✅ User found: " + user.email);
        // Delete existing auth identities
        const existingIdentities = await authModuleService.listAuthIdentities({});
        for (const identity of existingIdentities) {
            if (identity.app_metadata?.user_id === user.id) {
                await authModuleService.deleteAuthIdentities([identity.id]);
                logger.info("Deleted old auth identity");
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
        });
        logger.info("✅ Auth identity created successfully!");
        logger.info("📧 Login: " + adminEmail + " / " + adminPassword);
    }
    catch (error) {
        logger.error("❌ Error: " + error.message);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWFkbWluLWF1dGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc2NyaXB0cy9jcmVhdGUtYWRtaW4tYXV0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLGtDQWtEQztBQXBERCxxREFBbUQ7QUFFcEMsS0FBSyxVQUFVLGVBQWUsQ0FBQyxFQUFFLFNBQVMsRUFBWTtJQUNuRSxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQzFDLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ25ELE1BQU0saUJBQWlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7SUFFekQsTUFBTSxVQUFVLEdBQUcsbUJBQW1CLENBQUE7SUFDdEMsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFBO0lBRW5DLElBQUksQ0FBQztRQUNILG9CQUFvQjtRQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUE7UUFFakUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsTUFBTSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO1lBQ2pDLE9BQU07UUFDUixDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFMUMsa0NBQWtDO1FBQ2xDLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN6RSxLQUFLLE1BQU0sUUFBUSxJQUFJLGtCQUFrQixFQUFFLENBQUM7WUFDMUMsSUFBSSxRQUFRLENBQUMsWUFBWSxFQUFFLE9BQU8sS0FBSyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLE1BQU0saUJBQWlCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtnQkFDM0QsTUFBTSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFBO1lBQzFDLENBQUM7UUFDSCxDQUFDO1FBRUQseUNBQXlDO1FBQ3pDLE1BQU0saUJBQWlCLENBQUMsb0JBQW9CLENBQUM7WUFDM0MsbUJBQW1CLEVBQUU7Z0JBQ25CO29CQUNFLFFBQVEsRUFBRSxXQUFXO29CQUNyQixTQUFTLEVBQUUsVUFBVTtvQkFDckIsaUJBQWlCLEVBQUU7d0JBQ2pCLFFBQVEsRUFBRSxhQUFhO3FCQUN4QjtpQkFDRjthQUNGO1lBQ0QsWUFBWSxFQUFFO2dCQUNaLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRTthQUNqQjtTQUNGLENBQUMsQ0FBQTtRQUVGLE1BQU0sQ0FBQyxJQUFJLENBQUMsdUNBQXVDLENBQUMsQ0FBQTtRQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxVQUFVLEdBQUcsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFBO0lBRWhFLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzNDLENBQUM7QUFDSCxDQUFDIn0=