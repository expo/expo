# Dynamic entities and catalogs

This example uses a custom entity. Adopting an Apple domain schema adds a separate contract for properties and related entities; verify it using the schema guidance in [advanced-features.md](advanced-features.md).

For record-valued parameters, define a concrete `AppEntity` with a stable ID, display representation, and `defaultQuery`. Implement `EntityStringQuery` methods for identifier lookup, suggestions, and text matching. This example resolves items from the catalog without needing JavaScript to be running:

```swift
import AppIntents
internal import ExpoAppIntents
import Foundation

struct ItemEntity: AppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Item"
  static let defaultQuery = ItemQuery()

  var id: String
  @Property(title: "Title") var title: String
  var synonyms: [String]

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(title)")
  }

  init(record: AppIntentEntityRecord) {
    id = record.id
    title = record.title
    synonyms = record.synonyms
  }
}

struct ItemQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [ItemEntity] {
    try await AppIntentEntityStore.shared
      .entities(ofKind: "item", matching: identifiers)
      .map(ItemEntity.init(record:))
  }

  func suggestedEntities() async throws -> [ItemEntity] {
    try await AppIntentEntityStore.shared.entities(ofKind: "item")
      .map(ItemEntity.init(record:))
  }

  func entities(matching string: String) async throws -> [ItemEntity] {
    let search = string.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !search.isEmpty else { return [] }
    return try await suggestedEntities().filter { item in
      ([item.title] + item.synonyms).contains { term in
        term.range(of: search, options: [.caseInsensitive, .diacriticInsensitive]) != nil
      }
    }
  }
}
```

Use `@Parameter(title: "Item") var item: ItemEntity` on an intent, then dispatch `params: ["itemId": .string(item.id)]` from `perform()`. The JavaScript handler resolves that ID through the app's existing store. For a parameterized phrase, interpolate `\(\.$item)` along with `\(.applicationName)`. Match titles and synonyms in the query; JavaScript publication alone does not implement matching.

Publish the app's authoritative data after it finishes loading:

```ts
await AppIntents.setEntityCatalogAsync('item', items.map((item) => ({
  id: item.id,
  title: item.title.trim() || 'Untitled item',
})));
```

The `kind` string must agree with the Swift query and any entity registration. Records require unique nonblank string IDs and nonblank titles; optional fields are `subtitle`, `synonyms: string[]`, `metadata: Record<string, string>`, and `hideInSpotlight`. Invalid updates reject as a whole and leave the previous catalog intact.

Keep a record's ID stable across title changes, launches, and app upgrades. Do not derive it from a mutable title or list position, regenerate it on publication, or reuse a deleted record's ID for a different record. Saved shortcuts can retain these identifiers. If the app changes its ID scheme, preserve resolution of old IDs where appropriate and authorized; never redirect a missing ID to an unrelated default entity.

Publication **replaces** that kind's entire catalog. Wait for an explicit loaded state; do not overwrite persisted catalogs with temporary empty loading state. Publish `[]` when the authoritative result is genuinely empty, including removal of the last record or account cleanup. Republish after edits and deletions, and serialize asynchronous publications if older requests could overwrite newer data. Native catalogs survive restarts and must not leak a previous account's records into the next session.

Catalogs live in `UserDefaults`, so publish a compact relevant subset, not thousands of full records or attachment contents. Until an entity is published, catalog-backed queries cannot resolve it, even on a cold launch.

`setEntityCatalogAsync()` requests shortcut refresh and, for indexed kinds, index synchronization. Unchanged catalogs normally do nothing. Do not race publication with a redundant `refreshShortcutsAsync()`. Explicit refresh rejects if no provider refresh handler exists; it cannot invent new compiled phrases.
