import AppIntents
internal import ExpoAppIntents
internal import ExpoModulesCore

/// A phrase-based shortcut that orders a dish.
///
/// The required dish parameter lets Siri either resolve the dish from the launch phrase or ask
/// a follow-up question when the user only says "Place an order".
struct OrderFoodIntent: AppIntent {
  static let title: LocalizedStringResource = "Order Food"
  static let openAppWhenRun: Bool = true

  @Parameter(title: "Dish", requestValueDialog: "What would you like to order?")
  var dish: DishEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Order \(\.$dish)")
  }

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    await AppIntentDispatcher.shared.dispatch(
      name: "orderFood",
      params: [
        "dishId": .string(dish.id),
        "dishName": .string(dish.name),
      ]
    )

    return .result(dialog: "Ordering \(dish.name).")
  }
}

/// Lets the order screen donate an order that the user placed in the app, so the system can suggest
/// ordering the same dish again.
extension OrderFoodIntent: DonatableAppIntent {
  struct DonationParams: Record {
    @Field(.required) var dishId: String = ""
  }

  struct UnknownDish: Error, CustomStringConvertible {
    let dishId: String

    var description: String {
      "no dish '\(dishId)' is in the published 'dish' catalog; publish it with setEntityCatalogAsync() first"
    }
  }

  /// Only the id comes from JavaScript. The dish is read from the published catalog, the same way
  /// Siri resolves it, so the donated intent refers to a dish that Siri can find again.
  init(donationParams: DonationParams) async throws {
    self.init()
    guard let dish = try await DishQuery().entities(for: [donationParams.dishId]).first else {
      throw UnknownDish(dishId: donationParams.dishId)
    }
    self.dish = dish
  }
}
