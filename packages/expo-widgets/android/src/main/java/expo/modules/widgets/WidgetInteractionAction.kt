package expo.modules.widgets

import android.content.Context
import android.content.Intent
import io.github.jakex7.peek.emittables.PeekAction
import io.github.jakex7.peek.emittables.actionSendBroadcast

internal const val WIDGET_INTERACTION_ACTION = "expo.modules.widgets.ACTION_WIDGET_INTERACTION"
internal const val WIDGET_INTERACTION_SOURCE_EXTRA = "expo.modules.widgets.extra.SOURCE"
internal const val WIDGET_INTERACTION_TARGET_EXTRA = "expo.modules.widgets.extra.TARGET"

internal data class WidgetInteraction(
  val source: String,
  val target: String
)

internal fun WidgetInteraction.toPeekAction(context: Context): PeekAction {
  val intent = Intent(WIDGET_INTERACTION_ACTION)
    .setComponent(widgetProviderComponentName(context, source))
    .putExtra(WIDGET_INTERACTION_SOURCE_EXTRA, source)
    .putExtra(WIDGET_INTERACTION_TARGET_EXTRA, target)
  val requestCode = 31 * source.hashCode() + target.hashCode()
  return actionSendBroadcast(intent, requestCode = requestCode)
}

internal object WidgetsInteraction {
  fun handle(context: Context, source: String, target: String) {
    val layout = WidgetsLayoutRegistry.layout(context, source) ?: return
    val props = WidgetsLayoutRegistry.props(context, source)
    val environment = getWidgetEnvironment(context) + ("target" to target)
    val updatedProps = evaluateWidgetButtonPress(context, layout, props, environment)

    if (updatedProps != null) {
      WidgetsStorage.set(context, "__expo_widgets_${source}_props", props.orEmpty() + updatedProps)
    }

    WidgetsEvents.sendUserInteraction(source, target)
    WidgetsUpdater.reload(context, source)
  }
}
