package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import android.view.ViewGroup

/**
 * A NOOP view, which is used when an error occurs.
 */
open class ErrorView(context: Context) : View(context)

/**
 * A NOOP view group, which is used when an error occurs.
 */
class ErrorGroupView(context: Context) : ViewGroup(context) {
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit
}

fun View.isErrorView(): Boolean {
  return this is ErrorView || this is ErrorGroupView
}
