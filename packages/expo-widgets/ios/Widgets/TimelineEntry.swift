import WidgetKit

public struct WidgetsTimelineEntry: WidgetKit.TimelineEntry {
  public let date: Date
  public let source: String
  public let node: [String: Any]?
  public let entryIndex: Int?
}
