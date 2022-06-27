package expo.modules.kotlin.activityresult

import android.content.Context
import android.content.Intent
import java.io.Serializable

/**
 * A contract specifying that an activity can be called with an input of type [I] and produce an output of type [O].
 *
 * Makes calling an activity for result type-safe.
 *
 * This interface differs from the original in terms of providing `input` parameter in the [parseResult] method.
 *
 * @see androidx.activity.result.contract.ActivityResultContract
 */
interface AppContextActivityResultContract<I : Serializable, O> {
  /**
   * Create an intent that can be used for [android.app.Activity.startActivityForResult].
   */
  fun createIntent(context: Context, input: I): Intent

  /**
   * Convert result obtained from [android.app.Activity.onActivityResult] to [O].
   * @param input the very same input object that is used in [createIntent] method. You can use it to add additional information to constructed result.
   */
  fun parseResult(input: I, resultCode: Int, intent: Intent?): O
}
