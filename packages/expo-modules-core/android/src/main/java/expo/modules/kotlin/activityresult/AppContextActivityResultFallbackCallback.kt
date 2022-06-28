package expo.modules.kotlin.activityresult

import java.io.Serializable

/**
 * Interface for fallback callback that has to be registered at the very beginning of module's lifecycle
 * in order to deliver all results in case launching [android.app.Activity] is killed.
 *
 * @see [androidx.activity.result.ActivityResultCallback]
 */
fun interface AppContextActivityResultFallbackCallback<I : Serializable, O> {
  /**
   * @param input parameters used to construct Intent that launched the operation
   * @param result output constructed by the associated [AppContextActivityResultContract]
   */
  fun onActivityResult(input: I, result: O)
}
