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
      if #available(iOS 26.0, *) {
        AppEntityIdentifierRegistry.shared.register("journalEntry", as: JournalEntity.self)
      }

      Task {
        await AppIntentDispatcher.shared.setShortcutsRefreshHandler {
          AppShortcuts.updateAppShortcutParameters()
        }
        AppShortcuts.updateAppShortcutParameters()
      }
    }

    AsyncFunction("indexJournalEntriesAsync") { (records: [AppIntentEntityRecord]) async throws in
      if #available(iOS 26.0, *) {
        try await JournalEntityIndexer.replaceIndex(with: records)
      }
    }
  }
}
