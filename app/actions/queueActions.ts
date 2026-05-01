"use server"

import {
  ApiStateResp,
  OrderType,
  QueueState,
  toBackendOrderType,
  toQueueState,
} from "@/lib/queue/contracts"

const getBackendBaseUrl = () => {
  const value = process.env.BACKEND_BASE_URL
  if (!value) {
    throw new Error("BACKEND_BASE_URL is not configured")
  }

  return value.replace(/\/$/, "")
}

const backendFetch = async (path: string, init: RequestInit = {}) => {
  const url = `${getBackendBaseUrl()}${path}`
  const headers = new Headers(init.headers)

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return response
}

/**
 * @deprecated Use websocket `/state` stream for runtime queue updates.
 */
export async function getQueueStateAction(): Promise<QueueState> {
  const response = await backendFetch("/state", { method: "GET" })
  const payload = (await response.json()) as ApiStateResp
  return toQueueState(payload)
}

export async function createOrderAction(type: OrderType): Promise<void> {
  await backendFetch("/orders", {
    method: "POST",
    body: JSON.stringify({ type: toBackendOrderType(type) }),
  })
}

export async function addBotAction(): Promise<void> {
  await backendFetch("/bots", { method: "POST" })
}

export async function removeBotAction(): Promise<void> {
  await backendFetch("/bots", { method: "DELETE" })
}
