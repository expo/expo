import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct BareExpoCounterWidget: Widget {
  let name: String = "BareExpoCounterWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Bare Expo Counter")
    .description("Tests snapshot updates and interactive widget buttons")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}