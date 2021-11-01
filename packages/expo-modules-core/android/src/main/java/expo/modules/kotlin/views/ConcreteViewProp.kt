package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.types.TypeConverterHelper
import kotlin.reflect.KType

class ConcreteViewProp<ViewType : View, PropType>(
  name: String,
  private val propType: KType,
  private val setter: (view: ViewType, prop: PropType) -> Unit,
) : AnyViewProp(name) {

  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Dynamic, onView: View) {
    setter(onView as ViewType, TypeConverterHelper.convert(prop, propType) as PropType)
  }
}
