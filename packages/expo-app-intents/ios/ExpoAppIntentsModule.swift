import ExpoModulesCore
import ExpoUI

internal final class ShortcutsRefreshUnavailableException: Exception, @unchecked Sendable {
  override var reason: String {
    "App Shortcuts could not be refreshed because no refresh handler is registered. "
      + "Only your app target can call AppShortcuts.updateAppShortcutParameters(), so the "
      + "'AppIntentsSetup' inline module has to hand that call to "
      + "AppIntentDispatcher.shared.setShortcutsRefreshHandler(...) — and it only does so for an "
      + "app that has an AppShortcutsProvider. If your app declares no App Shortcut phrases there "
      + "is nothing to re-train, so drop the refreshShortcutsAsync() call. If it does declare "
      + "them, add this to the OnCreate of your AppIntentsSetup module: "
      + "Task { await AppIntentDispatcher.shared.setShortcutsRefreshHandler "
      + "{ AppShortcuts.updateAppShortcutParameters() } }"
  }
}

public final class ExpoAppIntentsModule: Module {
  private var invocationEventsTask: Task<Void, Never>?
  private var invocationEventsSubscription: AppIntentEventSubscription?
  private var modifierRegistration: AppEntityIdentifierModifierRegistration?

  public func definition() -> ModuleDefinition {
    Name("ExpoAppIntents")

    Events("onIntent")

    OnCreate {
      // Every context claims the process-wide registration, and only the first claim installs the
      // factory: a reload has two contexts alive at once, and registering again while the previous
      // claim stands would make `ViewModifierRegistry` log an overwrite for a factory that already
      // does the right thing. See `AppEntityIdentifierModifierRegistration`.
      let registration = AppEntityIdentifierModifierRegistration()
      modifierRegistration = registration
      if registration.isFirstClaim {
        Self.registerAppEntityIdentifierModifier()
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
      // The registry is process-wide and the factory is shared, so it goes away only with the last
      // context that claimed it. A dev-client reload creates the new context before destroying the
      // old one, and unregistering unconditionally here would strip the factory the new context
      // relies on; unregistering because this context is the newest would strip it from an older
      // context that is still running.
      if modifierRegistration?.release() == true {
        ViewModifierRegistry.unregister("appEntityIdentifier")
      }
      modifierRegistration = nil

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
      // The catalog write and the Spotlight index update happen together, as one operation per kind,
      // so that two publishes racing here cannot leave the index holding a catalog the store has
      // already replaced.
      let didChangeCatalog = try await AppEntityIdentifierRegistry.shared.publishCatalog(
        kind: kind,
        records: entities
      )

      // Nothing else downstream of the catalog can have changed if the catalog itself did not.
      guard didChangeCatalog else {
        return
      }
      // Best-effort, and deliberately not propagated: the catalog and the Spotlight index are
      // already updated by this point, so failing the call would report a write that did happen as
      // an error. An app with no App Shortcut phrases has no `AppShortcutsProvider` to register a
      // refresh handler, and no shortcut parameters to re-train either.
      await AppIntentDispatcher.shared.requestShortcutsRefresh()
    }

    AsyncFunction("reindexEntitiesAsync") { (kind: String?) async throws in
      try await self.reindexEntities(kind: kind)
    }

    AsyncFunction("getEntityCatalogAsync") { (kind: String) async throws -> [AppIntentEntityRecord] in
      return try await AppIntentEntityStore.shared.entities(ofKind: kind)
    }

    AsyncFunction("refreshShortcutsAsync") { () async throws in
      try await self.refreshShortcuts()
    }
  }

  /// Installs the `appEntityIdentifier` factory. Both factories take the `AppContext` from the call
  /// rather than from the context that registered them, which is what lets one registration serve every
  /// context. See `AppEntityIdentifierModifierRegistration`.
  private static func registerAppEntityIdentifierModifier() {
    if #available(iOS 18.4, *) {
      ViewModifierRegistry.register("appEntityIdentifier") { params, appContext, _ in
        // The modifier reports a call it cannot honour from `body`, and this logger is what carries
        // the report to the JavaScript console rather than only to OSLog.
        return try AppEntityIdentifierModifier(
          from: params,
          appContext: appContext,
          jsLogger: appContext.jsLogger
        )
      }
    } else {
      ViewModifierRegistry.register("appEntityIdentifier") { _, appContext, _ in
        AppEntityIdentifierDiagnostics.reportOnce(
          key: "unavailableOSVersion",
          to: appContext.jsLogger,
          "expo-app-intents: appEntityIdentifier() does nothing on this device, because reporting "
            + "the entity behind a view to the system requires iOS 18.4 or newer. The view still "
            + "renders the same way, so gate the call on the OS version only if your app has to "
            + "tell the two cases apart."
        )
        return UnavailableAppEntityIdentifierModifier()
      }
    }
  }

  /// Rebuilds the Spotlight index from the stored catalog. Unlike `setEntityCatalogAsync` this does
  /// not check whether the catalog changed, because the point of asking for it explicitly is to
  /// recover from an index that no longer matches: one the system evicted, or one left stale by an
  /// app update that changed how entities describe themselves.
  ///
  /// Every kind is attempted before the first failure is reported, so one unreadable catalog does not
  /// skip the rest. The failure does reach JavaScript: this is the retry path, and a caller that asked
  /// for a rebuild has no other way to learn it did not happen.
  private func reindexEntities(kind: String?) async throws {
    let registry = AppEntityIdentifierRegistry.shared
    let kinds = kind.map { [$0] } ?? registry.indexedKinds

    var firstFailure: (any Error)?
    for kind in kinds {
      do {
        try await registry.replaceIndexFromCatalog(kind: kind)
      } catch {
        firstFailure = firstFailure ?? error
      }
    }

    if let firstFailure {
      throw firstFailure
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
