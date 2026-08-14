import ExpoModulesCore
import ActivityKit

struct WidgetsJSTimelineEntry: Record {
  @Field var timestamp: Int
  @Field var props: [String: Any] = [:]
}

struct WidgetConfigurationOptionRecord: Record {
  @Field var name: String
  @Field var value: String
  @Field var subtitle: String?

  func toDictionary() -> [String: Any] {
    var result: [String: Any] = [
      "name": name,
      "value": value
    ]
    if let subtitle {
      result["subtitle"] = subtitle
    }
    return result
  }
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
