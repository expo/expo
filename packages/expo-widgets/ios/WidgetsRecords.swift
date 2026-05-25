import ActivityKit
import ExpoModulesCore
import Foundation

struct WidgetsJSTimelineEntry: Record {
  @Field var timestamp: Int
  @Field var props: [String: Any] = [:]
}

internal struct WidgetImageResizeOptions: Record {
  @Field var maxWidth: Double?
  @Field var maxHeight: Double?
}

internal struct WidgetImagePreloadOptions: Record {
  @Field var key: String
  @Field var url: String
  @Field var method: String?
  @Field var headers: [String: String]?
  @Field var resize: WidgetImageResizeOptions?
}

internal struct WidgetImageClearOptions: Record {
  @Field var keys: [String]?
}

internal enum LiveActivityDismissalPolicy: String, Enumerable {
  case `default`
  case immediate
  case after

  @available(iOS 16.1, *)
  internal func toDismissalPolicy(date: Date?) -> ActivityUIDismissalPolicy {
    return switch self {
    case .default: .default
    case .immediate: .immediate
    case .after: .after(date ?? Date.now)
    }
  }
}
