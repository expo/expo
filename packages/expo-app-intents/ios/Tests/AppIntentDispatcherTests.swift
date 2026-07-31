import XCTest

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

final class AppIntentDispatcherTests: XCTestCase {
  private var dispatcher: AppIntentDispatcher!
  private var defaults: UserDefaults!

  override func setUp() {
    super.setUp()
    defaults = UserDefaults(suiteName: #file)
    defaults.removePersistentDomain(forName: #file)
    dispatcher = AppIntentDispatcher(store: AppIntentInvocationStore(defaults: defaults))
  }

  func testDispatchPersistsBeforeAnyListener() async throws {
    let id = await dispatcher.dispatch(name: "increaseCounter", params: ["by": 1])

    let pending = try await dispatcher.pendingInvocations()
    XCTAssertEqual(pending.map(\.id), [id])
    XCTAssertEqual(pending[0].name, "increaseCounter")
  }

  func testDispatchYieldsInvocationEvent() async throws {
    let recorder = EventRecorder()
    let consumer = await subscribe(into: recorder)

    await dispatcher.dispatch(name: "startHike", params: ["trailId": "t1"])

    let delivered = await waitUntil { await recorder.names == ["startHike"] }
    XCTAssertTrue(delivered, "expected the live listener to receive 'startHike'")
    let pending = try await dispatcher.pendingInvocations()
    XCTAssertEqual(pending.count, 1)
    consumer.cancel()
  }

  func testTerminatingOldEventStreamDoesNotClearNewerListener() async {
    let oldRecorder = EventRecorder()
    let oldConsumer = await subscribe(into: oldRecorder)

    let newRecorder = EventRecorder()
    let newConsumer = await subscribe(into: newRecorder)

    oldConsumer.cancel()
    _ = await waitUntil { await oldRecorder.didFinish }

    await dispatcher.dispatch(name: "afterRefresh", params: [:])

    let delivered = await waitUntil { await newRecorder.names == ["afterRefresh"] }
    XCTAssertTrue(delivered, "expected the newer listener to receive 'afterRefresh'")
    newConsumer.cancel()
  }

  /**
   Two `AppContext`s genuinely coexist, for example while a JavaScript reload settles. A second
   subscription must not silence the first: with a single continuation the older context was deaf
   for the rest of its life.
   */
  func testEverySubscriberReceivesEveryInvocation() async {
    let firstRecorder = EventRecorder()
    let firstConsumer = await subscribe(into: firstRecorder)
    let secondRecorder = EventRecorder()
    let secondConsumer = await subscribe(into: secondRecorder)

    await dispatcher.dispatch(name: "startHike", params: [:])

    let firstGotIt = await waitUntil { await firstRecorder.names == ["startHike"] }
    let secondGotIt = await waitUntil { await secondRecorder.names == ["startHike"] }
    XCTAssertTrue(firstGotIt, "expected the older subscriber to keep receiving")
    XCTAssertTrue(secondGotIt, "expected the newer subscriber to receive")
    let firstFinished = await firstRecorder.didFinish
    XCTAssertFalse(firstFinished, "a second subscription must not finish the first stream")

    firstConsumer.cancel()
    secondConsumer.cancel()
  }

  /**
   Destroying the newest subscriber must not leave the app deaf. With a single continuation, the
   remaining context had no way to register again and nothing listened to `onIntent` any more.
   */
  func testRemainingSubscriberStillReceivesAfterTheNewestIsDestroyed() async {
    let survivingRecorder = EventRecorder()
    let survivingConsumer = await subscribe(into: survivingRecorder)

    let doomedRecorder = EventRecorder()
    let doomedConsumer = await subscribe(into: doomedRecorder)
    doomedConsumer.cancel()
    _ = await waitUntil { await doomedRecorder.didFinish }

    await dispatcher.dispatch(name: "afterTeardown", params: [:])

    let delivered = await waitUntil { await survivingRecorder.names == ["afterTeardown"] }
    XCTAssertTrue(delivered, "expected the surviving subscriber to still receive invocations")
    survivingConsumer.cancel()
  }

  /**
   A JavaScript reload briefly keeps two modules alive. The old module's `OnDestroy` cancels its
   event task, but a cancelled task still runs its body, so it can still reach the dispatcher after
   the new module registered its stream. Registering then would immediately terminate again and
   leave nothing listening, and `onIntent` would never fire again.
   */
  func testCancelledTaskCannotReplaceLiveListener() async {
    let liveRecorder = EventRecorder()
    let liveConsumer = await subscribe(into: liveRecorder)

    let staleTask = Task { [dispatcher] in
      let subscription = AppIntentEventSubscription()
      for await _ in await dispatcher!.invocationEvents(for: subscription) {}
    }
    staleTask.cancel()
    _ = await waitUntil { staleTask.isCancelled }
    try? await Task.sleep(nanoseconds: 100_000_000)

    await dispatcher.dispatch(name: "afterReload", params: [:])

    let delivered = await waitUntil { await liveRecorder.names == ["afterReload"] }
    XCTAssertTrue(delivered, "expected the live listener to keep receiving after a stale task ran")
    liveConsumer.cancel()
  }

  /// Same race, resolved through the token the destroyed module invalidated in `OnDestroy`.
  func testInvalidatedSubscriptionCannotReplaceLiveListener() async {
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
    XCTAssertTrue(delivered, "expected the live listener to keep receiving after a stale token ran")
    XCTAssertEqual(staleNames, [])
    liveConsumer.cancel()
    staleConsumer.cancel()
  }

  func testRemovePendingInvocationAndClearPendingInvocations() async throws {
    let id = await dispatcher.dispatch(name: "a", params: [:])
    await dispatcher.dispatch(name: "b", params: [:])

    try await dispatcher.removePendingInvocation(id: id)
    let afterRemove = try await dispatcher.pendingInvocations()
    XCTAssertEqual(afterRemove.count, 1)

    await dispatcher.clearPendingInvocations()
    let afterClear = try await dispatcher.pendingInvocations()
    XCTAssertEqual(afterClear.count, 0)
  }

  func testRequestShortcutsRefreshInvokesHandler() async {
    let handlerCalled = EventRecorder()
    await dispatcher.setShortcutsRefreshHandler {
      await handlerCalled.record("refresh")
    }

    let refreshed = await dispatcher.requestShortcutsRefresh()
    let names = await handlerCalled.names
    XCTAssertTrue(refreshed)
    XCTAssertEqual(names, ["refresh"])
  }

  func testRequestShortcutsRefreshWithoutHandlerReturnsFalse() async {
    let refreshed = await dispatcher.requestShortcutsRefresh()
    XCTAssertFalse(refreshed)
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

  /**
   Polls until `condition` holds. Awaiting a task that never completes would hang the whole test
   run, so every wait here is bounded and reported as a failed assertion instead.
   */
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
