import AppIntents
internal import ExpoAppIntents
internal import ExpoModulesCore
import Foundation

/// Opens a draft the system already knows about, for example a Spotlight result. `.mail.openDraft`
/// is the mail domain's own open schema; it requires the iOS 27 SDK.
#if compiler(>=6.4)
@available(iOS 27.0, macOS 27.0, *)
@AppIntent(schema: .mail.openDraft)
struct OpenMailDraftIntent {
  static var openAppWhenRun: Bool = true

  var target: MailDraftEntity

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(
      name: "openMailDraft",
      params: ["id": .string(target.id), "subject": .string(target.displaySubject), "body": .string(target.bodyText)]
    )

    return .result()
  }
}

/// Lets the mail screen donate opening a draft, so the system can suggest opening it again. Because
/// `target` is a `MailDraftEntity`, deleting donations by `{ entity: 'mailDraft', id }` removes these
/// donations when the draft is gone.
@available(iOS 27.0, macOS 27.0, *)
extension OpenMailDraftIntent: DonatableAppIntent {
  struct DonationParams: Record {
    @Field(.required) var draftId: String = ""
  }

  struct UnknownDraft: Error, CustomStringConvertible {
    let draftId: String

    var description: String {
      "no draft '\(draftId)' is in the published 'mailDraft' catalog; publish it with setEntityCatalogAsync() first"
    }
  }

  /// Only the id comes from JavaScript. The draft is read from the published catalog, the same way
  /// Siri resolves it.
  init(donationParams: DonationParams) async throws {
    self.init()
    guard let draft = try await MailDraftEntityQuery().entities(for: [donationParams.draftId]).first else {
      throw UnknownDraft(draftId: donationParams.draftId)
    }
    target = draft
  }
}
#endif
