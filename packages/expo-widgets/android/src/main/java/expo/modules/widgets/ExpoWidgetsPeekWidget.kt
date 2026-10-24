@file:SuppressLint("RestrictedApi")
package expo.modules.widgets

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import androidx.compose.ui.unit.DpSize
import androidx.glance.Emittable
import androidx.glance.appwidget.AppWidgetId
import androidx.glance.appwidget.SizeMode
import io.github.expo.peek.emittables.PeekEmittableAppWidget

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
    // Rendered for both schemes: the launcher does not ask for the widget again when the system theme
    // changes, so the tree has to carry the colors for both.
    val light = evaluateLayout(appContext, layout, props, environment + ("colorScheme" to "light"))
    val dark = evaluateLayout(appContext, layout, props, environment + ("colorScheme" to "dark"))

    return toDayNightPeekRoot(
      appContext,
      light = light,
      dark = dark,
      isNight = environment["colorScheme"] == "dark",
      source = InteractionSource.Widget(widgetName),
      size = size
    )
  }
}
