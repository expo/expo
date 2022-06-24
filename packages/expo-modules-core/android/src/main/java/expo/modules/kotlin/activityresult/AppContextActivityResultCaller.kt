package expo.modules.kotlin.activityresult

import androidx.activity.result.contract.ActivityResultContract
import androidx.annotation.MainThread
import java.io.Serializable

/**
 * This interface is directly based on [androidx.activity.result.ActivityResultCaller], but due to incompatibility
 * of ReactNative and Android's [androidx.lifecycle.Lifecycle] it needed to be adapted.
 * For more information how to use it read [androidx.activity.result.ActivityResultCaller] from `androidx.activity:activity:1.4.0`
 * or even better from `androidx.activity:activity-ktx:1.4.0`.
 */
interface AppContextActivityResultCaller {
  /**
   * @see [androidx.activity.result.ActivityResultCaller.registerForActivityResult] from `androidx.activity:activity-ktx:1.4.0`.
   * @param I - input
   * @param O - output
   * @param P - additional parameters to be passed into the [fallbackCallback]
   */
  @MainThread
  suspend fun <I, O, P : Serializable> registerForActivityResult(
    contract: ActivityResultContract<I, O>,
    fallbackCallback: AppContextActivityResultFallbackCallback<O, P>,
  ): AppContextActivityResultLauncher<I, O, P>
}
