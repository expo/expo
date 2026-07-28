internal import ExpoAppIntents
internal import ExpoModulesCore

/**
 Registered Expo inline module that wires app-target App Intents code to expo-app-intents.
 Do not change the name of this class.

 This is the visual-intelligence variant of the setup module. On top of the shortcut refresh
 handler it does two things:

 - registers the `mailDraft` entity kind, which is what lets `appEntityIdentifier('mailDraft', id)`
   in JavaScript tell the system which draft a visible view represents.
 - exposes `indexMailDraftsAsync`, so JavaScript can push the current draft catalog into Spotlight
   whenever it changes.
 */
final class AppIntentsSetup: Module {
  public func definition() -> ExpoModulesCore.ModuleDefinition {
    Name("AppIntentsSetup")

    OnCreate {
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
