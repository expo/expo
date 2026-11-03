import AppIntents
internal import ExpoAppIntents
internal import ExpoModulesCore
import Foundation

/// Lets JavaScript donate opening a draft with `donateIntentAsync('openMailDraft', { draftId })`, so
/// the system can suggest opening it again. Because `target` is a `MailDraftEntity`,
/// `deleteDonationsAsync({ entity: 'mailDraft', id })` removes these donations when the draft is gone.
#if compiler(>=6.4)
@available(iOS 27.0, macOS 27.0, *)
extension OpenMailDraftIntent: DonatableAppIntent {
  struct DonationParams: Record {
    @Field(.required) var draftId: String = ""
  }

  final class UnknownDraftException: GenericException<String>, @unchecked Sendable {
    override var reason: String {
      return """
        No draft '\(param)' is in the published 'mailDraft' catalog, so opening it cannot be \
        donated. The donation passes only the draft id, and the draft is read from the catalog. \
        Publish the draft with setEntityCatalogAsync() before you donate opening it.
        """
    }
  }

  /// Only the id comes from JavaScript. The draft is read from the published catalog, the same way
  /// Siri resolves it.
  init(donationParams: DonationParams) async throws {
    self.init()
    guard let draft = try await MailDraftEntityQuery().entities(for: [donationParams.draftId]).first else {
      throw UnknownDraftException(donationParams.draftId)
    }
    target = draft
  }
}
#endif
