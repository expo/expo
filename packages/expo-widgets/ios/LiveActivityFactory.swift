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

  func start(props: String?, url: URL?, staleDate: Date?, schedule: LiveActivityScheduleRecord?) throws -> LiveActivity {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      throw LiveActivitiesNotSupportedException()
    }
    if schedule != nil, #unavailable(iOS 26.0) {
      throw ScheduledLiveActivitiesNotSupportedException()
    }

    do {
      let initialState = LiveActivityAttributes.ContentState(name: name, props: props)
      let attributes = LiveActivityAttributes(url: url?.absoluteString)
      let content = ActivityContent(state: initialState, staleDate: staleDate)
      let pushType: PushType? = LiveActivityFactory.pushNotificationsEnabled ? .token : nil
      let activity: Activity<LiveActivityAttributes>

      if let schedule, #available(iOS 26.0, *) {
        activity = try Activity.request(
          attributes: attributes,
          content: content,
          pushType: pushType,
          style: .standard,
          alertConfiguration: schedule.alertConfiguration.toAlertConfiguration(),
          startDate: schedule.startDate
        )
      } else {
        activity = try Activity.request(attributes: attributes, content: content, pushType: pushType)
      }

      let instance = LiveActivity(id: activity.id, name: name)
      instance.observePushTokenUpdates(for: activity, pushNotificationsEnabled: LiveActivityFactory.pushNotificationsEnabled)
      instances[activity.id] = instance
      return instance
    } catch {
      throw StartLiveActivityException(error.localizedDescription)
    }
  }

  func getInstances() throws -> [LiveActivity] {
    let activities = Activity<LiveActivityAttributes>.activities
      // Filter LiveActivity instances for activities that don't match the factory's name.
      .filter { $0.content.state.name == name }
      // A stale activity is still visible and updatable, and a pending one is scheduled to start; only ended/dismissed ones are gone.
      .filter { activity in
        if #available(iOS 26.0, *), activity.activityState == .pending {
          return true
        }
        return activity.activityState == .active || activity.activityState == .stale
      }
      
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
