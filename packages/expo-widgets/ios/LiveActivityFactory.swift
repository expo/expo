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

  func start(props: String?, options: LiveActivityStartOptions) throws -> LiveActivity {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      throw LiveActivitiesNotSupportedException()
    }

    do {
      let initialState = LiveActivityAttributes.ContentState(name: name, props: props)
      let attributes = LiveActivityAttributes(url: options.url?.absoluteString)
      let content = ActivityContent(
        state: initialState,
        staleDate: options.staleDate,
        relevanceScore: options.relevanceScore
      )
      let pushType: PushType? = Self.pushNotificationsEnabled ? .token : nil
      let activity: Activity<LiveActivityAttributes>
      if let schedule = options.schedule {
        guard #available(iOS 26.0, *) else {
          throw ScheduledLiveActivitiesNotSupportedException()
        }

        activity = try Activity.request(
          attributes: attributes,
          content: content,
          pushType: pushType,
          style: .standard,
          alertConfiguration: schedule.alertConfiguration.toAlertConfiguration(),
          start: schedule.startDate
        )
      } else {
        activity = try Activity.request(attributes: attributes, content: content, pushType: pushType)
      }

      let instance = LiveActivity(id: activity.id, name: name)
      instance.observePushTokenUpdates(for: activity, pushNotificationsEnabled: LiveActivityFactory.pushNotificationsEnabled)
      instances[activity.id] = instance
      return instance
    } catch let error as ScheduledLiveActivitiesNotSupportedException {
      throw error
    } catch {
      throw StartLiveActivityException(error.localizedDescription)
    }
  }

  func getInstances() throws -> [LiveActivity] {
    let activities = Activity<LiveActivityAttributes>.activities
      // Filter LiveActivity instances for activities that don't match the factory's name.
      .filter { $0.content.state.name == name }

    let activityIDs = Set(activities.map(\.id))
    instances = instances.filter { activityIDs.contains($0.key) }

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
