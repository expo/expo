import AppIntents
@preconcurrency import CoreSpotlight

@available(iOS 26.0, *)
struct JournalEntityQuery: EntityStringQuery, EnumerableEntityQuery {

  func entities(matching string: String) async throws -> [JournalEntity] {
    let query = string.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    guard !query.isEmpty else {
      return try await allEntities()
    }

    let entities = await JournalEntityIndexer.currentEntities()
    return entities.filter { entity in
      [entity.displayTitle, entity.messageText]
        .joined(separator: " ")
        .lowercased()
        .contains(query)
      }
  }
  func entities(for identifiers: [JournalEntity.ID]) async throws -> [JournalEntity] {
    return await JournalEntityIndexer.entities(for: identifiers)
  }

  func suggestedEntities() async throws -> [JournalEntity] {
    return await JournalEntityIndexer.currentEntities()
  }

  func allEntities() async throws -> [JournalEntity] {
    return await JournalEntityIndexer.currentEntities()
  }
}

@available(iOS 27.0, *)
extension JournalEntityQuery: IndexedEntityQuery {
  func reindexEntities(
    for identifiers: [JournalEntity.ID],
    indexDescription: CSSearchableIndexDescription
  ) async throws {
    try await JournalEntityIndexer.index(try await entities(for: identifiers))
  }

  func reindexAllEntities(indexDescription: CSSearchableIndexDescription) async throws {
    try await JournalEntityIndexer.replaceIndex(with: try await allEntities())
  }
}
