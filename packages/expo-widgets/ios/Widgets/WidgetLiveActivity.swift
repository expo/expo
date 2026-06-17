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
  let widgetContext: AppContext = AppContext()

  public init() {}

  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      LiveActivityBannerView(context: context)
    } dynamicIsland: { context in
      DynamicIsland {
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
      .widgetURL(getLiveActivityUrl(forName: context.state.name))
    }
    .supplementalActivityFamiliesIfAvailable()
  }
}

@available(iOS 16.1, *)
private struct LiveActivitySectionView: View {
  @Environment(\.self) var env
  let context: ActivityViewContext<LiveActivityAttributes>
  let sectionName: String

  var body: some View {
    let nodes = getLiveActivityNodes(
      forName: context.state.name,
      props: context.state.props,
      environment: getLiveActivityEnvironment(environment: env)
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
  @Environment(\.self) var env
  var context: ActivityViewContext<LiveActivityAttributes>

  var body: some View {
    let nodes = getLiveActivityNodes(
      forName: context.state.name,
      props: context.state.props,
      environment: getLiveActivityEnvironment(environment: env)
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
