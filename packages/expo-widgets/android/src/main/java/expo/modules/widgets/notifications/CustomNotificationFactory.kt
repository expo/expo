package expo.modules.widgets.notifications

import android.content.Context
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.widgets.WidgetsStorage

internal class CustomNotificationFactory(
  private val context: Context,
  val name: String,
  layout: String
) : SharedObject() {
  init {
    WidgetsStorage.set(context, "__expo_widgets_notification_${name}_layout", layout)
  }

  suspend fun post(id: String, props: Map<String, Any?>?, options: CustomNotificationOptions): CustomNotification {
    CustomNotifications.shared.post(context, CustomNotificationState(name, id, props, options))
    return CustomNotification(context, name, id)
  }

  fun get(id: String): CustomNotification? {
    return CustomNotificationState.find(context, name, id)?.let {
      CustomNotification(context, name, id)
    }
  }

  fun getActive(): List<CustomNotification> {
    return CustomNotificationState.all(context)
      .filter { it.name == name }
      .map { CustomNotification(context, name, it.id) }
  }

  fun cancelAll() {
    CustomNotifications.shared.cancelAll(context, name)
  }
}
