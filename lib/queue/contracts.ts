export type OrderType = "VIP" | "Normal"

export type BackendOrderType = "vip" | "normal"

export type Order = {
  id: number
  type: OrderType
  createdAt: string
  status: string
}

export type Bot = {
  id: number
  status: "IDLE" | "BUSY"
  currentOrder: Order | null
}

export type QueueState = {
  pending: Order[]
  complete: Order[]
  bots: Bot[]
}

export type ApiOrderResp = {
  id: number
  type: string
  status: string
  created_at: string
}

export type ApiBotResp = {
  id: number
  current_order?: ApiOrderResp
}

export type ApiStateResp = {
  pending: ApiOrderResp[]
  completed: ApiOrderResp[]
  bots: ApiBotResp[]
}

export const toBackendOrderType = (type: OrderType): BackendOrderType =>
  type === "VIP" ? "vip" : "normal"

const toOrderType = (type: string): OrderType =>
  type.toLowerCase() === "vip" ? "VIP" : "Normal"

const toOrder = (order: ApiOrderResp): Order => ({
  id: order.id,
  type: toOrderType(order.type),
  status: order.status,
  createdAt: order.created_at,
})

export const toQueueState = (state: ApiStateResp): QueueState => ({
  pending: state.pending.map(toOrder),
  complete: state.completed.map(toOrder),
  bots: state.bots.map((bot) => ({
    id: bot.id,
    status: bot.current_order ? "BUSY" : "IDLE",
    currentOrder: bot.current_order ? toOrder(bot.current_order) : null,
  })),
})
