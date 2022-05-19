package expo.modules.kotlin.activityresult

import androidx.activity.result.ActivityResultCaller
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.registerForActivityResult
import androidx.annotation.MainThread
import androidx.lifecycle.Lifecycle
import expo.modules.kotlin.AppContextActivityResult

/**
 * This interface is direct based on [ActivityResultCaller], but due to incompatibility of ReactNative
 * and Android's [Lifecycle] it needed to be adapted.
 * For more information how to use it read [ActivityResultCaller] from `androidx.activity:activity:1.4.0` or even better from `androidx.activity:activity-ktx:1.4.0`.
 */
interface AppContextActivityResultCaller {
  /**
   * A version of [ActivityResultCaller.registerForActivityResult]
   * that additionally takes an input right away, producing a launcher that doesn't take any
   * additional input when called.
   *
   * @see ActivityResultCaller.registerForActivityResult from `androidx.activity:activity-ktx:1.4.0`.
   */
  @MainThread
  fun <I, O> registerForActivityResult(
    contract: ActivityResultContract<I, O>,
    callback: AppContextActivityResultCallback<O>
  ): ActivityResultLauncher<I>

  /**
   * Suspend version of [registerForActivityResult], but with the default [AppContextActivityResultCallback]
   * that should simply forward the result as a result of this suspending function.
   *
   *
   * @see ActivityResultCaller.registerForActivityResult
   */
  @MainThread
  suspend fun <O> launchForActivityResult(
    contract: ActivityResultContract<Any?, O>
  ): AppContextActivityResult<O>
}
