package expo.modules.widgets

import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

open class ExpoWidgetsAppWidgetProvider(
  widgetName: String,
) : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = ExpoWidgetsGlanceWidget(widgetName)
}
