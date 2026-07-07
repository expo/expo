import AppIntents
import Foundation
import GeoToolbox
internal import ExpoAppIntents

/**
  On devices running the new iOS 27+ AI Siri, the `CreateJournalEntryIntent` should be automatically
  picked up by the system without the need of registering it in AppShortcutProvider phrases.
 */

@available(iOS 27.0, *)
@AppIntent(schema: .journal.createEntry)
struct CreateJournalEntryIntent {
  static var openAppWhenRun: Bool = true

  var message: AttributedString
  var title: String?
  var location: GeoToolbox.PlaceDescriptor?
  var mediaItems: [IntentFile]
  var entryDate: Date?

  @MainActor
  func perform() async throws -> some IntentResult & ReturnsValue<JournalEntity> {
    let messageText = String(message.characters)
    let entry = JournalEntity(
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
        "location": .string(entry.locationDisplayName ?? ""),
        "mediaItemCount": .int(mediaItems.count),
        "message": .string(messageText)
      ]
    )

    return .result(value: entry)
  }
}
