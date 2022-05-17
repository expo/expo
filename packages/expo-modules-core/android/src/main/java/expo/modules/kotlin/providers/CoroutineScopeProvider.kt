package expo.modules.kotlin.providers

import kotlinx.coroutines.CoroutineScope

/**
 * A class that provides the accessor to the [CoroutineScope]. It enables accessing launching
 * functions/tasks on given coroutine scope.
 */
interface CoroutineScopeProvider {
  /**
   * Returns the [CoroutineScope].
   */
  val coroutineScope: CoroutineScope
}
