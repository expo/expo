package expo.modules.kotlin.activityresult

import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.contract.ActivityResultContract
import java.io.Serializable
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

/**
 * A launcher for a previously-[AppContextActivityResultCaller.registerForActivityResult] prepared call
 * to start the process of executing an [ActivityResultContract]
 *
 * @param I type of the input required to launch, it also is preserved and delivered in fallback callback
 * @param O result type
 *
 * @see [androidx.activity.result.ActivityResultLauncher]
 */
abstract class AppContextActivityResultLauncher<I : Serializable, O> {
  /**
   * @param input This would be persisted and restored upon possible Activity destruction by the system
   * to keep context of launching the mechanism.
   */
  abstract fun launch(input: I, callback: ActivityResultCallback<O>)

  suspend fun launch(input: I): O = suspendCoroutine { continuation ->
    launch(input) { output -> continuation.resume(output) }
  }

  abstract val contract: AppContextActivityResultContract<I, O>
}
