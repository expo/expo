import XCTest

@testable import ExpoModulesCore
@testable import ExpoAppIntents

final class AppIntentEntityStoreTests: XCTestCase {
  private static let trailStorageKey = "dev.expo.appintents.entities.trail"

  private var store: AppIntentEntityStore!
  private var defaults: UserDefaults!

  override func setUp() {
    super.setUp()
    defaults = UserDefaults(suiteName: #file)
    defaults.removePersistentDomain(forName: #file)
    store = AppIntentEntityStore(defaults: defaults)
  }

  func testSetAndReadCatalog() async throws {
    try await store.setCatalog(
      kind: "trail",
      entities: [
        AppIntentEntityRecord(id: "t1", title: "Eagle Peak", subtitle: "5 km", synonyms: ["eagle"]),
        AppIntentEntityRecord(id: "t2", title: "Lake Loop", subtitle: nil, synonyms: [])
      ])

    let all = try await store.entities(ofKind: "trail")
    XCTAssertEqual(all.map(\.id), ["t1", "t2"])
    XCTAssertEqual(all[0].title, "Eagle Peak")
    XCTAssertEqual(all[0].subtitle, "5 km")
    XCTAssertEqual(all[0].synonyms, ["eagle"])
    XCTAssertNil(all[1].subtitle)
  }

  func testMatchingIdentifiers() async throws {
    try await store.setCatalog(
      kind: "trail",
      entities: [
        AppIntentEntityRecord(id: "t1", title: "A", subtitle: nil, synonyms: []),
        AppIntentEntityRecord(id: "t2", title: "B", subtitle: nil, synonyms: [])
      ])

    let matching = try await store.entities(ofKind: "trail", matching: ["t2"])
    XCTAssertEqual(matching.map(\.id), ["t2"])
  }

  func testUnknownKindIsEmpty() async throws {
    let entities = try await store.entities(ofKind: "missing")
    XCTAssertEqual(entities.count, 0)
  }

  /**
   A `try?` here used to hand back an empty catalog, which is exactly what an unpublished kind looks
   like: Siri would offer nothing and the developer would never learn why.
   */
  func testEntitiesReportsAnUndecodableCatalogInsteadOfReturningItEmpty() async {
    defaults.set(Data("not json at all".utf8), forKey: Self.trailStorageKey)

    do {
      _ = try await store.entities(ofKind: "trail")
      XCTFail("expected entities(ofKind:) to report the undecodable catalog")
    } catch {
      // Expected.
    }
  }

  /// Publishing the kind again has to recover, because the catalog is owned by JavaScript.
  func testSetCatalogReplacesAnUndecodableCatalog() async throws {
    defaults.set(Data("not json at all".utf8), forKey: Self.trailStorageKey)

    try await store.setCatalog(
      kind: "trail", entities: [AppIntentEntityRecord(id: "t1", title: "Eagle Peak")])

    let readBack = try await store.entities(ofKind: "trail")
    XCTAssertEqual(readBack.map(\.id), ["t1"])
  }

  /**
   `@Field` with a default value makes a field optional at the JavaScript boundary, so
   `setEntityCatalogAsync('dish', [{}])` from untyped JavaScript used to store an entity with an
   empty id and title. `.required` rejects the missing keys instead.
   */
  func testRecordRequiresAnIdAndATitle() {
    let appContext = AppContext.create()

    XCTAssertThrowsError(try AppIntentEntityRecord(from: [:], appContext: appContext))
    XCTAssertThrowsError(try AppIntentEntityRecord(from: ["id": "t1"], appContext: appContext))
    XCTAssertThrowsError(try AppIntentEntityRecord(from: ["title": "A"], appContext: appContext))
    XCTAssertNoThrow(
      try AppIntentEntityRecord(from: ["id": "t1", "title": "A"], appContext: appContext)
    )
  }

  /// `.required` rejects a missing key, but an explicit empty string is just as unresolvable.
  func testSetCatalogRejectsAnEmptyIdentifierOrTitle() async throws {
    for invalid in [
      AppIntentEntityRecord(id: "", title: "No id"),
      AppIntentEntityRecord(id: "t1", title: "")
    ] {
      do {
        try await store.setCatalog(kind: "trail", entities: [invalid])
        XCTFail("expected setCatalog to reject an entity with an empty id or title")
      } catch {
        // Expected.
      }
    }

    let stored = try await store.entities(ofKind: "trail")
    XCTAssertEqual(stored.count, 0, "a rejected catalog must not be stored")
  }
}
