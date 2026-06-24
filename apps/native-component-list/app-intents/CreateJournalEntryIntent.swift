import AppIntents
import CoreLocation
import Foundation
internal import ExpoAppIntents

/**
  On devices running the new iOS 27+ AI Siri, the `CreateJournalEntryIntent` should be automatically
  picked up by the system without the need of registering it in AppShortcutProvider phrases.
 */
@available(iOS 18.0, *)
@AppIntent(schema: .journal.createEntry)
struct CreateJournalEntryIntent {
  static var openAppWhenRun: Bool = true

  var title: String?
  var message: AttributedString
  var entryDate: Date?
  var location: CLPlacemark?
  var mediaItems: [IntentFile]

  @MainActor
  func perform() async throws -> some IntentResult & ReturnsValue<JournalEntryEntity> {
    let messageText = String(message.characters)
    let entry = JournalEntryEntity(
      id: UUID().uuidString,
      title: title,
      entryDate: entryDate ?? Date(),
      location: location,
      mediaItems: mediaItems,
      message: message
    )

    await AppIntentDispatcher.shared.dispatch(
      name: "createJournalEntry",
      params: [
        "id": .string(entry.id),
        "title": .string(title ?? ""),
        "entryDate": .double(entry.entryDate?.timeIntervalSince1970 ?? Date().timeIntervalSince1970),
        "location": .string(location?.name ?? ""),
        "mediaItemCount": .int(mediaItems.count),
        "message": .string(messageText)
      ]
    )

    return .result(value: entry)
  }
}
