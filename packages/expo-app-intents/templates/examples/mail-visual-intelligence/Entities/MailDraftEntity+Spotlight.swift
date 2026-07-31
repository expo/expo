import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents
import Foundation

/// `IntentPerson` models a name and a handle rather than a plain address, so pull the address out
/// when Spotlight wants one.
@available(iOS 18.0, *)
extension IntentPerson {
  var emailAddress: String? {
    guard let handle, case .emailAddress(let emailAddress) = handle.value else {
      return nil
    }
    return emailAddress
  }
}

/// Lets expo-app-intents rebuild drafts from the catalog that JavaScript publishes, which is what
/// keeps the Spotlight index in step with `setEntityCatalogAsync`. The base entity already has the
/// matching initializer, so this only declares the conformance.
@available(iOS 18.0, *)
extension MailDraftEntity: AppIntentEntityRecordConvertible {}

/// Makes the draft entity Spotlight-indexable. This is added as an extension so the base
/// `MailDraftEntity` stays unchanged: conformance and indexing are the only things visual
/// intelligence adds to it.
@available(iOS 18.0, *)
extension MailDraftEntity: IndexedEntity {
  /// Groups the app's Spotlight items so they can be managed together.
  static let spotlightDomainIdentifier = "dev.expo.appintents.mailDraft"

  /// Apple's own opt-out, honoured by Spotlight from iOS 18.4. expo-app-intents already keeps hidden
  /// drafts out of the index it manages; forwarding the flag here also covers indexing the system
  /// performs itself.
  var hideInSpotlight: Bool {
    return isHiddenInSpotlight
  }

  /// `defaultAttributeSet` already carries the properties the `.mail.draft` schema declares
  /// indexing keys for (subject, body, and the recipient lists), so this only fills in the rest.
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
    attributes.domainIdentifier = Self.spotlightDomainIdentifier
    attributes.keywords = ["mail", "email", "draft", displaySubject]
    return attributes
  }
}
