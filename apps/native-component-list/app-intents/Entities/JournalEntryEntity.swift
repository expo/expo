import AppIntents
@preconcurrency import CoreSpotlight
import Foundation
import GeoToolbox
internal import ExpoAppIntents

@available(iOS 26.0, *)
@AppEntity(schema: .journal.entry)
struct JournalEntity: IndexedEntity {
  static let defaultQuery = JournalEntityQuery()

  var id: String
  var title: String?
  var entryDate: Date?
  var location: GeoToolbox.PlaceDescriptor?
  var mediaItems: [IntentFile]
  var message: AttributedString?

  init(
    id: String,
    title: String?,
    entryDate: Date?,
    location: GeoToolbox.PlaceDescriptor?,
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

  init(record: AppIntentEntityRecord) {
    let messageText = record.metadata["message"] ?? record.subtitle ?? ""
    let createdAt = record.metadata["createdAt"].flatMap(Double.init)

    self.id = record.id
    self.title = record.title
    self.entryDate = createdAt.map { Date(timeIntervalSince1970: $0 / 1000) }
    self.location = nil
    self.mediaItems = []
    self.message = messageText.isEmpty ? nil : AttributedString(messageText)
  }

  var displayRepresentation: DisplayRepresentation {
    if let displaySubtitle {
      return DisplayRepresentation(
        title: "\(displayTitle)",
        subtitle: "\(displaySubtitle)",
        image: DisplayRepresentation.Image(systemName: "book.pages", isTemplate: true)
      )
    }

    return DisplayRepresentation(
      title: "\(displayTitle)",
      image: DisplayRepresentation.Image(systemName: "book.pages", isTemplate: true)
    )
  }

  var attributeSet: CSSearchableItemAttributeSet {
    let attributes = defaultAttributeSet
    attributes.displayName = displayTitle
    attributes.title = displayTitle
    attributes.contentDescription = messagePreview
    attributes.textContent = messageText
    attributes.contentCreationDate = entryDate
    attributes.contentModificationDate = entryDate
    attributes.userCreated = NSNumber(value: true)
    attributes.domainIdentifier = JournalEntityIndexer.domainIdentifier
    attributes.keywords = ["journal", "journal entry", displayTitle]
    return attributes
  }

  var displayTitle: String {
    if let title = title?.trimmingCharacters(in: .whitespacesAndNewlines), !title.isEmpty {
      return title
    }

    if let firstLine = messageText.components(separatedBy: .newlines)
      .map({ $0.trimmingCharacters(in: .whitespacesAndNewlines) })
      .first(where: { !$0.isEmpty }) {
      return firstLine.truncated(to: 60)
    }

    return "Untitled journal entry"
  }

  var displaySubtitle: String? {
    let components = [
      formattedEntryDate,
      locationDisplayName,
      hasExplicitTitle ? messagePreview : nil,
      mediaItems.isEmpty ? nil : "\(mediaItems.count) attachment\(mediaItems.count == 1 ? "" : "s")",
    ].compactMap { value -> String? in
      guard let value, !value.isEmpty else {
        return nil
      }
      return value
    }

    return components.isEmpty ? nil : components.joined(separator: " · ")
  }

  var messageText: String {
    guard let message else {
      return ""
    }
    return String(message.characters)
  }

  var noteFilename: String {
    let invalidCharacters = CharacterSet(charactersIn: "/\\?%*|\"<>:")
      .union(.newlines)
      .union(.controlCharacters)
    let filename = displayTitle
      .components(separatedBy: invalidCharacters)
      .joined(separator: " ")
      .trimmingCharacters(in: .whitespacesAndNewlines)

    return "\(filename.isEmpty ? "Untitled journal entry" : filename).txt"
  }

  private var hasExplicitTitle: Bool {
    guard let title else {
      return false
    }
    return !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
  }

  private var messagePreview: String? {
    let preview = messageText.trimmingCharacters(in: .whitespacesAndNewlines).truncated(to: 80)
    return preview.isEmpty ? nil : preview
  }

  var locationDisplayName: String? {
    let value = location?.commonName ?? location?.address
    return value?.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  var locationLatitude: Double? {
    return location?.coordinate?.latitude
  }

  var locationLongitude: Double? {
    return location?.coordinate?.longitude
  }

  private var formattedEntryDate: String? {
    guard let entryDate else {
      return nil
    }
    return entryDate.formatted(date: .abbreviated, time: .shortened)
  }
}

private extension String {
  func truncated(to maxLength: Int) -> String {
    guard count > maxLength else {
      return self
    }
    return String(prefix(maxLength)).trimmingCharacters(in: .whitespacesAndNewlines) + "..."
  }
}
