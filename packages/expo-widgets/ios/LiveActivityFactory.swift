import ExpoModulesCore
import ActivityKit

final class LiveActivityFactory: SharedObject {
  let name: String

  static var pushNotificationsEnabled: Bool {
    Bundle.main.object(forInfoDictionaryKey: pushNotificationsEnabledKey) as? Bool ?? false
  }

  init(name: String, layout: String) {
    self.name = name
    WidgetsStorage.set(layout, forKey: "__expo_widgets_live_activity_\(name)_layout")
  }

  func start(props: String, url: URL?) throws -> LiveActivity {
    guard #available(iOS 16.2, *) else { throw LiveActivitiesNotSupportedException() }
    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      throw LiveActivitiesNotSupportedException()
    }

    if let url {
      WidgetsStorage.set(url.absoluteString, forKey: "__expo_widgets_live_activity_\(name)_url")
    }

    do {
      let initialState = LiveActivityAttributes.ContentState(name: name, props: props)
      let activity = try Activity.request(
        attributes: LiveActivityAttributes(),
        content: .init(state: initialState, staleDate: nil),
        pushType: LiveActivityFactory.pushNotificationsEnabled ? .token : nil
      )

      let instance = LiveActivity(id: activity.id, name: name)
      instance.observePushTokenUpdates(for: activity, pushNotificationsEnabled: LiveActivityFactory.pushNotificationsEnabled)
      return instance
    } catch {
      throw StartLiveActivityException(error.localizedDescription)
    }
  }

  func getInstances() throws -> [LiveActivity] {
    guard #available(iOS 16.1, *) else { throw LiveActivitiesNotSupportedException() }

    return Activity<LiveActivityAttributes>.activities.map { activity in
      LiveActivity(id: activity.id, name: name)
    }
  }
}
