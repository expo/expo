import XCTest

@testable import ExpoAppIntents

final class AppIntentDispatcherTests: XCTestCase {
  private var dispatcher: AppIntentDispatcher!
  private var defaults: UserDefaults!

  override func setUp() {
    super.setUp()
    defaults = UserDefaults(suiteName: #file)
    defaults.removePersistentDomain(forName: #file)
    dispatcher = AppIntentDispatcher(store: AppIntentInvocationStore(defaults: defaults))
  }

  func testDispatchPersistsBeforeAnyListener() async {
    let id = await dispatcher.dispatch(name: "increaseCounter", params: ["by": 1])

    let pending = await dispatcher.pendingInvocations()
    XCTAssertEqual(pending.map(\.id), [id])
    XCTAssertEqual(pending[0].name, "increaseCounter")
  }

  func testDispatchYieldsInvocationEvent() async {
    let stream = await dispatcher.invocationEvents()
    let eventTask = Task {
      var iterator = stream.makeAsyncIterator()
      return await iterator.next()
    }

    await dispatcher.dispatch(name: "startHike", params: ["trailId": "t1"])

    let emitted = await eventTask.value
    XCTAssertEqual(emitted?.name, "startHike")
    let pending = await dispatcher.pendingInvocations()
    XCTAssertEqual(pending.count, 1)
  }

  func testTerminatingOldEventStreamDoesNotClearNewerListener() async {
    let oldStream = await dispatcher.invocationEvents()
    let oldEventTask = Task {
      var iterator = oldStream.makeAsyncIterator()
      return await iterator.next()
    }

    let newStream = await dispatcher.invocationEvents()
    let newEventTask = Task {
      var iterator = newStream.makeAsyncIterator()
      return await iterator.next()
    }

    oldEventTask.cancel()
    try? await Task.sleep(nanoseconds: 50_000_000)

    await dispatcher.dispatch(name: "afterRefresh", params: [:])

    let emitted = await nextInvocationWithTimeout(from: newEventTask)
    XCTAssertEqual(emitted?.name, "afterRefresh")
  }

  func testRemovePendingInvocationAndClearPendingInvocations() async {
    let id = await dispatcher.dispatch(name: "a", params: [:])
    await dispatcher.dispatch(name: "b", params: [:])

    await dispatcher.removePendingInvocation(id: id)
    let afterRemove = await dispatcher.pendingInvocations()
    XCTAssertEqual(afterRemove.count, 1)

    await dispatcher.clearPendingInvocations()
    let afterClear = await dispatcher.pendingInvocations()
    XCTAssertEqual(afterClear.count, 0)
  }

  func testRequestShortcutsRefreshInvokesHandler() async {
    var called = false
    await dispatcher.setShortcutsRefreshHandler { called = true }
    let didRefresh = await dispatcher.requestShortcutsRefresh()
    XCTAssertTrue(didRefresh)
    XCTAssertTrue(called)
  }

  func testRequestShortcutsRefreshWithoutHandlerReturnsFalse() async {
    let didRefresh = await dispatcher.requestShortcutsRefresh()
    XCTAssertFalse(didRefresh)
  }

  private func nextInvocationWithTimeout(
    from task: Task<AppIntentInvocation?, Never>,
    nanoseconds: UInt64 = 500_000_000
  ) async -> AppIntentInvocation? {
    return await withTaskGroup(of: AppIntentInvocation?.self) { group in
      group.addTask {
        return await task.value
      }
      group.addTask {
        try? await Task.sleep(nanoseconds: nanoseconds)
        return nil
      }

      let result = await group.next()
      group.cancelAll()
      return result ?? nil
    }
  }
}
