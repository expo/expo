import Testing
import Foundation

@testable import EXUpdates

private final class StubObserver: UpdatesEventManagerObserver {
  var receivedContext: UpdatesStateContext?
  func onStateMachineContextEvent(context: UpdatesStateContext) {
    receivedContext = context
  }
}

@Suite("QueueUpdatesEventManager")
struct QueueUpdatesEventManagerTests {
  @Test
  func `removeObserver only clears the slot if it still points at the caller`() {
    let manager = QueueUpdatesEventManager(logger: UpdatesLogger())
    let first = StubObserver()
    let second = StubObserver()

    manager.setObserver(first)
    manager.setObserver(second)
    manager.removeObserver(first)
    manager.sendStateMachineContextEvent(context: UpdatesStateContext())

    #expect(second.receivedContext != nil)
    #expect(first.receivedContext == nil)
  }
}
