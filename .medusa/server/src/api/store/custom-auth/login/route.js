"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// POST /store/custom-auth/login
async function POST(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({
            type: 'invalid_data',
            message: 'Email and password are required'
        });
        return;
    }
    try {
        // Resolve user service
        const userService = req.scope.resolve('user_service');
        // Find user by email
        const [user] = await userService.listUsers({ email });
        if (!user) {
            res.status(401).json({
                type: 'unauthorized',
                message: 'Invalid email or password'
            });
            return;
        }
        // Resolve auth module
        const authModuleService = req.scope.resolve('auth_module');
        // Find auth identity
        const identities = await authModuleService.listAuthIdentities({
            entity_id: email,
            provider: 'emailpass'
        });
        if (!identities || identities.length === 0) {
            res.status(401).json({
                type: 'unauthorized',
                message: 'Invalid email or password'
            });
            return;
        }
        // Get password from provider_metadata
        const identity = identities[0];
        const providerMetadata = identity.provider_metadata || {};
        const storedPassword = providerMetadata.password;
        if (!storedPassword) {
            res.status(500).json({
                type: 'server_error',
                message: 'Password not configured for this user'
            });
            return;
        }
        // Compare passwords
        const isMatch = await bcrypt_1.default.compare(password, storedPassword);
        if (!isMatch) {
            res.status(401).json({
                type: 'unauthorized',
                message: 'Invalid email or password'
            });
            return;
        }
        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || 'supersecret';
        const token = jsonwebtoken_1.default.sign({
            user_id: user.id,
            email: user.email,
            app_metadata: { user_id: user.id }
        }, jwtSecret, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });
    }
    catch (error) {
        console.error('Custom auth error:', error);
        res.status(500).json({
            type: 'server_error',
            message: error.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2N1c3RvbS1hdXRoL2xvZ2luL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBS0Esb0JBb0dDO0FBeEdELGdFQUE4QjtBQUM5QixvREFBMkI7QUFFM0IsZ0NBQWdDO0FBQ3pCLEtBQUssVUFBVSxJQUFJLENBQ3hCLEdBQWtCLEVBQ2xCLEdBQW1CO0lBRW5CLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQTtJQUVwQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDeEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsSUFBSSxFQUFFLGNBQWM7WUFDcEIsT0FBTyxFQUFFLGlDQUFpQztTQUMzQyxDQUFDLENBQUE7UUFDRixPQUFNO0lBQ1IsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILHVCQUF1QjtRQUN2QixNQUFNLFdBQVcsR0FBUSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTtRQUUxRCxxQkFBcUI7UUFDckIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFVLE1BQU0sV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7UUFFNUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLElBQUksRUFBRSxjQUFjO2dCQUNwQixPQUFPLEVBQUUsMkJBQTJCO2FBQ3JDLENBQUMsQ0FBQTtZQUNGLE9BQU07UUFDUixDQUFDO1FBRUQsc0JBQXNCO1FBQ3RCLE1BQU0saUJBQWlCLEdBQVEsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7UUFFL0QscUJBQXFCO1FBQ3JCLE1BQU0sVUFBVSxHQUFHLE1BQU8saUJBQXlCLENBQUMsa0JBQWtCLENBQUM7WUFDckUsU0FBUyxFQUFFLEtBQUs7WUFDaEIsUUFBUSxFQUFFLFdBQVc7U0FDdEIsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzNDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNuQixJQUFJLEVBQUUsY0FBYztnQkFDcEIsT0FBTyxFQUFFLDJCQUEyQjthQUNyQyxDQUFDLENBQUE7WUFDRixPQUFNO1FBQ1IsQ0FBQztRQUVELHNDQUFzQztRQUN0QyxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDOUIsTUFBTSxnQkFBZ0IsR0FBUSxRQUFRLENBQUMsaUJBQWlCLElBQUksRUFBRSxDQUFBO1FBQzlELE1BQU0sY0FBYyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQTtRQUVoRCxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLElBQUksRUFBRSxjQUFjO2dCQUNwQixPQUFPLEVBQUUsdUNBQXVDO2FBQ2pELENBQUMsQ0FBQTtZQUNGLE9BQU07UUFDUixDQUFDO1FBRUQsb0JBQW9CO1FBQ3BCLE1BQU0sT0FBTyxHQUFHLE1BQU0sZ0JBQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxDQUFBO1FBRTlELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNuQixJQUFJLEVBQUUsY0FBYztnQkFDcEIsT0FBTyxFQUFFLDJCQUEyQjthQUNyQyxDQUFDLENBQUE7WUFDRixPQUFNO1FBQ1IsQ0FBQztRQUVELHFCQUFxQjtRQUNyQixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxhQUFhLENBQUE7UUFFekQsTUFBTSxLQUFLLEdBQUcsc0JBQUcsQ0FBQyxJQUFJLENBQ3BCO1lBQ0UsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ2hCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixZQUFZLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtTQUNuQyxFQUNELFNBQVMsRUFDVCxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FDcEIsQ0FBQTtRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxLQUFLO1lBQ0wsSUFBSSxFQUFFO2dCQUNKLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDWCxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtnQkFDM0IsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2FBQzFCO1NBQ0YsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUMxQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixJQUFJLEVBQUUsY0FBYztZQUNwQixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDdkIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMifQ==