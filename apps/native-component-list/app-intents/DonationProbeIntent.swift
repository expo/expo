import AppIntents
internal import ExpoAppIntents

/// Not an App Shortcut, so the system suggests it only after a donation.
struct DonationProbeIntent: AppIntent, DonatableAppIntent {
  static let title: LocalizedStringResource = "Donation Probe"

  init() {}

  init(donationParams: AppIntentParams) {
    self.init()
  }

  func perform() async throws -> some IntentResult & ProvidesDialog {
    return .result(dialog: "Donation probe ran.")
  }
}
