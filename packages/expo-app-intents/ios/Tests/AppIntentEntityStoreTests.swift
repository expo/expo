import XCTest

@testable import ExpoAppIntents

final class AppIntentEntityStoreTests: XCTestCase {
  private var store: AppIntentEntityStore!
  private var defaults: UserDefaults!

  override func setUp() {
    super.setUp()
    defaults = UserDefaults(suiteName: #file)
    defaults.removePersistentDomain(forName: #file)
    store = AppIntentEntityStore(defaults: defaults)
  }

  func testSetAndReadCatalog() async {
    await store.setCatalog(
      kind: "trail",
      entities: [
        AppIntentEntityRecord(id: "t1", title: "Eagle Peak", subtitle: "5 km", synonyms: ["eagle"]),
        AppIntentEntityRecord(id: "t2", title: "Lake Loop", subtitle: nil, synonyms: [])
      ])

    let all = await store.entities(ofKind: "trail")
    XCTAssertEqual(all.map(\.id), ["t1", "t2"])
    XCTAssertEqual(all[0].title, "Eagle Peak")
    XCTAssertEqual(all[0].subtitle, "5 km")
    XCTAssertEqual(all[0].synonyms, ["eagle"])
    XCTAssertNil(all[1].subtitle)
  }

  func testMatchingIdentifiers() async {
    await store.setCatalog(
      kind: "trail",
      entities: [
        AppIntentEntityRecord(id: "t1", title: "A", subtitle: nil, synonyms: []),
        AppIntentEntityRecord(id: "t2", title: "B", subtitle: nil, synonyms: [])
      ])

    XCTAssertEqual(await store.entities(ofKind: "trail", matching: ["t2"]).map(\.id), ["t2"])
  }

  func testUnknownKindIsEmpty() async {
    XCTAssertEqual(await store.entities(ofKind: "missing").count, 0)
  }
}
