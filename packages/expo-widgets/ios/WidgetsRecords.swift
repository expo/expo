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

struct LiveActivityAlertConfigurationRecord: Record {
  @Field var title: String = ""
  @Field var body: String = ""
  @Field var sound: String?

  func toAlertConfiguration() -> AlertConfiguration {
    AlertConfiguration(
      title: LocalizedStringResource(stringLiteral: title),
      body: LocalizedStringResource(stringLiteral: body),
      sound: sound.map { .named($0) } ?? .default
    )
  }
}

struct LiveActivityScheduleRecord: Record {
  @Field var startDate: Date = Date()
  @Field var alertConfiguration: LiveActivityAlertConfigurationRecord = LiveActivityAlertConfigurationRecord()
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
