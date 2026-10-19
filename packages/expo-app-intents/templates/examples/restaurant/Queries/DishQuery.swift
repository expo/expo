import AppIntents
internal import ExpoAppIntents

/// Resolves DishEntity values from the catalog your JavaScript code publishes.
///
/// The catalog starts out empty, and every method here reads from it, so this query returns nothing
/// until your app has run this at least once:
///
/// ```ts
/// import { setEntityCatalogAsync } from 'expo-app-intents';
///
/// await setEntityCatalogAsync('dish', [{ id: 'margherita', title: 'Margherita' }]);
/// ```
///
/// `OrderFoodIntent.dish` is a required parameter, so with an empty catalog Siri has nothing to offer
/// and the shortcut cannot run. The catalog is stored natively and survives restarts, so publish it
/// once at startup and again whenever your menu changes.
struct DishQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [DishEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "dish", matching: identifiers)
      .map(DishEntity.init(record:))
  }

  func suggestedEntities() async throws -> [DishEntity] {
    return try await AppIntentEntityStore.shared.entities(ofKind: "dish")
      .map(DishEntity.init(record:))
  }

  func entities(matching string: String) async throws -> [DishEntity] {
    return try await suggestedEntities().filter { $0.matches(string) }
  }
}
