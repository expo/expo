package expo.modules.kotlin.activityresult

import androidx.activity.result.ActivityResultCaller
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.registerForActivityResult
import androidx.annotation.MainThread
import androidx.lifecycle.Lifecycle

/**
 * This interface is direct based on [ActivityResultCaller], but due to incompatibility of ReactNative
 * and Android's [Lifecycle] it needed to be adapted.
 * For more information how to use it read [ActivityResultCaller] from `androidx.activity:activity:1.4.0` or even better from `androidx.activity:activity-ktx:1.4.0`.
 */
interface AppContextActivityResultCaller {
  /**
   * @see ActivityResultCaller.registerForActivityResult from `androidx.activity:activity-ktx:1.4.0`.
   */
  @MainThread
  suspend fun <I, O, P: Bundleable<P>> registerForActivityResult(
    contract: ActivityResultContract<I, O>,
    fallbackCallback: AppContextActivityResultFallbackCallback<O, P>,
  ): AppContextActivityResultLauncher<I, O, P>
}
