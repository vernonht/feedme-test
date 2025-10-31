import { jest } from "@jest/globals"
import useStore from "../store/useStore"
import { PROCESS_TIME } from "../constants"

describe("useStore simulator", () => {
  beforeEach(() => {
    // reset the store by reloading module state
    jest.resetModules()
  })

  test("creates orders and prioritizes VIP", () => {
    const { newOrder, pending } = useStore.getState()
    newOrder("Normal")
    newOrder("Normal")
    newOrder("VIP")
    const p = useStore.getState().pending
    expect(p.length).toBe(3)
    // VIP should be placed before normals (but after existing VIPs)
    expect(p[0].type).toBe("VIP")
  })

  test("bot processes order after PROCESS_TIME and moves to complete", () => {
    jest.useFakeTimers()
    const store = require("../store/useStore")
    const s = store.default.getState()
    s.newOrder("Normal")
    s.addBot()
    // fast-forward
    jest.advanceTimersByTime(PROCESS_TIME)
    const after = store.default.getState()
    expect(after.complete.length).toBe(1)
    jest.useRealTimers()
  })

  test("removing bot cancels processing", () => {
    jest.useFakeTimers()
    const store = require("../store/useStore")
    const s = store.default.getState()
    s.newOrder("Normal")
    s.addBot()
    // remove the bot before timer finishes
    s.removeBot()
    jest.advanceTimersByTime(PROCESS_TIME)
    const after = store.default.getState()
    // order should be still in pending and not in complete
    expect(after.pending.length).toBeGreaterThanOrEqual(1)
    expect(after.complete.length).toBe(0)
    jest.useRealTimers()
  })

  test("multiple bots process multiple orders in parallel", () => {
    jest.useFakeTimers()
    const store = require("../store/useStore")
    const s = store.default.getState()
    // Add 3 orders
    s.newOrder("Normal")
    s.newOrder("VIP")
    s.newOrder("Normal")
    // Add 2 bots
    s.addBot()
    s.addBot()
    // Both bots should pick up orders immediately
    let bots = store.default.getState().bots
    expect(bots.filter((b: any) => b.status === "BUSY").length).toBe(2)
    // Fast-forward timers
    jest.advanceTimersByTime(PROCESS_TIME)
    const after = store.default.getState()
    // 2 orders should be complete, 1 pending
    expect(after.complete.length).toBe(2)
    expect(after.pending.length).toBe(1)
    jest.useRealTimers()
  })

  test("VIP orders are always prioritized by all bots", () => {
    jest.useFakeTimers()
    const store = require("../store/useStore")
    const s = store.default.getState()
    // Add 2 normal, 1 VIP, 1 normal
    s.newOrder("Normal")
    s.newOrder("Normal")
    s.newOrder("VIP")
    s.newOrder("Normal")
    // Add 3 bots
    s.addBot()
    s.addBot()
    s.addBot()
    // Fast-forward timers
    jest.advanceTimersByTime(PROCESS_TIME)
    const after = store.default.getState()
    // All bots should have processed an order, VIP should be in complete
    expect(after.complete.find((o: any) => o.type === "VIP")).toBeTruthy()
    expect(after.complete.length).toBe(3)
    expect(after.pending.length).toBe(1)
    jest.useRealTimers()
  })
})
