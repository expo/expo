package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.exception.PropSetException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.types.AnyType

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

  override val isNullable: Boolean = propType.kType.isMarkedNullable
}
