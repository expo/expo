import AppIntents
internal import ExpoAppIntents
import Foundation

/// Opens a draft the system already knows about, for example a Spotlight result. `.mail.openDraft`
/// is the mail domain's own open schema; it requires the iOS 27 SDK.
#if compiler(>=6.4)
@available(iOS 27.0, *)
@AppIntent(schema: .mail.openDraft)
struct OpenMailDraftIntent {
  static var openAppWhenRun: Bool = true

  var target: MailDraftEntity

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(
      name: "openMailDraft",
      params: [
        "id": .string(target.id),
        "subject": .string(target.displaySubject),
        "body": .string(target.bodyText),
      ]
    )

    return .result()
  }
}
#endif
