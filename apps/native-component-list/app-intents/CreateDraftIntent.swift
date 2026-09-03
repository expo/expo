import AppIntents
internal import ExpoAppIntents
import Foundation

/// On devices running the new AI Siri, the `CreateDraftIntent` should be automatically
/// picked up by the system without the need of registering it in AppShortcutProvider phrases.
@available(iOS 18.0, *)
@AppIntent(schema: .mail.createDraft)
struct CreateDraftIntent {
  static let openAppWhenRun: Bool = true

  var body: AttributedString?
  var to: [IntentPerson]
  var subject: String?
  var cc: [IntentPerson]
  var bcc: [IntentPerson]
  var account: MailAccountEntity?
  var attachments: [IntentFile]

  @MainActor
  func perform() async throws -> some IntentResult & ReturnsValue<MailDraftEntity> {
    let draft = MailDraftEntity(
      id: UUID().uuidString,
      to: to,
      cc: cc,
      bcc: bcc,
      subject: subject,
      body: body,
      attachments: attachments,
      account: account ?? MailAccountEntity.default
    )

    await AppIntentDispatcher.shared.dispatch(
      name: "createMailDraft",
      params: [
        "id": .string(draft.id),
        "subject": .string(subject ?? ""),
        "body": .string(draft.bodyText),
        "recipients": .array(draft.recipientAddresses.map(AppIntentValue.string)),
        "attachmentCount": .int(attachments.count),
      ]
    )

    return .result(value: draft)
  }
}
