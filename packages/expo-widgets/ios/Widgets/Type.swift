import WidgetKit

public enum WidgetsKind {
  case widget
  case liveActivity
}

func getKeyFor(widgetFamily: WidgetFamily) -> String {
  switch widgetFamily {
  case .systemSmall: return "systemSmall"
  case .systemMedium: return "systemMedium"
  case .systemLarge: return "systemLarge"
  case .systemExtraLarge: return "systemExtraLarge"
  case .accessoryCircular: return "accessoryCircular"
  case .accessoryRectangular: return "accessoryRectangular"
  case .accessoryInline: return "accessoryInline"
  default: return "systemSmall"
  }
}
