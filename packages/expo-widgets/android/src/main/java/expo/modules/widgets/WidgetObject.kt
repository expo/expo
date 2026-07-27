package expo.modules.widgets

import android.content.Context
import expo.modules.kotlin.sharedobjects.SharedObject

internal class WidgetObject(
  private val context: Context,
  val name: String,
  layout: String,
  initialProps: Map<String, Any?>?
) : SharedObject() {
  init {
    WidgetsStorage.set(context, "__expo_widgets_${name}_layout", layout)
    if (initialProps != null) {
      WidgetsStorage.set(context, "__expo_widgets_${name}_initial_props", initialProps)
    } else {
      WidgetsStorage.remove(context, "__expo_widgets_${name}_initial_props")
    }
  }

  fun reload() {
    WidgetsUpdater.reload(context, name)
  }

  fun updateSnapshot(props: Map<String, Any?>) {
    WidgetsStorage.set(context, "__expo_widgets_${name}_props", props)
    reload()
  }
}
