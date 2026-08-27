import { publicSite, adminLogin, adminLogout, adminMe, adminContent, adminMessages, adminSubscribers, contact, subscribe } from './handlers.js'

export async function routeApi(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname.replace(/\/+$/, '') || '/'
    if (path === '/api/site') return publicSite(req,res)
    if (path === '/api/contact') return contact(req,res)
    if (path === '/api/subscribe') return subscribe(req,res)
    if (path === '/api/admin/login') return adminLogin(req,res)
    if (path === '/api/admin/logout') return adminLogout(req,res)
    if (path === '/api/admin/me') return adminMe(req,res)
    if (path === '/api/admin/content') return adminContent(req,res)
    if (path === '/api/admin/messages') return adminMessages(req,res)
    if (path === '/api/admin/subscribers') return adminSubscribers(req,res)
    return res.status(404).json({ error: 'API route not found.' })
  } catch (error) { console.error(error); return res.status(500).json({ error: error.message || 'Server error.' }) }
}
