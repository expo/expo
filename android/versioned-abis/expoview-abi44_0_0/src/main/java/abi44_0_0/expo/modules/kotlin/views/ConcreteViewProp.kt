package abi44_0_0.expo.modules.kotlin.views

import android.view.View
import abi44_0_0.com.facebook.react.bridge.Dynamic
import abi44_0_0.expo.modules.kotlin.types.AnyType

class ConcreteViewProp<ViewType : View, PropType>(
  name: String,
  private val propType: AnyType,
  private val setter: (view: ViewType, prop: PropType) -> Unit,
) : AnyViewProp(name) {

  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Dynamic, onView: View) {
    setter(onView as ViewType, propType.convert(prop) as PropType)
  }
}
