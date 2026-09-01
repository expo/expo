import Testing
import Foundation

@testable import EXUpdates

private final class StubObserver: UpdatesEventManagerObserver {
  var receivedContext: UpdatesStateContext?
  func onStateMachineContextEvent(context: UpdatesStateContext) {
    receivedContext = context
  }
}

// On reload, the incoming module sets itself as the observer while the outgoing module clears
// itself from another thread, so the observer slot is written from more than one thread.
@Suite("QueueUpdatesEventManager")
struct QueueUpdatesEventManagerTests {
  @Test
  func `sends the context to the current observer`() {
    let manager = QueueUpdatesEventManager(logger: UpdatesLogger())
    let observer = StubObserver()
    manager.setObserver(observer)

    let context = UpdatesStateContext()
    manager.sendStateMachineContextEvent(context: context)

    #expect(observer.receivedContext != nil)
  }

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

  @Test
  func `removeObserver clears the slot when it matches`() {
    let manager = QueueUpdatesEventManager(logger: UpdatesLogger())
    let observer = StubObserver()

    manager.setObserver(observer)
    manager.removeObserver(observer)
    manager.sendStateMachineContextEvent(context: UpdatesStateContext())

    #expect(observer.receivedContext == nil)
  }

  @Test
  func `set and remove from many threads at once does not crash`() {
    let manager = QueueUpdatesEventManager(logger: UpdatesLogger())
    let observers = (0..<500).map { _ in StubObserver() }

    DispatchQueue.concurrentPerform(iterations: observers.count) { index in
      manager.setObserver(observers[index])
      manager.removeObserver(observers[index])
    }

    manager.sendStateMachineContextEvent(context: UpdatesStateContext())
  }
}
