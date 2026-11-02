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

  public var body: some View {
    if let layout = WidgetsLayoutRegistry.layout(for: entry.name) {
      let node = evaluateLayout(layout: layout, props: entry.props, environment: widgetEnvironment)
      WidgetsDynamicView(name: entry.name, kind: .widget, node: node, entryIndex: entry.entryIndex, environmentString: widgetEnvironmentString)
    } else {
      // No layout is stored until the app has run once after install or
      // update. That's an expected state, not an error, so show a neutral,
      // system-themed empty widget instead of the red box.
      EmptyWidgetView()
    }
  }
}

// Also used by the generated configurable widgets (withWidgetSourceFiles).
public struct EmptyWidgetView: View {
  public init() {}

  public var body: some View {
    if #available(iOS 17.0, *) {
      Color.clear.containerBackground(.fill.tertiary, for: .widget)
    } else {
      Color.clear
    }
  }
}
