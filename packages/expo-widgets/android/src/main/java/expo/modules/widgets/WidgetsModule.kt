package expo.modules.widgets

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class WidgetsModule : Module() {
  val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoWidgets")

    Events(ON_USER_INTERACTION)

    OnStartObserving(ON_USER_INTERACTION) {
      WidgetsEvents.startObservingUserInteractions { event ->
        sendEvent(ON_USER_INTERACTION, event)
      }
    }

    OnStopObserving(ON_USER_INTERACTION) {
      WidgetsEvents.stopObservingUserInteractions()
    }

    OnDestroy {
      WidgetsEvents.stopObservingUserInteractions()
    }

    Constant("widgetsDirectory") {
      val directory = File(appContext.persistentFilesDirectory, "ExpoWidgets")
      if (directory.mkdirs() || directory.isDirectory) {
        directory.toURI().toString()
      } else {
        ""
      }
    }

    Function("reloadAllWidgets") {
      WidgetsUpdater.reloadAll(context)
    }

    Class("Widget", WidgetObject::class) {
      Constructor { name: String, layout: String, initialProps: Map<String, Any?>? ->
        WidgetObject(context, name, layout, initialProps)
      }

      Function("reload") { widget: WidgetObject ->
        widget.reload()
      }

      Function("updateSnapshot") { widget: WidgetObject, props: Map<String, Any?> ->
        widget.updateSnapshot(props)
      }
    }
  }
}
