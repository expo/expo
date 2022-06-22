package expo.modules.kotlin.activityresult

/**
 * @see [androidx.activity.result.ActivityResultCallback]
 *
 * A type-safe callback to be called when an activity result is available.
 * Type parameters:
 * @param O - result/output type
 * @param P - additional parameter type
 */
fun interface AppContextActivityResultCallback<O, P> {
  fun onActivityResult(result: O, params: P)
}
