import ExpoModulesCore
import ActivityKit

final class LiveActivity: SharedObject {
  let id: String
  let name: String
  private var pushTokenObserverTask: Task<Void, Never>?

  init(id: String, name: String) {
    self.id = id
    self.name = name
    super.init()
  }

  func update(props: String) async throws {
    guard #available(iOS 16.2, *) else { throw LiveActivitiesNotSupportedException() }

    guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id }) else {
      throw LiveActivityNotFoundException(id)
    }

    let newState = LiveActivityAttributes.ContentState(name: name, props: props)
    await activity.update(ActivityContent(state: newState, staleDate: nil))
  }

  func end(dismissalPolicy: LiveActivityDismissalPolicy?, afterDate: Date?, props: String?, contentDate: Date?) async throws {
    guard #available(iOS 16.2, *) else { throw LiveActivitiesNotSupportedException() }

    guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id }) else {
      throw LiveActivityNotFoundException(id)
    }

    let content: ActivityContent<LiveActivityAttributes.ContentState>?
    if let props {
      content = ActivityContent(state: LiveActivityAttributes.ContentState(name: name, props: props), staleDate: nil)
    } else {
      content = nil
    }

    guard let contentDate, #available(iOS 17.2, *) else {
      return await activity.end(content, dismissalPolicy: dismissalPolicy?.toDismissalPolicy(date: afterDate) ?? .default)
    }

    await activity.end(content, dismissalPolicy: dismissalPolicy?.toDismissalPolicy(date: afterDate) ?? .default, timestamp: contentDate)
  }

  func getPushToken() throws -> String? {
    guard #available(iOS 16.1, *) else { throw LiveActivitiesNotSupportedException() }

    guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id }) else {
      throw LiveActivityNotFoundException(id)
    }

    guard let tokenData = activity.pushToken else { return nil }

    return tokenData.reduce("") { $0 + String(format: "%02x", $1) }
  }

  @available(iOS 16.1, *)
  func observePushTokenUpdates(for activity: Activity<LiveActivityAttributes>, pushNotificationsEnabled: Bool) {
    guard pushNotificationsEnabled else {
      return
    }

    pushTokenObserverTask?.cancel()
    pushTokenObserverTask = Task {
      for await data in activity.pushTokenUpdates {
        let token = data.reduce("") { $0 + String(format: "%02x", $1) }
        emit(event: onTokenReceived, arguments: [
          "activityId": activity.id,
          "pushToken": token
        ])
      }
    }
  }

  override func sharedObjectWillRelease() {
    pushTokenObserverTask?.cancel()
    pushTokenObserverTask = nil
  }
}
