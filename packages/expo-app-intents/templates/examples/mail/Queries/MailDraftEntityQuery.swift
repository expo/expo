import AppIntents
internal import ExpoAppIntents

@available(iOS 18.0, *)
struct MailDraftEntityQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [MailDraftEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "mailDraft", matching: identifiers)
      .map(MailDraftEntity.init(record:))
  }

  /// What Siri offers, and what `entities(matching:)` searches. `hideInSuggestions` is not something
  /// expo-app-intents knows about: it is an app-defined value travelling in the record's `metadata`,
  /// and honouring it here is what gives it meaning. Drop the filter and every draft is offered.
  ///
  /// `entities(for:)` above deliberately does not filter, so a hidden draft still resolves when the
  /// system already has its identifier — from a Spotlight result, for example.
  func suggestedEntities() async throws -> [MailDraftEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "mailDraft")
      .filter { $0.metadata["hideInSuggestions"] != "true" }
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
