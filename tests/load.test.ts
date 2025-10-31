import { jest } from "@jest/globals"

describe("load test for useStore", () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test("processes many orders with multiple bots", () => {
    jest.useFakeTimers()
    const storeMod = require("../store/useStore")
    const useStore = storeMod.default
    const { PROCESS_TIME } = require("../constants")

    const s = useStore.getState()
    const ORDERS = 200
    const BOTS = 20

    // create orders (mix VIP and Normal)
    function randomOrderType() {
      return Math.random() < 0.3 ? "VIP" : "Normal"
    }
    for (let i = 0; i < ORDERS; i++) {
      s.newOrder(randomOrderType())
    }

    // add bots
    for (let i = 0; i < BOTS; i++) s.addBot()

    // compute rounds and fast-forward
    const rounds = Math.ceil(ORDERS / BOTS)
    jest.advanceTimersByTime(rounds * PROCESS_TIME + 2000)

    const after = useStore.getState()
    expect(after.complete.length).toBe(ORDERS)

    jest.useRealTimers()
  }, 20000)

  test("processes many orders with bots removal", () => {
    jest.useFakeTimers()
    const storeMod = require("../store/useStore")
    const useStore = storeMod.default
    const { PROCESS_TIME } = require("../constants")

    const s = useStore.getState()
    const ORDERS = 200
    const BOTS = 20

    // create orders (mix VIP and Normal)
    function randomOrderType() {
      return Math.random() < 0.3 ? "VIP" : "Normal"
    }
    for (let i = 0; i < ORDERS; i++) {
      s.newOrder(randomOrderType())
    }

    // add bots
    for (let i = 0; i < BOTS; i++) s.addBot()

    jest.advanceTimersByTime(PROCESS_TIME / 2)

    // remove half of the bots mid-processing
    const midRemove = Math.floor(BOTS / 2)
    for (let i = 0; i < midRemove; i++) s.removeBot()

    jest.advanceTimersByTime(PROCESS_TIME / 2)

    const after = useStore.getState()

    // only half of the orders should be complete
    expect(after.complete.length).toBe(BOTS / 2)

    // the remaining orders should still be pending
    expect(after.pending.length).toBe(ORDERS - BOTS / 2)

    jest.useRealTimers()
  }, 20000)

  test("processes many orders with random bot removals each round", () => {
    jest.useFakeTimers()
    const storeMod = require("../store/useStore")
    const useStore = storeMod.default
    const { PROCESS_TIME } = require("../constants")

    const s = useStore.getState()
    const ORDERS = 200
    const BOTS = 20

    // create orders (mix VIP and Normal)
    function randomOrderType() {
      return Math.random() < 0.3 ? "VIP" : "Normal"
    }
    for (let i = 0; i < ORDERS; i++) {
      s.newOrder(randomOrderType())
    }

    // add bots
    for (let i = 0; i < BOTS; i++) s.addBot()

    let botsLeft = BOTS
    let ordersLeft = ORDERS
    let round = 0

    while (botsLeft > 0 && ordersLeft > 0) {
      jest.advanceTimersByTime(PROCESS_TIME / 2)
      // Remove a random number of bots (up to half of current bots, but at least 1 if more than 1 bot left)
      const maxRemove = Math.max(1, Math.floor(botsLeft / 2))
      const removeCount = Math.floor(Math.random() * (maxRemove + 1))
      for (let i = 0; i < removeCount; i++) {
        if (botsLeft > 0) {
          s.removeBot()
          botsLeft--
        }
      }
      // Update orders left
      const after = useStore.getState()
      ordersLeft = after.pending.length
      round++
      if (botsLeft === 0) break
    }

    const after = useStore.getState()
    // All bots are removed or orders are done
    expect(after.bots.length).toBe(botsLeft)
    expect(after.pending.length + after.complete.length).toBe(ORDERS)

    jest.useRealTimers()
  }, 20000)
})
