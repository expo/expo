import AppIntents
import Foundation
internal import ExpoAppIntents

/**
 Opens a draft the system already knows about, for example a Spotlight result. `.mail.openDraft`
 is the mail domain's own open schema; it requires iOS 27, the same floor as the generic
 `.system.open`.
 */
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
        "body": .string(target.bodyText)
      ]
    )

    return .result()
  }
}
