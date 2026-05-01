import { ApiStateResp, QueueState, toQueueState } from "./contracts"

type StateSocketHandlers = {
  onState: (state: QueueState) => void
  onError: (message: string) => void
  onOpen?: () => void
  onClose?: () => void
}

const getWebSocketBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_BACKEND_WS_URL

  if (!raw) {
    throw new Error("NEXT_PUBLIC_BACKEND_WS_URL is not configured")
  }

  const normalized = raw.replace(/\/$/, "")

  if (normalized.startsWith("https://")) {
    return normalized.replace(/^https:\/\//, "wss://")
  }

  if (normalized.startsWith("http://")) {
    return normalized.replace(/^http:\/\//, "ws://")
  }

  if (normalized.startsWith("wss://") || normalized.startsWith("ws://")) {
    return normalized
  }

  throw new Error("NEXT_PUBLIC_BACKEND_WS_URL must include http(s):// or ws(s)://")
}

export const createStateSocket = ({
  onState,
  onError,
  onOpen,
  onClose,
}: StateSocketHandlers): WebSocket => {
  const socket = new WebSocket(`${getWebSocketBaseUrl()}/state`)

  socket.onopen = () => {
    onOpen?.()
  }

  socket.onmessage = (event: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(event.data) as ApiStateResp
      onState(toQueueState(payload))
    } catch {
      onError("Invalid state payload received from websocket")
    }
  }

  socket.onerror = () => {
    onError("Websocket connection error")
  }

  socket.onclose = () => {
    onClose?.()
  }

  return socket
}
