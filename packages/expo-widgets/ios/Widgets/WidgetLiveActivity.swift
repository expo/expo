import SwiftUI
import WidgetKit
import ExpoModulesCore
import ActivityKit

struct LiveActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var name: String
    var props: String
  }
}

@available(iOS 16.1, *)
public struct WidgetLiveActivity: Widget {
  let widgetContext: AppContext = AppContext()

  public init() {}

  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      let nodes = getLiveActivityNodes(forName: context.state.name, props: context.state.props)
      if #available(iOS 18.0, *) {
        LiveActivityBanner(context: context, nodes: nodes)
      } else {
        liveActivitySection("banner", source: context.activityID, nodes: nodes)
      }
    } dynamicIsland: { context in
      let nodes = getLiveActivityNodes(forName: context.state.name, props: context.state.props)
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
    .supplementalActivityFamiliesIfAvailable()
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

extension WidgetConfiguration {
  func supplementalActivityFamiliesIfAvailable() -> some WidgetConfiguration {
    if #available(iOS 18.0, iOSApplicationExtension 18.0, *) {
      return self.supplementalActivityFamilies([.small, .medium])
    } else {
      return self
    }
  }
}
