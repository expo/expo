package expo.modules.core.errors

import kotlinx.coroutines.CancellationException

private const val DEFAULT_MESSAGE = "Module destroyed. All coroutines are cancelled."

/**
 * Can be passed as parameter to [kotlinx.coroutines.cancel] when module is destroyed
 * in order to cancel all coroutines in [kotlinx.coroutines.CoroutineScope]
 *
 * Example usage:
 * ```
 * override fun onDestroy() {
 *   try {
 *     moduleCoroutineScope.cancel(ModuleDestroyedException())
 *   } catch (e: IllegalStateException) {
 *     Log.w(TAG, "The scope does not have a job in it")
 *   }
 * }
 * ```
 */
class ModuleDestroyedException(message: String = DEFAULT_MESSAGE) : CancellationException(message)
