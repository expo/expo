import ExpoModulesCore
import ActivityKit
import WidgetKit
import JavaScriptCore

private let pushNotificationsEnabledKey: String = "ExpoWidgets_EnablePushNotifications"

private let onUserInteraction = "onExpoWidgetsUserInteraction"
private let onPushToStartTokenReceived = "onExpoWidgetsPushToStartTokenReceived"
private let onTokenReceived = "onExpoWidgetsTokenReceived"
let onUserInteractionNotification = Notification.Name(onUserInteraction)

public final class WidgetsModule: Module {
  var pushToStartTokenObserverTask: Task<Void, Never>?

  public func definition() -> ModuleDefinition {
    Name("ExpoWidgets")

    Events(onPushToStartTokenReceived, onTokenReceived, onUserInteraction)

    OnStartObserving(onUserInteraction) {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(handleUserInteractionNotification),
        name: onUserInteractionNotification,
        object: nil
      )
    }

    OnStopObserving(onUserInteraction) {
      NotificationCenter.default.removeObserver(
        self,
        name: onUserInteractionNotification,
        object: nil
      )
    }

    OnStartObserving(onPushToStartTokenReceived) {
      if pushNotificationsEnabled {
        observePushToStartToken()
      }
    }
    
    OnStopObserving(onPushToStartTokenReceived) {
      pushToStartTokenObserverTask?.cancel()
      pushToStartTokenObserverTask = nil
    }

    Function("reloadWidget") { (timeline: String?) in
      if let timeline = timeline {
        WidgetCenter.shared.reloadTimelines(ofKind: timeline)
      } else {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }

    Function("updateWidget") { (name: String, data: String, props: [String: Any]?, updateFunction: String?) in
      WidgetsStorage.set(data, forKey: "__expo_widgets_\(name)")
      if let props {
        WidgetsStorage.set(props, forKey: "__expo_widgets_\(name)_props")
      }
      if let updateFunction {
        WidgetsStorage.set(updateFunction, forKey: "__expo_widgets_\(name)_updateFunction")
      }
    }

    Function("startLiveActivity") { (name: String, nodes: String, url: URL?) throws -> String in
      guard #available(iOS 16.2, *) else { throw LiveActivitiesNotSupportedException() }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        throw LiveActivitiesNotSupportedException()
      }

      let nodesData = nodes.data(using: .utf8)
      guard let compressedData = try nodesData?.brotliCompressed() else {
        throw LiveActivitiesNotSupportedException()
      }

      WidgetsStorage.set(compressedData, forKey: "__expo_widgets_live_activity_\(name)")
      if let url {
        WidgetsStorage.set(url.absoluteString, forKey: "__expo_widgets_live_activity_\(name)_url")
      }

      do {
        let initialState = LiveActivityAttributes.ContentState(name: name)

        let activity = try Activity.request(
          attributes: LiveActivityAttributes(),
          content: .init(state: initialState, staleDate: nil),
          pushType: pushNotificationsEnabled ? .token : nil
        )
        
        if pushNotificationsEnabled {
          self.observePushTokenUpdates(for: activity)
        }

        return activity.id
      } catch {
        throw StartLiveActivityException(error.localizedDescription)
      }
    }

    Function("updateLiveActivity") { (id: String, name: String, nodes: String) throws in
      guard #available(iOS 16.2, *) else { throw LiveActivitiesNotSupportedException() }

      guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id })
      else { throw LiveActivityNotFoundException(id) }

      let nodesData = nodes.data(using: .utf8)
      guard let compressedData = try nodesData?.brotliCompressed() else {
        throw LiveActivitiesNotSupportedException()
      }

      WidgetsStorage.set(compressedData, forKey: "__expo_widgets_live_activity_\(name)")

      Task {
        let newState = LiveActivityAttributes.ContentState(name: name)
        await activity.update(ActivityContent(state: newState, staleDate: nil))
      }
    }

    Function("endLiveActivity") { (id: String, dismissalPolicy: String?) throws in
      guard #available(iOS 16.2, *) else { throw LiveActivitiesNotSupportedException() }
      
      guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id })
      else { throw LiveActivityNotFoundException(id) }

      Task {
        let policy: ActivityUIDismissalPolicy
        switch dismissalPolicy {
        case "immediate":
          policy = .immediate
        default:
          policy = .default
        }

        await activity.end(dismissalPolicy: policy)
      }
    }
    
    AsyncFunction("getLiveActivityPushToken") { (id: String) throws -> String? in
      guard #available(iOS 16.1, *) else { throw LiveActivitiesNotSupportedException() }
      
      guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id })
      else { throw LiveActivityNotFoundException(id) }

      guard let tokenData = activity.pushToken else { return nil }
      
      return tokenData.reduce("") { $0 + String(format: "%02x", $1) }
    }

    Function("getLiveActivities") { () throws -> [LiveActivityInfo] in
      guard #available(iOS 16.1, *) else { throw LiveActivitiesNotSupportedException() }
      
      return Activity<LiveActivityAttributes>.activities.map { activity in
        if #available(iOS 16.2, *) {
          LiveActivityInfo(id: activity.id, name: activity.content.state.name, pushToken: activity.pushToken?.reduce("") { $0 + String(format: "%02x", $1) })
        } else {
          LiveActivityInfo(id: activity.id, pushToken: activity.pushToken?.reduce("") { $0 + String(format: "%02x", $1) })
        }
      }
    }
  }

  @objc func handleUserInteractionNotification(_ notification: Notification) {
    guard let userInfo = notification.userInfo as? [String: Any],
          let eventData = userInfo["eventData"] as? [String: Any]
    else { return }
    self.sendEvent(onUserInteraction, eventData)
  }
  
  private func sendPushToStartToken(activityPushToStartToken: String) {
    sendEvent(
      onPushToStartTokenReceived,
      [
        "activityPushToStartToken": activityPushToStartToken,
      ]
    )
  }

  private func observePushToStartToken() {
    guard #available(iOS 17.2, *), ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    pushToStartTokenObserverTask = Task {
      let initialToken = (Activity<LiveActivityAttributes>.pushToStartToken?.reduce("") { $0 + String(format: "%02x", $1) })
      if let initialToken {
        sendPushToStartToken(activityPushToStartToken: initialToken)
      }

      for await data in Activity<LiveActivityAttributes>.pushToStartTokenUpdates {
        let token = data.reduce("") { $0 + String(format: "%02x", $1) }
        if token != initialToken {
          sendPushToStartToken(activityPushToStartToken: token)
        }
      }
    }
  }

  @available(iOS 16.1, *)
  private func observePushTokenUpdates(for activity: Activity<LiveActivityAttributes>) {
    Task {
      for await data in activity.pushTokenUpdates {
        let token = data.reduce("") { $0 + String(format: "%02x", $1) }
        sendEvent(
          onTokenReceived,
          [
            "activityId": activity.id,
            "pushToken": token,
          ]
        )
      }
    }
  }

  private var pushNotificationsEnabled: Bool {
    Bundle.main.object(forInfoDictionaryKey: pushNotificationsEnabledKey) as? Bool ?? false
  }
}
