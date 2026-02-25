import SwiftUI
import WidgetKit

@available(iOS 18.0, *)
struct LiveActivityBanner: View {
  @Environment(\.activityFamily) var activityFamily
  var context: ActivityViewContext<LiveActivityAttributes>
  var nodes: [String: Any]?

  var body: some View {
    if activityFamily == .small, let node = nodes?["bannerSmall"] as? [String: Any] {
      WidgetsDynamicView(source: context.activityID, kind: .liveActivity, node: node)
    } else if let node = nodes?["banner"] as? [String: Any] {
      WidgetsDynamicView(source: context.activityID, kind: .liveActivity, node: node)
    } else {
      EmptyView()
    }
  }
}
