import Foundation
import Testing

@testable import ExpoAppIntents
@testable import ExpoModulesCore

/// Serialized because every test works in the same `#file`-named UserDefaults suite.
@Suite("AppIntentEntityStore", .serialized)
struct AppIntentEntityStoreTests {
  private static let trailStorageKey = "dev.expo.appintents.entities.trail"

  private let store: AppIntentEntityStore
  private let defaults: UserDefaults

  init() throws {
    defaults = try #require(UserDefaults(suiteName: #file))
    defaults.removePersistentDomain(forName: #file)
    store = AppIntentEntityStore(defaults: defaults)
  }

  @Test
  func `sets and reads a catalog`() async throws {
    try await store.setCatalog(
      kind: "trail",
      entities: [
        AppIntentEntityRecord(id: "t1", title: "Eagle Peak", subtitle: "5 km", synonyms: ["eagle"]),
        AppIntentEntityRecord(id: "t2", title: "Lake Loop", subtitle: nil, synonyms: []),
      ]
    )

    let all = try await store.entities(ofKind: "trail")
    #expect(all.map(\.id) == ["t1", "t2"])
    #expect(all[0].title == "Eagle Peak")
    #expect(all[0].subtitle == "5 km")
    #expect(all[0].synonyms == ["eagle"])
    #expect(all[1].subtitle == nil)
  }

  @Test
  func `filters entities by matching identifiers`() async throws {
    try await store.setCatalog(
      kind: "trail",
      entities: [
        AppIntentEntityRecord(id: "t1", title: "A", subtitle: nil, synonyms: []),
        AppIntentEntityRecord(id: "t2", title: "B", subtitle: nil, synonyms: []),
      ]
    )

    let matching = try await store.entities(ofKind: "trail", matching: ["t2"])
    #expect(matching.map(\.id) == ["t2"])
  }

  @Test
  func `an unknown kind is empty`() async throws {
    let entities = try await store.entities(ofKind: "missing")
    #expect(entities.isEmpty)
  }

  /// A `try?` here used to hand back an empty catalog, which is exactly what an unpublished kind looks
  /// like: Siri would offer nothing and the developer would never learn why.
  @Test
  func `entities reports an undecodable catalog instead of returning it empty`() async {
    defaults.set(Data("not json at all".utf8), forKey: Self.trailStorageKey)

    await #expect(throws: (any Error).self) {
      _ = try await store.entities(ofKind: "trail")
    }
  }

  /// Publishing the kind again has to recover, because the catalog is owned by JavaScript.
  @Test
  func `setCatalog replaces an undecodable catalog`() async throws {
    defaults.set(Data("not json at all".utf8), forKey: Self.trailStorageKey)

    try await store.setCatalog(
      kind: "trail",
      entities: [AppIntentEntityRecord(id: "t1", title: "Eagle Peak")]
    )

    let readBack = try await store.entities(ofKind: "trail")
    #expect(readBack.map(\.id) == ["t1"])
  }

  /// `@Field` with a default value makes a field optional at the JavaScript boundary, so
  /// `setEntityCatalogAsync('dish', [{}])` from untyped JavaScript used to store an entity with an
  /// empty id and title. `.required` rejects the missing keys instead.
  @Test
  func `record requires an id and a title`() throws {
    let appContext = AppContext.create()

    #expect(throws: (any Error).self) {
      try AppIntentEntityRecord(from: [:], appContext: appContext)
    }
    #expect(throws: (any Error).self) {
      try AppIntentEntityRecord(from: ["id": "t1"], appContext: appContext)
    }
    #expect(throws: (any Error).self) {
      try AppIntentEntityRecord(from: ["title": "A"], appContext: appContext)
    }
    _ = try AppIntentEntityRecord(from: ["id": "t1", "title": "A"], appContext: appContext)
  }

  /// `.required` rejects a missing key, but an explicit empty string is just as unresolvable, and so
  /// is a string made only of whitespace.
  @Test
  func `setCatalog rejects an empty or blank identifier or title`() async throws {
    for invalid in [
      AppIntentEntityRecord(id: "", title: "No id"),
      AppIntentEntityRecord(id: " ", title: "Blank id"),
      AppIntentEntityRecord(id: "t1", title: ""),
      AppIntentEntityRecord(id: "t1", title: "\n"),
    ] {
      await #expect(throws: (any Error).self) {
        try await store.setCatalog(kind: "trail", entities: [invalid])
      }
    }

    let stored = try await store.entities(ofKind: "trail")
    #expect(stored.isEmpty, "a rejected catalog must not be stored")
  }

  /// The kind names the catalog that app-target `EntityQuery` implementations read, so a blank kind
  /// stores a catalog no query ever finds. Entities get this validation; the kind needs it too.
  @Test
  func `setCatalog rejects a blank kind`() async throws {
    for blankKind in ["", " ", "\n"] {
      await #expect(throws: (any Error).self, "expected setCatalog to reject the blank kind '\(blankKind)'") {
        try await store.setCatalog(
          kind: blankKind,
          entities: [AppIntentEntityRecord(id: "t1", title: "A")]
        )
      }
    }
  }

  /// Two entities with one id cannot both be resolved, so the catalog is ambiguous as a whole.
  @Test
  func `setCatalog rejects duplicate identifiers`() async throws {
    await #expect(throws: (any Error).self) {
      try await store.setCatalog(
        kind: "trail",
        entities: [
          AppIntentEntityRecord(id: "t1", title: "Eagle Peak"),
          AppIntentEntityRecord(id: "t1", title: "Lake Loop"),
        ]
      )
    }

    let stored = try await store.entities(ofKind: "trail")
    #expect(stored.isEmpty, "a rejected catalog must not be stored")
  }
}
