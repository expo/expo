import ExpoModulesCore
import Foundation

/// An entity exposed to App Intents parameter queries. JS populates catalogs with
/// `setEntityCatalogAsync`; app-target `EntityQuery` implementations read them through
/// `AppIntentEntityStore.shared`.
///
/// Catalogs are stored in UserDefaults, so they should stay compact. Apps with large
/// datasets should publish only the subset needed for Siri and Shortcuts resolution.
@Record
public struct AppIntentEntityRecord: Codable, Sendable {
  public var id: String
  public var title: String
  public var subtitle: String?
  public var synonyms: [String] = []
  public var metadata: [String: String] = [:]
  public var hideInSpotlight: Bool = false

  private enum CodingKeys: String, CodingKey {
    case id
    case title
    case subtitle
    case synonyms
    case metadata
    case hideInSpotlight
  }

  public init(
    id: String,
    title: String,
    subtitle: String? = nil,
    synonyms: [String] = [],
    metadata: [String: String] = [:],
    hideInSpotlight: Bool = false
  ) {
    self.id = id
    self.title = title
    self.subtitle = subtitle
    self.synonyms = synonyms
    self.metadata = metadata
    self.hideInSpotlight = hideInSpotlight
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    self.init(
      id: try container.decode(String.self, forKey: .id),
      title: try container.decode(String.self, forKey: .title),
      subtitle: try container.decodeIfPresent(String.self, forKey: .subtitle),
      synonyms: try container.decodeIfPresent([String].self, forKey: .synonyms) ?? [],
      metadata: try container.decodeIfPresent([String: String].self, forKey: .metadata) ?? [:],
      hideInSpotlight: try container.decodeIfPresent(Bool.self, forKey: .hideInSpotlight) ?? false
    )
  }

  public func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(id, forKey: .id)
    try container.encode(title, forKey: .title)
    try container.encodeIfPresent(subtitle, forKey: .subtitle)
    try container.encode(synonyms, forKey: .synonyms)
    if !metadata.isEmpty {
      try container.encode(metadata, forKey: .metadata)
    }
    // Encoded only when set, so catalogs that never touch the flag keep the same bytes and do not
    // register as changed. It has to be encoded at all, though: change detection compares the
    // encoded catalog, so a flag flip would otherwise go unnoticed and never trigger a reindex.
    if hideInSpotlight {
      try container.encode(hideInSpotlight, forKey: .hideInSpotlight)
    }
  }
}

public actor AppIntentEntityStore {
  public static let shared = AppIntentEntityStore()
  internal static let userDefaultsSuiteName = "dev.expo.appintents"

  private let suiteName: String
  private var defaults: UserDefaults?

  internal init(userDefaultsSuiteName: String = AppIntentEntityStore.userDefaultsSuiteName) {
    suiteName = userDefaultsSuiteName
  }

  private func requireDefaults() throws -> UserDefaults {
    if let defaults {
      return defaults
    }

    guard let defaults = UserDefaults(suiteName: suiteName) else {
      throw AppIntentEntityStoreUnavailableException(suiteName)
    }

    self.defaults = defaults
    return defaults
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
    let defaults = try requireDefaults()
    guard let data = defaults.data(forKey: storageKey(kind: kind)) else {
      return []
    }

    do {
      return try JSONDecoder().decode([AppIntentEntityRecord].self, from: data)
    } catch {
      let message = """
        expo-app-intents could not read the '\(kind)' entity catalog, so Siri and Shortcuts have no \
        values to offer or resolve for it. The stored data is not valid JSON for this version of \
        the module, which usually means a different version wrote it. Call \
        setEntityCatalogAsync('\(kind)', ...) to replace it. Decoding error: \(error.localizedDescription)
        """
      log.error(message)
      throw AppIntentEntityCatalogDecodingException(message)
    }
  }

  public func entities(
    ofKind kind: String,
    matching identifiers: [String]
  ) throws -> [AppIntentEntityRecord] {
    let identifierSet = Set(identifiers)
    return try entities(ofKind: kind).filter { identifierSet.contains($0.id) }
  }

  /// Replaces the catalog for the given kind and reports whether anything changed, so callers can
  /// skip work that only makes sense for a new catalog. Throws rather than leaving the previous
  /// catalog in place without saying so.
  ///
  /// `.sortedKeys` is required rather than cosmetic: `metadata` is a dictionary with no guaranteed
  /// iteration order, so without it two encodings of equal content could differ and every write
  /// would look like a change.
  @discardableResult
  internal func setCatalog(kind: String, entities: [AppIntentEntityRecord]) throws -> Bool {
    // The kind names the catalog that app-target `EntityQuery` implementations read, so a blank
    // kind stores a catalog no query ever asks for.
    if isBlank(kind) {
      throw AppIntentEntityCatalogKindException(
        """
        expo-app-intents rejected an entity catalog because its kind is empty. Call \
        setEntityCatalogAsync with the same non-empty kind your EntityQuery uses.
        """
      )
    }

    // An entity without an identifier can never be resolved or matched, and an entity without a
    // title has nothing for Siri to match speech against. Required `@Record` properties reject a
    // missing key, but not one explicitly set to an empty (or whitespace-only) string.
    if let invalid = entities.first(where: { isBlank($0.id) || isBlank($0.title) }) {
      throw AppIntentEntityInvalidFieldException(
        """
        expo-app-intents rejected the '\(kind)' entity catalog because an entity has an empty \
        \(isBlank(invalid.id) ? "id" : "title"). Give every entity a non-empty 'id' and 'title', \
        then call 'setEntityCatalogAsync' again.
        """
      )
    }

    // Two entities with one id cannot both be resolved, so the id no longer names one entity.
    var seenIds = Set<String>()
    for entity in entities where !seenIds.insert(entity.id).inserted {
      throw AppIntentEntityDuplicateIdException(
        """
        expo-app-intents rejected the '\(kind)' entity catalog because more than one entity has \
        the id '\(entity.id)'. Give every entity a unique 'id', then call setEntityCatalogAsync again.
        """
      )
    }

    let defaults = try requireDefaults()
    let encoder = JSONEncoder()
    encoder.outputFormatting = .sortedKeys

    let data: Data
    do {
      data = try encoder.encode(entities)
    } catch {
      // Every field of `AppIntentEntityRecord` is a string, so this should never happen.
      throw AppIntentEntityCatalogEncodingException(
        "expo-app-intents could not save the '\(kind)' entity catalog. Encoding error: \(error.localizedDescription)"
      )
    }

    guard data != defaults.data(forKey: storageKey(kind: kind)) else {
      return false
    }

    defaults.set(data, forKey: storageKey(kind: kind))
    return true
  }
}

internal final class AppIntentEntityStoreUnavailableException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return """
      expo-app-intents could not access the '\(param)' UserDefaults suite, so entity catalogs cannot \
      be read or written. Try again later.
      """
  }
}

internal final class AppIntentEntityCatalogDecodingException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return param
  }
}

internal final class AppIntentEntityCatalogKindException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return param
  }
}

internal final class AppIntentEntityInvalidFieldException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return param
  }
}

internal final class AppIntentEntityDuplicateIdException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return param
  }
}

internal final class AppIntentEntityCatalogEncodingException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return param
  }
}
