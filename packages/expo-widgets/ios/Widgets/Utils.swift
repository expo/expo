import WidgetKit
import Foundation

func parseTimeline(identifier: String, name: String, family: WidgetFamily) -> [WidgetsTimelineEntry] {
  let layout = WidgetsStorage.getString(forKey: "__expo_widgets_\(name)_layout") ?? ""
  let timeline = WidgetsStorage.getArray(forKey: "__expo_widgets_\(name)_timeline") ?? []

  let entries: [WidgetsTimelineEntry?] = timeline.enumerated().map { index, entry in
    if let entry = entry as? [String: Any], let timestamp = entry["timestamp"] as? Int, let props = entry["props"] as? [String: Any] {
      let node = evaluateLayout(layout: layout, props: props, timestamp: timestamp, family: family)
      return WidgetsTimelineEntry(
        date: Date(timeIntervalSince1970: Double(timestamp) / 1000),
        source: name,
        node: node,
        entryIndex: index
      )
    }
    return nil
  }

  return entries.compactMap(\.self)
}

func evaluateLayout(
  layout: String,
  props: [String: Any],
  timestamp: Int,
  family: WidgetFamily
) -> [String: Any]? {
  guard let context = createWidgetContext(layout: layout, props: props) else {
    return nil
  }
  let familyKey: String? = getKeyFor(widgetFamily: family)

  let result = context.objectForKeyedSubscript("__expoWidgetRender")?.call(
    withArguments: [timestamp, familyKey as Any]
  )
  return result?.toObject() as? [String: Any]
}

func getLiveActivityNodes(forName name: String, props: String = "{}") -> [String: Any] {
  let layout = WidgetsStorage.getString(forKey: "__expo_widgets_live_activity_\(name)_layout") ?? ""
  let propsData = props.data(using: .utf8)
  let propsDict = propsData.flatMap { try? JSONSerialization.jsonObject(with: $0, options: []) as? [String: Any] }
  guard let context = createWidgetContext(layout: layout, props: propsDict ?? [:]) else {
    return [:]
  }

  let result = context.objectForKeyedSubscript("__expoWidgetRender")?.call(
    withArguments: [Int(Date.now.timeIntervalSince1970 * 1000)]
  )
  return result?.toObject() as? [String: Any] ?? [:]
}

func getLiveActivityUrl(forName name: String) -> URL? {
  let data = WidgetsStorage.getData(forKey: "__expo_widgets_live_activity_\(name)_url")
  if let data, let url = String(data: data, encoding: .utf8) {
    return URL(string: url)
  }
  return nil
}
