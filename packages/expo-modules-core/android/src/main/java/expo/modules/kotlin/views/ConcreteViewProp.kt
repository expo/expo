package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.PropSetException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.types.AnyType

open class ConcreteViewProp<ViewType : View, PropType>(
  name: String,
  propType: AnyType,
  protected val setter: (view: ViewType, prop: PropType) -> Unit
) : AnyViewProp(name, propType) {
  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Dynamic, onView: View, appContext: AppContext?) {
    exceptionDecorator({
      PropSetException(name, onView::class, it)
    }) {
      setter(onView as ViewType, type.convert(prop, appContext) as PropType)
    }
  }

  override val isNullable: Boolean = propType.kType.isMarkedNullable
}

class ConcreteViewPropWithDefault<ViewType : View, PropType>(
  name: String,
  propType: AnyType,
  setter: (view: ViewType, prop: PropType) -> Unit,
  private val defaultValue: PropType
) : ConcreteViewProp<ViewType, PropType>(name, propType, setter) {
  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Dynamic, onView: View, appContext: AppContext?) {
    if (prop.isNull) {
      setter(onView as ViewType, defaultValue)
      return
    }
    super.set(prop, onView, appContext)
  }
}
