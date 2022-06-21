package expo.modules.kotlin.activityresult

import android.annotation.SuppressLint

/**
 * @see [androidx.activity.result.ActivityResultCallback]
 */
fun interface AppContextActivityResultCallback<O, P> {
  fun onActivityResult(@SuppressLint("UnknownNullness") result: O, params: P)
}
