import AppIntents
internal import ExpoAppIntents
internal import ExpoModulesCore

/// Lets JavaScript donate an order that the user placed in the app with
/// `donateIntentAsync('orderFood', { dishId })`, so the system can suggest ordering the same dish
/// again.
extension OrderFoodIntent: DonatableAppIntent {
  struct DonationParams: Record {
    // A `@Field` needs an initial value, because a record is created with `init()` and then filled
    // in. `.required` rejects params without `dishId`, so this empty string is never used.
    @Field(.required) var dishId: String = ""
  }

  final class UnknownDishException: GenericException<String>, @unchecked Sendable {
    override var reason: String {
      return """
        No dish '\(param)' is in the published 'dish' catalog, so the order cannot be donated. The \
        donation passes only the dish id, and the dish is read from the catalog. Publish the dish \
        with setEntityCatalogAsync() before you donate an order of it.
        """
    }
  }

  /// Only the id comes from JavaScript. The dish is read from the published catalog, the same way
  /// Siri resolves it, so the donated intent refers to a dish that Siri can find again.
  init(donationParams: DonationParams) async throws {
    self.init()
    guard let dish = try await DishQuery().entities(for: [donationParams.dishId]).first else {
      throw UnknownDishException(donationParams.dishId)
    }
    self.dish = dish
  }
}
