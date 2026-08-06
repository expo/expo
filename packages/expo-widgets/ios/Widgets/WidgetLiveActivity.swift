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

  var environmentString: String? {
    guard let data = try? JSONSerialization.data(withJSONObject: environment) else {
      return nil
    }
    return String(data: data, encoding: .utf8)
  }

  public init() {}

  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivityAttributes.self) { context in
      let nodes = getLiveActivityNodes(
        forName: context.state.name,
        activityID: context.activityID,
        props: context.state.props,
        environment: environment
      )
      LiveActivityBannerView(context: context, nodes: nodes, environmentString: environmentString)
    } dynamicIsland: { context in
      let nodes = getLiveActivityNodes(
        forName: context.state.name,
        activityID: context.activityID,
        props: context.state.props,
        environment: environment
      )
      return DynamicIsland {
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
  let environmentString: String?

  var body: some View {
    if let node = nodes[sectionName] as? [String: Any] {
      WidgetsDynamicView(name: context.activityID, kind: .liveActivity, node: node, entryIndex: nil, environmentString: environmentString)
    } else {
      EmptyView()
    }
  }
}

@available(iOS 16.1, *)
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
