export async function subscribePush(reg: ServiceWorkerRegistration) {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  if (!('pushManager' in reg)) return null
  if (!vapidKey) return null
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await saveSubscription(sub)
    return sub
  }
  const converted = urlBase64ToUint8Array(vapidKey)
  const newSub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: converted })
  await saveSubscription(newSub)
  return newSub
}

async function saveSubscription(sub: PushSubscription) {
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    })
  } catch {}
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
