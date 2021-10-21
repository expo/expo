package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReadableMap
import expo.modules.core.ViewManager

class ViewManagerDefinition(
  private val viewFactory: (Context) -> View,
  private val viewType: Class<out View>,
  private val props: Map<String, AnyViewProp>
) {

  fun createView(context: Context): View = viewFactory(context)

  fun getViewManagerType(): ViewManager.ViewManagerType {
    return if (ViewGroup::class.java.isAssignableFrom(viewType)) {
      ViewManager.ViewManagerType.GROUP
    } else {
      ViewManager.ViewManagerType.SIMPLE
    }
  }

  fun setProps(propsToSet: ReadableMap, onView: View) {
    for ((propName, prop) in propsToSet.entryIterator) {
      val propDelegate = props[propName] ?: continue
      propDelegate.set(prop, onView)
    }
  }
}
