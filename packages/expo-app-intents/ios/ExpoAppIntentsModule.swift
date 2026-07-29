import ExpoModulesCore
import ExpoUI

internal final class ShortcutsRefreshUnavailableException: Exception, @unchecked Sendable {
  override var reason: String {
    "App Shortcuts could not be refreshed because no refresh handler is registered. "
      + "The app target must contain an 'AppIntentsSetup' inline module that sets "
      + "AppIntentDispatcher.shared.setShortcutsRefreshHandler(...). Run `npx expo-app-intents init` "
      + "to generate it, or add it manually as described in the expo-app-intents documentation."
  }
}

public final class ExpoAppIntentsModule: Module {
  private var invocationEventsTask: Task<Void, Never>?

  public func definition() -> ModuleDefinition {
    Name("ExpoAppIntents")

    Events("onIntent")

    OnCreate {
      if #available(iOS 18.4, *) {
        ViewModifierRegistry.register("appEntityIdentifier") { params, appContext, _ in
          return try AppEntityIdentifierModifier(from: params, appContext: appContext)
        }
      }

      invocationEventsTask = Task { [weak self] in
        for await invocation in await AppIntentDispatcher.shared.invocationEvents() {
          await self?.sendIntentEvent(invocation)
        }
      }
    }

    OnDestroy {
      if #available(iOS 18.4, *) {
        ViewModifierRegistry.unregister("appEntityIdentifier")
      }

      invocationEventsTask?.cancel()
      invocationEventsTask = nil
    }

    AsyncFunction("getPendingInvocationsAsync") { () async -> [[String: Any]] in
      return await AppIntentDispatcher.shared.pendingInvocations().map { $0.toDict() }
    }

    AsyncFunction("removePendingInvocationAsync") { (id: String) async in
      await AppIntentDispatcher.shared.removePendingInvocation(id: id)
    }

    AsyncFunction("clearPendingInvocationsAsync") { () async in
      await AppIntentDispatcher.shared.clearPendingInvocations()
    }

    AsyncFunction("setEntityCatalogAsync") { (kind: String, entities: [AppIntentEntityRecord]) async throws in
      // Nothing downstream of the catalog can have changed if the catalog itself did not, and
      // JavaScript commonly republishes an identical catalog on every app start.
      guard await AppIntentEntityStore.shared.setCatalog(kind: kind, entities: entities) else {
        return
      }
      await AppEntityIdentifierRegistry.shared.reindex(kind: kind, records: entities)
      try await self.refreshShortcuts()
    }

    AsyncFunction("reindexEntitiesAsync") { (kind: String?) async in
      await self.reindexEntities(kind: kind)
    }

    AsyncFunction("getEntityCatalogAsync") { (kind: String) async -> [AppIntentEntityRecord] in
      return await AppIntentEntityStore.shared.entities(ofKind: kind)
    }

    AsyncFunction("refreshShortcutsAsync") { () async throws in
      try await self.refreshShortcuts()
    }
  }

  /**
   Rebuilds the Spotlight index from the stored catalog. Unlike `setEntityCatalogAsync` this does
   not check whether the catalog changed, because the point of asking for it explicitly is to
   recover from an index that no longer matches: one the system evicted, or one left stale by an
   app update that changed how entities describe themselves.
   */
  private func reindexEntities(kind: String?) async {
    let registry = AppEntityIdentifierRegistry.shared
    let kinds = kind.map { [$0] } ?? registry.indexedKinds

    for kind in kinds {
      let records = await AppIntentEntityStore.shared.entities(ofKind: kind)
      await registry.reindex(kind: kind, records: records)
    }
  }

  private func refreshShortcuts() async throws {
    if !(await AppIntentDispatcher.shared.requestShortcutsRefresh()) {
      throw ShortcutsRefreshUnavailableException()
    }
  }

  @MainActor
  private func sendIntentEvent(_ invocation: AppIntentInvocation) {
    sendEvent("onIntent", invocation.toDict())
  }
}
