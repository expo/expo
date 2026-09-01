import Foundation
import Testing

@testable import ExpoAppIntents

/// Serialized because every test works in the same `#file`-named UserDefaults suite.
@Suite("AppIntentInvocationStore", .serialized)
struct AppIntentInvocationStoreTests {
  private static let pendingStorageKey = "dev.expo.appintents.invocations.pending"
  private static let corruptedStorageKey = "dev.expo.appintents.invocations.pending.corrupted"

  private let store: AppIntentInvocationStore
  private let defaults: UserDefaults

  init() throws {
    defaults = try #require(UserDefaults(suiteName: #file))
    defaults.removePersistentDomain(forName: #file)
    store = AppIntentInvocationStore(defaults: defaults)
  }

  @Test
  func `appends and reads pending invocations`() throws {
    let invocation = AppIntentInvocation(name: "startHike", params: ["trailId": "t1"])
    store.append(invocation)

    let pending = try store.pending()
    #expect(pending.count == 1)
    #expect(pending[0].id == invocation.id)
    #expect(pending[0].name == "startHike")
    #expect(pending[0].params["trailId"] == .string("t1"))
  }

  @Test
  func `removes an invocation by id`() throws {
    let first = AppIntentInvocation(name: "a", params: [:])
    let second = AppIntentInvocation(name: "b", params: [:])
    store.append(first)
    store.append(second)

    try store.remove(id: first.id)

    #expect(try store.pending().map(\.id) == [second.id])
  }

  @Test
  func `clears the queue`() throws {
    store.append(AppIntentInvocation(name: "a", params: [:]))
    store.clear()
    #expect(try store.pending().isEmpty)
  }

  @Test
  func `append keeps the queue when params cannot be represented in JSON`() throws {
    store.append(AppIntentInvocation(name: "queued", params: ["ok": "yes"]))
    store.append(AppIntentInvocation(name: "nonFinite", params: ["x": .double(Double.nan)]))

    let pending = try store.pending()
    #expect(pending.map(\.name) == ["queued", "nonFinite"])
    #expect(pending.last?.params["x"] == .null)
  }

  @Test
  func `persists across instances`() throws {
    store.append(AppIntentInvocation(name: "cold", params: [:]))
    let secondInstance = AppIntentInvocationStore(defaults: defaults)
    #expect(try secondInstance.pending().first?.name == "cold")
  }

  /// A `try?` here used to hand back an empty queue, which the next write turned into the real stored
  /// queue. The corruption has to be reported instead, and the bytes have to survive it.
  @Test
  func `pending reports a corrupt queue instead of returning it empty`() {
    let corrupt = Data("not json at all".utf8)
    defaults.set(corrupt, forKey: Self.pendingStorageKey)

    #expect(throws: (any Error).self) {
      try store.pending()
    }
    #expect(defaults.data(forKey: Self.corruptedStorageKey) == corrupt)
  }

  /// The next dispatch must still be recorded, and must not be what destroys the corrupt blob.
  @Test
  func `append after corruption keeps both the new invocation and the corrupt bytes`() throws {
    let corrupt = Data("not json at all".utf8)
    defaults.set(corrupt, forKey: Self.pendingStorageKey)

    store.append(AppIntentInvocation(name: "afterCorruption", params: [:]))

    #expect(try store.pending().map(\.name) == ["afterCorruption"])
    #expect(defaults.data(forKey: Self.corruptedStorageKey) == corrupt)
  }

  /// Reporting once is enough: the queue recovers rather than failing on every later read.
  @Test
  func `pending recovers after reporting corruption`() throws {
    defaults.set(Data("not json at all".utf8), forKey: Self.pendingStorageKey)

    #expect(throws: (any Error).self) {
      try store.pending()
    }
    #expect(try store.pending().isEmpty)
  }

  @Test
  func `clear also drops the corrupt blob`() {
    defaults.set(Data("not json at all".utf8), forKey: Self.pendingStorageKey)
    #expect(throws: (any Error).self) {
      try store.pending()
    }

    store.clear()

    #expect(defaults.data(forKey: Self.corruptedStorageKey) == nil)
  }

  @Test
  func `remove reports a corrupt queue`() {
    defaults.set(Data("not json at all".utf8), forKey: Self.pendingStorageKey)

    #expect(throws: (any Error).self) {
      try store.remove(id: "whatever")
    }
  }

  /// Only JavaScript drains this queue, so an app that never dequeues - one whose handler throws, or
  /// that never mounts `useAppIntents` - would grow it without bound. `UserDefaults` is read into
  /// memory when the app launches, so that is a cost every later start pays.
  @Test
  func `append drops the oldest invocations once the queue is full`() throws {
    let capacity = AppIntentInvocationStore.maxPendingInvocations
    for index in 0...capacity {
      store.append(AppIntentInvocation(name: "invocation\(index)", params: [:]))
    }

    let pending = try store.pending()
    #expect(pending.count == capacity, "the queue may not grow past its capacity")
    // The newest invocation is the one the user just asked for, so the oldest is the one to lose.
    #expect(pending.first?.name == "invocation1", "the oldest invocation is the one dropped")
    #expect(pending.last?.name == "invocation\(capacity)", "the newest invocation is kept")
  }

  /// A queue already over capacity - written by a build with a higher cap - has to come back down.
  @Test
  func `append trims a queue that is already over capacity`() throws {
    let capacity = AppIntentInvocationStore.maxPendingInvocations
    let oversized = (0..<(capacity + 10)).map { AppIntentInvocation(name: "old\($0)", params: [:]) }
    defaults.set(try JSONEncoder().encode(oversized), forKey: Self.pendingStorageKey)

    store.append(AppIntentInvocation(name: "newest", params: [:]))

    let pending = try store.pending()
    #expect(pending.count == capacity)
    #expect(pending.last?.name == "newest")
  }
}
