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

  private var widgetEnvironmentString: String? {
    guard let data = try? JSONSerialization.data(withJSONObject: widgetEnvironment),
          let jsonString = String(data: data, encoding: .utf8) else {
        return nil
    }
    return jsonString
  }

  private var layoutNode: [String: Any] {
    guard let layout = WidgetsLayoutRegistry.layout(for: entry.name) else {
      return createRedBox(message: "No layout found for \(WidgetsStorage.appGroupIdentifier ?? "")::\(entry.name)")
    }
    return evaluateLayout(layout: layout, props: entry.props, environment: widgetEnvironment)
  }

  public var body: some View {
    let node = layoutNode
    WidgetsDynamicView(name: entry.name, kind: .widget, node: node, entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
      .fallbackContainerBackground(forLayout: node)
  }
}
