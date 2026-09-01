import Testing
import Foundation

@testable import ExpoNotifications

/// A delegate that only needs an identity, which is all the registry uses.
private final class StubDelegate: NotificationDelegate {}

/// Runs `body` once per index, concurrently, and returns once every call has finished.
private func concurrently(_ count: Int, _ body: @escaping (Int) -> Void) {
  DispatchQueue.concurrentPerform(iterations: count) { index in
    body(index)
  }
}

// An incoming app context registers its modules while an outgoing one tears its modules down, so
// the registry is written from more than one thread. Unsynchronized, concurrent `append`s lose
// entries and corrupt the array's buffer, which crashes the process with SIGSEGV.
@Suite("NotificationDelegateRegistry")
struct NotificationDelegateRegistryTests {
  @Test
  func `keeps every delegate added from several threads at once`() {
    let registry = NotificationDelegateRegistry()
    let added = (0..<500).map { _ in StubDelegate() }

    concurrently(added.count) { index in
      _ = registry.add(added[index])
    }

    #expect(registry.delegates.count == added.count)
    for delegate in added {
      #expect(registry.delegates.contains { $0 === delegate })
    }
  }

  @Test
  func `removes every delegate removed from several threads at once`() {
    let registry = NotificationDelegateRegistry()
    let added = (0..<500).map { _ in StubDelegate() }
    for delegate in added {
      _ = registry.add(delegate)
    }

    concurrently(added.count) { index in
      registry.remove(added[index])
    }

    #expect(registry.delegates.isEmpty)
  }

  @Test
  func `keeps the survivors when adds and removes interleave across threads`() {
    let registry = NotificationDelegateRegistry()
    let survivors = (0..<250).map { _ in StubDelegate() }
    let transients = (0..<250).map { _ in StubDelegate() }

    concurrently(survivors.count + transients.count) { index in
      if index < survivors.count {
        _ = registry.add(survivors[index])
      } else {
        let transient = transients[index - survivors.count]
        _ = registry.add(transient)
        registry.remove(transient)
      }
    }

    #expect(registry.delegates.count == survivors.count)
    for delegate in survivors {
      #expect(registry.delegates.contains { $0 === delegate })
    }
  }

  @Test
  func `add returns the responses the new delegate still has to be offered`() {
    let registry = NotificationDelegateRegistry()
    let first = StubDelegate()

    #expect(registry.add(first).isEmpty)
    #expect(registry.pendingResponses.isEmpty)
  }

  @Test
  func `removing a delegate that was never added leaves the others in place`() {
    let registry = NotificationDelegateRegistry()
    let kept = StubDelegate()
    _ = registry.add(kept)

    registry.remove(StubDelegate())

    #expect(registry.delegates.count == 1)
    #expect(registry.delegates.first === kept)
  }
}
