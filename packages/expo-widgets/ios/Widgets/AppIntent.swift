import AppIntents
import WidgetKit

struct WidgetReload: AppIntent {
  // title is not used for non-discoverable intents, but it is required
  static var title: LocalizedStringResource = "Reload widget"
  static var isDiscoverable: Bool = false
  @Parameter(title: "source")
  var source: String?

  init() {}
  init(source: String?) {
    self.source = source
  }

  func perform() async throws -> some IntentResult {
    guard let source else {
      return .result()
    }

    WidgetCenter.shared.reloadTimelines(ofKind: source)
    return .result()
  }
}

struct WidgetUserInteraction: AppIntent {
  // title is not used for non-discoverable intents, but it is required
  static var title: LocalizedStringResource = "User Interaction"
  static var isDiscoverable: Bool = false
  @Parameter(title: "source")
  var source: String?

  @Parameter(title: "target")
  var target: String?

  @Parameter(title: "entryIndex")
  var entryIndex: Int?

  @Parameter(title: "environmentString")
  var environmentString: String?

  init() {}
  init(source: String?, target: String?, entryIndex: Int?, environmentString: String?) {
    self.source = source
    self.target = target
    self.entryIndex = entryIndex
    self.environmentString = environmentString
  }

  func perform() async throws -> some IntentResult {
    guard let source else {
      return .result()
    }

    guard let layout = WidgetsLayoutRegistry.layout(for: source) else {
      return .result()
    }
    let timeline = WidgetsStorage.getArray(forKey: "__expo_widgets_\(source)_timeline")

    guard let timeline,
          let entryIndex,
          timeline.indices.contains(entryIndex),
          let entry = timeline[entryIndex] as? [String: Any],
          let props = entry["props"] as? [String: Any],
          let environmentData = environmentString?.data(using: .utf8),
          var environment = try? JSONSerialization.jsonObject(with: environmentData) as? [String: Any] else {
      return .result()
    }
    environment["target"] = target

    let newProps: [String: Any]?
    switch evaluateWidgetButtonPress(layout: layout, props: props, environment: environment) {
    case .success(let result):
      newProps = result
    case .failure(let error):
      print("[ExpoWidgets] Button press evaluation failed: \(error.message)")
      newProps = nil
    }

    if let newProps {
      var newEntry = entry
      if let originalProps = entry["props"] as? [String: Any] {
        newEntry["props"] = originalProps.merging(newProps) { _, new in new }
      }
      guard var newTimeline = timeline as? [[String: Any]] else {
        return .result()
      }
      newTimeline[entryIndex] = newEntry
      WidgetsStorage.set(newTimeline, forKey: "__expo_widgets_\(source)_timeline")
    }

    WidgetsEvents.shared.sendNotification(type: .userEvent, data: [
      "source": source as Any,
      "target": target as Any,
      "timestamp": Int(Date().timeIntervalSince1970 * 1000)
    ])

    WidgetCenter.shared.reloadTimelines(ofKind: source)

    return .result()
  }
}

struct LiveActivityUserInteraction: LiveActivityIntent {
  // title is not used for non-discoverable intents, but it is required
  static var title: LocalizedStringResource = "User Interaction"
  static var isDiscoverable: Bool = false

  @Parameter(title: "source")
  var source: String?

  @Parameter(title: "target")
  var target: String?

  init() {}
  init(source: String?, target: String?) {
    self.source = source
    self.target = target
  }

  func perform() async throws -> some IntentResult {
    WidgetsEvents.shared.sendNotification(type: .userEvent, data: [
      "source": source as Any,
      "target": target as Any,
      "timestamp": Int(Date().timeIntervalSince1970 * 1000)
    ])

    // The system suspends the app as soon as this intent returns (observed ~100 ms
    // of "running-active" per tap). A JS runtime resumed from suspension needs
    // longer than that to receive the event and call `update()`, so the first
    // tap after idling was silently lost. Ask for a short background grace period
    // so the process outlives the intent long enough for JS to respond.
    keepProcessAlive(seconds: 3)

    return .result()
  }
}

/// Holds a background activity assertion for up to `seconds`, or until the system
/// says time is up. The block runs synchronously on a background queue, which is
/// how `performExpiringActivity` expects to be used; it never blocks the caller.
private func keepProcessAlive(seconds: TimeInterval) {
  let expiry = DispatchSemaphore(value: 0)
  ProcessInfo.processInfo.performExpiringActivity(withReason: "expo-widgets: deliver user interaction to JS") { expired in
    if expired {
      // Second invocation: the system needs the process to suspend now. Wake the
      // first invocation so it releases the assertion instead of sleeping through.
      expiry.signal()
      return
    }
    _ = expiry.wait(timeout: .now() + seconds)
  }
}
