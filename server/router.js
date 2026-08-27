import { publicSite, adminLogin, adminLogout, adminMe, adminContent, adminMessages, adminSubscribers, contact, subscribe } from './handlers.js'

function adaptResponse(res) {
  if (typeof res.status === 'function' && typeof res.json === 'function') return res

  res.status = (code) => { res.statusCode = code; return res }
  res.json = (payload) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
    return res
  }
  return res
}

async function ensureBody(req) {
  if (req.body && typeof req.body === 'object') return
  const method = String(req.method || 'GET').toUpperCase()
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    req.body = {}
    return
  }

  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) { req.body = {}; return }

  const contentType = String(req.headers?.['content-type'] || '').toLowerCase()
  if (contentType.includes('application/json')) {
    try {
      req.body = JSON.parse(raw)
    } catch {
      const error = new Error('Invalid JSON request body.')
      error.statusCode = 400
      throw error
    }
  } else {
    req.body = {}
  }
}

export async function routeApi(req, rawRes) {
  const res = adaptResponse(rawRes)
  try {
    await ensureBody(req)
    const url = new URL(req.url || '/', 'https://portfolio.local')
    const path = url.pathname.replace(/\/+$/, '') || '/'
    if (path === '/api/site') return await publicSite(req,res)
    if (path === '/api/contact') return await contact(req,res)
    if (path === '/api/subscribe') return await subscribe(req,res)
    if (path === '/api/admin/login') return await adminLogin(req,res)
    if (path === '/api/admin/logout') return await adminLogout(req,res)
    if (path === '/api/admin/me') return await adminMe(req,res)
    if (path === '/api/admin/content') return await adminContent(req,res)
    if (path === '/api/admin/messages') return await adminMessages(req,res)
    if (path === '/api/admin/subscribers') return await adminSubscribers(req,res)
    return res.status(404).json({ error: 'API route not found.' })
  } catch (error) {
    console.error('API error:', error)
    const status = Number(error?.statusCode) || 500
    return res.status(status).json({ error: error?.message || 'Server error.' })
  }
}
