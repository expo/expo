import AppIntents
import WidgetKit

@available(iOS 16.0, *)
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

  init() {}
  init(source: String?, target: String?, entryIndex: Int?) {
    self.source = source
    self.target = target
    self.entryIndex = entryIndex
  }

  func perform() async throws -> some IntentResult {
    guard let source else {
      return .result()
    }

    let layout = WidgetsStorage.getString(forKey: "__expo_widgets_\(source)_layout") ?? ""
    let timeline = WidgetsStorage.getArray(forKey: "__expo_widgets_\(source)_timeline")

    guard let timeline,
          let entryIndex,
          let entry = timeline[entryIndex] as? [String: Any],
          let props = entry["props"] as? [String: Any],
          let context = createWidgetContext(layout: layout, props: props) else {
      return .result()
    }
    let familyKey: String? = "systemSmall"
    let result = context.objectForKeyedSubscript("__expoWidgetHandlePress")?.call(
      withArguments: [Int(Date.now.timeIntervalSince1970 * 1000), familyKey as Any, target as Any]
    )
    if let newProps = result?.toObject() as? [String: Any] {
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

@available(iOS 16.0, *)
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

    return .result()
  }
}
