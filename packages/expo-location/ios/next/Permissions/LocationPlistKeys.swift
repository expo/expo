import Foundation

enum LocationPlistKeys {
  static let whenInUse = "NSLocationWhenInUseUsageDescription"
  static let alwaysAndWhenInUse = "NSLocationAlwaysAndWhenInUseUsageDescription"

  static func firstMissing(in keys: [String]) -> String? {
    return keys.first { Bundle.main.object(forInfoDictionaryKey: $0) == nil }
  }
}
