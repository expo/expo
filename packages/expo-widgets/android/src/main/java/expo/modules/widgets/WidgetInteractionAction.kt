package expo.modules.widgets

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.action.Action
import androidx.glance.action.ActionParameters
import androidx.glance.action.actionParametersOf
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback

private val sourceKey = ActionParameters.Key<String>("source")
private val targetKey = ActionParameters.Key<String>("target")

internal data class WidgetInteraction(
  val source: String,
  val target: String
)

internal fun WidgetInteraction.toGlanceAction(): Action {
  return actionRunCallback<WidgetInteractionAction>(
    actionParametersOf(
      sourceKey to source,
      targetKey to target
    )
  )
}

class WidgetInteractionAction : ActionCallback {
  override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
    val source = parameters[sourceKey] ?: return
    val target = parameters[targetKey] ?: return

    WidgetsInteraction.handle(context.applicationContext, source, target)
  }
}

internal object WidgetsInteraction {
  fun handle(context: Context, source: String, target: String) {
    val layout = WidgetsLayoutRegistry.layout(context, source) ?: return
    val props = WidgetsLayoutRegistry.props(context, source)
    val environment = getWidgetEnvironment(context) + ("target" to target)
    val updatedProps = evaluateWidgetButtonPress(context, layout, props, environment)

    if (updatedProps != null) {
      WidgetsStorage.set(context, props.orEmpty() + updatedProps, "__expo_widgets_${source}_props")
    }

    WidgetsEvents.sendUserInteraction(source, target)
    WidgetsUpdater.reload(context, source)
  }
}
