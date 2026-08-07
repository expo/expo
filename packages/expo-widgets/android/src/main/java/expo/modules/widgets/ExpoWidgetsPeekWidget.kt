package expo.modules.widgets

import android.content.Context
import android.os.Bundle
import androidx.compose.ui.unit.DpSize
import androidx.glance.Emittable
import androidx.glance.appwidget.AppWidgetId
import androidx.glance.appwidget.SizeMode
import io.github.jakex7.peek.emittables.PeekEmittableAppWidget

internal class ExpoWidgetsPeekWidget(
  private val widgetName: String
) : PeekEmittableAppWidget() {
  override val sizeMode = SizeMode.Exact

  override fun provideRoot(
    context: Context,
    id: AppWidgetId,
    options: Bundle,
    size: DpSize
  ): Emittable {
    val appContext = context.applicationContext
    val layout = WidgetsLayoutRegistry.layout(appContext, widgetName)
      ?: return createErrorRoot("No layout found for $widgetName")
    val props = WidgetsLayoutRegistry.props(appContext, widgetName)
    val environment = getWidgetEnvironment(appContext)
    val node = evaluateLayout(appContext, layout, props, environment)

    return node.toPeekRoot(appContext, widgetName)
  }
}
