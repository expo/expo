import XCTest

@testable import ExpoAppIntents

final class AppIntentInvocationStoreTests: XCTestCase {
  private static let pendingStorageKey = "dev.expo.appintents.invocations.pending"
  private static let corruptedStorageKey = "dev.expo.appintents.invocations.pending.corrupted"

  private var store: AppIntentInvocationStore!
  private var defaults: UserDefaults!

  override func setUp() {
    super.setUp()
    defaults = UserDefaults(suiteName: #file)
    defaults.removePersistentDomain(forName: #file)
    store = AppIntentInvocationStore(defaults: defaults)
  }

  func testAppendAndReadPending() throws {
    let invocation = AppIntentInvocation(name: "startHike", params: ["trailId": "t1"])
    store.append(invocation)

    let pending = try store.pending()
    XCTAssertEqual(pending.count, 1)
    XCTAssertEqual(pending[0].id, invocation.id)
    XCTAssertEqual(pending[0].name, "startHike")
    XCTAssertEqual(pending[0].params["trailId"], .string("t1"))
  }

  func testRemoveById() throws {
    let first = AppIntentInvocation(name: "a", params: [:])
    let second = AppIntentInvocation(name: "b", params: [:])
    store.append(first)
    store.append(second)

    try store.remove(id: first.id)

    XCTAssertEqual(try store.pending().map(\.id), [second.id])
  }

  func testClear() throws {
    store.append(AppIntentInvocation(name: "a", params: [:]))
    store.clear()
    XCTAssertEqual(try store.pending().count, 0)
  }

  func testAppendKeepsQueueWhenParamsCannotBeRepresentedInJSON() throws {
    store.append(AppIntentInvocation(name: "queued", params: ["ok": "yes"]))
    store.append(AppIntentInvocation(name: "nonFinite", params: ["x": .double(Double.nan)]))

    let pending = try store.pending()
    XCTAssertEqual(pending.map(\.name), ["queued", "nonFinite"])
    XCTAssertEqual(pending.last?.params["x"], .null)
  }

  func testPersistsAcrossInstances() throws {
    store.append(AppIntentInvocation(name: "cold", params: [:]))
    let secondInstance = AppIntentInvocationStore(defaults: defaults)
    XCTAssertEqual(try secondInstance.pending().first?.name, "cold")
  }

  /**
   A `try?` here used to hand back an empty queue, which the next write turned into the real stored
   queue. The corruption has to be reported instead, and the bytes have to survive it.
   */
  func testPendingReportsACorruptQueueInsteadOfReturningItEmpty() {
    let corrupt = Data("not json at all".utf8)
    defaults.set(corrupt, forKey: Self.pendingStorageKey)

    XCTAssertThrowsError(try store.pending())
    XCTAssertEqual(defaults.data(forKey: Self.corruptedStorageKey), corrupt)
  }

  /// The next dispatch must still be recorded, and must not be what destroys the corrupt blob.
  func testAppendAfterCorruptionKeepsBothTheNewInvocationAndTheCorruptBytes() throws {
    let corrupt = Data("not json at all".utf8)
    defaults.set(corrupt, forKey: Self.pendingStorageKey)

    store.append(AppIntentInvocation(name: "afterCorruption", params: [:]))

    XCTAssertEqual(try store.pending().map(\.name), ["afterCorruption"])
    XCTAssertEqual(defaults.data(forKey: Self.corruptedStorageKey), corrupt)
  }

  /// Reporting once is enough: the queue recovers rather than failing on every later read.
  func testPendingRecoversAfterReportingCorruption() throws {
    defaults.set(Data("not json at all".utf8), forKey: Self.pendingStorageKey)

    XCTAssertThrowsError(try store.pending())
    XCTAssertEqual(try store.pending().count, 0)
  }

  func testClearAlsoDropsTheCorruptBlob() throws {
    defaults.set(Data("not json at all".utf8), forKey: Self.pendingStorageKey)
    XCTAssertThrowsError(try store.pending())

    store.clear()

    XCTAssertNil(defaults.data(forKey: Self.corruptedStorageKey))
  }

  func testRemoveReportsACorruptQueue() {
    defaults.set(Data("not json at all".utf8), forKey: Self.pendingStorageKey)

    XCTAssertThrowsError(try store.remove(id: "whatever"))
  }

  /**
   Only JavaScript drains this queue, so an app that never dequeues - one whose handler throws, or
   that never mounts `useAppIntents` - would grow it without bound. `UserDefaults` is read into
   memory when the app launches, so that is a cost every later start pays.
   */
  func testAppendDropsTheOldestInvocationsOnceTheQueueIsFull() throws {
    let capacity = AppIntentInvocationStore.maxPendingInvocations
    for index in 0...capacity {
      store.append(AppIntentInvocation(name: "invocation\(index)", params: [:]))
    }

    let pending = try store.pending()
    XCTAssertEqual(pending.count, capacity, "the queue may not grow past its capacity")
    // The newest invocation is the one the user just asked for, so the oldest is the one to lose.
    XCTAssertEqual(pending.first?.name, "invocation1", "the oldest invocation is the one dropped")
    XCTAssertEqual(pending.last?.name, "invocation\(capacity)", "the newest invocation is kept")
  }

  /// A queue already over capacity - written by a build with a higher cap - has to come back down.
  func testAppendTrimsAQueueThatIsAlreadyOverCapacity() throws {
    let capacity = AppIntentInvocationStore.maxPendingInvocations
    let oversized = (0..<(capacity + 10)).map { AppIntentInvocation(name: "old\($0)", params: [:]) }
    defaults.set(try JSONEncoder().encode(oversized), forKey: Self.pendingStorageKey)

    store.append(AppIntentInvocation(name: "newest", params: [:]))

    let pending = try store.pending()
    XCTAssertEqual(pending.count, capacity)
    XCTAssertEqual(pending.last?.name, "newest")
  }
}
