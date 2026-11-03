package expo.modules.widgets

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.glance.action.Action
import androidx.glance.appwidget.action.actionSendBroadcast
import expo.modules.widgets.notifications.ExpoWidgetsNotificationReceiver

internal const val WIDGET_INTERACTION_ACTION = "expo.modules.widgets.ACTION_WIDGET_INTERACTION"
internal const val NOTIFICATION_INTERACTION_ACTION = "expo.modules.widgets.ACTION_NOTIFICATION_INTERACTION"
internal const val WIDGET_INTERACTION_SOURCE_EXTRA = "expo.modules.widgets.extra.SOURCE"
internal const val WIDGET_INTERACTION_TARGET_EXTRA = "expo.modules.widgets.extra.TARGET"
internal const val WIDGET_INTERACTION_NOTIFICATION_ID_EXTRA = "expo.modules.widgets.extra.NOTIFICATION_ID"

internal sealed interface InteractionSource {
  val name: String

  data class Widget(override val name: String) : InteractionSource

  data class Notification(override val name: String, val notificationId: String) : InteractionSource
}

internal data class WidgetInteraction(
  val source: InteractionSource,
  val target: String
)

internal fun WidgetInteraction.toGlanceAction(context: Context): Action {
  val intent = when (source) {
    is InteractionSource.Widget -> Intent(WIDGET_INTERACTION_ACTION)
      .setComponent(widgetProviderComponentName(context, source.name))

    is InteractionSource.Notification -> Intent(NOTIFICATION_INTERACTION_ACTION)
      .setClass(context, ExpoWidgetsNotificationReceiver::class.java)
      // Extras do not participate in PendingIntent identity. Glance's default URI uses the
      // same appWidgetId for every notification, so provide our own stable button identity.
      .setData(
        Uri.Builder()
          .scheme("expo-widgets")
          .authority("notification")
          .appendPath(source.name)
          .appendPath(source.notificationId)
          .appendPath(target)
          .build()
      )
      .putExtra(WIDGET_INTERACTION_NOTIFICATION_ID_EXTRA, source.notificationId)
  }
  intent
    .putExtra(WIDGET_INTERACTION_SOURCE_EXTRA, source.name)
    .putExtra(WIDGET_INTERACTION_TARGET_EXTRA, target)
  return actionSendBroadcast(intent)
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
