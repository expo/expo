import AppIntents
import CoreTransferable
import Foundation
import UniformTypeIdentifiers

/**
 The `.mail.draft` schema does not require `Transferable`, but conforming lets the system share
 and export a draft, for example when dragging it out of the app.
 */
@available(iOS 18.0, *)
extension MailDraftEntity: Transferable {
  static var transferRepresentation: some TransferRepresentation {
    FileRepresentation(exportedContentType: .plainText) { draft in
      let fileURL = FileManager.default.temporaryDirectory
        .appendingPathComponent(draft.draftFilename)

      try draft.bodyText.write(to: fileURL, atomically: true, encoding: .utf8)

      return SentTransferredFile(fileURL)
    }

    DataRepresentation(exportedContentType: .json) { draft in
      return try JSONEncoder().encode(MailDraftTransferRecord(draft: draft))
    }

    DataRepresentation(exportedContentType: .plainText) { draft in
      return Data(draft.bodyText.utf8)
    }

    ProxyRepresentation(exporting: \.bodyText)
  }

  var draftFilename: String {
    let invalidCharacters = CharacterSet(charactersIn: "/\\?%*|\"<>:")
      .union(.newlines)
      .union(.controlCharacters)
    let filename = displaySubject
      .components(separatedBy: invalidCharacters)
      .joined(separator: " ")
      .trimmingCharacters(in: .whitespacesAndNewlines)

    return "\(filename.isEmpty ? "No subject" : filename).txt"
  }
}

@available(iOS 18.0, *)
private struct MailDraftTransferRecord: Encodable {
  let id: String
  let subject: String
  let body: String
  let recipients: [String]
  let account: String
  let attachmentCount: Int

  init(draft: MailDraftEntity) {
    self.id = draft.id
    self.subject = draft.displaySubject
    self.body = draft.bodyText
    self.recipients = draft.to.compactMap(MailDraftEntity.emailAddress(of:))
    self.account = draft.account.emailAddress
    self.attachmentCount = draft.attachments.count
  }
}
