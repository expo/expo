public enum WidgetsStorage {
  public static var appGroupIdentifier: String? = Bundle.main.object(forInfoDictionaryKey: "ExpoWidgetsAppGroupIdentifier") as? String
  static let defaults = UserDefaults(suiteName: appGroupIdentifier)

  static func set(_ value: [String: Any], forKey key: String) {
    guard let defaults else { return }

    defaults.set(value, forKey: key)
  }

  static func set(_ value: [[String: Any]], forKey key: String) {
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

  public static func getDictionary(forKey key: String) -> [String: Any]? {
    guard let defaults else { return nil }

    return defaults.dictionary(forKey: key)
  }

  public static func getArray(forKey key: String) -> [Any]? {
    guard let defaults else { return nil }

    return defaults.array(forKey: key)
  }

  public static func getData(forKey key: String) -> Data? {
    guard let defaults else { return nil }

    return defaults.data(forKey: key)
  }

  public static func getString(forKey key: String) -> String? {
    guard let defaults else { return nil }

    return defaults.string(forKey: key)
  }

  static func removeObject(forKey key: String) {
    guard let defaults else { return }

    defaults.removeObject(forKey: key)
  }

  static func getLiveActivityInteractionState(forActivityID activityID: String) -> [String: Any]? {
    return getDictionary(forKey: liveActivityInteractionStateKey(forActivityID: activityID))
  }

  static func updateLiveActivityInteractionState(_ state: [String: Any], forActivityID activityID: String) {
    let currentState = getLiveActivityInteractionState(forActivityID: activityID) ?? [:]
    let newState = currentState.merging(state) { _, newValue in newValue }
    set(newState, forKey: liveActivityInteractionStateKey(forActivityID: activityID))
  }

  static func removeLiveActivityInteractionState(forActivityID activityID: String) {
    removeObject(forKey: liveActivityInteractionStateKey(forActivityID: activityID))
  }

  private static func liveActivityInteractionStateKey(forActivityID activityID: String) -> String {
    return "__expo_widgets_live_activity_\(activityID)_interaction_state"
  }
}
