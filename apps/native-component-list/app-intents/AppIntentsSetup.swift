internal import ExpoAppIntents
internal import ExpoModulesCore

/**
 Registered Expo inline module that wires app-target App Intents code to expo-app-intents.
 Do not change the name of this class.
 */
final class AppIntentsSetup: Module {
  public func definition() -> ExpoModulesCore.ModuleDefinition {
    Name("AppIntentsSetup")

    OnCreate {
      AppEntityIdentifierRegistry.shared.register("dish", as: DishEntity.self)
      if #available(iOS 18.0, *) {
        // `registerIndexed` also mirrors the catalog published with `setEntityCatalogAsync` into
        // Spotlight, so nothing has to index the drafts by hand.
        AppEntityIdentifierRegistry.shared.registerIndexed("mailDraft", as: MailDraftEntity.self)
      }

      Task {
        await AppIntentDispatcher.shared.setShortcutsRefreshHandler {
          AppShortcuts.updateAppShortcutParameters()
        }
        AppShortcuts.updateAppShortcutParameters()
      }
    }
  }
}
