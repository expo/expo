import ExpoModulesCore
import ActivityKit

final class LiveActivityFactory: SharedObject {
  let name: String
  private var instances: [String: LiveActivity] = [:]

  static var pushNotificationsEnabled: Bool {
    Bundle.main.object(forInfoDictionaryKey: pushNotificationsEnabledKey) as? Bool ?? false
  }

  init(name: String, layout: String) {
    self.name = name
    WidgetsStorage.set(layout, forKey: "__expo_widgets_live_activity_\(name)_layout")
  }

  func start(props: String, url: URL?, staleDate: Date?) throws -> LiveActivity {
    guard #available(iOS 16.2, *) else { throw LiveActivitiesNotSupportedException() }
    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      throw LiveActivitiesNotSupportedException()
    }

    do {
      let initialState = LiveActivityAttributes.ContentState(name: name, props: props)
      let activity = try Activity.request(
        attributes: LiveActivityAttributes(url: url?.absoluteString),
        content: .init(state: initialState, staleDate: staleDate),
        pushType: LiveActivityFactory.pushNotificationsEnabled ? .token : nil
      )

      let instance = LiveActivity(id: activity.id, name: name)
      instance.observePushTokenUpdates(for: activity, pushNotificationsEnabled: LiveActivityFactory.pushNotificationsEnabled)
      instances[activity.id] = instance
      return instance
    } catch {
      throw StartLiveActivityException(error.localizedDescription)
    }
  }

  func getInstances() throws -> [LiveActivity] {
    guard #available(iOS 16.2, *) else { throw LiveActivitiesNotSupportedException() }

    let activities = Activity<LiveActivityAttributes>.activities
      // Filter LiveActivity instances for activities that don't match the factory's name.
      .filter { $0.content.state.name == name }
      // A stale activity is still visible and updatable; only ended/dismissed ones are gone.
      .filter { $0.activityState == .active || $0.activityState == .stale }
      
    let activeIDs = Set(activities.map(\.id))
    instances = instances.filter { activeIDs.contains($0.key) }

    return activities.map { activity in
      if let instance = instances[activity.id] {
        instance.observePushTokenUpdates(for: activity, pushNotificationsEnabled: Self.pushNotificationsEnabled)
        return instance
      }

      let instance = LiveActivity(id: activity.id, name: name)
      instance.observePushTokenUpdates(for: activity, pushNotificationsEnabled: Self.pushNotificationsEnabled)
      instances[activity.id] = instance
      return instance
    }
  }

  override func sharedObjectWillRelease() {
    instances.removeAll()
  }
}
