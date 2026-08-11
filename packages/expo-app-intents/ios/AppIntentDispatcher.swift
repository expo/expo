import Foundation

/**
 * Ownership token for a single `AppIntentDispatcher.invocationEvents(for:)` subscription.
 *
 * Cancelling the read task alone still lets an old module receive invocations after a JavaScript
 * reload replaces it, so the token prevents it from subscribing at all.
 */
internal final class AppIntentEventSubscription: @unchecked Sendable {
  private let lock = NSLock()
  private var isInvalidated = false

  internal var isValid: Bool {
    lock.lock()
    defer { lock.unlock() }
    return !isInvalidated
  }

  internal func invalidate() {
    lock.lock()
    defer { lock.unlock() }
    isInvalidated = true
  }
}

/**
 * The bridge between app-target App Intent code and the Expo runtime.
 * `AppIntent.perform()` implementations call `await AppIntentDispatcher.shared.dispatch(...)`.
 * The dispatcher persists the invocation first, then notifies JS if it is alive. The intents can be queried and handled
 * from the JS side.
 */
public actor AppIntentDispatcher {
  public static let shared = AppIntentDispatcher()

  private let store: AppIntentInvocationStore
  private var eventContinuations: [Int: AsyncStream<AppIntentInvocation>.Continuation] = [:]
  private var nextSubscriptionKey = 0

  /**
   Set by the app-target `AppIntentsSetup` inline module. Must call
   `AppShortcuts.updateAppShortcutParameters()` on the app's concrete
   `AppShortcutsProvider` because the pod cannot reference that type.
   */
  private var shortcutsRefreshHandler: (@Sendable () async -> Void)?

  internal init(store: AppIntentInvocationStore = AppIntentInvocationStore()) {
    self.store = store
  }

  /**
   * Returns a stream of the invocations dispatched while JavaScript is running.
   * Every subscription gets its own live stream, and the token has no default so a module replaced by
   * a JavaScript reload cannot subscribe.
   */
  internal func invocationEvents(
    for subscription: AppIntentEventSubscription
  ) -> AsyncStream<AppIntentInvocation> {
    guard subscription.isValid, !Task.isCancelled else {
      return AsyncStream { continuation in
        continuation.finish()
      }
    }

    nextSubscriptionKey += 1
    let key = nextSubscriptionKey
    return AsyncStream { continuation in
      eventContinuations[key] = continuation
      continuation.onTermination = { _ in
        Task {
          await self.removeEventContinuation(key: key)
        }
      }
    }
  }

  private func removeEventContinuation(key: Int) {
    eventContinuations.removeValue(forKey: key)
  }

  @discardableResult
  public func dispatch(name: String, params: AppIntentParams = [:]) -> String {
    let invocation = AppIntentInvocation(name: name, params: params)
    store.append(invocation)
    for continuation in eventContinuations.values {
      continuation.yield(invocation)
    }
    return invocation.id
  }

  // Both of these propagate a storage failure so `ExpoAppIntentsModule` can reject the promise the
  // caller is waiting on. A developer sees a rejected promise; the global `log` only reaches OSLog.
  internal func pendingInvocations() throws -> [AppIntentInvocation] {
    return try store.pending()
  }

  internal func removePendingInvocation(id: String) throws {
    try store.remove(id: id)
  }

  internal func clearPendingInvocations() {
    store.clear()
  }

  public func setShortcutsRefreshHandler(_ handler: (@Sendable () async -> Void)?) {
    shortcutsRefreshHandler = handler
  }

  @discardableResult
  internal func requestShortcutsRefresh() async -> Bool {
    guard let handler = shortcutsRefreshHandler else {
      return false
    }
    await handler()
    return true
  }
}
