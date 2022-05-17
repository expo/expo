package expo.modules.kotlin.activityresult

/**
 * @see [ActivityResultCallback]
 */
fun interface AppContextActivityResultCallback<O> {
  /**
   * Called when result is available
   * @param launchingActivityHasBeenKilled additional parameter that tells whether the calling [Activity]
   * has been destroyed and recreated due to resources limits. If this is true then React Native application
   * has been recreated from scratch as well and all previous state is invalid.
   */
  fun onActivityResult(result: O, launchingActivityHasBeenKilled: Boolean)
}