import AppIntents
internal import ExpoAppIntents

/// Not an App Shortcut, so the system suggests it only after a donation. It takes no params, so
/// conforming to `DonatableAppIntent` is all it needs.
struct DonationProbeIntent: AppIntent, DonatableAppIntent {
  static let title: LocalizedStringResource = "Donation Probe"

  func perform() async throws -> some IntentResult & ProvidesDialog {
    return .result(dialog: "Donation probe ran.")
  }
}
