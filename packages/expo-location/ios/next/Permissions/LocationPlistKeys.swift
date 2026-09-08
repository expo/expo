import Foundation

enum LocationPlistKeys {
  static let whenInUse = "NSLocationWhenInUseUsageDescription"
  static let alwaysAndWhenInUse = "NSLocationAlwaysAndWhenInUseUsageDescription"

  static func isIncludedInInfoPlist(_ key: String) -> Bool {
    return Bundle.main.object(forInfoDictionaryKey: key) != nil
  }
}
