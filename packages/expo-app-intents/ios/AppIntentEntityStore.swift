import Foundation
import ExpoModulesCore

/**
 An entity exposed to App Intents parameter queries. JS populates catalogs with
 `setEntityCatalogAsync`; app-target `EntityQuery` implementations read them through
 `AppIntentEntityStore.shared`.

 Catalogs are stored in UserDefaults, so they should stay compact. Apps with large
 datasets should publish only the subset needed for Siri and Shortcuts resolution.
 */
public struct AppIntentEntityRecord: Codable, Record {
  @Field public var id: String = ""
  @Field public var title: String = ""
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

  public func entities(ofKind kind: String) -> [AppIntentEntityRecord] {
    if let data = defaults.data(forKey: storageKey(kind: kind)),
      let entities = try? JSONDecoder().decode([AppIntentEntityRecord].self, from: data) {
      return entities
    }
    return []
  }

  public func entities(ofKind kind: String, matching identifiers: [String]) -> [AppIntentEntityRecord] {
    return entities(ofKind: kind).filter { identifiers.contains($0.id) }
  }

  internal func setCatalog(kind: String, entities: [AppIntentEntityRecord]) {
    guard let data = try? JSONEncoder().encode(entities) else {
      return
    }
    defaults.set(data, forKey: storageKey(kind: kind))
  }
}
