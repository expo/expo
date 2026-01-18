import SwiftUI
import WidgetKit
import ExpoModulesCore
import ActivityKit

struct LiveActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var name: String
  }
}

@available(iOS 16.1, *)
public struct WidgetLiveActivity: Widget {
  let widgetContext: AppContext = AppContext()
  
  public init() {}
  
  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      let nodes = getLiveActivityNodes(forName: context.state.name)
      return liveActivitySection("banner", source: context.activityID, nodes: nodes)
    } dynamicIsland: { context in
      let nodes = getLiveActivityNodes(forName: context.state.name)
      return DynamicIsland {
        expandedContent(source: context.activityID, nodes: nodes)
      } compactLeading: {
        liveActivitySection("compactLeading", source: context.activityID, nodes: nodes)
      } compactTrailing: {
        liveActivitySection("compactTrailing", source: context.activityID, nodes: nodes)
      } minimal: {
        liveActivitySection("minimal", source: context.activityID, nodes: nodes)
      }
      .widgetURL(getLiveActivityUrl(forName: context.state.name))
    }
  }
  
  @DynamicIslandExpandedContentBuilder
  private func expandedContent(source: String, nodes: [String: Any]?) -> DynamicIslandExpandedContent<some View> {
    DynamicIslandExpandedRegion(.center) {
      liveActivitySection("expandedCenter", source: source, nodes: nodes)
    }
    DynamicIslandExpandedRegion(.leading) {
      liveActivitySection("expandedLeading", source: source, nodes: nodes)
    }
    DynamicIslandExpandedRegion(.trailing) {
      liveActivitySection("expandedTrailing", source: source, nodes: nodes)
    }
    DynamicIslandExpandedRegion(.bottom) {
      liveActivitySection("expandedBottom", source: source, nodes: nodes)
    }
  }
  
  private func liveActivitySection(_ sectionName: String, source: String, nodes: [String: Any]?) -> some View {
    guard let node = nodes?[sectionName] as? [String: Any] else {
      return AnyView(EmptyView())
    }
    return AnyView(WidgetsDynamicView(source: source, kind: .liveActivity, node: node))
  }
}

