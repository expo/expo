package abi49_0_0.expo.modules.kotlin.views

import android.view.View
import abi49_0_0.com.facebook.react.bridge.Dynamic
import abi49_0_0.expo.modules.kotlin.types.AnyType

abstract class AnyViewProp(
  val name: String,
  internal val type: AnyType
) {
  abstract fun set(prop: Dynamic, onView: View)

  abstract val isNullable: Boolean
}
