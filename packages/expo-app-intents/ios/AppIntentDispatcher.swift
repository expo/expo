import Foundation

/**
 The bridge between app-target App Intent code and the Expo runtime.

 `AppIntent.perform()` implementations call `await AppIntentDispatcher.shared.dispatch(...)`.
  The dispatcher persists the invocation first, then notifies JS if it is alive. The intents can be queried and handled
  from the JS side.
 */
public actor AppIntentDispatcher {
  public static let shared = AppIntentDispatcher()

  private let store: AppIntentInvocationStore
  private var eventContinuation: AsyncStream<AppIntentInvocation>.Continuation?
  private var eventContinuationGeneration = 0

  /**
   Set by the app-target `AppIntentsSetup` inline module. Must call
   `AppShortcuts.updateAppShortcutParameters()` on the app's concrete
   `AppShortcutsProvider` because the pod cannot reference that type.
   */
  private var shortcutsRefreshHandler: (@Sendable () async -> Void)?

  internal init(store: AppIntentInvocationStore = AppIntentInvocationStore()) {
    self.store = store
  }

  internal func invocationEvents() -> AsyncStream<AppIntentInvocation> {
    eventContinuationGeneration += 1
    let generation = eventContinuationGeneration
    return AsyncStream { continuation in
      eventContinuation = continuation
      continuation.onTermination = { _ in
        Task {
          await self.clearEventContinuation(generation: generation)
        }
      }
    }
  }

  private func clearEventContinuation(generation: Int) {
    guard eventContinuationGeneration == generation else {
      return
    }
    eventContinuation = nil
  }

  @discardableResult
  public func dispatch(name: String, params: AppIntentParams = [:]) -> String {
    let invocation = AppIntentInvocation(name: name, params: params)
    store.append(invocation)
    eventContinuation?.yield(invocation)
    return invocation.id
  }

  internal func pendingInvocations() -> [AppIntentInvocation] {
    return store.pending()
  }

  internal func removePendingInvocation(id: String) {
    store.remove(id: id)
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
