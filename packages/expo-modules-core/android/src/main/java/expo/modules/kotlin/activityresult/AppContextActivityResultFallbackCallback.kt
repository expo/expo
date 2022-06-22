package expo.modules.kotlin.activityresult

import java.io.Serializable

/**
 * @see [androidx.activity.result.ActivityResultCallback]
 *
 * Interface for fallback callback that has to be registered at the very beginning of module's life
 * in order to deliver all results in case launching Activity is killed.
 *
 * Type parameters:
 * @param O - result/output type
 * @param P - additional parameter type
 */
fun interface AppContextActivityResultFallbackCallback<O, P: Serializable> {
  fun onActivityResult(result: O, params: P)
}
