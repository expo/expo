package expo.modules.widgets

import android.content.Context
import android.os.Bundle
import androidx.compose.ui.unit.DpSize
import io.github.jakex7.peek.appwidget.PeekAppWidgetId
import io.github.jakex7.peek.appwidget.PeekAppWidgetSizeMode
import io.github.jakex7.peek.emittables.PeekEmittableAppWidget
import io.github.jakex7.peek.emittables.PeekRoot

internal class ExpoWidgetsPeekWidget(
  private val widgetName: String
) : PeekEmittableAppWidget() {
  override val sizeMode = PeekAppWidgetSizeMode.Exact

  override suspend fun provideRoot(
    context: Context,
    id: PeekAppWidgetId,
    options: Bundle,
    size: DpSize
  ): PeekRoot {
    val appContext = context.applicationContext
    val layout = WidgetsLayoutRegistry.layout(appContext, widgetName)
      ?: return createErrorRoot("No layout found for $widgetName")
    val props = WidgetsLayoutRegistry.props(appContext, widgetName)
    val environment = getWidgetEnvironment(appContext)
    val node = evaluateLayout(appContext, layout, props, environment)

    return node.toPeekRoot(appContext, widgetName)
  }
}
