package abi47_0_0.expo.modules.kotlin.views

import android.view.View
import abi47_0_0.com.facebook.react.bridge.Dynamic

abstract class AnyViewProp(
  val name: String
) {
  abstract fun set(prop: Dynamic, onView: View)
}
