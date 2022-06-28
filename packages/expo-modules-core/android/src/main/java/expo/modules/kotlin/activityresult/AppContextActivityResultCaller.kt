package expo.modules.kotlin.activityresult

import androidx.annotation.MainThread
import java.io.Serializable

/**
 * This interface is directly based on [androidx.activity.result.ActivityResultCaller], but due to incompatibility
 * of ReactNative and Android's [androidx.lifecycle.Lifecycle] it needed to be adapted.
 * For more information how to use it read [androidx.activity.result.ActivityResultCaller] from `androidx.activity:activity:1.4.0`
 * or even better from `androidx.activity:activity-ktx:1.4.0`.
 *
 * @see [androidx.activity.result.ActivityResultCaller]
 */
interface AppContextActivityResultCaller {
  /**
   * @see [androidx.activity.result.ActivityResultCaller.registerForActivityResult] from `androidx.activity:activity-ktx:1.4.0`.
   * @param I - input, it is preserved across Activity calls and is delivered to fallback callback
   * @param O - output
   */
  @MainThread
  suspend fun <I : Serializable, O> registerForActivityResult(
    contract: AppContextActivityResultContract<I, O>,
    fallbackCallback: AppContextActivityResultFallbackCallback<I, O>,
  ): AppContextActivityResultLauncher<I, O>
}
