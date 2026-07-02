package expo.modules.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.os.Bundle
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.glance.appwidget.ExperimentalGlanceRemoteViewsApi
import androidx.glance.appwidget.GlanceRemoteViews
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

private const val PROVIDER_SUFFIX = "Provider"

internal object WidgetsUpdater {
  private val updateMutex = Mutex()
  private val updateScope = CoroutineScope(
    Dispatchers.Default +
      SupervisorJob() +
      CoroutineName("expo.widgets.UpdaterScope")
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

  @OptIn(ExperimentalGlanceRemoteViewsApi::class)
  private suspend fun updateWidget(context: Context, name: String) {
    val appWidgetManager = AppWidgetManager.getInstance(context)
    val componentName = widgetComponentName(context, name)

    appWidgetManager.getAppWidgetIds(componentName).forEach { appWidgetId ->
      val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
      val remoteViews = GlanceRemoteViews()
        .compose(
          context = context,
          size = widgetSize(options),
          appWidgetOptions = options
        ) {
          ExpoWidgetsGlanceContent(context, name)
        }
        .remoteViews

      appWidgetManager.updateAppWidget(appWidgetId, remoteViews)
    }
  }

  private fun widgetComponentName(context: Context, widgetName: String): ComponentName {
    return ComponentName(context.packageName, "${context.packageName}.$widgetName$PROVIDER_SUFFIX")
  }

  private fun widgetNames(context: Context): List<String> {
    return context.resources.getStringArray(R.array.expo_widgets_names).toList()
  }

  private fun widgetSize(options: Bundle): DpSize {
    val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH)
      .takeIf { it > 0 }
      ?: options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)

    val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT)
      .takeIf { it > 0 }
      ?: options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)

    return DpSize(width.dp, height.dp)
  }
}
