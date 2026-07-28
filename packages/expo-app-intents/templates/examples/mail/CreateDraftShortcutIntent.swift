import AppIntents
import Foundation
internal import ExpoAppIntents

/**
  This AppIntent keeps the shortcut provider available on devices running iOS versions
  older than 18. The schema-based CreateDraftIntent requires iOS 18, so an
  AppShortcutsProvider that references it directly must also be marked iOS 18-only
  (adding it conditionally is not supported).
  If you bump the AppShortcutProvider availability to iOS 18, you can use CreateDraftIntent
  directly in the provider and remove this helper.
 */
struct CreateDraftShortcutIntent: AppIntent {
  static let title: LocalizedStringResource = "Create Draft"
  static var openAppWhenRun: Bool = true

  @Parameter(title: "Body")
  var body: String

  @Parameter(title: "Subject")
  var subject: String?

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    await AppIntentDispatcher.shared.dispatch(
      name: "createMailDraft",
      params: [
        "id": .string(UUID().uuidString),
        "subject": .string(subject ?? ""),
        "body": .string(body)
      ]
    )

    return .result(dialog: "Created a draft.")
  }
}
