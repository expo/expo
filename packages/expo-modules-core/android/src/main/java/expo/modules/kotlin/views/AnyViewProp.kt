package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.types.AnyType

abstract class AnyViewProp(
  val name: String,
  internal val type: AnyType
) {
  abstract fun set(prop: Dynamic, onView: View)

  abstract val isNullable: Boolean
}
