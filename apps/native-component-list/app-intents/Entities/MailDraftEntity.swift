import AppIntents
internal import ExpoAppIntents
import Foundation

@available(iOS 18.0, *)
@AppEntity(schema: .mail.draft)
struct MailDraftEntity {
  static let defaultQuery = MailDraftEntityQuery()

  var id: String
  var to: [IntentPerson]
  var cc: [IntentPerson]
  var bcc: [IntentPerson]
  var subject: String?
  var body: AttributedString?
  var attachments: [IntentFile]
  var account: MailAccountEntity

  init(
    id: String,
    to: [IntentPerson],
    cc: [IntentPerson],
    bcc: [IntentPerson],
    subject: String?,
    body: AttributedString?,
    attachments: [IntentFile],
    account: MailAccountEntity
  ) {
    self.id = id
    self.to = to
    self.cc = cc
    self.bcc = bcc
    self.subject = subject
    self.body = body
    self.attachments = attachments
    self.account = account
  }

  /// Builds a draft from a catalog record published by JavaScript with
  /// `setEntityCatalogAsync('mailDraft', drafts)`. The record's title carries the subject and its
  /// subtitle carries the body, so Siri can resolve a draft the user names out loud.
  init(record: AppIntentEntityRecord) {
    self.init(
      id: record.id,
      to: [],
      cc: [],
      bcc: [],
      subject: record.title.isEmpty ? nil : record.title,
      body: record.subtitle.map(AttributedString.init),
      attachments: [],
      account: MailAccountEntity.default
    )
  }

  var displayRepresentation: DisplayRepresentation {
    return DisplayRepresentation(title: "\(displaySubject)", subtitle: "\(bodyPreview)")
  }

  var displaySubject: String {
    guard let subject = subject?.trimmingCharacters(in: .whitespacesAndNewlines), !subject.isEmpty
    else {
      return "No subject"
    }
    return subject
  }

  var bodyText: String {
    guard let body else {
      return ""
    }
    return String(body.characters)
  }

  /// A flat, JS-friendly recipient list. `IntentPerson` models a name and a handle rather than a
  /// plain string, so it is projected to an address (or a display name when no address is known)
  /// before it crosses into JavaScript.
  ///
  /// Each address stays a separate element. A display name formatted as "Doe, John" contains a comma
  /// of its own, so joining the addresses into one string would let JavaScript read it as two
  /// recipients.
  var recipientAddresses: [String] {
    return (to + cc + bcc).compactMap(Self.address(of:))
  }

  /// The same addresses as one string, for the places that want a single line instead of an array: a
  /// summary label, or one string to match a search term against.
  ///
  /// Nothing in this example reads it yet. `displayRepresentation` shows the subject and a body
  /// preview, and `MailDraftEntityQuery` searches those two, because a draft built from a catalog
  /// record has no recipients - `init(record:)` above leaves `to`, `cc` and `bcc` empty. Add
  /// recipients to the records your app publishes, then search this too.
  var recipientList: String {
    return recipientAddresses.joined(separator: ", ")
  }

  private static func address(of person: IntentPerson) -> String? {
    if let handle = person.handle {
      switch handle.value {
      case .emailAddress(let emailAddress):
        return emailAddress
      case .phoneNumber(let phoneNumber):
        return phoneNumber
      case .applicationDefined(let value):
        return value
      @unknown default:
        break
      }
    }

    switch person.name {
    case .displayName(let displayName):
      return displayName
    case .components(let components):
      return PersonNameComponentsFormatter().string(from: components)
    case .unknown:
      return nil
    @unknown default:
      return nil
    }
  }

  private var bodyPreview: String {
    let preview = bodyText.trimmingCharacters(in: .whitespacesAndNewlines)
    guard preview.count > 80 else {
      return preview
    }
    return String(preview.prefix(80)).trimmingCharacters(in: .whitespacesAndNewlines) + "..."
  }
}
