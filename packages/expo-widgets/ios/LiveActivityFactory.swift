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

  func start(props: String?, url: URL?, staleDate: Date?) throws -> LiveActivity {
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
      instance.observeStateUpdates(for: activity)
      instances[activity.id] = instance
      return instance
    } catch {
      throw StartLiveActivityException(error.localizedDescription)
    }
  }

  func getInstances(includeEnded: Bool = false) throws -> [LiveActivity] {
    // Filter LiveActivity instances for activities that don't match the factory's name.
    let known = Activity<LiveActivityAttributes>.activities.filter { $0.content.state.name == name }
    // Prune by every known activity, not the filtered view, so an ended instance keeps its identity.
    let knownIDs = Set(known.map(\.id))
    instances = instances.filter { knownIDs.contains($0.key) }

    // A stale activity is still visible and updatable. An ended one stays visible until its
    // dismissal but cannot be updated, so it is returned only with `includeEnded`.
    let activities = known.filter { activity in
      switch activity.activityState {
      case .active, .stale: return true
      case .ended: return includeEnded
      default: return false
      }
    }

    return activities.map { activity in
      if let instance = instances[activity.id] {
        instance.observePushTokenUpdates(for: activity, pushNotificationsEnabled: Self.pushNotificationsEnabled)
        instance.observeStateUpdates(for: activity)
        return instance
      }

      let instance = LiveActivity(id: activity.id, name: name)
      instance.observePushTokenUpdates(for: activity, pushNotificationsEnabled: Self.pushNotificationsEnabled)
      instance.observeStateUpdates(for: activity)
      instances[activity.id] = instance
      return instance
    }
  }

  override func sharedObjectWillRelease() {
    instances.removeAll()
  }
}
