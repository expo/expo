import AppIntents
internal import ExpoAppIntents
internal import ExpoModulesCore
import Foundation

/// Lets JavaScript donate a draft that the user wrote in the app with
/// `donateIntentAsync('createMailDraft', { subject, body, recipients })`, so the system can suggest
/// writing a similar draft again. Every field is optional, as it is for the intent itself.
@available(iOS 18.0, macOS 15.0, *)
extension CreateDraftIntent: DonatableAppIntent {
  struct DonationParams: Record {
    @Field var subject: String?
    @Field var body: String?
    @Field var recipients: [String] = []
  }

  init(donationParams: DonationParams) {
    self.init()
    subject = donationParams.subject
    body = donationParams.body.map { AttributedString($0) }
    to = donationParams.recipients.map { IntentPerson(handle: .init(emailAddress: $0)) }
    cc = []
    bcc = []
    attachments = []
  }
}
