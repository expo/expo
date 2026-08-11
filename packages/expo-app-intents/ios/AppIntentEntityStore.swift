import ExpoModulesCore
import Foundation

/// An entity exposed to App Intents parameter queries. JS populates catalogs with
/// `setEntityCatalogAsync`; app-target `EntityQuery` implementations read them through
/// `AppIntentEntityStore.shared`.
///
/// Catalogs are stored in UserDefaults, so they should stay compact. Apps with large
/// datasets should publish only the subset needed for Siri and Shortcuts resolution.
public struct AppIntentEntityRecord: Codable, Record {
  @Field(.required) public var id: String = ""
  @Field(.required) public var title: String = ""
  @Field public var subtitle: String?
  @Field public var synonyms: [String] = []

  private enum CodingKeys: String, CodingKey {
    case id
    case title
    case subtitle
    case synonyms
  }

  public init() {}

  public init(id: String, title: String, subtitle: String? = nil, synonyms: [String] = []) {
    self.id = id
    self.title = title
    self.subtitle = subtitle
    self.synonyms = synonyms
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.init(
      id: try container.decode(String.self, forKey: .id),
      title: try container.decode(String.self, forKey: .title),
      subtitle: try container.decodeIfPresent(String.self, forKey: .subtitle),
      synonyms: try container.decodeIfPresent([String].self, forKey: .synonyms) ?? []
    )
  }

  public func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(id, forKey: .id)
    try container.encode(title, forKey: .title)
    try container.encodeIfPresent(subtitle, forKey: .subtitle)
    try container.encode(synonyms, forKey: .synonyms)
  }
}

public actor AppIntentEntityStore {
  public static let shared = AppIntentEntityStore()

  private let defaults: UserDefaults

  internal init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  private func storageKey(kind: String) -> String {
    return "dev.expo.appintents.entities.\(kind)"
  }

  private func isBlank(_ value: String) -> Bool {
    return value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
  }

  /// Returns the stored catalog of the given kind, throwing when the stored blob cannot be decoded.
  /// Nothing is set aside the way `AppIntentInvocationStore.pending()` sets a corrupt queue aside. A
  /// catalog is owned by JavaScript rather than accumulated natively, so the next `setCatalog` for the
  /// kind replaces the unreadable blob and nothing is lost by leaving it in place until then.
  public func entities(ofKind kind: String) throws -> [AppIntentEntityRecord] {
    guard let data = defaults.data(forKey: storageKey(kind: kind)) else {
      return []
    }

    do {
      return try JSONDecoder().decode([AppIntentEntityRecord].self, from: data)
    } catch {
      let message =
        "expo-app-intents could not read the '\(kind)' entity catalog, so Siri and Shortcuts have no "
        + "values to offer or resolve for it. The stored data is not valid JSON for this version of "
        + "the module, which usually means a different version wrote it. Call "
        + "setEntityCatalogAsync('\(kind)', ...) to replace it, and please report this at "
        + "https://github.com/expo/expo/issues. Decoding error: \(error.localizedDescription)"
      log.error(message)
      throw AppIntentEntityInvalidException(message)
    }
  }

  public func entities(
    ofKind kind: String,
    matching identifiers: [String]
  ) throws -> [AppIntentEntityRecord] {
    return try entities(ofKind: kind).filter { identifiers.contains($0.id) }
  }

  /// Replaces the catalog of the given kind, throwing instead of leaving the previous one in place
  /// without saying so.
  internal func setCatalog(kind: String, entities: [AppIntentEntityRecord]) throws {
    // The kind names the catalog that app-target `EntityQuery` implementations read, so a blank
    // kind stores a catalog no query ever asks for.
    if isBlank(kind) {
      throw AppIntentEntityInvalidException(
        "expo-app-intents rejected an entity catalog because its kind is empty. The kind names the "
          + "catalog that your app-target EntityQuery reads through AppIntentEntityStore.shared, so "
          + "it cannot be blank. Call setEntityCatalogAsync with the same non-empty kind your "
          + "EntityQuery uses."
      )
    }

    // An entity without an identifier can never be resolved or matched, and an entity without a
    // title has nothing for Siri to match speech against. `@Field(.required)` rejects a missing
    // key, but not a key explicitly set to an empty (or whitespace-only) string.
    if let invalid = entities.first(where: { isBlank($0.id) || isBlank($0.title) }) {
      throw AppIntentEntityInvalidException(
        "expo-app-intents rejected the '\(kind)' entity catalog because an entity has an empty "
          + "\(isBlank(invalid.id) ? "id" : "title"), and Siri and Shortcuts cannot resolve such an "
          + "entity. Give every entity a non-empty 'id' and 'title', then call "
          + "setEntityCatalogAsync again."
      )
    }

    // Two entities with one id cannot both be resolved, so the id no longer names one entity.
    var seenIds = Set<String>()
    for entity in entities {
      if !seenIds.insert(entity.id).inserted {
        throw AppIntentEntityInvalidException(
          "expo-app-intents rejected the '\(kind)' entity catalog because more than one entity has "
            + "the id '\(entity.id)', so Siri and Shortcuts cannot resolve that id to a single "
            + "entity. Give every entity a unique 'id', then call setEntityCatalogAsync again."
        )
      }
    }

    do {
      let data = try JSONEncoder().encode(entities)
      defaults.set(data, forKey: storageKey(kind: kind))
    } catch {
      // Every field of `AppIntentEntityRecord` is a string, so this should never happen.
      throw AppIntentEntityInvalidException(
        "expo-app-intents could not save the '\(kind)' entity catalog. Encoding error: "
          + "\(error.localizedDescription)"
      )
    }
  }
}

internal final class AppIntentEntityInvalidException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return param
  }
}
