// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum LocalNetworkConfig {
  static let bonjourServiceType = "_expo._tcp"

  static func isConfigured(in infoDictionary: [String: Any]?) -> Bool {
    guard let infoDictionary else {
      return false
    }
    guard let description = infoDictionary["NSLocalNetworkUsageDescription"] as? String,
      !description.isEmpty else {
      return false
    }
    guard let services = infoDictionary["NSBonjourServices"] as? [String] else {
      return false
    }
    return services.contains { normalized($0) == bonjourServiceType }
  }

  private static func normalized(_ service: String) -> String {
    var value = service.lowercased()
    if value.hasSuffix(".") {
      value.removeLast()
    }
    return value
  }
}
