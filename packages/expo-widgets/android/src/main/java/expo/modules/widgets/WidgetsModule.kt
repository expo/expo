package expo.modules.widgets

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WidgetsModule : Module() {
  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoWidgets")

//    Function("reloadAllWidgets")

    Class("Widget", WidgetObject::class) {
      Constructor { name: String, layout: String ->
        WidgetObject(context, name, layout)
      }
    }
  }
}
