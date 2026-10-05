internal import ExpoAppIntents
internal import ExpoModulesCore

/// Registered Expo inline module that wires app-target App Intents code to expo-app-intents.
/// Do not change the name of this class.
final class AppIntentsSetup: Module {
  public func definition() -> ExpoModulesCore.ModuleDefinition {
    Name("AppIntentsSetup")

    OnCreate {
      AppIntentDonationRegistry.shared.register("donationProbe", as: DonationProbeIntent.self)
      AppIntentDonationRegistry.shared.register("orderFood", as: OrderFoodIntent.self)
      AppIntentDonationRegistry.shared.register("addToCounter", as: AddToCounterIntent.self)

      if #available(iOS 18.0, macOS 15.0, *) {
        AppEntityIdentifierRegistry.shared.registerIndexed("mailDraft", as: MailDraftEntity.self)
        AppIntentDonationRegistry.shared.register("createMailDraft", as: CreateDraftIntent.self)
      }
      #if compiler(>=6.4)
      if #available(iOS 27.0, macOS 27.0, *) {
        AppIntentDonationRegistry.shared.register("openMailDraft", as: OpenMailDraftIntent.self)
      }
      #endif

      Task {
        await AppIntentDispatcher.shared.setShortcutsRefreshHandler {
          AppShortcuts.updateAppShortcutParameters()
        }
        AppShortcuts.updateAppShortcutParameters()
      }
    }
  }
}
