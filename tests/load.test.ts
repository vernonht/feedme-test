import { jest } from "@jest/globals"

const actionMocks = {
  createOrderAction: jest.fn(),
  addBotAction: jest.fn(),
  removeBotAction: jest.fn(),
}

jest.mock("../app/actions/queueActions", () => actionMocks)

describe("load test for server-action store", () => {
  beforeEach(() => {
    jest.resetModules()
    actionMocks.createOrderAction.mockReset()
    actionMocks.addBotAction.mockReset()
    actionMocks.removeBotAction.mockReset()
  })

  test("handles high-volume order and bot operations", async () => {
    actionMocks.addBotAction.mockResolvedValue(undefined)
    actionMocks.createOrderAction.mockResolvedValue(undefined)

    const { default: useStore } = await import("../store/useStore")
    const s = useStore.getState()

    for (let i = 0; i < 10; i++) {
      await s.addBot()
    }

    for (let i = 0; i < 100; i++) {
      await s.newOrder(i % 3 === 0 ? "VIP" : "Normal")
    }

    const after = useStore.getState()
    expect(actionMocks.addBotAction).toHaveBeenCalledTimes(10)
    expect(actionMocks.createOrderAction).toHaveBeenCalledTimes(100)
    expect(after.isLoading).toBe(false)
    expect(after.error).toBeNull()
  }, 30000)
})
