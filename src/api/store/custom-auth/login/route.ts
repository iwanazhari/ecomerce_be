import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

// POST /store/custom-auth/login
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({
      type: 'invalid_data',
      message: 'Email and password are required'
    })
    return
  }

  try {
    // Resolve user service
    const userService: any = req.scope.resolve('user_service')
    
    // Find user by email
    const [user]: any[] = await userService.listUsers({ email })

    if (!user) {
      res.status(401).json({
        type: 'unauthorized',
        message: 'Invalid email or password'
      })
      return
    }

    // Resolve auth module
    const authModuleService: any = req.scope.resolve('auth_module')
    
    // Find auth identity
    const identities = await (authModuleService as any).listAuthIdentities({
      entity_id: email,
      provider: 'emailpass'
    })

    if (!identities || identities.length === 0) {
      res.status(401).json({
        type: 'unauthorized',
        message: 'Invalid email or password'
      })
      return
    }

    // Get password from provider_metadata
    const identity = identities[0]
    const providerMetadata: any = identity.provider_metadata || {}
    const storedPassword = providerMetadata.password

    if (!storedPassword) {
      res.status(500).json({
        type: 'server_error',
        message: 'Password not configured for this user'
      })
      return
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, storedPassword)

    if (!isMatch) {
      res.status(401).json({
        type: 'unauthorized',
        message: 'Invalid email or password'
      })
      return
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'supersecret'
    
    const token = jwt.sign(
      { 
        user_id: user.id,
        email: user.email,
        app_metadata: { user_id: user.id }
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    })

  } catch (error: any) {
    console.error('Custom auth error:', error)
    res.status(500).json({
      type: 'server_error',
      message: error.message
    })
  }
}
