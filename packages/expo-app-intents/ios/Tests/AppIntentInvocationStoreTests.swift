import XCTest

@testable import ExpoAppIntents

final class AppIntentInvocationStoreTests: XCTestCase {
  private var store: AppIntentInvocationStore!
  private var defaults: UserDefaults!

  override func setUp() {
    super.setUp()
    defaults = UserDefaults(suiteName: #file)
    defaults.removePersistentDomain(forName: #file)
    store = AppIntentInvocationStore(defaults: defaults)
  }

  func testAppendAndReadPending() {
    let invocation = AppIntentInvocation(name: "startHike", params: ["trailId": "t1"])
    store.append(invocation)

    let pending = store.pending()
    XCTAssertEqual(pending.count, 1)
    XCTAssertEqual(pending[0].id, invocation.id)
    XCTAssertEqual(pending[0].name, "startHike")
    XCTAssertEqual(pending[0].params["trailId"], .string("t1"))
  }

  func testRemoveById() {
    let first = AppIntentInvocation(name: "a", params: [:])
    let second = AppIntentInvocation(name: "b", params: [:])
    store.append(first)
    store.append(second)

    store.remove(id: first.id)

    XCTAssertEqual(store.pending().map(\.id), [second.id])
  }

  func testClear() {
    store.append(AppIntentInvocation(name: "a", params: [:]))
    store.clear()
    XCTAssertEqual(store.pending().count, 0)
  }

  func testPersistsAcrossInstances() {
    store.append(AppIntentInvocation(name: "cold", params: [:]))
    let secondInstance = AppIntentInvocationStore(defaults: defaults)
    XCTAssertEqual(secondInstance.pending().first?.name, "cold")
  }
}
