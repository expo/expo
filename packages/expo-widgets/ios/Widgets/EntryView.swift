import SwiftUI
import ExpoModulesCore
import WidgetKit

public struct WidgetsEntryView: View {
  @Environment(\.widgetFamily) var widgetFamily
  var entry: WidgetsTimelineProvider.Entry

  public init(entry: WidgetsTimelineProvider.Entry) {
    self.entry = entry
  }

  public var body: some View {
    if let node = entry.node {
      if #available(iOS 17.0, *) {
        WidgetsDynamicView(source: entry.source, kind: .widget, node: node, entryIndex: entry.entryIndex)
          .containerBackground(Self.extractContainerBackground(from: node), for: .widget)
      } else {
        WidgetsDynamicView(source: entry.source, kind: .widget, node: node, entryIndex: entry.entryIndex)
      }
    } else {
      EmptyView()
    }
  }

  /// Extracts the background color from the root node's modifiers to propagate
  /// it as the containerBackground. This ensures the system-applied padding area
  /// matches the content background, eliminating visible borders on iOS 17+.
  ///
  /// Node structure: node["props"]["modifiers"][N]["$type"] == "background"
  ///                 node["props"]["modifiers"][N]["color"] == "#RRGGBB"
  private static func extractContainerBackground(from node: [String: Any]) -> Color {
    guard
      let props = node["props"] as? [String: Any],
      let modifiers = props["modifiers"] as? [[String: Any]],
      let bgModifier = modifiers.first(where: { ($0["$type"] as? String) == "background" }),
      let hex = bgModifier["color"] as? String
    else {
      return Color.black
    }
    return Color(hex: hex) ?? Color.black
  }
}

// MARK: - Hex color parsing

extension Color {
  init?(hex: String) {
    var hexString = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if hexString.hasPrefix("#") {
      hexString.removeFirst()
    }
    guard hexString.count == 6, let rgb = UInt64(hexString, radix: 16) else {
      return nil
    }
    self.init(
      red: Double((rgb >> 16) & 0xFF) / 255.0,
      green: Double((rgb >> 8) & 0xFF) / 255.0,
      blue: Double(rgb & 0xFF) / 255.0
    )
  }
}
