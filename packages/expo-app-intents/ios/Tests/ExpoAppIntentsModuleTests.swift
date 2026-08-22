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
  /// re-train, and the catalog and the Spotlight index are both already updated by the time the
  /// refresh is attempted.
  @Test
  func `publishing a catalog succeeds when no refresh handler is registered`() async throws {
    let kind = "testDraftWithoutRefreshHandler"
    let storageKey = "dev.expo.appintents.entities.\(kind)"
    // The store skips catalogs that match what is already stored, so a leftover catalog from an
    // earlier run would make this pass without ever reaching the refresh. Cleared again on the way
    // out so the published catalog does not outlive the test in the standard UserDefaults of the
    // test host, even when a read below throws.
    UserDefaults.standard.removeObject(forKey: storageKey)
    defer {
      UserDefaults.standard.removeObject(forKey: storageKey)
    }
    await AppIntentDispatcher.shared.setShortcutsRefreshHandler(nil)

    var thrown: (any Error)?
    do {
      _ = try await runtime.evalAsync(
        "expo.modules.ExpoAppIntents.setEntityCatalogAsync('\(kind)', [{ id: 'a', title: 'A' }])"
      )
    } catch {
      thrown = error
    }
    let stored = try await AppIntentEntityStore.shared.entities(ofKind: kind)

    #expect(thrown == nil, "expected the catalog to publish: \(String(describing: thrown))")
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

/// `ViewModifierRegistry` is process-wide, so keeping the `appEntityIdentifier` factory alive for
/// exactly as long as some `AppContext` needs it has to be done by hand.
@Suite("AppEntityIdentifierModifierRegistration")
struct AppEntityIdentifierModifierRegistrationTests {
  /// Claims are counted in a set of this suite's own. Nothing may be asserted about the shared set:
  /// every `AppContext` created anywhere in the process claims in it, including the ones the other
  /// suites here create, and Swift Testing runs suites in parallel.
  private let claims = AppEntityIdentifierModifierClaims()

  /// Registering again while another context holds a claim would only make `ViewModifierRegistry` log
  /// an overwrite: the factory is handed the `AppContext` on every call, so the one already installed
  /// serves the new context too.
  @Test
  func `only the first claim installs the factory`() {
    #expect(AppEntityIdentifierModifierRegistration(claims: claims).isFirstClaim == true)
    #expect(AppEntityIdentifierModifierRegistration(claims: claims).isFirstClaim == false)
  }

  /// A JavaScript reload creates the new `AppContext` before destroying the old one, and either of the
  /// two can be destroyed first. Neither order may unregister the factory while the other context is
  /// still running, or `appEntityIdentifier()` silently stops working until the next reload.
  @Test
  func `the factory is unregistered only once the last claim is released`() {
    let reloaded = AppEntityIdentifierModifierRegistration(claims: claims)
    let live = AppEntityIdentifierModifierRegistration(claims: claims)

    #expect(live.release() == false, "a claim that is still held keeps the factory registered")
    #expect(reloaded.release() == true, "releasing the last claim unregisters the factory")
  }

  @Test
  func `releasing the same claim twice does not release another context's`() {
    let first = AppEntityIdentifierModifierRegistration(claims: claims)
    let second = AppEntityIdentifierModifierRegistration(claims: claims)

    #expect(first.release() == false)
    #expect(first.release() == false)
    #expect(second.release() == true)
  }
}

/// Keeps what it was logged, standing in for the handler that forwards to the JavaScript console.
private final class CollectingLogHandler: LogHandler {
  private let lock = NSLock()
  private var messages: [String] = []

  func log(type: LogType, _ message: String) {
    lock.lock()
    defer { lock.unlock() }
    messages.append(message)
  }

  var collected: [String] {
    lock.lock()
    defer { lock.unlock() }
    return messages
  }
}

/** Counts how many pieces of work were ever in flight at the same time. */
private actor OverlapCounter {
  private var active = 0
  private(set) var mostConcurrent = 0

  func enter() {
    active += 1
    mostConcurrent = max(mostConcurrent, active)
  }

  func leave() {
    active -= 1
  }
}

@Suite("KeyedSerialQueue")
struct KeyedSerialQueueTests {
  /// The reason this queue exists: an index update deletes before it indexes, so two overlapping
  /// updates to the same kind can leave the index matching neither catalog.
  @Test
  func `work for one key never overlaps`() async throws {
    let queue = KeyedSerialQueue()
    let counter = OverlapCounter()

    await withTaskGroup(of: Void.self) { group in
      for _ in 0..<8 {
        group.addTask {
          try? await queue.run(key: "mailDraft") {
            await counter.enter()
            try await Task.sleep(nanoseconds: 2_000_000)
            await counter.leave()
          }
        }
      }
    }

    #expect(await counter.mostConcurrent == 1)
  }

  /// A failed update is reported to whoever asked for it, and must not strand the next one.
  @Test
  func `a failure reaches the caller and the next call still runs`() async throws {
    struct Boom: Error {}
    let queue = KeyedSerialQueue()

    await #expect(throws: Boom.self) {
      try await queue.run(key: "mailDraft") { throw Boom() }
    }

    var didRun = false
    try await queue.run(key: "mailDraft") { didRun = true }
    #expect(didRun)
  }
}

@Suite("AppEntityIdentifierRegistry")
struct AppEntityIdentifierRegistryTests {
  @Test
  func `reindexing ignores a kind that is not registered for indexing`() async throws {
    let kind = "testUnregistered-\(UUID().uuidString)"
    let key = "dev.expo.appintents.entities.\(kind)"
    UserDefaults.standard.set(Data("not json".utf8), forKey: key)
    defer { UserDefaults.standard.removeObject(forKey: key) }

    try await AppEntityIdentifierRegistry.shared.replaceIndexFromCatalog(kind: kind)
  }
}

@Suite("AppEntityIdentifierDiagnostics")
struct AppEntityIdentifierDiagnosticsTests {
  /// A view's `body` is re-evaluated on every render, so the same cause must be reported once and not
  /// on a loop.
  @Test
  func `each cause is reported once`() {
    let key = "test:\(UUID().uuidString)"

    #expect(AppEntityIdentifierDiagnostics.reportOnce(key: key, "first") == true)
    #expect(AppEntityIdentifierDiagnostics.reportOnce(key: key, "again") == false)
  }

  /// The report has to go to the `AppContext`'s logger, because that one reaches the JavaScript console
  /// and so Metro and LogBox. Written to the global `log` it would sit in OSLog, where the developer
  /// whose call did nothing is not looking.
  @Test
  func `a cause is reported to the logger it is given`() {
    let handler = CollectingLogHandler()
    let logger = Logger(logHandlers: [handler])
    let key = "test:\(UUID().uuidString)"

    AppEntityIdentifierDiagnostics.reportOnce(key: key, to: logger, "reported to the caller")

    #expect(handler.collected.contains { $0.contains("reported to the caller") })
  }
}
