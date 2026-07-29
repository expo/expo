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
        AppIntentEntityRecord(
          id: "t1",
          title: "Eagle Peak",
          subtitle: "5 km",
          synonyms: ["eagle"],
          metadata: ["difficulty": "moderate"]
        ),
        AppIntentEntityRecord(id: "t2", title: "Lake Loop", subtitle: nil, synonyms: [])
      ])

    let all = await store.entities(ofKind: "trail")
    XCTAssertEqual(all.map(\.id), ["t1", "t2"])
    XCTAssertEqual(all[0].title, "Eagle Peak")
    XCTAssertEqual(all[0].subtitle, "5 km")
    XCTAssertEqual(all[0].synonyms, ["eagle"])
    XCTAssertEqual(all[0].metadata, ["difficulty": "moderate"])
    XCTAssertNil(all[1].subtitle)
    XCTAssertEqual(all[1].metadata, [:])
  }

  func testSetCatalogReportsWhetherAnythingChanged() async {
    let records = [
      AppIntentEntityRecord(
        id: "t1",
        title: "Eagle Peak",
        subtitle: "5 km",
        synonyms: ["eagle"],
        metadata: ["difficulty": "moderate", "region": "north"]
      )
    ]

    let firstWrite = await store.setCatalog(kind: "trail", entities: records)
    XCTAssertTrue(firstWrite, "the first write introduces a catalog")

    let identicalWrite = await store.setCatalog(kind: "trail", entities: records)
    XCTAssertFalse(identicalWrite, "republishing the same catalog is not a change")

    var changed = records
    changed[0].title = "Eagle Peak Trail"
    let changedWrite = await store.setCatalog(kind: "trail", entities: changed)
    XCTAssertTrue(changedWrite, "a different catalog is a change")

    let readBack = await store.entities(ofKind: "trail")
    XCTAssertEqual(readBack.map(\.title), ["Eagle Peak Trail"])
  }

  func testSetCatalogIsStableAcrossMetadataOrdering() async {
    // Encoding uses sorted keys, so two records whose metadata was built in a different order
    // must still compare as unchanged. Without that, dictionary ordering would make every write
    // look like a change.
    let first = AppIntentEntityRecord(
      id: "t1", title: "Eagle Peak", subtitle: nil, synonyms: [],
      metadata: ["a": "1", "b": "2", "c": "3"]
    )
    var reordered: [String: String] = [:]
    reordered["c"] = "3"
    reordered["b"] = "2"
    reordered["a"] = "1"
    let second = AppIntentEntityRecord(
      id: "t1", title: "Eagle Peak", subtitle: nil, synonyms: [], metadata: reordered
    )

    let firstWrite = await store.setCatalog(kind: "trail", entities: [first])
    XCTAssertTrue(firstWrite)

    let reorderedWrite = await store.setCatalog(kind: "trail", entities: [second])
    XCTAssertFalse(reorderedWrite, "metadata insertion order must not count as a change")
  }

  func testMatchingIdentifiers() async {
    await store.setCatalog(
      kind: "trail",
      entities: [
        AppIntentEntityRecord(id: "t1", title: "A", subtitle: nil, synonyms: []),
        AppIntentEntityRecord(id: "t2", title: "B", subtitle: nil, synonyms: [])
      ])

    let matching = await store.entities(ofKind: "trail", matching: ["t2"])
    XCTAssertEqual(matching.map(\.id), ["t2"])
  }

  func testUnknownKindIsEmpty() async {
    let missing = await store.entities(ofKind: "missing")
    XCTAssertEqual(missing.count, 0)
  }
}
