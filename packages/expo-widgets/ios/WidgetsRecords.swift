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

struct LiveActivityStartOptions: Record {
  @Field var url: URL?
  @Field var staleDate: Date?
  @Field var relevanceScore: Double = 0
  @Field var schedule: LiveActivitySchedule?
}

struct LiveActivityUpdateOptions: Record {
  @Field var staleDate: Date?
  @Field var relevanceScore: Double = 0
  @Field var contentDate: Date?
}

struct LiveActivitySchedule: Record {
  @Field(.required) var startDate: Date = .distantFuture
  @Field(.required) var alertConfiguration: LiveActivityAlertConfiguration
}

struct LiveActivityAlertConfiguration: Record {
  @Field(.required) var title: String
  @Field(.required) var body: String
  @Field var sound: String?

  func toAlertConfiguration() -> AlertConfiguration {
    AlertConfiguration(
      title: LocalizedStringResource(stringLiteral: title),
      body: LocalizedStringResource(stringLiteral: body),
      sound: sound.map { .named($0) } ?? .default
    )
  }
}

internal enum LiveActivityDismissalPolicy: String, Enumerable {
  case `default`
  case immediate
  case after

  internal func toDismissalPolicy(date: Date?) -> ActivityUIDismissalPolicy {
    return switch self {
    case .default: .default
    case .immediate: .immediate
    case .after: .after(date ?? Date.now)
    }
  }
}
