import { jest } from "@jest/globals"
import { QueueState } from "../lib/queue/contracts"

const actionMocks = {
  createOrderAction: jest.fn(),
  addBotAction: jest.fn(),
  removeBotAction: jest.fn(),
}

let socketHandlers: {
  onState: (state: QueueState) => void
  onError: (message: string) => void
  onOpen?: () => void
  onClose?: () => void
} | null = null

const socketMock = {
  close: jest.fn(),
  readyState: WebSocket.CONNECTING,
}

jest.mock("../app/actions/queueActions", () => actionMocks)
jest.mock("../lib/queue/stateSocket", () => ({
  createStateSocket: jest.fn((handlers) => {
    socketHandlers = handlers
    return socketMock
  }),
}))

const queueState: QueueState = {
  pending: [
    {
      id: 1,
      type: "VIP",
      status: "pending",
      createdAt: "2026-05-01T12:00:00Z",
    },
  ],
  complete: [],
  bots: [
    {
      id: 1,
      status: "IDLE",
      currentOrder: null,
    },
  ],
}

describe("useStore with server actions", () => {
  beforeEach(() => {
    jest.resetModules()
    actionMocks.createOrderAction.mockReset()
    actionMocks.addBotAction.mockReset()
    actionMocks.removeBotAction.mockReset()
    socketHandlers = null
    socketMock.close.mockReset()
    socketMock.readyState = WebSocket.CONNECTING
  })

  test("connectStateStream hydrates frontend state from websocket", async () => {
    const { default: useStore } = await import("../store/useStore")
    useStore.getState().connectStateStream()

    socketHandlers?.onOpen?.()
    socketHandlers?.onState(queueState)

    const state = useStore.getState()
    expect(state.isStreaming).toBe(true)
    expect(state.pending).toHaveLength(1)
    expect(state.bots).toHaveLength(1)
    expect(state.error).toBeNull()
  })

  test("newOrder triggers mutation and waits for websocket state", async () => {
    actionMocks.createOrderAction.mockResolvedValue(undefined)

    const { default: useStore } = await import("../store/useStore")
    await useStore.getState().newOrder("Normal")

    expect(actionMocks.createOrderAction).toHaveBeenCalledWith("Normal")
    expect(useStore.getState().isLoading).toBe(false)
  })

  test("addBot and removeBot trigger server actions", async () => {
    actionMocks.addBotAction.mockResolvedValue(undefined)
    actionMocks.removeBotAction.mockResolvedValue(undefined)

    const { default: useStore } = await import("../store/useStore")
    await useStore.getState().addBot()
    expect(actionMocks.addBotAction).toHaveBeenCalled()

    await useStore.getState().removeBot()
    expect(actionMocks.removeBotAction).toHaveBeenCalled()
  })

  test("stores errors from failed server action", async () => {
    actionMocks.removeBotAction.mockRejectedValue(new Error("Not Found"))

    const { default: useStore } = await import("../store/useStore")
    await useStore.getState().removeBot()

    expect(useStore.getState().error).toBe("Not Found")
    expect(useStore.getState().isLoading).toBe(false)
  })
})
