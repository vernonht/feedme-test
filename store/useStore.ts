"use client"

import { create } from "zustand"
import {
  addBotAction,
  createOrderAction,
  removeBotAction,
} from "../app/actions/queueActions"
import { Bot, Order, OrderType, QueueState } from "@/lib/queue/contracts"
import { createStateSocket } from "../lib/queue/stateSocket"

let stateSocket: WebSocket | null = null

type StoreState = {
  pending: Order[]
  complete: Order[]
  bots: Bot[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  newOrder: (type: OrderType) => Promise<void>
  addBot: () => Promise<void>
  removeBot: () => Promise<void>
  connectStateStream: () => void
  disconnectStateStream: () => void
  clearError: () => void
}

type SetFn = (updater: (s: StoreState) => StoreState) => void

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Unexpected API error"
}

const applyQueueState = (current: StoreState, queue: QueueState): StoreState => ({
  ...current,
  pending: queue.pending,
  complete: queue.complete,
  bots: queue.bots,
  isLoading: false,
})

export const useStore = create<StoreState>((set: SetFn) => ({
  pending: [],
  complete: [],
  bots: [],
  isLoading: false,
  isStreaming: false,
  error: null,

  async newOrder(type) {
    set((s: StoreState) => ({ ...s, isLoading: true, error: null }))

    try {
      await createOrderAction(type)
      set((s: StoreState) => ({ ...s, isLoading: false }))
    } catch (error) {
      set((s: StoreState) => ({
        ...s,
        isLoading: false,
        error: getErrorMessage(error),
      }))
    }
  },

  async addBot() {
    set((s: StoreState) => ({ ...s, isLoading: true, error: null }))

    try {
      await addBotAction()
      set((s: StoreState) => ({ ...s, isLoading: false }))
    } catch (error) {
      set((s: StoreState) => ({
        ...s,
        isLoading: false,
        error: getErrorMessage(error),
      }))
    }
  },

  async removeBot() {
    set((s: StoreState) => ({ ...s, isLoading: true, error: null }))

    try {
      await removeBotAction()
      set((s: StoreState) => ({ ...s, isLoading: false }))
    } catch (error) {
      set((s: StoreState) => ({
        ...s,
        isLoading: false,
        error: getErrorMessage(error),
      }))
    }
  },

  connectStateStream() {
    if (stateSocket && stateSocket.readyState <= WebSocket.OPEN) {
      return
    }

    try {
      stateSocket = createStateSocket({
        onState: (queue) => {
          set((s: StoreState) => ({ ...applyQueueState(s, queue), error: null }))
        },
        onError: (message) => {
          set((s: StoreState) => ({ ...s, isStreaming: false, error: message }))
        },
        onOpen: () => {
          set((s: StoreState) => ({ ...s, isStreaming: true, error: null }))
        },
        onClose: () => {
          stateSocket = null
          set((s: StoreState) => ({ ...s, isStreaming: false }))
        },
      })
    } catch (error) {
      set((s: StoreState) => ({
        ...s,
        isStreaming: false,
        error: getErrorMessage(error),
      }))
    }
  },

  disconnectStateStream() {
    if (!stateSocket) {
      set((s: StoreState) => ({ ...s, isStreaming: false }))
      return
    }

    stateSocket.close()
    stateSocket = null
    set((s: StoreState) => ({ ...s, isStreaming: false }))
  },

  clearError() {
    set((s: StoreState) => ({ ...s, error: null }))
  },
}))

export type { Order, Bot } from "@/lib/queue/contracts"

export default useStore
