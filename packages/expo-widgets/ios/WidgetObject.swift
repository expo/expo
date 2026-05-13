import ExpoModulesCore
import WidgetKit

final class WidgetObject: SharedObject {
  let name: String
  init(name: String, layout: String) {
    self.name = name
    WidgetsStorage.set(layout, forKey: "__expo_widgets_\(name)_layout")
  }

  func reload() {
    WidgetCenter.shared.reloadTimelines(ofKind: name)
  }

  func updateTimeline(entries: [WidgetsJSTimelineEntry]) throws {
    if WidgetsStorage.getString(forKey: "__expo_widgets_\(name)_layout") == nil {
      throw UpdatedTimelineWithoutLayout(name)
    }
    WidgetsStorage.set(entries.map { $0.toDictionary() }, forKey: "__expo_widgets_\(name)_timeline")

    self.reload()
  }

  func getTimeline() throws -> [WidgetsJSTimelineEntry] {
    guard let entries = WidgetsStorage.getArray(forKey: "__expo_widgets_\(name)_timeline") as? [[String: Any]],
          let appContext else {
      return []
    }
    return try entries.map { try WidgetsJSTimelineEntry(from: $0, appContext: appContext) }
  }
}
