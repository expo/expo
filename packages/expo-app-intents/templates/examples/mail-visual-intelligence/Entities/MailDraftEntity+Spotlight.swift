import AppIntents
@preconcurrency import CoreSpotlight
import Foundation
internal import ExpoAppIntents

/**
 `IntentPerson` models a name and a handle rather than a plain address, so pull the address out
 when Spotlight wants one.
 */
@available(iOS 18.0, *)
extension IntentPerson {
  var emailAddress: String? {
    guard let handle, case .emailAddress(let emailAddress) = handle.value else {
      return nil
    }
    return emailAddress
  }
}

/**
 Makes the draft entity Spotlight-indexable. This is added as an extension so the base
 `MailDraftEntity` stays unchanged: conformance and indexing are the only things visual
 intelligence adds to it.
 */
@available(iOS 18.0, *)
extension MailDraftEntity: IndexedEntity {
  /**
   `defaultAttributeSet` already carries the properties the `.mail.draft` schema declares
   indexing keys for (subject, body, and the recipient lists), so this only fills in the rest.
   */
  var attributeSet: CSSearchableItemAttributeSet {
    let attributes = defaultAttributeSet
    attributes.displayName = displaySubject
    attributes.title = displaySubject
    attributes.subject = subject
    attributes.textContent = bodyText
    attributes.contentDescription = bodyText
    attributes.recipientEmailAddresses = to.compactMap(\.emailAddress)
    attributes.authorEmailAddresses = [account.emailAddress]
    attributes.userCreated = NSNumber(value: true)
    attributes.domainIdentifier = MailDraftIndexer.domainIdentifier
    attributes.keywords = ["mail", "email", "draft", displaySubject]
    return attributes
  }
}

/**
 Keeps the Spotlight index in step with the entity catalog that JavaScript publishes with
 `setEntityCatalogAsync('mailDraft', drafts)`.
 */
@available(iOS 18.0, *)
enum MailDraftIndexer {
  static let domainIdentifier = "dev.expo.appintents.mailDraft"

  static func currentEntities() async -> [MailDraftEntity] {
    return await AppIntentEntityStore.shared.entities(ofKind: "mailDraft")
      .map(MailDraftEntity.init(record:))
  }

  static func entities(for identifiers: [MailDraftEntity.ID]) async -> [MailDraftEntity] {
    return await AppIntentEntityStore.shared.entities(ofKind: "mailDraft", matching: identifiers)
      .map(MailDraftEntity.init(record:))
  }

  static func replaceIndex(with records: [AppIntentEntityRecord]) async throws {
    try await replaceIndex(with: records.map(MailDraftEntity.init(record:)))
  }

  static func replaceIndex(with entities: [MailDraftEntity]) async throws {
    try await CSSearchableIndex.default().deleteAppEntities(ofType: MailDraftEntity.self)
    guard !entities.isEmpty else {
      return
    }
    try await CSSearchableIndex.default().indexAppEntities(entities)
  }

  static func index(_ entities: [MailDraftEntity]) async throws {
    guard !entities.isEmpty else {
      return
    }
    try await CSSearchableIndex.default().indexAppEntities(entities)
  }
}
