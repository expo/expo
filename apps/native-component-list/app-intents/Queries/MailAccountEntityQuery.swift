import AppIntents

/**
 Schema entities must be resolvable by the system, which means the default query has to be an
 `EntityStringQuery` (or the entity has to be indexed). A plain `EntityQuery` is rejected by the
 App Intents metadata extractor at build time.
 */
@available(iOS 18.0, *)
struct MailAccountEntityQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [MailAccountEntity] {
    return try await suggestedEntities().filter { identifiers.contains($0.id) }
  }

  func suggestedEntities() async throws -> [MailAccountEntity] {
    return [MailAccountEntity.default]
  }

  func entities(matching string: String) async throws -> [MailAccountEntity] {
    let query = string.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    guard !query.isEmpty else {
      return try await suggestedEntities()
    }

    return try await suggestedEntities().filter { account in
      account.name.lowercased().contains(query) || account.emailAddress.lowercased().contains(query)
    }
  }
}
