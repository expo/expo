package expo.modules.widgets

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.LocalState
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.provideContent
import androidx.glance.text.Text

internal class ExpoWidgetsGlanceWidget(
  private val widgetName: String
) : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)

    provideContent {
      LocalState.current
      val result = WidgetsJSRuntime.render(
        context = context,
        layout = "() => ({'test': 'test123'.toUpperCase()})"
      )
      print(result)
      Text(result.getString("test"))
    }
  }
}
