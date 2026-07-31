import Foundation

/**
 Ownership token for a single `AppIntentDispatcher.invocationEvents(for:)` subscription.

 `ExpoAppIntentsModule` creates one synchronously in `OnCreate` and invalidates it synchronously in
 `OnDestroy`. Cancelling the task that reads the stream is not enough on its own, because a
 cancelled task still runs its body: a module torn down by a JavaScript reload can still reach the
 dispatcher after the module that replaced it subscribed. The token is what stops it from
 subscribing at all, so a doomed stream never joins the set that `dispatch` yields to and no
 invocation is handed to a reader that is already gone.
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
 The bridge between app-target App Intent code and the Expo runtime.

 `AppIntent.perform()` implementations call `await AppIntentDispatcher.shared.dispatch(...)`.
  The dispatcher persists the invocation first, then notifies JS if it is alive. The intents can be queried and handled
  from the JS side.
 */
public actor AppIntentDispatcher {
  public static let shared = AppIntentDispatcher()

  private let store: AppIntentInvocationStore
  /**
   One continuation per live subscription, keyed by a counter this actor hands out.

   A single slot would make the last subscriber the only one: with two `AppContext`s alive, the
   older would be deaf for the rest of its life, and destroying the newer would leave nothing
   listening at all. The key is a fresh integer rather than the subscription's identity, so a
   deallocated token can never collide with a later one.
   */
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
   Returns a stream of the invocations dispatched while JavaScript is running.

   Every subscription gets its own stream and they all stay live, so each `AppContext` receives
   every invocation. A subscription lasts until the task reading it is cancelled or the stream is
   released, at which point `onTermination` removes just that one.

   The token has to be owned by the caller and is deliberately not defaultable. A module torn down
   by a JavaScript reload can still reach this method after the module replacing it subscribed, and
   only a token the caller can invalidate keeps it from registering a stream it is about to
   terminate. A token created here would be valid by construction, so a caller that omitted it would
   opt out of the very guard it exists for, and would do so silently.
   */
  internal func invocationEvents(
    for subscription: AppIntentEventSubscription
  ) -> AsyncStream<AppIntentInvocation> {
    guard subscription.isValid, !Task.isCancelled else {
      // The caller is already torn down, so give it a stream that is over before it starts.
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

  /**
   Hands an invocation to JavaScript and returns its id, without waiting for anything.

   Delivery is one way by design, not by omission: `perform()` is routinely called while the app is
   not running, so there is frequently no JavaScript runtime to ask. An intent that waited for a
   reply would work when the app happened to be open and hang, or fail, when Siri reached it cold —
   which is the case App Intents exist to serve. The invocation is recorded first and only then
   emitted, so a cold launch still finds it in the pending queue.

   So whatever `perform()` returns to Siri or Shortcuts has to be produced in Swift. JavaScript is
   where the app's own state is updated afterwards, not where the intent's result comes from. An
   intent whose result genuinely depends on app state should either keep that state somewhere Swift
   can read it, or return no value and open the app.
   */
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
