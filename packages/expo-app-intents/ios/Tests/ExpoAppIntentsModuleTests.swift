import Foundation
import Testing

@testable import ExpoAppIntents
@testable import ExpoModulesCore

/// Covers the module's JavaScript-facing surface. These go through the runtime rather than calling the
/// actors directly, because what matters here is whether the JavaScript promise resolves or rejects.
@Suite("ExpoAppIntentsModule", .serialized)
@JavaScriptActor
struct ExpoAppIntentsModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = AppContext.create()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: ExpoAppIntentsModule(appContext: appContext),
        name: "ExpoAppIntents"
      )
    )
  }

  /// A scaffold with no App Shortcut phrases has no `AppShortcutsProvider`, so nothing registers a
  /// refresh handler. Publishing a catalog still has to succeed: there are no shortcut parameters to
  /// re-train, and the catalog is already stored by the time the refresh is attempted.
  @Test
  func `publishing a catalog succeeds when no refresh handler is registered`() async throws {
    let kind = "testDraftWithoutRefreshHandler"
    let storageKey = "dev.expo.appintents.entities.\(kind)"
    // Cleared so the assertion below can only pass on what this test itself published, and cleared
    // again on the way out so the published catalog does not outlive the test in the standard
    // UserDefaults of the test host.
    UserDefaults.standard.removeObject(forKey: storageKey)
    defer {
      UserDefaults.standard.removeObject(forKey: storageKey)
    }
    await AppIntentDispatcher.shared.setShortcutsRefreshHandler(nil)

    _ = try await runtime.evalAsync(
      "expo.modules.ExpoAppIntents.setEntityCatalogAsync('\(kind)', [{ id: 'a', title: 'A' }])"
    )

    let stored = try await AppIntentEntityStore.shared.entities(ofKind: kind)
    #expect(stored.map(\.id) == ["a"])
  }

  /// Asking for a refresh explicitly is different: there is nothing else the call could have
  /// accomplished, so a missing handler has to surface rather than pass silently.
  @Test
  func `refreshing shortcuts fails when no refresh handler is registered`() async throws {
    await AppIntentDispatcher.shared.setShortcutsRefreshHandler(nil)

    await #expect(throws: (any Error).self) {
      _ = try await runtime.evalAsync("expo.modules.ExpoAppIntents.refreshShortcutsAsync()")
    }
  }
}
