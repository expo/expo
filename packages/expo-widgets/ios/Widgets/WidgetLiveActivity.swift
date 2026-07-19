import SwiftUI
import WidgetKit
import ExpoModulesCore
import ActivityKit

struct LiveActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var name: String
    var props: String?
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
      LiveActivityBannerView(context: context, nodes: nodes)
    } dynamicIsland: { context in
      let nodes = getLiveActivityNodes(
        forName: context.state.name,
        props: context.state.props,
        environment: environment
      )
      return DynamicIsland {
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
      .widgetURL(getLiveActivityUrl(forName: context.state.name))
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
