import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents

@available(iOS 18.0, *)
enum MailDraftIndexer {
  static let domainIdentifier = "dev.expo.appintents.mailDraft"

  static func currentEntities() async -> [MailDraftEntity] {
    return await AppIntentEntityStore.shared.entities(ofKind: "mailDraft")
      .map(MailDraftEntity.init(record:))
  }

  static func entities(for identifiers: [MailDraftEntity.ID]) async -> [MailDraftEntity] {
    return await AppIntentEntityStore.shared.entities(ofKind: "mailDraft", matching: identifiers)
      .map(MailDraftEntity.init(record:))
  }

  static func replaceIndex(with records: [AppIntentEntityRecord]) async throws {
    try await replaceIndex(with: records.map(MailDraftEntity.init(record:)))
  }

  static func replaceIndex(with entities: [MailDraftEntity]) async throws {
    try await CSSearchableIndex.default().deleteAppEntities(ofType: MailDraftEntity.self)
    guard !entities.isEmpty else {
      return
    }
    try await CSSearchableIndex.default().indexAppEntities(entities)
  }

  static func index(_ entities: [MailDraftEntity]) async throws {
    guard !entities.isEmpty else {
      return
    }
    try await CSSearchableIndex.default().indexAppEntities(entities)
  }
}
