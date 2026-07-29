import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents

@available(iOS 18.0, *)
struct MailDraftEntityQuery: EntityStringQuery, EnumerableEntityQuery {
  func entities(matching string: String) async throws -> [MailDraftEntity] {
    let query = string.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    guard !query.isEmpty else {
      return try await allEntities()
    }

    return try await allEntities().filter { draft in
      [draft.displaySubject, draft.bodyText, draft.recipientList]
        .joined(separator: " ")
        .lowercased()
        .contains(query)
    }
  }

  func entities(for identifiers: [MailDraftEntity.ID]) async throws -> [MailDraftEntity] {
    return await AppIntentEntityStore.shared.entities(ofKind: "mailDraft", matching: identifiers)
      .map(MailDraftEntity.init(record:))
  }

  func suggestedEntities() async throws -> [MailDraftEntity] {
    return await AppIntentEntityStore.shared.entities(ofKind: "mailDraft")
      .map(MailDraftEntity.init(record:))
  }

  func allEntities() async throws -> [MailDraftEntity] {
    return try await suggestedEntities()
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
    await AppEntityIdentifierRegistry.shared.updateIndexFromCatalog(
      kind: "mailDraft",
      matching: identifiers
    )
  }

  func reindexAllEntities(indexDescription: CSSearchableIndexDescription) async throws {
    await AppEntityIdentifierRegistry.shared.replaceIndexFromCatalog(kind: "mailDraft")
  }
}
