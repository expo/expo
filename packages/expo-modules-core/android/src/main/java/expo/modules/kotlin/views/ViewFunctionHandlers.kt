package expo.modules.kotlin.views

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.withTimeoutOrNull

typealias ViewFunctionHandler = suspend (args: Array<out Any?>) -> Any?

/**
 * Handlers for a view's async functions when they're bound after the view is
 * created — a Compose view binds them during its first composition, one or more
 * frames after the view is mounted. A call that arrives in that window suspends
 * in [resolve] until the initial binding pass completes instead of failing with
 * a missing-handler error.
 */
class ViewFunctionHandlers(private val viewName: String) {
  private val handlers = mutableMapOf<String, ViewFunctionHandler>()
  private val initialBinding = CompletableDeferred<Unit>()

  operator fun set(name: String, handler: ViewFunctionHandler) {
    handlers[name] = handler
  }

  fun remove(name: String) {
    handlers.remove(name)
  }

  /**
   * Marks the initial binding pass as finished — for Compose views, the moment
   * the first composition is applied and every `handle { }` binding has run.
   */
  fun markInitiallyBound() {
    initialBinding.complete(Unit)
  }

  /**
   * Returns the handler bound under [name], waiting for the initial binding
   * pass when the call arrives before the view has composed.
   */
  suspend fun resolve(name: String): ViewFunctionHandler {
    handlers[name]?.let { return it }
    withTimeoutOrNull(INITIAL_BINDING_TIMEOUT_MS) { initialBinding.await() }
      ?: throw IllegalStateException(
        "AsyncFunction '$name' was called on view '$viewName', but the view was never composed. " +
          "Make sure the component is rendered inside a <Host> and stays mounted while calling its functions."
      )
    return handlers[name]
      ?: error(
        "No handler registered for AsyncFunction '$name' on view '$viewName'. " +
          "Did you forget to bind it with `$name.handle { ... }` inside the Content { } block? " +
          "This can also happen when the view is removed before the call is delivered."
      )
  }

  private companion object {
    const val INITIAL_BINDING_TIMEOUT_MS = 1_000L
  }
}
