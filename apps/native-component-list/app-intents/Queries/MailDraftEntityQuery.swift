import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents

@available(iOS 18.0, *)
struct MailDraftEntityQuery: EntityStringQuery, EnumerableEntityQuery {
  func entities(matching string: String) async throws -> [MailDraftEntity] {
    let query = string.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    guard !query.isEmpty else {
      return try await suggestedEntities()
    }

    return try await suggestedEntities().filter { draft in
      [draft.displaySubject, draft.bodyText, draft.recipientList]
        .joined(separator: " ")
        .lowercased()
        .contains(query)
    }
  }

  func entities(for identifiers: [MailDraftEntity.ID]) async throws -> [MailDraftEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "mailDraft", matching: identifiers)
      .map(MailDraftEntity.init(record:))
  }

  /**
   What Siri offers, and what `entities(matching:)` searches. `hideInSuggestions` is app-defined and
   travels in the record's `metadata`; honouring it here is what gives it meaning.

   `entities(for:)` above deliberately does not filter, so a hidden draft still resolves when the
   system already has its identifier.
   */
  func suggestedEntities() async throws -> [MailDraftEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "mailDraft")
      .filter { $0.metadata["hideInSuggestions"] != "true" }
      .map(MailDraftEntity.init(record:))
  }

  /**
   Every draft in the catalog, deliberately not `suggestedEntities()`. `hideInSuggestions` means
   "do not offer this in Siri suggestions", which says nothing about whether search may find it —
   routing enumeration through that filter would drop a merely unsuggested draft out of the
   Spotlight index too, and it would then be unfindable by any search.

   `hideInSpotlight` is the flag that does belong to indexing, and it is not applied here either:
   `MailDraftEntity` forwards it to `IndexedEntity`, so Spotlight itself skips those drafts. Nor is
   this enumeration only ever used for indexing — the Shortcuts picker asks for it as well, where a
   Spotlight opt-out has no bearing.
   */
  func allEntities() async throws -> [MailDraftEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "mailDraft")
      .map(MailDraftEntity.init(record:))
  }
}

/**
 `IndexedEntityQuery` lets the system ask the app to rebuild the index on its own schedule. That
 request arrives on this query type, so it cannot be served from inside expo-app-intents, but the
 work itself is the same indexing the package already does for `setEntityCatalogAsync` — so this
 hands it straight back.
 */
@available(iOS 27.0, *)
extension MailDraftEntityQuery: IndexedEntityQuery {
  func reindexEntities(
    for identifiers: [MailDraftEntity.ID],
    indexDescription: CSSearchableIndexDescription
  ) async throws {
    try await AppEntityIdentifierRegistry.shared.updateIndexFromCatalog(
      kind: "mailDraft",
      matching: identifiers
    )
  }

  func reindexAllEntities(indexDescription: CSSearchableIndexDescription) async throws {
    try await AppEntityIdentifierRegistry.shared.replaceIndexFromCatalog(kind: "mailDraft")
  }
}
