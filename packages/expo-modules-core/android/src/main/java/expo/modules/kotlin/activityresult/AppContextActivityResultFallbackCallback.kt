package expo.modules.kotlin.activityresult

import java.io.Serializable

/**
 * Interface for fallback callback that has to be registered at the very beginning of module's lifecycle
 * in order to deliver all results in case launching [android.app.Activity] is killed.
 *
 * @param O output type, similar to the main callback
 * @param P additional parameters type. This is registered during and preserved across [android.app.Activity] destruction.
 *
 * @see [androidx.activity.result.ActivityResultCallback]
 */
fun interface AppContextActivityResultFallbackCallback<O, P : Serializable> {
  fun onActivityResult(result: O, params: P)
}
