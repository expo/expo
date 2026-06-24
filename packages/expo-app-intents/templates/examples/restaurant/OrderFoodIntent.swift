import AppIntents
internal import ExpoAppIntents

/**
 A phrase-based shortcut that orders a dish.

 The required dish parameter lets Siri either resolve the dish from the launch phrase or ask
 a follow-up question when the user only says "Place an order".
 */
struct OrderFoodIntent: AppIntent {
  static let title: LocalizedStringResource = "Order Food"
  static var openAppWhenRun: Bool = true

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
        "dishName": .string(dish.name)
      ]
    )

    return .result(dialog: "Ordering \(dish.name).")
  }
}
