import Foundation
import ExpoModulesCore

/**
 A single recorded App Intent invocation, persisted until JS removes it
 with `removePendingInvocationAsync`. Delivery to JS is at-least-once.
 */
public struct AppIntentInvocation: Codable, Sendable {
  public let id: String
  public let name: String
  /**
   Intent-specific values. The top-level invocation schema is fixed; put custom
   data for each intent here.
   */
  public let params: AppIntentParams
  public let createdAt: Double

  public init(name: String, params: AppIntentParams) {
    self.id = UUID().uuidString
    self.name = name
    self.params = params
    self.createdAt = Date().timeIntervalSince1970 * 1000
  }

  func toDict() -> [String: Any] {
    return [
      "id": id,
      "name": name,
      "params": params.mapValues(\.foundationValue),
      "createdAt": createdAt
    ]
  }
}
