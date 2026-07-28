import AppIntents
@preconcurrency import CoreSpotlight

@available(iOS 18.0, *)
struct MailDraftEntityQuery: EntityStringQuery, EnumerableEntityQuery {
  func entities(matching string: String) async throws -> [MailDraftEntity] {
    let query = string.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    guard !query.isEmpty else {
      return try await allEntities()
    }

    return await MailDraftIndexer.currentEntities().filter { draft in
      [draft.displaySubject, draft.bodyText, draft.recipientList]
        .joined(separator: " ")
        .lowercased()
        .contains(query)
    }
  }

  func entities(for identifiers: [MailDraftEntity.ID]) async throws -> [MailDraftEntity] {
    return await MailDraftIndexer.entities(for: identifiers)
  }

  func suggestedEntities() async throws -> [MailDraftEntity] {
    return await MailDraftIndexer.currentEntities()
  }

  func allEntities() async throws -> [MailDraftEntity] {
    return await MailDraftIndexer.currentEntities()
  }
}

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
