import ExpoModulesCore
import ActivityKit
import WidgetKit

let pushNotificationsEnabledKey: String = "ExpoWidgets_EnablePushNotifications"

let onUserInteraction = "onExpoWidgetsUserInteraction"
let onPushToStartTokenReceived = "onExpoWidgetsPushToStartTokenReceived"
let onTokenReceived = "onExpoWidgetsTokenReceived"
let onActivityStateChanged = "onExpoWidgetsLiveActivityStateChanged"
let onLiveActivityStarted = "onExpoWidgetsLiveActivityStarted"
let onUserInteractionNotification = Notification.Name(onUserInteraction)

public final class WidgetsModule: Module {
  var pushToStartTokenObserverTask: Task<Void, Never>?
  var liveActivityStartObserverTask: Task<Void, Never>?

  public func definition() -> ModuleDefinition {
    Name("ExpoWidgets")

    Events(onPushToStartTokenReceived, onTokenReceived, onActivityStateChanged, onLiveActivityStarted, onUserInteraction)

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

    OnDestroy {
      pushToStartTokenObserverTask?.cancel()
      liveActivityStartObserverTask?.cancel()
    }

    OnStartObserving(onLiveActivityStarted) {
      observeLiveActivityStarts()
    }

    OnStopObserving(onLiveActivityStarted) {
      liveActivityStartObserverTask?.cancel()
      liveActivityStartObserverTask = nil
    }

    Constant("widgetsDirectory") { () -> String? in
      guard let appGroupIdentifier = WidgetsStorage.appGroupIdentifier,
            let containerUrl = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
        return nil
      }
      let directoryUrl = containerUrl.appendingPathComponent("ExpoWidgets", isDirectory: true)
      do {
        try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
        return directoryUrl.absoluteString
      } catch {
        return nil
      }
    }

    Function("reloadAllWidgets") {
      WidgetCenter.shared.reloadAllTimelines()
    }

    Function("areActivitiesEnabled") { () -> Bool in
      return ActivityAuthorizationInfo().areActivitiesEnabled
    }

    Class("Widget", WidgetObject.self) {
      Constructor { (name: String, layout: String, initialProps: [String: Any]?) in
        WidgetObject(name: name, layout: layout, initialProps: initialProps)
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

      Function("setConfigurationParameterEnum") { (widget: WidgetObject, parameterName: String, options: [WidgetConfigurationOptionRecord]?) in
        widget.setConfigurationParameterEnum(parameterName: parameterName, options: options)
      }
    }

    Class("LiveActivityFactory", LiveActivityFactory.self) {
      Constructor { (name: String, layout: String) in
        LiveActivityFactory(name: name, layout: layout)
      }

      Function("start") { (liveActivity: LiveActivityFactory, props: String?, options: LiveActivityStartOptions) in
        try liveActivity.start(props: props, options: options)
      }

      Function("getInstances") { (liveActivity: LiveActivityFactory) in
        try liveActivity.getInstances()
      }
    }

    Class("LiveActivity", LiveActivity.self) {
      Function("getId") { (instance: LiveActivity) in
        instance.id
      }

      Function("getState") { (instance: LiveActivity) in
        try instance.getState()
      }

      AsyncFunction("update") { (instance: LiveActivity, props: String?, options: LiveActivityUpdateOptions) in
        try await instance.update(props: props, options: options)
      }

      AsyncFunction("end") { (instance: LiveActivity, dismissalPolicy: LiveActivityDismissalPolicy?, afterDate: Date?, props: String?, contentDate: Date?) in
        try await instance.end(dismissalPolicy: dismissalPolicy, afterDate: afterDate, props: props, contentDate: contentDate)
      }

      AsyncFunction("getPushToken") { (instance: LiveActivity) in
        try instance.getPushToken()
      }

      Function("getProps") { (instance: LiveActivity) in
        try instance.getProps()
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

  private func observeLiveActivityStarts() {
    liveActivityStartObserverTask?.cancel()
    liveActivityStartObserverTask = Task {
      for await activity in Activity<LiveActivityAttributes>.activityUpdates {
        sendEvent(onLiveActivityStarted, [
          "activityId": activity.id,
          "name": activity.content.state.name
        ])
      }
    }
  }

  private var pushNotificationsEnabled: Bool {
    Bundle.main.object(forInfoDictionaryKey: pushNotificationsEnabledKey) as? Bool ?? false
  }
}
