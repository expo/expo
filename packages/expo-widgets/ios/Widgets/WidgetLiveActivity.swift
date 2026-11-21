import SwiftUI
import WidgetKit
import ExpoModulesCore
import ActivityKit

struct LiveActivityAttributes: ActivityAttributes {
  // The deep link URL passed to start(). Stored in the static attributes so it is
  // scoped to this activity and survives content updates, unlike ContentState.
  var url: String?
  // A JSON string set only by push-to-start `attributes`. Content-state props override it key by key.
  var props: String?

  public struct ContentState: Codable, Hashable {
    var name: String
    var props: String?
  }

  init(url: String? = nil) {
    self.url = url
  }

  func mergedProps(_ stateProps: String?) -> String? {
    guard let props, let base = Self.jsonObject(props) else { return stateProps }
    let merged = base.merging(stateProps.flatMap(Self.jsonObject) ?? [:]) { _, state in state }
    guard let data = try? JSONSerialization.data(withJSONObject: merged) else { return stateProps }
    return String(decoding: data, as: UTF8.self)
  }

  static func jsonObject(_ json: String) -> [String: Any]? {
    (try? JSONSerialization.jsonObject(with: Data(json.utf8))) as? [String: Any]
  }
}

public struct WidgetLiveActivity: Widget {
  @Environment(\.self) var env
  
  let widgetContext: AppContext = AppContext()

  public init() {}

  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      let nodes = getLiveActivityNodes(
        forName: context.state.name,
        props: context.attributes.mergedProps(context.state.props),
        environment: getLiveActivityEnvironment(for: env, in: context)
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
        props: context.attributes.mergedProps(context.state.props),
        environment: getLiveActivityEnvironment(for: env, in: context)
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
