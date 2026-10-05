import AppIntents
internal import ExpoAppIntents
internal import ExpoModulesCore

/// Adds an amount to the counter. It is not an App Shortcut, so the system suggests it only after the
/// counter screen donates it, with the amount the user added.
struct AddToCounterIntent: AppIntent, DonatableAppIntent {
  struct DonationParams: Record {
    // A `@Field` needs an initial value, because a record is created with `init()` and then filled
    // in. `.required` rejects params without `amount`, so this 0 is never used.
    @Field(.required) var amount: Int = 0
  }

  static let title: LocalizedStringResource = "Add to Counter"
  static let openAppWhenRun: Bool = true

  @Parameter(title: "Amount", default: 1)
  var amount: Int

  static var parameterSummary: some ParameterSummary {
    Summary("Add \(\.$amount) to the counter")
  }

  init() {}

  init(donationParams: DonationParams) {
    self.init()
    amount = donationParams.amount
  }

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    await AppIntentDispatcher.shared.dispatch(name: "addToCounter", params: ["amount": .int(amount)])
    return .result(dialog: "Added \(amount) to the counter.")
  }
}
