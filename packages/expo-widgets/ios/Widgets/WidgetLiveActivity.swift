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
  let widgetContext: AppContext = AppContext()

  public init() {}

  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      // Only apply widgetURL when the activity has one: a hierarchy with more than one
      // widgetURL modifier is undefined behavior, and layouts can set their own through
      // the widgetURL modifier from @expo/ui.
      let banner = LiveActivityBannerView(context: context)
      if let url = context.attributes.url.flatMap(URL.init(string:)) {
        banner.widgetURL(url)
      } else {
        banner
      }
    } dynamicIsland: { context in
      let island = DynamicIsland {
        DynamicIslandExpandedRegion(.center) {
          LiveActivitySectionView(context: context, sectionName: "expandedCenter")
        }
        DynamicIslandExpandedRegion(.leading) {
          LiveActivitySectionView(context: context, sectionName: "expandedLeading")
        }
        DynamicIslandExpandedRegion(.trailing) {
          LiveActivitySectionView(context: context, sectionName: "expandedTrailing")
        }
        DynamicIslandExpandedRegion(.bottom) {
          LiveActivitySectionView(context: context, sectionName: "expandedBottom")
        }
      } compactLeading: {
        LiveActivitySectionView(context: context, sectionName: "compactLeading")
      } compactTrailing: {
        LiveActivitySectionView(context: context, sectionName: "compactTrailing")
      } minimal: {
        LiveActivitySectionView(context: context, sectionName: "minimal")
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
  // Read here rather than on the Widget: @Environment only resolves once it is installed in a
  // view hierarchy, and returns default values everywhere else.
  @Environment(\.self) private var env
  let context: ActivityViewContext<LiveActivityAttributes>
  let sectionName: String

  var body: some View {
    let nodes = getLiveActivityNodes(
      forName: context.state.name,
      props: context.state.props,
      environment: getLiveActivityEnvironment(for: env, in: context)
    )
    if let node = nodes[sectionName] as? [String: Any] {
      WidgetsDynamicView(name: context.activityID, kind: .liveActivity, node: node)
    } else {
      EmptyView()
    }
  }
}

@available(iOS 16.1, *)
private struct LiveActivityBannerView: View {
  @Environment(\.self) private var env
  var context: ActivityViewContext<LiveActivityAttributes>

  var body: some View {
    let nodes = getLiveActivityNodes(
      forName: context.state.name,
      props: context.state.props,
      environment: getLiveActivityEnvironment(for: env, in: context)
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
