import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initializeDatabase } from './lib/db.js'
import { ensureAdminUser } from './lib/auth.js'
import { seedContent } from './seed.js'
import { routeApi } from './router.js'

const app = express()
const PORT = Number(process.env.PORT || 5000)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true, methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'] }))
app.use(express.json({ limit: '8mb' }))
app.use((req,res,next) => { if (req.path.startsWith('/api/')) return routeApi(req,res); return next() })
app.use((_req,res) => res.status(404).json({ error: 'Not found.' }))

if (process.env.NODE_ENV !== 'production') {
  initializeDatabase().then(ensureAdminUser).then(seedContent).then(() => app.listen(PORT, () => console.log(`Portfolio API running on http://localhost:${PORT}`))).catch((error) => { console.error(error); process.exit(1) })
}
export default app
