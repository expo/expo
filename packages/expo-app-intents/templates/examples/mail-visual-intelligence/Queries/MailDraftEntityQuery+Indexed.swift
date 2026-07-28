import AppIntents
@preconcurrency import CoreSpotlight

/**
 `EnumerableEntityQuery` lets the system enumerate every draft, which is what Spotlight needs in
 order to index them without being handed a list first.
 */
@available(iOS 18.0, *)
extension MailDraftEntityQuery: EnumerableEntityQuery {
  func allEntities() async throws -> [MailDraftEntity] {
    return try await suggestedEntities()
  }
}

/**
 `IndexedEntityQuery` lets the system ask the app to rebuild the index on its own schedule. It
 requires iOS 27, so it is a separate extension from the conformances above.
 */
@available(iOS 27.0, *)
extension MailDraftEntityQuery: IndexedEntityQuery {
  func reindexEntities(
    for identifiers: [MailDraftEntity.ID],
    indexDescription: CSSearchableIndexDescription
  ) async throws {
    try await MailDraftIndexer.index(try await entities(for: identifiers))
  }

  func reindexAllEntities(indexDescription: CSSearchableIndexDescription) async throws {
    try await MailDraftIndexer.replaceIndex(with: try await allEntities())
  }
}
