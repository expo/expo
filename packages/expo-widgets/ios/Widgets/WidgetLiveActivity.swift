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

public struct WidgetLiveActivity: Widget {
  let widgetContext: AppContext = AppContext()

  public init() {}

  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      let nodesProvider = LiveActivityNodesProvider(
        forName: context.state.name,
        props: context.state.props
      )
      // Only apply widgetURL when the activity has one: a hierarchy with more than one
      // widgetURL modifier is undefined behavior, and layouts can set their own through
      // the widgetURL modifier from @expo/ui.
      let banner = LiveActivityBannerView(context: context, nodesProvider: nodesProvider)
      if let url = context.attributes.url.flatMap(URL.init(string:)) {
        banner.widgetURL(url)
      } else {
        banner
      }
    } dynamicIsland: { context in
      let nodesProvider = LiveActivityNodesProvider(
        forName: context.state.name,
        props: context.state.props
      )
      let island = DynamicIsland {
        DynamicIslandExpandedRegion(.center) {
          LiveActivitySectionView(context: context, nodesProvider: nodesProvider, sectionName: "expandedCenter")
        }
        DynamicIslandExpandedRegion(.leading) {
          LiveActivitySectionView(context: context, nodesProvider: nodesProvider, sectionName: "expandedLeading")
        }
        DynamicIslandExpandedRegion(.trailing) {
          LiveActivitySectionView(context: context, nodesProvider: nodesProvider, sectionName: "expandedTrailing")
        }
        DynamicIslandExpandedRegion(.bottom) {
          LiveActivitySectionView(context: context, nodesProvider: nodesProvider, sectionName: "expandedBottom")
        }
      } compactLeading: {
        LiveActivitySectionView(context: context, nodesProvider: nodesProvider, sectionName: "compactLeading")
      } compactTrailing: {
        LiveActivitySectionView(context: context, nodesProvider: nodesProvider, sectionName: "compactTrailing")
      } minimal: {
        LiveActivitySectionView(context: context, nodesProvider: nodesProvider, sectionName: "minimal")
      }
      if let url = context.attributes.url.flatMap(URL.init(string:)) {
        return island.widgetURL(url)
      }
      return island
    }
    .supplementalActivityFamiliesIfAvailable()
  }
}

private struct LiveActivitySectionView: View {
  @Environment(\.self) private var env
  let context: ActivityViewContext<LiveActivityAttributes>
  let nodesProvider: LiveActivityNodesProvider
  let sectionName: String

  var body: some View {
    let nodes = nodesProvider.nodes(
      for: getLiveActivityEnvironment(for: env, in: context)
    )
    if let node = nodes[sectionName] as? [String: Any] {
      WidgetsDynamicView(name: context.activityID, kind: .liveActivity, node: node)
    } else {
      EmptyView()
    }
  }
}

private struct LiveActivityBannerView: View {
  @Environment(\.self) private var env
  var context: ActivityViewContext<LiveActivityAttributes>
  let nodesProvider: LiveActivityNodesProvider

  var body: some View {
    let nodes = nodesProvider.nodes(
      for: getLiveActivityEnvironment(for: env, in: context)
    )
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
