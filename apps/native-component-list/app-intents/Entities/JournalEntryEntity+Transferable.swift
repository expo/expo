import AppIntents
import CoreTransferable
import Foundation
import UniformTypeIdentifiers

@available(iOS 26.0, *)
extension JournalEntity: Transferable {
  static var transferRepresentation: some TransferRepresentation {
    FileRepresentation(exportedContentType: .plainText) { entry in
      let fileURL = FileManager.default.temporaryDirectory
        .appendingPathComponent(entry.noteFilename)

      try entry.messageText.write(to: fileURL, atomically: true, encoding: .utf8)

      return SentTransferredFile(fileURL)
    }

    DataRepresentation(exportedContentType: .json) { entry in
      return try JSONEncoder().encode(JournalEntryTransferRecord(entry: entry))
    }

    DataRepresentation(exportedContentType: .plainText) { entry in
      return Data(entry.messageText.utf8)
    }

    ProxyRepresentation(exporting: \.messageText)
  }
}

@available(iOS 26.0, *)
private struct JournalEntryTransferRecord: Encodable {
  let id: String
  let title: String
  let subtitle: String?
  let content: String
  let entryDate: Date?
  let locationName: String?
  let latitude: Double?
  let longitude: Double?
  let mediaItemCount: Int

  init(entry: JournalEntity) {
    self.id = entry.id
    self.title = entry.displayTitle
    self.subtitle = entry.displaySubtitle
    self.content = entry.messageText
    self.entryDate = entry.entryDate
    self.locationName = entry.locationDisplayName
    self.latitude = entry.locationLatitude
    self.longitude = entry.locationLongitude
    self.mediaItemCount = entry.mediaItems.count
  }
}
