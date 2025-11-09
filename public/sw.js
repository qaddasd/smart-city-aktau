self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  clients.claim()
})

const CACHE = 'sc-aktau-v1'

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  event.respondWith((async () => {
    try {
      const network = await fetch(req)
      const respClone = network.clone()
      const cache = await caches.open(CACHE)
      cache.put(req, respClone)
      return network
    } catch (e) {
      const cached = await caches.match(req)
      if (cached) return cached
      throw e
    }
  })())
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch {}
  const title = data.title || 'Smart City Актау'
  const body = data.body || 'Обновление'
  const url = data.url || '/submissions'
  const options = {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    data: { url },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  const url = event.notification?.data?.url || '/'
  event.notification.close()
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window' })
    for (const client of allClients) {
      if ('focus' in client) {
        client.navigate(url)
        return client.focus()
      }
    }
    if (clients.openWindow) return clients.openWindow(url)
  })())
})
