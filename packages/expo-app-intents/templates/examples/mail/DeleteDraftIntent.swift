import AppIntents
import Foundation
internal import ExpoAppIntents

/**
  Deletes one or more drafts. The `.mail.deleteDraft` schema supplies its own confirmation
  dialog ("Are you sure you would like to delete ... ?"), so this intent does not ask again,
  and it does not open the app: the invocation is queued and JavaScript applies it the next
  time it runs.

  The schema requires an authentication policy at least as restrictive as
  `.requiresLocalDeviceAuthentication`, because deleting content is destructive.
 */
@available(iOS 18.0, *)
@AppIntent(schema: .mail.deleteDraft)
struct DeleteDraftIntent {
  static let authenticationPolicy: IntentAuthenticationPolicy = .requiresLocalDeviceAuthentication

  var entities: [MailDraftEntity]

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(
      name: "deleteMailDrafts",
      params: [
        "ids": .array(entities.map { .string($0.id) })
      ]
    )

    return .result()
  }
}
