import ExpoModulesCore
import ActivityKit
import WidgetKit

let pushNotificationsEnabledKey: String = "ExpoWidgets_EnablePushNotifications"

let onUserInteraction = "onExpoWidgetsUserInteraction"
let onPushToStartTokenReceived = "onExpoWidgetsPushToStartTokenReceived"
let onTokenReceived = "onExpoWidgetsTokenReceived"
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

    Function("reloadAllWidgets") {
      WidgetCenter.shared.reloadAllTimelines()
    }

    Class("Widget", WidgetObject.self) {
      Constructor { (name: String, layout: String) in
        WidgetObject(name: name, layout: layout)
      }

      Function("reload") { (widget: WidgetObject) in
        widget.reload()
      }

      Function("updateTimeline") { (widget: WidgetObject, entries: [WidgetsJSTimelineEntry]) in
        try widget.updateTimeline(entries: entries)
      }

      Function("getTimeline") { (widget: WidgetObject) in
        try widget.getTimeline()
      }
    }

    Class("LiveActivityFactory", LiveActivityFactory.self) {
      Constructor { (name: String, layout: String) in
        LiveActivityFactory(name: name, layout: layout)
      }

      Function("start") { (liveActivity: LiveActivityFactory, props: String, url: URL?) in
        try liveActivity.start(props: props, url: url)
      }

      Function("getInstances") { (liveActivity: LiveActivityFactory) in
        try liveActivity.getInstances()
      }
    }

    Class("LiveActivity", LiveActivity.self) {
      AsyncFunction("update") { (instance: LiveActivity, props: String) in
        try await instance.update(props: props)
      }

      AsyncFunction("end") { (instance: LiveActivity, dismissalPolicy: String?) in
        try await instance.end(dismissalPolicy: dismissalPolicy)
      }

      AsyncFunction("getPushToken") { (instance: LiveActivity) in
        try instance.getPushToken()
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
        "activityPushToStartToken": activityPushToStartToken
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

  private var pushNotificationsEnabled: Bool {
    Bundle.main.object(forInfoDictionaryKey: pushNotificationsEnabledKey) as? Bool ?? false
  }
}
