import { create } from "zustand"
import { PROCESS_TIME } from "../constants"

type OrderType = "VIP" | "Normal"

export type Order = {
  id: number
  type: OrderType
  createdAt: number
  completedAt?: number
}

export type Bot = {
  id: number
  status: "IDLE" | "BUSY"
  currentOrder: Order | null
  timeoutId: number | null
}

type StoreState = {
  nextOrderId: number
  pending: Order[]
  complete: Order[]
  bots: Bot[]
  newOrder: (type: OrderType) => void
  addBot: () => void
  removeBot: () => void
  assignOrders: () => void
}

type SetFn = (updater: (s: StoreState) => StoreState) => void
type GetFn = () => StoreState

export const useStore = create<StoreState>((set: SetFn, get: GetFn) => ({
  nextOrderId: 1,
  pending: [],
  complete: [],
  bots: [],

  newOrder(type) {
    const id = get().nextOrderId
    const order: Order = { id, type, createdAt: Date.now() }
    set((s: StoreState) => {
      let pending = s.pending
      if (type === "VIP") {
        const lastVipIndex = pending
          .map((o: Order) => o.type)
          .lastIndexOf("VIP")
        if (lastVipIndex === -1) pending = [order, ...pending]
        else
          pending = [
            ...pending.slice(0, lastVipIndex + 1),
            order,
            ...pending.slice(lastVipIndex + 1),
          ]
      } else {
        pending = [...pending, order]
      }
      return { ...s, nextOrderId: id + 1, pending }
    })
    get().assignOrders()
  },

  addBot() {
    set((s: StoreState) => {
      const id =
        s.bots.length === 0 ? 1 : Math.max(...s.bots.map((x: Bot) => x.id)) + 1
      return {
        ...s,
        bots: [
          ...s.bots,
          { id, status: "IDLE", currentOrder: null, timeoutId: null },
        ],
      }
    })
    get().assignOrders()
  },

  removeBot() {
    const { bots } = get()
    if (bots.length === 0) return
    const newestId = Math.max(...bots.map((b) => b.id))
    const bot = bots.find((b) => b.id === newestId)!
    if (bot.status === "BUSY" && bot.currentOrder) {
      if (bot.timeoutId) {
        clearTimeout(bot.timeoutId)
      }
      const order = bot.currentOrder
      set((s: StoreState) => {
        return {
          ...s,
          bots: s.bots.filter((x: Bot) => x.id !== newestId),
        }
      })
    } else {
      set((s: StoreState) => ({
        ...s,
        bots: s.bots.filter((x: Bot) => x.id !== newestId),
      }))
    }
    get().assignOrders()
  },

  assignOrders() {
    set((s: StoreState) => {
      let pending = s.pending
      let bots = s.bots.map((bot: Bot) => ({ ...bot }))
      // Collect all order ids currently being processed by bots
      const processingOrderIds = new Set(
        bots
          .filter((b) => b.status === "BUSY" && b.currentOrder)
          .map((b) => b.currentOrder!.id)
      )
      for (const bot of bots) {
        if (bot.status === "IDLE") {
          // Only consider orders not already being processed
          const availablePending = pending.filter(
            (o) => !processingOrderIds.has(o.id)
          )
          const vip = availablePending.find((o: Order) => o.type === "VIP")
          const next = vip ?? availablePending[0] ?? null
          if (next) {
            bot.status = "BUSY"
            bot.currentOrder = next
            processingOrderIds.add(next.id)
            const tid = window.setTimeout(() => {
              set((ss: StoreState) => ({
                ...ss,
                pending: ss.pending.filter((o: Order) => o.id !== next.id),
                complete: [
                  ...ss.complete,
                  { ...next, completedAt: Date.now() },
                ],
                bots: ss.bots.map((b: Bot) =>
                  b.id === bot.id
                    ? {
                        ...b,
                        status: "IDLE",
                        currentOrder: null,
                        timeoutId: null,
                      }
                    : b
                ),
              }))
              get().assignOrders()
            }, PROCESS_TIME)
            bot.timeoutId = tid
          }
        }
      }
      return { ...s, bots, pending }
    })
  },
}))

export default useStore
