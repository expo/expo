package expo.modules.widgets

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.text.Text

internal class ExpoWidgetsGlanceWidget(
  private val widgetName: String
) : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    provideContent {
      Text(widgetName)
    }
  }
}
