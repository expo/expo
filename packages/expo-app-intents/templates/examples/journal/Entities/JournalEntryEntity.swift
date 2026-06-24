import AppIntents
import CoreLocation
import Foundation

@available(iOS 18.0, *)
@AppEntity(schema: .journal.entry)
struct JournalEntryEntity {
  static let defaultQuery = JournalEntryQuery()

  var id: String
  var title: String?
  var entryDate: Date?
  var location: CLPlacemark?
  var mediaItems: [IntentFile]
  var message: AttributedString?

  init(
    id: String,
    title: String?,
    entryDate: Date?,
    location: CLPlacemark?,
    mediaItems: [IntentFile],
    message: AttributedString?
  ) {
    self.id = id
    self.title = title
    self.entryDate = entryDate
    self.location = location
    self.mediaItems = mediaItems
    self.message = message
  }

  var displayRepresentation: DisplayRepresentation {
    if let title {
      return DisplayRepresentation(title: "\(title)")
    }
    if let message {
      return DisplayRepresentation(title: "\(String(message.characters))")
    }
    return DisplayRepresentation(title: "Untitled")
  }
}
