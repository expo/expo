package expo.modules.widgets

import android.appwidget.AppWidgetManager
import android.content.Context
import io.github.jakex7.peek.appwidget.PeekAppWidgetId
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

internal object WidgetsUpdater {
  private val updateMutex = Mutex()
  private val updateScope = CoroutineScope(
    Dispatchers.Default + SupervisorJob() + CoroutineName("expo.widgets.UpdaterScope")
  )

  fun reload(context: Context, name: String) {
    val appContext = context.applicationContext

    updateScope.launch {
      updateMutex.withLock {
        updateWidget(appContext, name)
      }
    }
  }

  fun reloadAll(context: Context) {
    val appContext = context.applicationContext

    updateScope.launch {
      updateMutex.withLock {
        widgetNames(appContext).forEach { name ->
          updateWidget(appContext, name)
        }
      }
    }
  }

  private suspend fun updateWidget(context: Context, name: String) {
    val appWidgetManager = AppWidgetManager.getInstance(context)
    val componentName = widgetProviderComponentName(context, name)
    val widget = ExpoWidgetsPeekWidget(name)

    appWidgetManager.getAppWidgetIds(componentName).forEach { appWidgetId ->
      widget.update(context, PeekAppWidgetId(appWidgetId))
    }
  }

  private fun widgetNames(context: Context): List<String> {
    return context.resources.getStringArray(R.array.expo_widgets_names).toList()
  }
}
