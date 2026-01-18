import SwiftUI
import ExpoModulesCore
import WidgetKit

public struct WidgetsEntryView : View {
  @Environment(\.widgetFamily) var widgetFamily
  var entry: WidgetsTimelineProvider.Entry
  
  public init(entry: WidgetsTimelineProvider.Entry) {
    self.entry = entry
  }
  
  public var body: some View {
    if let node = entry.node {
      if #available(iOS 17.0, *) {
        WidgetsDynamicView(source: entry.source, kind: .widget, node: node)
          .containerBackground(.clear, for: .widget)
      } else {
        WidgetsDynamicView(source: entry.source, kind: .widget, node: node)
      }
    } else {
      EmptyView()
    }
  }
}
