// Custom simple auth endpoint - bypass Medusa auth module complexity
const express = require('express')
const bcrypt = require('bcrypt')

const router = express.Router()

// POST /custom-auth/login - Simple login without publishable key requirement
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        type: 'invalid_data',
        message: 'Email and password are required'
      })
    }

    // Get container from request (injected by Medusa)
    const container = req.scope

    if (!container) {
      return res.status(500).json({
        type: 'server_error',
        message: 'Container not available'
      })
    }

    // Resolve user service
    const userService = container.resolve('user_service')
    
    // Find user by email
    const [user] = await userService.listUsers({ email })

    if (!user) {
      return res.status(401).json({
        type: 'unauthorized',
        message: 'Invalid email or password'
      })
    }

    // Resolve auth module
    const authModuleService = container.resolve('auth_module')
    
    // Find auth identity
    const identities = await authModuleService.listAuthIdentities({
      entity_id: email,
      provider: 'emailpass'
    })

    if (!identities || identities.length === 0) {
      return res.status(401).json({
        type: 'unauthorized',
        message: 'Invalid email or password'
      })
    }

    // Get password hash from provider_metadata
    const identity = identities[0]
    const providerMetadata = identity.provider_metadata || {}
    const storedPassword = providerMetadata.password

    if (!storedPassword) {
      return res.status(500).json({
        type: 'server_error',
        message: 'Password not configured for this user'
      })
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, storedPassword)

    if (!isMatch) {
      return res.status(401).json({
        type: 'unauthorized',
        message: 'Invalid email or password'
      })
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken')
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

  } catch (error) {
    console.error('Custom auth error:', error)
    res.status(500).json({
      type: 'server_error',
      message: error.message
    })
  }
})

module.exports = router
