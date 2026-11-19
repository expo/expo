import AppIntents
internal import ExpoAppIntents

/// An intent that JavaScript answers without opening the app: `perform()` runs a TaskManager task and
/// waits for the message it returns. The task is defined in `AppIntentBackgroundTasks.ts`.
struct IncreaseCounterInBackgroundIntent: AppIntent {
  static let title: LocalizedStringResource = "Increase Counter in Background"
  static let openAppWhenRun: Bool = false

  func perform() async throws -> some IntentResult & ProvidesDialog {
    let result = try await AppIntentDispatcher.shared.runBackgroundTask(
      name: "app-intents-increase-counter-in-background"
    )
    guard case .string(let message) = result else {
      return .result(dialog: "Counter increased.")
    }
    return .result(dialog: "\(message)")
  }
}
