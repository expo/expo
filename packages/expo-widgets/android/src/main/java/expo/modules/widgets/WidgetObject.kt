package expo.modules.widgets

import android.content.Context
import expo.modules.kotlin.sharedobjects.SharedObject

internal class WidgetObject(
  private val context: Context,
  private val name: String,
  layout: String
) : SharedObject() {
  init {
    WidgetsStorage.setWidgetLayout(context, name, layout)
  }
}
