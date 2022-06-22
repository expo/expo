package expo.modules.kotlin.activityresult

import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.contract.ActivityResultContract
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

/**
 * A launcher for a previously-[AppContextActivityResultCaller.registerForActivityResult] prepared call
 * to start the process of executing an [ActivityResultContract]
 *
 * @param I type of the input required to launch
 * @param O result type
 * @param P additional parameters type that would be passed to fallback callback
 *
 * @see [androidx.activity.result.ActivityResultLauncher]
 */
abstract class AppContextActivityResultLauncher<I, O, P> {
  /**
   * @param params These params would be persisted and restored upon possible Activity destruction
   * by the system
   */
  abstract fun launch(input: I, params: P, callback: ActivityResultCallback<O>)

  suspend fun launch(input: I, params: P): O  = suspendCoroutine { continuation ->
    launch(input, params) { output -> continuation.resume(output) }
  }

  abstract val contract: ActivityResultContract<I, *>
}
