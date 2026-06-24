import AppIntents
internal import ExpoAppIntents

struct DishQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [DishEntity] {
    return await AppIntentEntityStore.shared.entities(ofKind: "dish", matching: identifiers)
      .map(DishEntity.init(record:))
  }

  func suggestedEntities() async throws -> [DishEntity] {
    return await AppIntentEntityStore.shared.entities(ofKind: "dish")
      .map(DishEntity.init(record:))
  }

  func entities(matching string: String) async throws -> [DishEntity] {
    return try await suggestedEntities().filter { $0.matches(string) }
  }
}
