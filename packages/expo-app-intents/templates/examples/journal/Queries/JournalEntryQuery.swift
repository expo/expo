import AppIntents

@available(iOS 18.0, *)
struct JournalEntryQuery: EntityQuery {
  func entities(for identifiers: [String]) async throws -> [JournalEntryEntity] {
    return []
  }
}
