import Foundation

enum TemporaryFullAccuracyPlistKeys {
  static let purposeDictionary = "NSLocationTemporaryUsageDescriptionDictionary"
  static let purposeKey = "ExpoLocationFullAccuracy"

  static func containsPurposeKey(_ purposeKey: String) -> Bool {
    guard let dictionary = Bundle.main.object(forInfoDictionaryKey: purposeDictionary) as? [String: Any] else {
      return false
    }
    return dictionary[purposeKey] != nil
  }
}
