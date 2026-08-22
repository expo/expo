import Foundation
import Testing

@testable import ExpoAppIntents

/// Collects what a stream consumer saw, so assertions never depend on task scheduling order.
private actor EventRecorder {
  private(set) var names: [String] = []
  private(set) var didFinish = false

  func record(_ name: String) {
    names.append(name)
  }

  func markFinished() {
    didFinish = true
  }
}

/// Serialized because every test works in the same `#file`-named UserDefaults suite.
@Suite("AppIntentDispatcher", .serialized)
struct AppIntentDispatcherTests {
  private let dispatcher: AppIntentDispatcher
  private let defaults: UserDefaults

  init() throws {
    defaults = try #require(UserDefaults(suiteName: #file))
    defaults.removePersistentDomain(forName: #file)
    dispatcher = AppIntentDispatcher(store: AppIntentInvocationStore(defaults: defaults))
  }

  @Test
  func `dispatch persists before any listener`() async throws {
    let id = await dispatcher.dispatch(name: "increaseCounter", params: ["by": 1])

    let pending = try await dispatcher.pendingInvocations()
    #expect(pending.map(\.id) == [id])
    #expect(pending[0].name == "increaseCounter")
  }

  @Test
  func `dispatch yields an invocation event`() async throws {
    let recorder = EventRecorder()
    let consumer = await subscribe(into: recorder)

    await dispatcher.dispatch(name: "startHike", params: ["trailId": "t1"])

    let delivered = await waitUntil { await recorder.names == ["startHike"] }
    #expect(delivered, "expected the live listener to receive 'startHike'")
    let pending = try await dispatcher.pendingInvocations()
    #expect(pending.count == 1)
    consumer.cancel()
  }

  @Test
  func `terminating an old event stream does not clear a newer listener`() async {
    let oldRecorder = EventRecorder()
    let oldConsumer = await subscribe(into: oldRecorder)

    let newRecorder = EventRecorder()
    let newConsumer = await subscribe(into: newRecorder)

    oldConsumer.cancel()
    _ = await waitUntil { await oldRecorder.didFinish }

    await dispatcher.dispatch(name: "afterRefresh", params: [:])

    let delivered = await waitUntil { await newRecorder.names == ["afterRefresh"] }
    #expect(delivered, "expected the newer listener to receive 'afterRefresh'")
    newConsumer.cancel()
  }

  /// Two `AppContext`s genuinely coexist, for example while a JavaScript reload settles. A second
  /// subscription must not silence the first: with a single continuation the older context was deaf
  /// for the rest of its life.
  @Test
  func `every subscriber receives every invocation`() async {
    let firstRecorder = EventRecorder()
    let firstConsumer = await subscribe(into: firstRecorder)
    let secondRecorder = EventRecorder()
    let secondConsumer = await subscribe(into: secondRecorder)

    await dispatcher.dispatch(name: "startHike", params: [:])

    let firstGotIt = await waitUntil { await firstRecorder.names == ["startHike"] }
    let secondGotIt = await waitUntil { await secondRecorder.names == ["startHike"] }
    #expect(firstGotIt, "expected the older subscriber to keep receiving")
    #expect(secondGotIt, "expected the newer subscriber to receive")
    let firstFinished = await firstRecorder.didFinish
    #expect(!firstFinished, "a second subscription must not finish the first stream")

    firstConsumer.cancel()
    secondConsumer.cancel()
  }

  /// Destroying the newest subscriber must not leave the app deaf. With a single continuation, the
  /// remaining context had no way to register again and nothing listened to `onIntent` any more.
  @Test
  func `the remaining subscriber still receives after the newest is destroyed`() async {
    let survivingRecorder = EventRecorder()
    let survivingConsumer = await subscribe(into: survivingRecorder)

    let doomedRecorder = EventRecorder()
    let doomedConsumer = await subscribe(into: doomedRecorder)
    doomedConsumer.cancel()
    _ = await waitUntil { await doomedRecorder.didFinish }

    await dispatcher.dispatch(name: "afterTeardown", params: [:])

    let delivered = await waitUntil { await survivingRecorder.names == ["afterTeardown"] }
    #expect(delivered, "expected the surviving subscriber to still receive invocations")
    survivingConsumer.cancel()
  }

  /// A JavaScript reload briefly keeps two modules alive. The old module's `OnDestroy` cancels its
  /// event task, but a cancelled task still runs its body, so it can still reach the dispatcher after
  /// the new module registered its stream. Registering then would immediately terminate again and
  /// leave nothing listening, and `onIntent` would never fire again.
  @Test
  func `a cancelled task cannot replace the live listener`() async {
    let liveRecorder = EventRecorder()
    let liveConsumer = await subscribe(into: liveRecorder)

    let staleTask = Task { [dispatcher] in
      let subscription = AppIntentEventSubscription()
      for await _ in await dispatcher.invocationEvents(for: subscription) {}
    }
    staleTask.cancel()
    _ = await waitUntil { staleTask.isCancelled }
    try? await Task.sleep(nanoseconds: 100_000_000)

    await dispatcher.dispatch(name: "afterReload", params: [:])

    let delivered = await waitUntil { await liveRecorder.names == ["afterReload"] }
    #expect(delivered, "expected the live listener to keep receiving after a stale task ran")
    liveConsumer.cancel()
  }

  /// Same race, resolved through the token the destroyed module invalidated in `OnDestroy`.
  @Test
  func `an invalidated subscription cannot replace the live listener`() async {
    let liveRecorder = EventRecorder()
    let liveConsumer = await subscribe(into: liveRecorder)

    let staleSubscription = AppIntentEventSubscription()
    staleSubscription.invalidate()
    let staleRecorder = EventRecorder()
    let staleConsumer = consume(
      await dispatcher.invocationEvents(for: staleSubscription),
      into: staleRecorder
    )
    _ = await waitUntil { await staleRecorder.didFinish }

    await dispatcher.dispatch(name: "afterReload", params: [:])

    let delivered = await waitUntil { await liveRecorder.names == ["afterReload"] }
    let staleNames = await staleRecorder.names
    #expect(delivered, "expected the live listener to keep receiving after a stale token ran")
    #expect(staleNames.isEmpty)
    liveConsumer.cancel()
    staleConsumer.cancel()
  }

  @Test
  func `removes a pending invocation and clears the queue`() async throws {
    let id = await dispatcher.dispatch(name: "a", params: [:])
    await dispatcher.dispatch(name: "b", params: [:])

    try await dispatcher.removePendingInvocation(id: id)
    let afterRemove = try await dispatcher.pendingInvocations()
    #expect(afterRemove.count == 1)

    await dispatcher.clearPendingInvocations()
    let afterClear = try await dispatcher.pendingInvocations()
    #expect(afterClear.isEmpty)
  }

  @Test
  func `requestShortcutsRefresh invokes the registered handler`() async {
    let handlerCalled = EventRecorder()
    await dispatcher.setShortcutsRefreshHandler {
      await handlerCalled.record("refresh")
    }

    let refreshed = await dispatcher.requestShortcutsRefresh()
    let names = await handlerCalled.names
    #expect(refreshed)
    #expect(names == ["refresh"])
  }

  @Test
  func `requestShortcutsRefresh without a handler returns false`() async {
    let refreshed = await dispatcher.requestShortcutsRefresh()
    #expect(!refreshed)
  }

  /// Subscribes with a token of its own, because `invocationEvents(for:)` has no default one.
  private func subscribe(into recorder: EventRecorder) async -> Task<Void, Never> {
    let stream = await dispatcher.invocationEvents(for: AppIntentEventSubscription())
    return consume(stream, into: recorder)
  }

  private func consume(
    _ stream: AsyncStream<AppIntentInvocation>,
    into recorder: EventRecorder
  ) -> Task<Void, Never> {
    return Task {
      for await invocation in stream {
        await recorder.record(invocation.name)
      }
      await recorder.markFinished()
    }
  }

  /// Polls until `condition` holds. Awaiting a task that never completes would hang the whole test
  /// run, so every wait here is bounded and reported as a failed assertion instead.
  private func waitUntil(
    timeout: UInt64 = 2_000_000_000,
    _ condition: @Sendable () async -> Bool
  ) async -> Bool {
    let deadline = DispatchTime.now().uptimeNanoseconds + timeout
    while DispatchTime.now().uptimeNanoseconds < deadline {
      if await condition() {
        return true
      }
      try? await Task.sleep(nanoseconds: 10_000_000)
    }
    return await condition()
  }
}
