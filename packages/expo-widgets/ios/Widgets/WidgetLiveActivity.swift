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
  @Environment(\.self) var env
  
  let widgetContext: AppContext = AppContext()

  public init() {}

  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      let environment = getLiveActivityEnvironment(for: env, in: context)
      let environmentString = serializeEnvironment(environment)
      let nodes = getLiveActivityNodes(
        forName: context.state.name,
        activityID: context.activityID,
        props: context.state.props,
        environment: environment
      )
      // Only apply widgetURL when the activity has one: a hierarchy with more than one
      // widgetURL modifier is undefined behavior, and layouts can set their own through
      // the widgetURL modifier from @expo/ui.
      let banner = LiveActivityBannerView(context: context, nodes: nodes, environmentString: environmentString)
      if let url = context.attributes.url.flatMap(URL.init(string:)) {
        banner.widgetURL(url)
      } else {
        banner
      }
    } dynamicIsland: { context in
      let environment = getLiveActivityEnvironment(for: env, in: context)
      let environmentString = serializeEnvironment(environment)
      let nodes = getLiveActivityNodes(
        forName: context.state.name,
        activityID: context.activityID,
        props: context.state.props,
        environment: environment
      )
      let island = DynamicIsland {
        DynamicIslandExpandedRegion(.center) {
          LiveActivitySectionView(context: context, nodes: nodes, sectionName: "expandedCenter", environmentString: environmentString)
        }
        DynamicIslandExpandedRegion(.leading) {
          LiveActivitySectionView(context: context, nodes: nodes, sectionName: "expandedLeading", environmentString: environmentString)
        }
        DynamicIslandExpandedRegion(.trailing) {
          LiveActivitySectionView(context: context, nodes: nodes, sectionName: "expandedTrailing", environmentString: environmentString)
        }
        DynamicIslandExpandedRegion(.bottom) {
          LiveActivitySectionView(context: context, nodes: nodes, sectionName: "expandedBottom", environmentString: environmentString)
        }
      } compactLeading: {
        LiveActivitySectionView(context: context, nodes: nodes, sectionName: "compactLeading", environmentString: environmentString)
      } compactTrailing: {
        LiveActivitySectionView(context: context, nodes: nodes, sectionName: "compactTrailing", environmentString: environmentString)
      } minimal: {
        LiveActivitySectionView(context: context, nodes: nodes, sectionName: "minimal", environmentString: environmentString)
      }
      if let url = context.attributes.url.flatMap(URL.init(string:)) {
        return island.widgetURL(url)
      }
      return island
    }
    .supplementalActivityFamiliesIfAvailable()
  }
}

private func serializeEnvironment(_ environment: [String: Any]) -> String? {
  guard let data = try? JSONSerialization.data(withJSONObject: environment) else {
    return nil
  }
  return String(data: data, encoding: .utf8)
}

private struct LiveActivitySectionView: View {
  let context: ActivityViewContext<LiveActivityAttributes>
  let nodes: [String: Any]
  let sectionName: String
  let environmentString: String?

  var body: some View {
    if let node = nodes[sectionName] as? [String: Any] {
      WidgetsDynamicView(name: context.activityID, kind: .liveActivity, node: node, entryIndex: nil, environmentString: environmentString)
    } else {
      EmptyView()
    }
  }
}

private struct LiveActivityBannerView: View {
  var context: ActivityViewContext<LiveActivityAttributes>
  let nodes: [String: Any]
  let environmentString: String?

  var body: some View {
    if #available(iOS 18.0, *) {
      LiveActivityBanner(context: context, nodes: nodes, environmentString: environmentString)
    } else if let node = nodes["banner"] as? [String: Any] {
      WidgetsDynamicView(name: context.activityID, kind: .liveActivity, node: node, entryIndex: nil, environmentString: environmentString)
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
