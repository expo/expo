package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.Dynamic

abstract class AnyViewProp(
  val name: String
) {
  abstract fun set(prop: Dynamic, onView: View)

  abstract val isNullable: Boolean
}
