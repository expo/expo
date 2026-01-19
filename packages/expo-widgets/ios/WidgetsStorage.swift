enum WidgetsStorage {
  static var appGroupIdentifier: String? = Bundle.main.object(forInfoDictionaryKey: "ExpoWidgetsAppGroupIdentifier") as? String
  static let defaults = UserDefaults(suiteName: appGroupIdentifier)

  static func set(_ value: [String: Any], forKey key: String) {
    guard let defaults else { return }

    defaults.set(value, forKey: key)
  }

  static func set(_ value: String, forKey key: String) {
    guard let defaults else { return }

    defaults.set(value, forKey: key)
  }

  static func set(_ value: Data, forKey key: String) {
    guard let defaults else { return }

    defaults.set(value, forKey: key)
  }

  static func getDictionary(forKey key: String) -> [String: Any]? {
    guard let defaults else { return nil }

    return defaults.dictionary(forKey: key)
  }

  static func getData(forKey key: String) -> Data? {
    guard let defaults else { return nil }

    return defaults.data(forKey: key)
  }

  static func getString(forKey key: String) -> String? {
    guard let defaults else { return nil }

    return defaults.string(forKey: key)
  }

  static func removeObject(forKey key: String) {
    guard let defaults else { return }

    defaults.removeObject(forKey: key)
  }
}
