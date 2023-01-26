import fastify from 'fastify'
import { join } from 'path';

const helmet = require('@fastify/helmet')

require('dotenv').config({ path: join(__dirname, '../config.conf') })

const app = fastify({
  logger: {
    transport:
      process.env.NODE_ENV === 'development'
        ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            colorize: true
          }
        }
        : undefined
  }
})

// Plugins
app.register(require('@fastify/formbody'))
app.register(require('@fastify/cors'))

// Rate limit
app.register(import('@fastify/rate-limit'), {
  global: false,
  max: 100,
  timeWindow: '1 minute'
})

app.register(
  helmet,
  { contentSecurityPolicy: false }
)

app.addHook('onSend', (request: any, reply: any, playload: any, next: any) => {
  reply.headers({
    'X-Powered-By': 'R7 Health Platform - HDC Services',
    'X-Processed-By': process.env.R7_DASHBOARD_SERVICE_HOSTNAME || 'dummy-server',
  })
  next()
})

// Database
app.register(require('./plugins/db'), {
  options: {
    client: 'mysql2',
    connection: {
      host: process.env.R7_DASHBOARD_DB_HOST || 'localhost',
      user: process.env.R7_DASHBOARD_DB_USER || 'root',
      port: Number(process.env.R7_DASHBOARD_DB_PORT) || 3306,
      password: process.env.R7_DASHBOARD_DB_PASSWORD || '',
      database: process.env.R7_DASHBOARD_DB_NAME || 'test',
    },
    pool: {
      min: 10,
      max: 500
    },
    debug: process.env.R7_DASHBOARD_DB_DEBUG === "Y" ? true : false,
  }
})

// JWT
app.register(require('./plugins/jwt'), {
  secret: process.env.R7_DASHBOARD_SECRET_KEY || '@1234567890@',
  sign: {
    iss: 'r7.moph.go.th',
    expiresIn: '1d'
  },
  messages: {
    badRequestErrorMessage: 'Format is Authorization: Bearer [token]',
    noAuthorizationInHeaderMessage: 'Autorization header is missing!',
    authorizationTokenExpiredMessage: 'Authorization token expired',
    authorizationTokenInvalid: (err: any) => {
      return `Authorization token is invalid: ${err.message}`
    }
  }
})

// routes
app.register(require("./routes/service_plan/ncd"), { prefix: '/service-plan/ncd' })
app.register(require("./routes/cockpit"), { prefix: '/cockpit' })
app.register(require("./routes/nhso7"), { prefix: '/nhso7' })

export default app
