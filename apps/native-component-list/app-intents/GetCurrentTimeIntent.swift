import AppIntents
internal import ExpoAppIntents

/// An intent whose JavaScript task fetches data from a server: `perform()` waits while the task asks
/// timeapi.io for the time, then returns it both as a dialog and as a value later Shortcuts actions can
/// use. The task is defined in `AppIntentBackgroundTasks.ts`.
struct GetCurrentTimeIntent: AppIntent {
  static let title: LocalizedStringResource = "Get Current Time"
  static let openAppWhenRun: Bool = false

  @Parameter(title: "Time Zone", description: "An IANA time zone name, such as Europe/Warsaw.", default: "UTC")
  var timeZone: String

  func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
    let result = try await AppIntentDispatcher.shared.runBackgroundTask(
      name: "app-intents-fetch-current-time",
      params: ["timeZone": .string(timeZone)],
      // The request is the slow part, and Siri should not wait the default 30 seconds for an answer.
      timeout: .seconds(15)
    )
    guard case .object(let fields) = result,
      case .string(let time)? = fields["time"],
      case .string(let dayOfWeek)? = fields["dayOfWeek"]
    else {
      return .result(value: "", dialog: "The time service gave an answer this example does not understand.")
    }
    return .result(value: time, dialog: "It is \(time) on \(dayOfWeek) in \(timeZone).")
  }
}
