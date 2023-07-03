package expo.modules.kotlin.views

import android.content.Context
import android.view.ViewGroup

/**
 * A NOOP view group, which is used when an error occurs.
 */
class ErrorViewGroup(context: Context) : ViewGroup(context) {
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit
}
