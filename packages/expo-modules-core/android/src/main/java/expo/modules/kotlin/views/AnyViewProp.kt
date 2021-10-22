package expo.modules.kotlin.views

import android.view.View

abstract class AnyViewProp(
  val name: String
) {
  abstract fun set(prop: Any?, onView: View)
}
