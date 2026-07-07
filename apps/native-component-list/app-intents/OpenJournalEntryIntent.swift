import AppIntents
import Foundation
internal import ExpoAppIntents

@available(iOS 27.0, *)
@AppIntent(schema: .system.open)
struct OpenJournalEntryIntent {
  static let title: LocalizedStringResource = "Open Journal Entry"
  static var openAppWhenRun: Bool = true

  @Parameter(title: "Journal Entry")
  var target: JournalEntity

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(
      name: "openJournalEntry",
      params: [
        "id": .string(target.id),
        "title": .string(target.displayTitle),
        "message": .string(target.messageText)
      ]
    )

    return .result()
  }
}
