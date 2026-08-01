import AppIntents
internal import ExpoAppIntents

/**
 The simplest shape of an App Intent: open the app and hand the invocation to JavaScript.
 */
struct IncreaseCounterIntent: AppIntent {
  static let title: LocalizedStringResource = "Increase Counter"
  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    await AppIntentDispatcher.shared.dispatch(name: "increaseCounter")
    return .result(dialog: "Counter increased.")
  }
}
