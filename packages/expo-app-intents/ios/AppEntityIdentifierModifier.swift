import AppIntents
import Foundation
import ExpoModulesCore
import SwiftUI

public final class AppEntityIdentifierRegistry {
  public static let shared = AppEntityIdentifierRegistry()

  private typealias EntityIdentifierFactory = (String) -> EntityIdentifier?
  private var factories: [String: EntityIdentifierFactory] = [:]

  private init() {}

  public func register<Entity: AppEntity>(_ entity: String, as entityType: Entity.Type) {
    factories[entity] = { rawIdentifier in
      guard let identifier = Entity.ID.entityIdentifier(for: rawIdentifier) else {
        return nil
      }
      return EntityIdentifier(for: entityType, identifier: identifier)
    }
  }

  public func unregister(_ entity: String) {
    factories.removeValue(forKey: entity)
  }

  func identifier(for entity: String, id: String) -> EntityIdentifier? {
    factories[entity]?(id)
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
