package expo.modules.kotlin.views

import android.view.View

class ConcreteViewProp<ViewType : View, PropType>(
  name: String,
  private val setter: (view: ViewType, prop: PropType) -> Unit
) : AnyViewProp(name) {

  @Suppress("UNCHECKED_CAST")
  override fun set(prop: Any?, onView: View) {
    // TODO(@lukmccall): use TypeConverterHelper to convert types
    setter(onView as ViewType, prop as PropType)
  }
}
