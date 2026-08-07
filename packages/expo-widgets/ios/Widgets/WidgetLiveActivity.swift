import SwiftUI
import WidgetKit
import ExpoModulesCore
import ActivityKit

struct LiveActivityAttributes: ActivityAttributes {
  // The deep link URL passed to start(). Stored in the static attributes so it is
  // scoped to this activity and survives content updates, unlike ContentState.
  var url: String?

  public struct ContentState: Codable, Hashable {
    var name: String
    var props: String?
  }

  init(url: String? = nil) {
    self.url = url
  }
}

@available(iOS 16.1, *)
public struct WidgetLiveActivity: Widget {
  @Environment(\.self) var env
  
  let widgetContext: AppContext = AppContext()
  
  var environment: [String: Any] {
    return getLiveActivityEnvironment(environment: env)
  }

  public init() {}

  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      let nodes = getLiveActivityNodes(
        forName: context.state.name,
        props: context.state.props,
        environment: environment
      )
      // Only apply widgetURL when the activity has one: a hierarchy with more than one
      // widgetURL modifier is undefined behavior, and layouts can set their own through
      // the widgetURL modifier from @expo/ui.
      let banner = LiveActivityBannerView(context: context, nodes: nodes)
      if let url = context.attributes.url.flatMap(URL.init(string:)) {
        banner.widgetURL(url)
      } else {
        banner
      }
    } dynamicIsland: { context in
      let nodes = getLiveActivityNodes(
        forName: context.state.name,
        props: context.state.props,
        environment: environment
      )
      let island = DynamicIsland {
        DynamicIslandExpandedRegion(.center) {
          LiveActivitySectionView(context: context, nodes: nodes, sectionName: "expandedCenter")
        }
        DynamicIslandExpandedRegion(.leading) {
          LiveActivitySectionView(context: context, nodes: nodes, sectionName: "expandedLeading")
        }
        DynamicIslandExpandedRegion(.trailing) {
          LiveActivitySectionView(context: context, nodes: nodes, sectionName: "expandedTrailing")
        }
        DynamicIslandExpandedRegion(.bottom) {
          LiveActivitySectionView(context: context, nodes: nodes, sectionName: "expandedBottom")
        }
      } compactLeading: {
        LiveActivitySectionView(context: context, nodes: nodes, sectionName: "compactLeading")
      } compactTrailing: {
        LiveActivitySectionView(context: context, nodes: nodes, sectionName: "compactTrailing")
      } minimal: {
        LiveActivitySectionView(context: context, nodes: nodes, sectionName: "minimal")
      }
      if let url = context.attributes.url.flatMap(URL.init(string:)) {
        return island.widgetURL(url)
      }
      return island
    }
    .supplementalActivityFamiliesIfAvailable()
  }
}

@available(iOS 16.1, *)
private struct LiveActivitySectionView: View {
  let context: ActivityViewContext<LiveActivityAttributes>
  let nodes: [String: Any]
  let sectionName: String

  var body: some View {
    if let node = nodes[sectionName] as? [String: Any] {
      WidgetsDynamicView(name: context.activityID, kind: .liveActivity, node: node)
    } else {
      EmptyView()
    }
  }
}

@available(iOS 16.1, *)
private struct LiveActivityBannerView: View {
  var context: ActivityViewContext<LiveActivityAttributes>
  let nodes: [String: Any]

  var body: some View {
    if #available(iOS 18.0, *) {
      LiveActivityBanner(context: context, nodes: nodes)
    } else if let node = nodes["banner"] as? [String: Any] {
      WidgetsDynamicView(name: context.activityID, kind: .liveActivity, node: node)
    } else {
      EmptyView()
    }
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
