import AppIntents
@preconcurrency import CoreSpotlight
import Foundation
import ExpoModulesCore
import SwiftUI

/**
 An `AppEntity` that can be rebuilt from a catalog record published by JavaScript with
 `setEntityCatalogAsync`. Required for Spotlight indexing, because the package has to turn the
 stored records back into entities without knowing the concrete type.
 */
public protocol AppIntentEntityRecordConvertible {
  init(record: AppIntentEntityRecord)
}

public final class AppEntityIdentifierRegistry {
  public static let shared = AppEntityIdentifierRegistry()

  private typealias EntityIdentifierFactory = (String) -> EntityIdentifier?
  private typealias EntityIndexer = ([AppIntentEntityRecord]) async throws -> Void

  private var factories: [String: EntityIdentifierFactory] = [:]
  private var indexers: [String: EntityIndexer] = [:]

  private init() {}

  public func register<Entity: AppEntity>(_ entity: String, as entityType: Entity.Type) {
    factories[entity] = { rawIdentifier in
      guard let identifier = Entity.ID.entityIdentifier(for: rawIdentifier) else {
        return nil
      }
      return EntityIdentifier(for: entityType, identifier: identifier)
    }
  }

  /**
   Registers an entity that is also Spotlight-indexable. On top of what `register(_:as:)` does,
   the catalog published from JavaScript is mirrored into the Spotlight index, so the two cannot
   drift apart.

   This is a separate method rather than an overload of `register(_:as:)` on purpose: overloads
   that differ only by an extra conformance resolve by specificity, and picking the wrong one
   would silently mean no indexing.
   */
  @available(iOS 18.0, *)
  public func registerIndexed<Entity>(_ entity: String, as entityType: Entity.Type)
  where Entity: AppEntity & IndexedEntity & AppIntentEntityRecordConvertible {
    register(entity, as: entityType)

    indexers[entity] = { records in
      try await CSSearchableIndex.default().deleteAppEntities(ofType: entityType)

      let entities = records.map(Entity.init(record:))
      guard !entities.isEmpty else {
        return
      }
      try await CSSearchableIndex.default().indexAppEntities(entities)
    }
  }

  public func unregister(_ entity: String) {
    factories.removeValue(forKey: entity)
    indexers.removeValue(forKey: entity)
  }

  func identifier(for entity: String, id: String) -> EntityIdentifier? {
    factories[entity]?(id)
  }

  /** Kinds registered as indexable. */
  var indexedKinds: [String] {
    return Array(indexers.keys)
  }

  /**
   Rebuilds the Spotlight index for one kind. A failure is logged rather than thrown: the catalog
   write that triggered this has already succeeded, and the index is a derived cache. Callers that
   need to retry can use `reindexEntitiesAsync`.
   */
  func reindex(kind: String, records: [AppIntentEntityRecord]) async {
    guard let indexer = indexers[kind] else {
      return
    }

    do {
      try await indexer(records)
    } catch {
      log.error("expo-app-intents: could not update the Spotlight index for '\(kind)': \(error)")
    }
  }
}

@available(iOS 18.4, *)
struct AppEntityIdentifierModifier: ViewModifier, Record {
  @Field var entity: String = ""
  @Field var id: String = ""

  @ViewBuilder
  func body(content: Content) -> some View {
    if let identifier = AppEntityIdentifierRegistry.shared.identifier(for: entity, id: id) {
      content.appEntityIdentifier(identifier)
        .appEntityUIElements { context in
          return [
            AppEntityUIElement(
              identifier: identifier,
              bounds: context.bounds
            ),
          ]
        }
    } else {
      content
    }
  }
}
