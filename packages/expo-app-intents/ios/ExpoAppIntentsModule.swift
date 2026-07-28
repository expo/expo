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
  private var invocationEventsSubscription: AppIntentEventSubscription?

  public func definition() -> ModuleDefinition {
    Name("ExpoAppIntents")

    Events("onIntent")

    OnCreate {
      if #available(iOS 18.4, *) {
        ViewModifierRegistry.register("appEntityIdentifier") { params, appContext, _ in
          return try AppEntityIdentifierModifier(from: params, appContext: appContext)
        }
      }

      // The token is created here, synchronously, so `OnDestroy` can invalidate it before the task
      // below ever reaches the dispatcher.
      let subscription = AppIntentEventSubscription()
      invocationEventsSubscription = subscription
      invocationEventsTask = Task { [weak self] in
        for await invocation in await AppIntentDispatcher.shared.invocationEvents(for: subscription) {
          guard !Task.isCancelled else {
            break
          }
          await self?.sendIntentEvent(invocation)
        }
      }
    }

    OnDestroy {
      if #available(iOS 18.4, *) {
        ViewModifierRegistry.unregister("appEntityIdentifier")
      }

      invocationEventsSubscription?.invalidate()
      invocationEventsSubscription = nil
      invocationEventsTask?.cancel()
      invocationEventsTask = nil
    }

    AsyncFunction("getPendingInvocationsAsync") { () async throws -> [[String: Any]] in
      return try await AppIntentDispatcher.shared.pendingInvocations().map { $0.toDict() }
    }

    AsyncFunction("removePendingInvocationAsync") { (id: String) async throws in
      try await AppIntentDispatcher.shared.removePendingInvocation(id: id)
    }

    AsyncFunction("clearPendingInvocationsAsync") { () async in
      await AppIntentDispatcher.shared.clearPendingInvocations()
    }

    AsyncFunction("setEntityCatalogAsync") { (kind: String, entities: [AppIntentEntityRecord]) async throws in
      try await AppIntentEntityStore.shared.setCatalog(kind: kind, entities: entities)
      // Best-effort, and deliberately not propagated: the catalog is already stored by this point,
      // so failing the call would report a write that did happen as an error. An app with no App
      // Shortcut phrases has no `AppShortcutsProvider` to register a refresh handler, and no
      // shortcut parameters to re-train either.
      await AppIntentDispatcher.shared.requestShortcutsRefresh()
    }

    AsyncFunction("getEntityCatalogAsync") { (kind: String) async throws -> [AppIntentEntityRecord] in
      return try await AppIntentEntityStore.shared.entities(ofKind: kind)
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

  private func sendIntentEvent(_ invocation: AppIntentInvocation) {
    sendEvent("onIntent", invocation.toDict())
  }
}
