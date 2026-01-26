import ExpoModulesCore
import ActivityKit
import WidgetKit
import JavaScriptCore

private let onUserInteraction = "onExpoWidgetsUserInteraction"
let onUserInteractionNotification = Notification.Name(onUserInteraction)

public final class WidgetsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoWidgets")

    Events(onUserInteraction)

    OnStartObserving {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(handleUserInteractionNotification),
        name: onUserInteractionNotification,
        object: nil
      )
    }

    OnStopObserving {
      NotificationCenter.default.removeObserver(
        self,
        name: onUserInteractionNotification,
        object: nil
      )
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
          pushType: nil
        )

        return activity.id
      } catch {
        throw StartLiveActivityException(error.localizedDescription)
      }
    }

    Function("updateLiveActivity") { (id: String, name: String, nodes: String) throws in
      guard #available(iOS 16.2, *) else { throw LiveActivitiesNotSupportedException() }

      guard let activity = Activity<LiveActivityAttributes>.activities.first(where: { $0.id == id })
      else { throw LiveActivitiesNotSupportedException() }

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
  }

  @objc func handleUserInteractionNotification(_ notification: Notification) {
    guard let userInfo = notification.userInfo as? [String: Any],
          let eventData = userInfo["eventData"] as? [String: Any]
    else { return }
    self.sendEvent(onUserInteraction, eventData)
  }
}
