import ExpoModulesCore

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
      invocationEventsTask = Task { [weak self] in
        for await invocation in await AppIntentDispatcher.shared.invocationEvents() {
          await self?.sendIntentEvent(invocation)
        }
      }
    }

    OnDestroy {
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
      await AppIntentEntityStore.shared.setCatalog(kind: kind, entities: entities)
      try await self.refreshShortcuts()
    }

    AsyncFunction("getEntityCatalogAsync") { (kind: String) async -> [AppIntentEntityRecord] in
      return await AppIntentEntityStore.shared.entities(ofKind: kind)
    }

    AsyncFunction("refreshShortcutsAsync") { () async throws in
      try await self.refreshShortcuts()
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
