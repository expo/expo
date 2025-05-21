package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.PropSetException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.types.AnyType

class ConcreteViewProp<ViewType : View, PropType>(
  name: String,
  propType: AnyType,
  private val setter: (view: ViewType, prop: PropType) -> Unit
) : AnyViewProp(name, propType) {
  private var defaultValue: PropType? = null

  constructor(
    name: String,
    propType: AnyType,
    defaultValue: PropType,
    setter: (view: ViewType, prop: PropType) -> Unit
  ) : this(name, propType, setter) {
    this.defaultValue = defaultValue
  }

  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Dynamic, onView: View, appContext: AppContext?) {
    exceptionDecorator({
      PropSetException(name, onView::class, it)
    }) {
      if (prop.isNull && defaultValue != null) {
        return setter(onView as ViewType, defaultValue as PropType)
      }
      setter(onView as ViewType, type.convert(prop, appContext) as PropType)
    }
  }

  override val isNullable: Boolean = propType.kType.isMarkedNullable
}
