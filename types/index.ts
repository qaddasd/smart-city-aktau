export interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  role: "user" | "admin"
  createdAt: string
}

export interface Feedback {
  id: string
  userId: string
  title: string
  description: string
  category: string
  status: "Received" | "In Progress" | "Resolved" | "Rejected"
  caseId: string
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: string
  type: "warning" | "fire" | "info" | "news"
  title: string
  description: string
  severity?: string
  latitude?: number
  longitude?: number
  source: string
  createdAt: string
}

export interface MapEvent {
  id: string
  title: string
  description: string
  eventType: string
  latitude: number
  longitude: number
  startTime?: string
  endTime?: string
  createdAt: string
}
