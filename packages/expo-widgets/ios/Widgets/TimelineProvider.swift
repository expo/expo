import WidgetKit

public struct WidgetsTimelineProvider: TimelineProvider {
  public func placeholder(in context: Context) -> WidgetsTimelineEntry {
    WidgetsTimelineEntry(date: Date(), source: name, node: nil)
  }

  public func getSnapshot(
    in context: Context, completion: @escaping @Sendable (WidgetsTimelineEntry) -> Void
  ) {
    let groupIdentifier =
      Bundle.main.object(forInfoDictionaryKey: "ExpoWidgetsAppGroupIdentifier") as? String
    guard let groupIdentifier else {
      completion(WidgetsTimelineEntry(date: Date(), source: name, node: nil))
      return
    }

    let entries = parseTimeline(identifier: groupIdentifier, name: name, family: context.family)
    completion(entries.first ?? WidgetsTimelineEntry(date: Date(), source: name, node: nil))
  }

  public func getTimeline(
    in context: Context,
    completion: @escaping @Sendable (Timeline<WidgetsTimelineEntry>) -> Void
  ) {
    let groupIdentifier =
      Bundle.main.object(forInfoDictionaryKey: "ExpoWidgetsAppGroupIdentifier") as? String
    guard let groupIdentifier else {
      fatalError("Could not get the app group identifier from Info.plist")
    }

    let entries = parseTimeline(identifier: groupIdentifier, name: name, family: context.family)

    let timeline = Timeline<WidgetsTimelineEntry>(entries: entries, policy: .atEnd)
    completion(timeline)
  }

  public typealias Entry = WidgetsTimelineEntry

  let name: String

  public init(name: String) {
    self.name = name
  }
}
