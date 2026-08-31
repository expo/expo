import AppIntents
import Foundation

/// The `.mail.draft` schema requires a non-optional account, so every draft needs one. This
/// example ships a single hardcoded account. A real mail app would publish its accounts to the
/// entity catalog from JavaScript, the same way the restaurant example publishes dishes.
@available(iOS 18.0, *)
@AppEntity(schema: .mail.account)
struct MailAccountEntity {
  static let defaultQuery = MailAccountEntityQuery()

  static let `default` = MailAccountEntity(
    id: "primary",
    name: "Primary",
    emailAddress: "me@example.com"
  )

  var id: String
  var name: String
  var emailAddress: String

  init(id: String, name: String, emailAddress: String) {
    self.id = id
    self.name = name
    self.emailAddress = emailAddress
  }

  var displayRepresentation: DisplayRepresentation {
    return DisplayRepresentation(title: "\(name)", subtitle: "\(emailAddress)")
  }
}
