package expo.modules.widgets

import android.content.Context
import android.content.Intent
import io.github.jakex7.peek.appwidget.PeekAppWidgetReceiver
import io.github.jakex7.peek.emittables.PeekEmittableAppWidget

open class ExpoWidgetsAppWidgetProvider(
  widgetName: String,
) : PeekAppWidgetReceiver() {
  override val peekAppWidget: PeekEmittableAppWidget = ExpoWidgetsPeekWidget(widgetName)

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == WIDGET_INTERACTION_ACTION) {
      val source = intent.getStringExtra(WIDGET_INTERACTION_SOURCE_EXTRA) ?: return
      val target = intent.getStringExtra(WIDGET_INTERACTION_TARGET_EXTRA) ?: return
      WidgetsInteraction.handle(context.applicationContext, source, target)
      return
    }

    super.onReceive(context, intent)
  }
}
