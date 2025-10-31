"use client"

import Image from "next/image"
import useStore, { Order, Bot } from "../store/useStore"
import { NORMAL_COLOR, VIP_COLOR } from "@/constants"

export default function Home() {
  const pending = useStore((s) => s.pending)
  const complete = useStore((s) => s.complete)
  const bots = useStore((s) => s.bots)
  const newOrder = useStore((s) => s.newOrder)
  const addBot = useStore((s) => s.addBot)
  const removeBot = useStore((s) => s.removeBot)

  function renderOrder(o: Order) {
    return (
      <div
        key={o.id}
        className="flex items-center justify-between gap-4 rounded border p-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 text-sm font-semibold">#{o.id}</div>
          <div
            className="rounded-md px-2 text-sm text-black"
            style={{ background: o.type === "VIP" ? VIP_COLOR : NORMAL_COLOR }}
          >
            {o.type}
          </div>
        </div>
        <div className="text-sm text-zinc-500">
          {o.completedAt ? (
            <span className="text-green-500">Completed at:{new Date(o.completedAt).toLocaleTimeString()}</span>
          ) : (
            new Date(o.createdAt).toLocaleTimeString()
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
      <main className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="https://www.mcdonalds.com.my/images/common/logo.svg"
              alt="logo"
              width={80}
              height={20}
            />
            <h1 className="text-2xl font-semibold">
              FeedMe Test - OMS
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => newOrder("Normal")}
              className="rounded bg-slate-800 px-4 py-2 text-white"
            >
              New Normal Order
            </button>
            <button
              onClick={() => newOrder("VIP")}
              className="rounded bg-yellow-400 px-4 py-2"
            >
              New VIP Order
            </button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="col-span-2 space-y-4">
            <div className="rounded border bg-white p-4">
              <h2 className="mb-3 text-6xl text-black font-medium">PENDING</h2>
              <div className="flex flex-col gap-2">
                {pending.length === 0 ? (
                  <div className="text-sm text-zinc-500">No pending orders</div>
                ) : (
                  pending.map(renderOrder)
                )}
              </div>
            </div>
            <div className="rounded border bg-white p-4">
              <h2 className="mb-3 text-6xl text-black font-medium">COMPLETE</h2>
              <div className="flex flex-col gap-2">
                {complete.length === 0 ? (
                  <div className="text-sm text-zinc-500">
                    No completed orders
                  </div>
                ) : (
                  complete.map(renderOrder)
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded border bg-white p-4">
              <h3 className="mb-3 text-3xl text-black font-medium">
                Bots (total:{bots.length})
              </h3>
              <div className="mb-4 flex gap-2">
                <button
                  onClick={addBot}
                  className="rounded-lg bg-green-500 px-5 py-1 text-white"
                >
                  + Bot
                </button>
                <button
                  onClick={removeBot}
                  className="rounded-lg bg-red-500 px-5 py-1 text-white"
                >
                  - Bot
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {bots.length === 0 && (
                  <div className="text-sm text-zinc-500">No bots</div>
                )}
                {bots.map((b: Bot) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded border p-2"
                  >
                    <div className="text-sm font-medium">Bot #{b.id}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-zinc-500">{b.status}</div>
                      {b.currentOrder && (
                        <div className="text-sm">#{b.currentOrder.id}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded border bg-white p-4">
              <h3 className="mb-2 text-lg font-medium">Instructions</h3>
              <ul className="text-sm text-zinc-600">
                <li>Click to create Normal or VIP orders.</li>
                <li>VIP orders are prioritized over Normal orders.</li>
                <li>
                  Each bot processes one order for 10s, then moves it to
                  COMPLETE.
                </li>
                <li>
                  Removing a bot cancels its current job and the pending order will remain in PENDING.
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
