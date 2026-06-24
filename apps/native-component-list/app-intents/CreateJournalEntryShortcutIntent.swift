import AppIntents
import Foundation
internal import ExpoAppIntents

/**
  This AppIntent keeps the shortcut provider available on devices running iOS versions
  older than 18. The schema-based CreateJournalEntryIntent requires iOS 18, so an
  AppShortcutsProvider that references it directly must also be marked iOS 18-only
  (adding it conditionally is not supported).
  If you bump the AppShortcutProvider availability to iOS 18, you can use CreateJournalEntryIntent
  directly in the provider and remove this helper.
 */
struct CreateJournalEntryShortcutIntent: AppIntent {
  static let title: LocalizedStringResource = "Create Journal Entry"
  static var openAppWhenRun: Bool = true

  @Parameter(title: "Message")
  var message: String

  @Parameter(title: "Title")
  var title: String?

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    await AppIntentDispatcher.shared.dispatch(
      name: "createJournalEntry",
      params: [
        "id": .string(UUID().uuidString),
        "title": .string(title ?? ""),
        "message": .string(message)
      ]
    )

    return .result(dialog: "Created a journal entry.")
  }
}
