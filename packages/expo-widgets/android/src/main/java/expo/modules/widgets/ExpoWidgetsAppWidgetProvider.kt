package expo.modules.widgets

import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

open class ExpoWidgetsAppWidgetProvider(
  private val widgetName: String
) : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = ExpoWidgetsGlanceWidget(widgetName)
}
