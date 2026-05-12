import WidgetKit

public struct WidgetsTimelineEntry: WidgetKit.TimelineEntry {
  public let date: Date
  public let name: String
  public let props: [String: Any]?
  public let entryIndex: Int?
}
