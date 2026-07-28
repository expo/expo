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
        AppEntityIdentifierRegistry.shared.register("mailDraft", as: MailDraftEntity.self)
      }

      Task {
        await AppIntentDispatcher.shared.setShortcutsRefreshHandler {
          AppShortcuts.updateAppShortcutParameters()
        }
        AppShortcuts.updateAppShortcutParameters()
      }
    }

    AsyncFunction("indexMailDraftsAsync") { (records: [AppIntentEntityRecord]) async throws in
      if #available(iOS 18.0, *) {
        try await MailDraftIndexer.replaceIndex(with: records)
      }
    }
  }
}
