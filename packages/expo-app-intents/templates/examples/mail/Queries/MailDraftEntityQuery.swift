import AppIntents
internal import ExpoAppIntents

@available(iOS 18.0, *)
struct MailDraftEntityQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [MailDraftEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "mailDraft", matching: identifiers)
      .map(MailDraftEntity.init(record:))
  }

  func suggestedEntities() async throws -> [MailDraftEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "mailDraft")
      .map(MailDraftEntity.init(record:))
  }

  func entities(matching string: String) async throws -> [MailDraftEntity] {
    let query = string.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    guard !query.isEmpty else {
      return try await suggestedEntities()
    }

    return try await suggestedEntities().filter { draft in
      [draft.displaySubject, draft.bodyText]
        .joined(separator: " ")
        .lowercased()
        .contains(query)
    }
  }
}
