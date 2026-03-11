import SwiftUI
import ExpoModulesCore
import WidgetKit

public struct WidgetsEntryView: View {
  @Environment(\.self) var environment
  var entry: WidgetsTimelineProvider.Entry

  public init(entry: WidgetsTimelineProvider.Entry) {
    self.entry = entry
  }

  private var widgetEnvironment: [String: Any] {
    var env: [String: Any] = getWidgetEnvironment(environment: environment)
    env["timestamp"] = Int(entry.date.timeIntervalSince1970 * 1000)
    return env
  }

  public var body: some View {
    let layout = WidgetsStorage.getString(forKey: "__expo_widgets_\(entry.source)_layout") ?? ""
    let node = evaluateLayout(layout: layout, props: entry.props ?? [:], environment: widgetEnvironment)

    if let node {
      if #available(iOS 17.0, *) {
        WidgetsDynamicView(source: entry.source, kind: .widget, node: node, entryIndex: entry.entryIndex)
          .containerBackground(.clear, for: .widget)
      } else {
        WidgetsDynamicView(source: entry.source, kind: .widget, node: node, entryIndex: entry.entryIndex)
      }
    } else {
      EmptyView()
    }
  }
}
