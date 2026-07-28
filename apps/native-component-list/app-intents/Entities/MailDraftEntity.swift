import AppIntents
@preconcurrency import CoreSpotlight
import Foundation
internal import ExpoAppIntents

@available(iOS 18.0, *)
@AppEntity(schema: .mail.draft)
struct MailDraftEntity: IndexedEntity {
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

  /**
   Builds a draft from a catalog record published by JavaScript with
   `setEntityCatalogAsync('mailDraft', drafts)`. The record's title carries the subject and its
   subtitle carries the body, so Siri can resolve a draft the user names out loud.
   */
  init(record: AppIntentEntityRecord) {
    let bodyText = record.metadata["body"] ?? record.subtitle ?? ""
    let recipients = (record.metadata["recipients"] ?? "")
      .split(separator: ",")
      .map { $0.trimmingCharacters(in: .whitespaces) }
      .filter { !$0.isEmpty }

    self.init(
      id: record.id,
      to: recipients.map { IntentPerson(handle: .init(emailAddress: $0)) },
      cc: [],
      bcc: [],
      subject: record.title.isEmpty ? nil : record.title,
      body: bodyText.isEmpty ? nil : AttributedString(bodyText),
      attachments: [],
      account: MailAccountEntity.default
    )
  }

  var displayRepresentation: DisplayRepresentation {
    return DisplayRepresentation(
      title: "\(displaySubject)",
      subtitle: "\(bodyPreview)",
      image: DisplayRepresentation.Image(systemName: "envelope", isTemplate: true)
    )
  }

  /**
   Spotlight metadata for the indexed draft. `defaultAttributeSet` already carries what the
   `.mail.draft` schema declares indexing keys for, so this only fills in the rest.
   */
  var attributeSet: CSSearchableItemAttributeSet {
    let attributes = defaultAttributeSet
    attributes.displayName = displaySubject
    attributes.title = displaySubject
    attributes.subject = subject
    attributes.textContent = bodyText
    attributes.contentDescription = bodyText
    attributes.recipientEmailAddresses = to.compactMap(Self.emailAddress(of:))
    attributes.authorEmailAddresses = [account.emailAddress]
    attributes.userCreated = NSNumber(value: true)
    attributes.domainIdentifier = MailDraftIndexer.domainIdentifier
    attributes.keywords = ["mail", "draft", "email", displaySubject]
    return attributes
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

  /**
   A flat, JS-friendly recipient list. `IntentPerson` models a name and a handle rather than a
   plain string, so it is projected to an address (or a display name when no address is known)
   before it crosses into JavaScript.
   */
  var recipientList: String {
    return (to + cc + bcc).compactMap(Self.address(of:)).joined(separator: ", ")
  }

  static func emailAddress(of person: IntentPerson) -> String? {
    guard let handle = person.handle, case .emailAddress(let emailAddress) = handle.value else {
      return nil
    }
    return emailAddress
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
