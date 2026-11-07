import ExpoModulesCore
import ActivityKit

final class LiveActivity: SharedObject {
  let id: String
  let name: String
  private var pushTokenObserverTask: Task<Void, Never>?
  private var stateObserverTask: Task<Void, Never>?

  init(id: String, name: String) {
    self.id = id
    self.name = name
    super.init()
  }

  func update(props: String?, staleDate: Date?) async throws {
    guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id }) else {
      throw LiveActivityNotFoundException(id)
    }

    let newState = LiveActivityAttributes.ContentState(name: name, props: props)
    await activity.update(ActivityContent(state: newState, staleDate: staleDate))
  }

  func end(dismissalPolicy: LiveActivityDismissalPolicy?, afterDate: Date?, props: String?, contentDate: Date?) async throws {
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
    guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id }) else {
      throw LiveActivityNotFoundException(id)
    }

    guard let tokenData = activity.pushToken else { return nil }

    return tokenData.reduce("") { $0 + String(format: "%02x", $1) }
  }

  func getState() throws -> String {
    guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id }) else {
      throw LiveActivityNotFoundException(id)
    }

    return Self.stateName(activity.activityState)
  }

  func getProps() throws -> [String: Any]? {
    guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id }) else {
      throw LiveActivityNotFoundException(id)
    }

    return activity.attributes.mergedProps(activity.content.state.props).flatMap(LiveActivityAttributes.jsonObject)
  }

  private static func stateName(_ state: ActivityState) -> String {
    if #available(iOS 26.0, *), state == .pending {
      return "pending"
    }

    switch state {
    case .active: return "active"
    case .stale: return "stale"
    case .ended: return "ended"
    case .dismissed: return "dismissed"
    @unknown default: return "unknown"
    }
  }

  func observeStateUpdates(for activity: Activity<LiveActivityAttributes>) {
    guard stateObserverTask == nil else {
      return
    }

    stateObserverTask = Task {
      for await state in activity.activityStateUpdates {
        emit(event: onActivityStateChanged, payload: [
          "activityId": activity.id,
          "state": Self.stateName(state)
        ])
      }
    }
  }

  func observePushTokenUpdates(for activity: Activity<LiveActivityAttributes>, pushNotificationsEnabled: Bool) {
    guard pushNotificationsEnabled else {
      return
    }

    guard pushTokenObserverTask == nil else {
      return
    }

    pushTokenObserverTask = Task {
      for await data in activity.pushTokenUpdates {
        let token = data.reduce("") { $0 + String(format: "%02x", $1) }
        emit(event: onTokenReceived, payload: [
          "activityId": activity.id,
          "pushToken": token
        ])
      }
    }
  }

  override func sharedObjectWillRelease() {
    pushTokenObserverTask?.cancel()
    pushTokenObserverTask = nil
    stateObserverTask?.cancel()
    stateObserverTask = nil
  }
}
