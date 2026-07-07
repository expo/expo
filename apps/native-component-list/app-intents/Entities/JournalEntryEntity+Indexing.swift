import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents

@available(iOS 26.0, *)
enum JournalEntityIndexer {
  static let domainIdentifier = "dev.expo.appintents.journalEntry"

  static func currentEntities() async -> [JournalEntity] {
    return await AppIntentEntityStore.shared.entities(ofKind: "journalEntry")
      .map(JournalEntity.init(record:))
  }

  static func entities(for identifiers: [JournalEntity.ID]) async -> [JournalEntity] {
    return await AppIntentEntityStore.shared.entities(ofKind: "journalEntry", matching: identifiers)
      .map(JournalEntity.init(record:))
  }

  static func replaceIndex(with records: [AppIntentEntityRecord]) async throws {
    try await replaceIndex(with: records.map(JournalEntity.init(record:)))
  }

  static func replaceIndex(with entities: [JournalEntity]) async throws {
    try await CSSearchableIndex.default().deleteAppEntities(ofType: JournalEntity.self)
    guard !entities.isEmpty else {
      return
    }
    try await CSSearchableIndex.default().indexAppEntities(entities)
  }

  static func index(_ entities: [JournalEntity]) async throws {
    guard !entities.isEmpty else {
      return
    }
    try await CSSearchableIndex.default().indexAppEntities(entities)
  }
}
