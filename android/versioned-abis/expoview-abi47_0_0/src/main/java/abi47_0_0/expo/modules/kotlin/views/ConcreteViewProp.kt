package abi47_0_0.expo.modules.kotlin.views

import android.view.View
import abi47_0_0.com.facebook.react.bridge.Dynamic
import abi47_0_0.expo.modules.kotlin.exception.PropSetException
import abi47_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi47_0_0.expo.modules.kotlin.types.AnyType

class ConcreteViewProp<ViewType : View, PropType>(
  name: String,
  private val propType: AnyType,
  private val setter: (view: ViewType, prop: PropType) -> Unit,
) : AnyViewProp(name) {

  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Dynamic, onView: View) {
    exceptionDecorator({
      PropSetException(name, onView::class, it)
    }) {
      setter(onView as ViewType, propType.convert(prop) as PropType)
    }
  }
}
